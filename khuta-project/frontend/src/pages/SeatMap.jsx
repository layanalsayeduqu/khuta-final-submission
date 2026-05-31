import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import API from "../api/api";

const SVG_W = 1000;
const SVG_H = 760;

const MAP_SEATS_URL = "/data/seats.geojson";
const STADIUM_BOX = { x: 90, y: 70, w: 820, h: 630 };
const FIELD = { x: 320, y: 250, w: 360, h: 260 };

const STAND_CATS = {
    North: { label: "Gold", multiplier: 1.5, color: "#f59e0b", soft: "#fff7ed" },
    South: { label: "Silver", multiplier: 1.0, color: "#6b7280", soft: "#f3f4f6" },
    West:  { label: "VIP", multiplier: 2.0, color: "#9b59b6", soft: "#f7f0ff" },
    East:  { label: "Premium", multiplier: 1.3, color: "#2ecc71", soft: "#ecfdf5" },
};

const STAND_ORDER = { North: 1, East: 2, South: 3, West: 4 };

function normalizeText(value) {
    return String(value ?? "").trim().toUpperCase();
}

function seatKey(section, row, seat) {
    return `${normalizeText(section)}|${normalizeText(row)}|${normalizeText(seat)}`;
}

function getSeatId(section, row, seat) {
    return `${String(section).trim()}-R${row}-S${seat}`;
}

function guessStand(section = "") {
    const first = String(section).trim().charAt(0).toUpperCase();
    if (first === "N") return "North";
    if (first === "S") return "South";
    if (first === "E") return "East";
    if (first === "W") return "West";
    return "South";
}

function getBounds(features) {
    const coords = features
        .map((f) => f.geometry?.coordinates)
        .filter((c) => Array.isArray(c) && Number.isFinite(Number(c[0])) && Number.isFinite(Number(c[1])));

    if (coords.length === 0) {
        return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }

    return coords.reduce((acc, [x, y]) => ({
        minX: Math.min(acc.minX, Number(x)),
        maxX: Math.max(acc.maxX, Number(x)),
        minY: Math.min(acc.minY, Number(y)),
        maxY: Math.max(acc.maxY, Number(y)),
    }), {
        minX: Number(coords[0][0]),
        maxX: Number(coords[0][0]),
        minY: Number(coords[0][1]),
        maxY: Number(coords[0][1]),
    });
}

function projectPoint([lng, lat], bounds) {
    const rangeX = bounds.maxX - bounds.minX || 1;
    const rangeY = bounds.maxY - bounds.minY || 1;

    return {
        x: STADIUM_BOX.x + ((Number(lng) - bounds.minX) / rangeX) * STADIUM_BOX.w,
        y: STADIUM_BOX.y + ((bounds.maxY - Number(lat)) / rangeY) * STADIUM_BOX.h,
    };
}

function sectionNumber(section = "") {
    const n = String(section).match(/\d+/)?.[0];
    return Number(n || 1);
}

function sortSections(a, b) {
    const standDiff = (STAND_ORDER[a.stand] || 99) - (STAND_ORDER[b.stand] || 99);
    if (standDiff !== 0) return standDiff;
    return sectionNumber(a.section) - sectionNumber(b.section);
}

