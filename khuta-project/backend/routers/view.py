import logging
import json
from collections import OrderedDict
from fastapi import APIRouter, HTTPException, Request
from geojson import Feature, FeatureCollection
import psycopg2.extras

from database import get_db_connection
from route_utils import (
    find_closest_network_node,
    find_closest_poi,
    calc_distance_walktime,
    create_route_markers,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def run_route(start_node_id, end_node_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    routing_query = """
        SELECT
            dij_route.seq AS seq,
            dij_route.edge AS edge,
            dij_route.node AS node,
            ST_Length(input_network.geom::geography) AS cost,
            dij_route.agg_cost AS agg_cost,
            input_network.floor_num AS floor_num,
            input_network.network_type AS network_type,
            ST_AsGeoJSON(input_network.geom) AS geoj,
            input_network.floor_name AS floor_name
        FROM pgr_dijkstra(
            'SELECT id, source, target, cost FROM routing_networklines',
            %s, %s, FALSE
        ) AS dij_route
        JOIN routing_networklines AS input_network
            ON dij_route.edge = input_network.id
        WHERE dij_route.edge != -1;
    """

    try:
        if not start_node_id or not end_node_id:
            return {
                "error": "start or end node is none",
                "reason": f"Sorry, start node is {start_node_id} END node is {end_node_id}",
            }

        if start_node_id == end_node_id:
            return {"error": "same ids", "reason": "Sorry, the start node is equal to end node"}

        cur.execute(routing_query, (start_node_id, end_node_id))
        route_rows = cur.fetchall()

        if not route_rows:
            return {"error": "no route", "reason": "Sorry no route found between these two points"}

    except Exception as e:
        logger.error(f"routing query failed: {e}")
        return {"error": "no route", "reason": str(e)}
    finally:
        cur.close()
        conn.close()

    route_info = calc_distance_walktime(route_rows)
    if "error" in route_info:
        return {"error": "no route", "reason": "Sorry no route found", "route_info_res": f"{route_info}"}

    route_result = []
    for row in route_rows:
        geojs_geom = json.loads(row["geoj"], object_pairs_hook=OrderedDict)
        route_result.append(Feature(
            geometry=geojs_geom,
            properties={
                "floor": row["floor_num"],
                "floor_name": row["floor_name"],
                "segment_length": float(row["cost"]),
                "network_type": row["network_type"],
                "seg_node_id": row["node"],
                "sequence": row["seq"],
            },
        ))

    geojs_fc = FeatureCollection(route_result)
    geojs_fc.update(route_info)
    return geojs_fc


@router.get("/directions/poi-to-poi")
def route_poi_to_poi(start_poi_id: str, end_poi_id: str):
    
    start_id_clean = start_poi_id.split("=")[-1]
    end_id_clean = end_poi_id.split("=")[-1]

    if start_id_clean == end_id_clean:
        return {"error": "route poi to poi", "reason": "Error: The start and end locations are the same"}

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            SELECT id, name_ar, ST_X(geom) AS lon, ST_Y(geom) AS lat, type
            FROM facilities
            WHERE id = %s;
        """, (start_id_clean,))
        start_poi = cur.fetchone()

        cur.execute("""
            SELECT id, name_ar, ST_X(geom) AS lon, ST_Y(geom) AS lat, type
            FROM facilities
            WHERE id = %s;
        """, (end_id_clean,))
        end_poi = cur.fetchone()
        
    except Exception as e:
        logger.error(f"error fetching facility: {e}")
        return {"error": "no facility found with given id"}
    finally:
        cur.close()
        conn.close()

    if not start_poi:
        return {"error": "no facility found with given start id"}
    if not end_poi:
        return {"error": "no facility found with given end id"}

    start_node_id = find_closest_network_node(start_poi["lon"], start_poi["lat"], 1)
    end_node_id = find_closest_network_node(end_poi["lon"], end_poi["lat"], 1)

    geojs_fc = run_route(start_node_id, end_node_id)
    if "error" in geojs_fc:
        return geojs_fc

    geojs_fc["route_info"]["start_name"] = start_poi["name_ar"]
    geojs_fc["route_info"]["end_name"] = end_poi["name_ar"]
    geojs_fc["route_info"]["start"] = {
        "id": start_poi["id"], "name_ar": start_poi["name_ar"],
        "lon": start_poi["lon"], "lat": start_poi["lat"], "type": start_poi["type"]
    }
    geojs_fc["route_info"]["end"] = {
        "id": end_poi["id"], "name_ar": end_poi["name_ar"],
        "lon": end_poi["lon"], "lat": end_poi["lat"], "type": end_poi["type"]
    }
    geojs_fc["route_info"]["mid_name"] = ""

    start_coords = {"coordinates": [[start_poi["lon"], start_poi["lat"]]], "type": "MultiPoint"}
    end_coords = {"coordinates": [[end_poi["lon"], end_poi["lat"]]], "type": "MultiPoint"}
    geojs_fc["route_info"]["route_markers"] = create_route_markers(
        start_coords, end_coords, 1, 1, start_poi["name_ar"], end_poi["name_ar"]
    )

    return geojs_fc


@router.get("/directions/near/{coordinates}/{floor}/{poi_cat_id}")
def nearest_poi(request: Request, coordinates: str, floor: str, poi_cat_id: str):
    coords = coordinates.split("=")[1]
    start_floor_num = int(floor.split("=")[1])
    poi_type = poi_cat_id.split("=")[1]
    lang_code = request.headers.get("Accept-Language", "ar").split(",")[0].split("-")[0].strip()

    poi_data = find_closest_poi(coords, start_floor_num, poi_type, lang_code)
    if isinstance(poi_data, list) or (isinstance(poi_data, dict) and "error" not in poi_data):
        return poi_data

    raise HTTPException(status_code=400, detail=poi_data.get("error", "Unknown error"))


@router.get("/directions/coords")
def route_coords(start_lon: float, start_lat: float, end_lon: float, end_lat: float, floor: int = 1):
    start_node = find_closest_network_node(start_lon, start_lat, floor)
    end_node = find_closest_network_node(end_lon, end_lat, floor)

    print(f"DEBUG: start_node={start_node}, end_node={end_node}")

    if not start_node:
        return {"error": "no start node found", "reason": "No network node near start coordinates"}
    if not end_node:
        return {"error": "no end node found", "reason": "No network node near end coordinates"}

    geojs_fc = run_route(start_node, end_node)
    if "error" in geojs_fc:
        return geojs_fc

    geojs_fc["route_info"]["start_name"] = f"{start_lon},{start_lat}"
    geojs_fc["route_info"]["end_name"] = f"{end_lon},{end_lat}"
    geojs_fc["route_info"]["mid_name"] = ""

    start_coords = {"coordinates": [[start_lon, start_lat]], "type": "MultiPoint"}
    end_coords = {"coordinates": [[end_lon, end_lat]], "type": "MultiPoint"}
    geojs_fc["route_info"]["route_markers"] = create_route_markers(
        start_coords, end_coords, floor, floor, f"{start_lon},{start_lat}", f"{end_lon},{end_lat}"
    )

    return geojs_fc