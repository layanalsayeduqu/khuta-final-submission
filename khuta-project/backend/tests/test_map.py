import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import view

app = FastAPI()
app.include_router(view.router)
client = TestClient(app)


# --- Test 1: POI to POI - Same Start and End --------------------------------

def test_poi_to_poi_same_start_end():
    response = client.get("/directions/poi-to-poi?start_poi_id=poi=301&end_poi_id=poi=301")
    assert response.json()["error"] == "route poi to poi"
    assert "same" in response.json()["reason"]


# --- Test 2: POI to POI - Database Exception --------------------------------

@patch('view.get_db_connection')
def test_poi_to_poi_db_exception(mock_db):
    mock_conn = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value.execute.side_effect = Exception("DB Connection Error")

    response = client.get("/directions/poi-to-poi?start_poi_id=poi=301&end_poi_id=poi=305")
    assert response.json()["error"] == "no facility found with given id"


# --- Test 3: POI to POI - Start POI Not Found -------------------------------

@patch('view.get_db_connection')
def test_poi_to_poi_start_not_found(mock_db):
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cur
    mock_cur.fetchone.return_value = None

    response = client.get("/directions/poi-to-poi?start_poi_id=poi=999&end_poi_id=poi=305")
    assert response.json()["error"] == "no facility found with given start id"


# --- Test 4: POI to POI - End POI Not Found ---------------------------------

@patch('view.get_db_connection')
def test_poi_to_poi_end_not_found(mock_db):
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cur
    mock_cur.fetchone.side_effect = [(301, "A", 39.1, 22.1, "restroom"), None]

    response = client.get("/directions/poi-to-poi?start_poi_id=poi=301&end_poi_id=poi=999")
    assert response.json()["error"] == "no facility found with given end id"


# --- Test 5: POI to POI - No Route Found ------------------------------------

@patch('view.get_db_connection')
@patch('view.find_closest_network_node')
@patch('view.run_route')
def test_poi_to_poi_no_route(mock_run, mock_find, mock_db):
    mock_cur = MagicMock()
    mock_db.return_value.cursor.return_value = mock_cur
    mock_cur.fetchone.side_effect = [(301, "A", 39.1, 22.1, "restroom"), (305, "B", 39.2, 22.2, "exit")]
    mock_find.side_effect = [10, 20]
    mock_run.return_value = {"error": "no route"}

    response = client.get("/directions/poi-to-poi?start_poi_id=poi=301&end_poi_id=poi=305")
    assert response.json()["error"] == "no route"


# --- Test 6: POI to POI - Success -------------------------------------------

@patch('view.get_db_connection')
@patch('view.find_closest_network_node')
@patch('view.run_route')
@patch('view.create_route_markers')
def test_poi_to_poi_success(mock_markers, mock_run, mock_find, mock_db):
    mock_cur = MagicMock()
    mock_db.return_value.cursor.return_value = mock_cur
    mock_cur.fetchone.side_effect = [(301, "A", 39.1, 22.1, "restroom"), (305, "B", 39.2, 22.2, "exit")]
    mock_find.side_effect = [10, 20]
    mock_run.return_value = {"type": "FeatureCollection", "route_info": {}}
    mock_markers.return_value = ["marker1", "marker2"]

    response = client.get("/directions/poi-to-poi?start_poi_id=poi=301&end_poi_id=poi=305")
    assert response.status_code == 200
    assert "route_markers" in response.json()["route_info"]


# --- Test 7: Nearest POI - Success ------------------------------------------

@patch('view.find_closest_poi')
def test_nearest_poi_success(mock_find_poi):
    mock_find_poi.return_value = [{"id": 1, "name": "Restroom A"}]
    response = client.get(
        "/directions/near/coords=39.1,22.1/floor=1/poiCatId=restroom",
        headers={"Accept-Language": "en-US"}
    )
    assert response.status_code == 200
    assert len(response.json()) == 1


# --- Test 8: Nearest POI - Error Handling -----------------------------------

@patch('view.find_closest_poi')
def test_nearest_poi_error(mock_find_poi):
    mock_find_poi.return_value = {"error": "POI category not found"}
    response = client.get("/directions/near/coords=39.1,22.1/floor=1/poiCatId=invalid")

    assert response.status_code == 400
    assert response.json()["detail"] == "POI category not found"


# --- Test 9: Route Coords - Start Node Not Found ----------------------------

@patch('view.find_closest_network_node')
def test_route_coords_start_not_found(mock_find_node):
    mock_find_node.side_effect = [None, 20]
    response = client.get("/directions/coords?start_lon=39.1&start_lat=22.1&end_lon=39.2&end_lat=22.2&floor=1")
    assert response.json()["error"] == "no start node found"


# --- Test 10: Route Coords - End Node Not Found -----------------------------

@patch('view.find_closest_network_node')
def test_route_coords_end_not_found(mock_find_node):
    mock_find_node.side_effect = [10, None]
    response = client.get("/directions/coords?start_lon=39.1&start_lat=22.1&end_lon=39.2&end_lat=22.2&floor=1")
    assert response.json()["error"] == "no end node found"


# --- Test 11: Route Coords - No Route Found ---------------------------------

@patch('view.find_closest_network_node')
@patch('view.run_route')
def test_route_coords_no_route(mock_run, mock_find_node):
    mock_find_node.side_effect = [10, 20]
    mock_run.return_value = {"error": "no route found"}

    response = client.get("/directions/coords?start_lon=39.1&start_lat=22.1&end_lon=39.2&end_lat=22.2&floor=1")
    assert response.json()["error"] == "no route found"


# --- Test 12: Route Coords - Same Node ID -----------------------------------

@patch('view.find_closest_network_node')
@patch('view.run_route')
def test_route_coords_same_node(mock_run, mock_find_node):
    mock_find_node.side_effect = [15, 15]
    mock_run.return_value = {"error": "same ids", "reason": "Sorry, the start node is equal to end node"}

    response = client.get("/directions/coords?start_lon=39.1&start_lat=22.1&end_lon=39.1&end_lat=22.1&floor=1")
    assert response.json()["error"] == "same ids"


# --- Test 13: Route Coords - Success ----------------------------------------

@patch('view.find_closest_network_node')
@patch('view.run_route')
@patch('view.create_route_markers')
def test_route_coords_success(mock_markers, mock_run_route, mock_find_node):
    mock_find_node.side_effect = [10, 20]
    mock_run_route.return_value = {
        "type": "FeatureCollection",
        "features": [],
        "route_info": {"route_length": "100"}
    }
    mock_markers.return_value = ["start_marker", "end_marker"]

    response = client.get("/directions/coords?start_lon=39.1&start_lat=22.1&end_lon=39.2&end_lat=22.2&floor=1")
    assert response.status_code == 200
    assert "route_markers" in response.json()["route_info"]