function buildSectionPanels(seats) {
    const groups = {};

    seats.forEach((seat) => {
        if (!groups[seat.section]) {
            groups[seat.section] = {
                section: seat.section,
                stand: seat.stand || guessStand(seat.section),
                minX: seat.x,
                maxX: seat.x,
                minY: seat.y,
                maxY: seat.y,
                count: 0,
            };
        }

        const g = groups[seat.section];
        g.minX = Math.min(g.minX, seat.x);
        g.maxX = Math.max(g.maxX, seat.x);
        g.minY = Math.min(g.minY, seat.y);
        g.maxY = Math.max(g.maxY, seat.y);
        g.count += 1;
    });

    return Object.values(groups).sort(sortSections).map((g) => {
        const cat = STAND_CATS[g.stand] || STAND_CATS.South;
        const cx = (g.minX + g.maxX) / 2;
        const cy = (g.minY + g.maxY) / 2;
        let points = "";

        if (g.stand === "North") {
            const top = g.minY - 18;
            const bottom = g.maxY + 18;
            const left = g.minX - 38 - sectionNumber(g.section) * 3;
            const right = g.maxX + 38 + sectionNumber(g.section) * 3;
            points = `${left + 22},${top} ${right - 22},${top} ${right},${bottom} ${left},${bottom}`;
        } else if (g.stand === "South") {
            const top = g.minY - 18;
            const bottom = g.maxY + 18;
            const left = g.minX - 38 - sectionNumber(g.section) * 3;
            const right = g.maxX + 38 + sectionNumber(g.section) * 3;
            points = `${left},${top} ${right},${top} ${right - 22},${bottom} ${left + 22},${bottom}`;
        } else if (g.stand === "West") {
            const left = g.minX - 22;
            const right = g.maxX + 22;
            const top = g.minY - 26;
            const bottom = g.maxY + 26;
            points = `${left},${top + 22} ${right},${top} ${right},${bottom} ${left},${bottom - 22}`;
        } else {
            const left = g.minX - 22;
            const right = g.maxX + 22;
            const top = g.minY - 26;
            const bottom = g.maxY + 26;
            points = `${left},${top} ${right},${top + 22} ${right},${bottom - 22} ${left},${bottom}`;
        }

        return { ...g, cx, cy, points, color: cat.color, soft: cat.soft, label: cat.label };
    });
}

function seatFill(seat, isSelected) {
    if (isSelected) return "#7c3aed";
    if (seat.status === "sold") return "#374151";
    if (seat.status === "reserved") return "#9ca3af";
    return STAND_CATS[seat.stand]?.color || "#6b7280";
}

