import logging
from geojson import Feature, Point, MultiPoint
import psycopg2.extras
from database import get_db_connection

logger = logging.getLogger(__name__)


def find_closest_network_node(x_coord, y_coord, floor=1):
    """
    Finds the nearest routing network node to any map coordinate.
    Works with DictCursor/RealDictCursor and does not fail because of row[0].
    """
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    query = """
        WITH pt AS (
            SELECT ST_SetSRID(ST_MakePoint(%s, %s), 4326) AS geom
        ),
        nearest_edge AS (
            SELECT
                e.source,
                e.target,
                e.geom,
                ST_StartPoint(e.geom) AS start_geom,
                ST_EndPoint(e.geom) AS end_geom
            FROM routing_networklines e, pt
            WHERE (%s IS NULL OR e.floor_num = %s)
            ORDER BY e.geom <-> pt.geom
            LIMIT 1
        )
        SELECT
            CASE
                WHEN ST_Distance(nearest_edge.start_geom, pt.geom)
                   <= ST_Distance(nearest_edge.end_geom, pt.geom)
                THEN nearest_edge.source
                ELSE nearest_edge.target
            END AS node_id
        FROM nearest_edge, pt;
    """

    try:
        cur.execute(query, (x_coord, y_coord, floor, floor))
        row = cur.fetchone()
        if row and row.get("node_id") is not None:
            return int(row["node_id"])
        return None
    except Exception as e:
        logger.error(f"find_closest_network_node failed: {e}")
        return None
    finally:
        cur.close()
        conn.close()


def find_closest_poi(coordinates, floor, poi_cat_id, lang_code="ar"):
    x_start_coord = float(coordinates.split(',')[0])
    y_start_coord = float(coordinates.split(',')[1])

    startid = find_closest_network_node(x_start_coord, y_start_coord, floor)
    if not startid:
        return {"error": "startid is none"}

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            SELECT
                id,
                name_ar,
                ST_X(geom) AS lon,
                ST_Y(geom) AS lat,
                type
            FROM facilities
            WHERE type = %s;
        """, (str(poi_cat_id),))

        pois = cur.fetchall()
        if not pois:
            return {"error": f"no facilities found for type '{poi_cat_id}'"}

        dest_nodes = []
        pois_found = []

        for i, poi in enumerate(pois):
            network_node_id = find_closest_network_node(poi["lon"], poi["lat"], floor)
            if network_node_id:
                pois_found.append({
                    "result_index": i,
                    "name": poi["name_ar"],
                    "floor": floor,
                    "id": poi["id"],
                    "type": poi["type"],
                    "network_node_id": network_node_id,
                    "geometry": {"type": "Point", "coordinates": [poi["lon"], poi["lat"]]}
                })
                dest_nodes.append(network_node_id)

        if not dest_nodes:
            return {"error": "no network node found close to any facility"}

        pgr_query = """
            SELECT end_vid, SUM(cost) AS distance_to_poi
            FROM pgr_dijkstra(
                'SELECT id, source, target, cost FROM routing_networklines',
                %s, %s, FALSE
            )
            GROUP BY end_vid
            ORDER BY distance_to_poi ASC;
        """

        cur.execute(pgr_query, (startid, dest_nodes))
        rows = cur.fetchall()

        sorted_pois = []
        for rank, row in enumerate(rows, start=1):
            node_id = row["end_vid"]
            distance = round(float(row["distance_to_poi"]), 2)
            for item in pois_found:
                if node_id == item["network_node_id"]:
                    sorted_pois.append({
                        "rank": rank,
                        "id": item["id"],
                        "name": item["name"],
                        "floor": item["floor"],
                        "type": item["type"],
                        "geometry": item["geometry"],
                        "distance": distance,
                    })
        return sorted_pois if sorted_pois else {"error": "res empty, no routes to facility"}

    except Exception as e:
        logger.error(f"find_closest_poi error: {e}")
        return {"error": str(e)}
    finally:
        cur.close()
        conn.close()


def calc_distance_walktime(rows):
    route_length = 0.0
    walk_time = 0.0
    speed_map = {"stairs": 1.2, "elevator": 1.1, "walking": 1.39}

    for row in rows:
        cost = float(row["cost"])
        network_type = row.get("network_type") or "walking"
        route_length += cost

        if network_type in ("gate_path",):
            walk_speed = speed_map["stairs"]
        elif network_type in ("facility_approach",):
            walk_speed = speed_map["elevator"]
        else:
            walk_speed = speed_map["walking"]

        walk_time += cost / walk_speed

    if route_length == 0:
        return {"error": "route has length of zero"}

    return {
        "route_info": {
            "route_length": "%.2f" % route_length,
            "walk_time": walk_time,
        }
    }


def create_route_markers(start_coords, end_coords, start_floor, end_floor, start_name, end_name):
    destination_markers = []

    if start_coords["type"] == "MultiPoint":
        destination_markers.append(Feature(
            geometry=MultiPoint(start_coords["coordinates"]),
            properties={"start": "start location", "floor": int(start_floor), "name": start_name}
        ))
    elif start_coords["type"] == "Point":
        destination_markers.append(Feature(
            geometry=Point(start_coords["coordinates"]),
            properties={"start": "start location", "floor": int(start_floor), "name": start_name}
        ))

    if end_coords["type"] == "MultiPoint":
        destination_markers.append(Feature(
            geometry=MultiPoint(end_coords["coordinates"]),
            properties={"end": "end location", "floor": int(end_floor), "name": end_name}
        ))
    elif end_coords["type"] == "Point":
        destination_markers.append(Feature(
            geometry=Point(end_coords["coordinates"]),
            properties={"end": "end location", "floor": int(end_floor), "name": end_name}
        ))

    return destination_markers
