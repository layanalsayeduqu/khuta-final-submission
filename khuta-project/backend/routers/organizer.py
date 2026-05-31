from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection

router = APIRouter(prefix="/organizer", tags=["Organizer"])

class MatchRequest(BaseModel):
    home_team: str
    away_team: str
    match_time: str
    stadium: str
    status: str = "upcoming"
    home_score: int = 0
    away_score: int = 0
    minute: int = 0
    base_price: int = 150

class FacilityRequest(BaseModel):
    name_ar: str
    type: str
    geom: str

@router.get("/matches")
def get_matches():
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT *
            FROM matches
            ORDER BY match_time ASC;
        """)

        return {
            "matches": cur.fetchall()
        }

    finally:
        cur.close()
        conn.close()


@router.post("/matches")
def add_match(match: MatchRequest):
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            INSERT INTO matches (
                home_team,
                away_team,
                match_time,
                stadium,
                status,
                home_score,
                away_score,
                minute,
                base_price
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            match.home_team,
            match.away_team,
            match.match_time,
            match.stadium,
            match.status,
            match.home_score,
            match.away_score,
            match.minute,
            match.base_price
        ))

        new_match = cur.fetchone()
        conn.commit()

        return {
            "success": True,
            "id": new_match["id"]
        }

    except Exception as error:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(error))

    finally:
        cur.close()
        conn.close()


@router.put("/matches/{match_id}")
def update_match(match_id: int, match: MatchRequest):
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            UPDATE matches
            SET
                home_team = %s,
                away_team = %s,
                match_time = %s,
                stadium = %s,
                status = %s,
                home_score = %s,
                away_score = %s,
                minute = %s,
                base_price = %s
            WHERE id = %s
            RETURNING id;
        """, (
            match.home_team,
            match.away_team,
            match.match_time,
            match.stadium,
            match.status,
            match.home_score,
            match.away_score,
            match.minute,
            match.base_price,
            match_id
        ))

        updated = cur.fetchone()

        if not updated:
            raise HTTPException(status_code=404, detail="Match not found")

        conn.commit()

        return {"success": True}

    except HTTPException as error:
        conn.rollback()
        raise error

    except Exception as error:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(error))

    finally:
        cur.close()
        conn.close()


@router.get("/facilities")
def get_facilities():
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT *
            FROM facilities
            ORDER BY id ASC;
        """)

        return {
            "facilities": cur.fetchall()
        }

    finally:
        cur.close()
        conn.close()


@router.post("/facilities")
def add_facility(facility: FacilityRequest):
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            INSERT INTO facilities (
                name_ar,
                type,
                geom
            )
            VALUES (%s, %s, %s)
            RETURNING id;
        """, (
            facility.name_ar,
            facility.type,
            facility.geom
        ))

        new_facility = cur.fetchone()
        conn.commit()

        return {
            "success": True,
            "id": new_facility["id"]
        }

    except Exception as error:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    finally:
        cur.close()
        conn.close()


@router.delete("/facilities/{facility_id}")
def delete_facility(facility_id: int):
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            DELETE FROM facilities
            WHERE id = %s
            RETURNING id;
        """, (facility_id,))

        deleted = cur.fetchone()

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Facility not found"
            )

        conn.commit()

        return {
            "success": True
        }

    except HTTPException as error:
        conn.rollback()
        raise error

    except Exception as error:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    finally:
        cur.close()
        conn.close()