export default function SeatMap() {
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const selectedMatch = location.state?.match;

    const [seats, setSeats] = useState([]);
    const [selected, setSelected] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedMatch?.id) return;

        setLoading(true);
        setSeats([]);
        setSelected({});
        setError("");

        Promise.all([
            API.get(`/api/seats/matches/${selectedMatch.id}`),
            fetch(MAP_SEATS_URL).then((res) => {
                if (!res.ok) throw new Error(`Could not load ${MAP_SEATS_URL}`);
                return res.json();
            }),
        ])
            .then(([dbRes, seatsGeojson]) => {
                const dbSeats = Array.isArray(dbRes.data) ? dbRes.data : [];
                const mapFeatures = Array.isArray(seatsGeojson.features) ? seatsGeojson.features : [];
                const bounds = getBounds(mapFeatures);

                const dbById = {};
                const dbByKey = {};

                dbSeats.forEach((db) => {
                    const section = db.section;
                    const row = db.row;
                    const seat = db.seat;
                    const id = db.seat_id || getSeatId(section, row, seat);

                    if (id) dbById[normalizeText(id)] = db;
                    dbByKey[seatKey(section, row, seat)] = db;
                });

                const formattedSeats = mapFeatures.flatMap((feature) => {
                    const p = feature.properties || {};
                    const coords = feature.geometry?.coordinates;
                    if (!Array.isArray(coords) || coords.length < 2) return [];

                    const section = String(p.section || "").trim();
                    const row = Number(p.row);
                    const seat = Number(p.seat);
                    const mapSeatId = p.seat_id || getSeatId(section, row, seat);

                    const db = dbById[normalizeText(mapSeatId)] || dbByKey[seatKey(section, row, seat)];

                    // SeatMap shows only seats that exist in the selected match database.
                    if (!db) return [];

                    const point = projectPoint(coords, bounds);
                    const stand = db.stand || p.stand || guessStand(section);

                    return [{
                        seat_id: db.seat_id || mapSeatId,
                        stand,
                        section,
                        row,
                        seat,
                        status: db.status || p.status || "available",
                        dbId: db.id ?? null,
                        x: point.x,
                        y: point.y,
                    }];
                }).sort((a, b) => {
                    if (a.stand !== b.stand) return (STAND_ORDER[a.stand] || 99) - (STAND_ORDER[b.stand] || 99);
                    if (a.section !== b.section) return sectionNumber(a.section) - sectionNumber(b.section);
                    if (a.row !== b.row) return Number(a.row) - Number(b.row);
                    return Number(a.seat) - Number(b.seat);
                });

                setSeats(formattedSeats);
            })
            .catch((err) => {
                console.error("Seat map loading error:", err);
                setError("Unable to load seat map data.");
                setSeats([]);
            })
            .finally(() => setLoading(false));
    }, [selectedMatch?.id]);

    const selectedList = Object.values(selected);
    const panels = buildSectionPanels(seats);

    const seatPrice = (seat) => {
        const multiplier = STAND_CATS[seat.stand]?.multiplier ?? 1;
        return Math.round((selectedMatch?.price ?? 75) * multiplier);
    };

    const toggle = (seat) => {
        if (seat.status !== "available") return;

        setSelected((prev) => {
            const next = { ...prev };
            if (next[seat.seat_id]) delete next[seat.seat_id];
            else next[seat.seat_id] = seat;
            return next;
        });
    };

    const handleContinue = () => {
        if (selectedList.length === 0) return;
        setError("");

        const seatData = selectedList.map((seat) => ({
            id: seat.seat_id,
            dbId: seat.dbId,
            price: seatPrice(seat),
            cat: STAND_CATS[seat.stand]?.label ?? seat.stand,
        }));

        navigate("/payment", {
            state: {
                booking: {
                    seats: seatData,
                    match: selectedMatch,
                    total: seatData.reduce((sum, s) => sum + s.price, 0),
                },
            },
        });
    };

    return (
        <main className="page">
            <section className="sm-page">
                {selectedMatch && (
                    <div className="match-header">
                        <div className="match-teams">
                            {selectedMatch.home} <span className="vs">VS</span> {selectedMatch.away}
                        </div>
                        <div className="match-meta">
                            📅 {selectedMatch.date} · 🕐 {selectedMatch.time} ·  {selectedMatch.stadium}
                        </div>
                    </div>
                )}

                <div className="sm-layout">
                    <div className="map-card">
                        <div className="sm-title"> {t.seatMap}</div>

                        <svg
                            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                            className="stadium-svg"
                            style={{ width: "100%", height: "auto", display: "block" }}
                        >
                            <defs>
                                <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.18" />
                                </filter>
                                <linearGradient id="fieldGradient" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0" stopColor="#208a3b" />
                                    <stop offset="1" stopColor="#116129" />
                                </linearGradient>
                            </defs>

                            <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="#f8fafc" rx="16" />
                            <rect x="55" y="45" width="890" height="675" fill="#f4eee2" rx="18" stroke="#d9d1c2" strokeWidth="1.5" />

                            {/* Section panels generated from the same seats.geojson geometry */}
                            {panels.map((panel) => {
                                const price = Math.round((selectedMatch?.price ?? 75) * (STAND_CATS[panel.stand]?.multiplier ?? 1));

                                return (
                                    <g key={panel.section} filter="url(#softShadow)">
                                        <polygon
                                            points={panel.points}
                                            fill={panel.color}
                                            fillOpacity="0.88"
                                            stroke="#ffffff"
                                            strokeWidth="2"
                                        />
                                        <text
                                            x={panel.cx}
                                            y={panel.cy - 4}
                                            textAnchor="middle"
                                            fill="#ffffff"
                                            fontSize="20"
                                            fontWeight="900"
                                            style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.45)", strokeWidth: 4 }}
                                        >
                                            {panel.section}
                                        </text>
                                        <text
                                            x={panel.cx}
                                            y={panel.cy + 15}
                                            textAnchor="middle"
                                            fill="#ffffff"
                                            fontSize="9"
                                            fontWeight="700"
                                            opacity="0.95"
                                        >
                                            {panel.label} · {price} SAR
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Field */}
                            <g filter="url(#softShadow)">
                                <rect x={FIELD.x - 16} y={FIELD.y - 16} width={FIELD.w + 32} height={FIELD.h + 32} fill="#9ca3af" opacity="0.45" />
                                <rect x={FIELD.x} y={FIELD.y} width={FIELD.w} height={FIELD.h} fill="url(#fieldGradient)" rx="12" stroke="#ffffff" strokeWidth="3" />
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <rect
                                        key={i}
                                        x={FIELD.x + (FIELD.w / 6) * i}
                                        y={FIELD.y}
                                        width={FIELD.w / 6}
                                        height={FIELD.h}
                                        fill={i % 2 === 0 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}
                                    />
                                ))}
                                <rect x={FIELD.x + 12} y={FIELD.y + 12} width={FIELD.w - 24} height={FIELD.h - 24} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
                                <line x1={FIELD.x + FIELD.w / 2} y1={FIELD.y} x2={FIELD.x + FIELD.w / 2} y2={FIELD.y + FIELD.h} stroke="rgba(255,255,255,0.75)" strokeWidth="2" />
                                <circle cx={FIELD.x + FIELD.w / 2} cy={FIELD.y + FIELD.h / 2} r="42" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" />
                                <circle cx={FIELD.x + FIELD.w / 2} cy={FIELD.y + FIELD.h / 2} r="4" fill="#ffffff" opacity="0.85" />
                                <rect x={FIELD.x} y={FIELD.y + 72} width="68" height="116" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" />
                                <rect x={FIELD.x + FIELD.w - 68} y={FIELD.y + 72} width="68" height="116" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" />
                            </g>

                            {/* Seat dots */}
                            {seats.map((seat) => {
                                const isSelected = !!selected[seat.seat_id];
                                const disabled = seat.status !== "available";
                                const size = isSelected ? 8 : 5;

                                return (
                                    <rect
                                        key={seat.seat_id}
                                        x={seat.x - size / 2}
                                        y={seat.y - size / 2}
                                        width={size}
                                        height={size}
                                        rx="1.4"
                                        fill={seatFill(seat, isSelected)}
                                        fillOpacity={disabled ? 0.45 : 1}
                                        stroke={isSelected ? "#ffffff" : "rgba(17,24,39,0.55)"}
                                        strokeWidth={isSelected ? 2.2 : 0.55}
                                        cursor={disabled ? "not-allowed" : "pointer"}
                                        onClick={() => toggle(seat)}
                                    >
                                        <title>
                                            {seat.seat_id} | {STAND_CATS[seat.stand]?.label ?? seat.stand} | {seatPrice(seat)} SAR | {seat.status}
                                        </title>
                                    </rect>
                                );
                            })}

                            {loading && (
                                <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle" fill="#334155" fontSize="18" fontWeight="800">
                                    Loading seats...
                                </text>
                            )}
                        </svg>

                        <div className="svg-legend">
                            <div className="legend-item"><span className="legend-dot" style={{ background: STAND_CATS.West.color }} />VIP</div>
                            <div className="legend-item"><span className="legend-dot" style={{ background: STAND_CATS.North.color }} />Gold</div>
                            <div className="legend-item"><span className="legend-dot" style={{ background: STAND_CATS.East.color }} />Premium</div>
                            <div className="legend-item"><span className="legend-dot" style={{ background: STAND_CATS.South.color }} />Silver</div>
                            <div className="legend-item"><span className="legend-dot" style={{ background: "#7c3aed" }} />{t.selected ?? "Selected"}</div>
                            <div className="legend-item"><span className="legend-dot" style={{ background: "#374151" }} />{t.sold ?? "Sold"}</div>
                            <div className="legend-item"><strong>{seats.length}</strong>&nbsp;Seats</div>
                        </div>
                    </div>

                    <div className="sidebar">
                        <div className="summary-card">
                            <div className="card-title">{t.selectSeat} ({selectedList.length})</div>

                            {selectedList.length === 0 ? (
                                <div className="empty-msg">{t.noSeatsSelected ?? "No seats selected yet"}</div>
                            ) : (
                                <div className="picked-list">
                                    {selectedList.map((seat) => (
                                        <div key={seat.seat_id} className="picked-row">
                                            <button className="rm-btn" onClick={() => toggle(seat)} title="Remove">✕</button>
                                            <div className="picked-info">
                                                <span className="picked-id">{seat.seat_id}</span>
                                                <span className="picked-stand">{STAND_CATS[seat.stand]?.label ?? seat.stand}</span>
                                            </div>
                                            <span className="picked-price">{seatPrice(seat)} SAR</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="total-row">
                                <span>{t.total ?? "Total"} ({selectedList.length})</span>
                                <span>{selectedList.reduce((sum, s) => sum + seatPrice(s), 0)} SAR</span>
                            </div>

                            <button className="continue-btn" disabled={selectedList.length === 0} onClick={handleContinue}>
                                {t.confirmPayment} →
                            </button>

                            {error && <p className="field-error">{error}</p>}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
