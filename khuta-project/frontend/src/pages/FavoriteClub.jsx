import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

const CLUBS = [
    { id: "alhilal", dbName: "Al Hilal", color: "#2f80ed" },
    { id: "alnassr", dbName: "Al Nassr", color: "#f2c94c" },
    { id: "alittihad", dbName: "Al Ittihad", color: "#252238" },
    { id: "alahli", dbName: "Al Ahli", color: "#2ecc71" },
    { id: "alshabab", dbName: "Al Shabab", color: "#cbb7ff" },
    { id: "alettifaq", dbName: "Al Ettifaq", color: "#8b4a4a" }
];

const API_BASE_URL = "http://127.0.0.1:8000";

function FavoriteClub() {
    const { t, lang } = useLanguage();
    const navigate = useNavigate();
    const [selectedClubId, setSelectedClubId] = useState(CLUBS[0].id);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);

    const normalizeClubId = (clubName) => {
        const value = String(clubName || "").trim().toLowerCase();

        const clubMap = {
            alhilal: "alhilal",
            "al hilal": "alhilal",
            الهلال: "alhilal",
            alnassr: "alnassr",
            "al nassr": "alnassr",
            النصر: "alnassr",
            alittihad: "alittihad",
            "al ittihad": "alittihad",
            الاتحاد: "alittihad",
            alahli: "alahli",
            "al ahli": "alahli",
            الأهلي: "alahli",
            الاهلي: "alahli",
            alshabab: "alshabab",
            "al shabab": "alshabab",
            الشباب: "alshabab",
            alettifaq: "alettifaq",
            "al ettifaq": "alettifaq",
            الاتفاق: "alettifaq"
        };

        return clubMap[value] || value;
    };

    const getClubDbName = (clubId) => {
        const club = CLUBS.find((item) => item.id === normalizeClubId(clubId));
        return club ? club.dbName : clubId;
    };

    const currentClub =
        CLUBS.find((club) => club.id === normalizeClubId(selectedClubId)) || CLUBS[0];

    const translateClubName = (clubName) => {
        const clubId = normalizeClubId(clubName);

        const clubMap = {
            alhilal: lang === "ar" ? "الهلال" : "Al Hilal",
            alnassr: lang === "ar" ? "النصر" : "Al Nassr",
            alittihad: lang === "ar" ? "الاتحاد" : "Al Ittihad",
            alahli: lang === "ar" ? "الأهلي" : "Al Ahli",
            alshabab: lang === "ar" ? "الشباب" : "Al Shabab",
            alettifaq: lang === "ar" ? "الاتفاق" : "Al Ettifaq"
        };

        return clubMap[clubId] || clubName;
    };

    const formatMatch = (match) => {
        const dateValue = match.match_time || match.date;
        const dateObject = dateValue ? new Date(dateValue) : null;

        return {
            id: match.id,
            home_team: match.home_team,
            away_team: match.away_team,
            date: dateObject && !isNaN(dateObject)
                ? dateObject.toISOString().slice(0, 10)
                : match.date,
            time: dateObject && !isNaN(dateObject)
                ? dateObject.toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", {
                    hour: "2-digit",
                    minute: "2-digit"
                })
                : match.time,
            stadium: match.stadium_name || match.stadium,
            score: "VS",
            price: match.base_price || match.price || 150
        };
    };

    const fetchMatchesByClub = async (clubId) => {
        try {
            const clubDbName = getClubDbName(clubId);
            const response = await API.get("/api/tickets/matches");
            const apiMatches = Array.isArray(response.data)
                ? response.data
                : response.data.matches || [];

            const filteredMatches = apiMatches
                .filter((match) =>
                    String(match.home_team || "").trim() === clubDbName ||
                    String(match.away_team || "").trim() === clubDbName
                )
                .map(formatMatch);

            setMatches(filteredMatches);
        } catch (error) {
            console.error("Failed to fetch club matches:", error);
            setMatches([]);
        }
    };

    const getUserId = () => {
        const userId =
            localStorage.getItem("user_id") ||
            localStorage.getItem("userId") ||
            localStorage.getItem("id");

        return Number(userId);
    };

    const fetchFavoriteData = async () => {
        const userId = getUserId();

        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/matches/favorite?user_id=${userId}`);
            const data = await response.json();

            if (response.ok) {
                const favoriteClub =
                    data.favoriteClub && data.favoriteClub !== "EMPTY" && data.favoriteClub !== "NULL"
                        ? normalizeClubId(data.favoriteClub)
                        : selectedClubId;

                setSelectedClubId(favoriteClub);
                await fetchMatchesByClub(favoriteClub);
            } else {
                await fetchMatchesByClub(selectedClubId);
            }
        } catch (error) {
            console.error("Failed to fetch favorite data:", error);
            await fetchMatchesByClub(selectedClubId);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavoriteData();
    }, []);

    useEffect(() => {
        if (!loading) {
            fetchMatchesByClub(selectedClubId);
        }
    }, [selectedClubId, lang]);

    const handleSaveFavorite = async () => {
        const userId = getUserId();

        if (!userId) {
            alert(lang === "ar" ? "يجب تسجيل الدخول أولًا" : "Please login first");
            return;
        }

        setSaveLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/update-favorite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: userId,
                    favorite_club: selectedClubId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Save favorite error:", data);
                alert(lang === "ar" ? "فشل حفظ النادي المفضل" : "Failed to save favorite club");
                return;
            }

            await fetchMatchesByClub(selectedClubId);
        } catch (error) {
            console.error("Save failed:", error);
            alert(lang === "ar" ? "خطأ في الاتصال بالسيرفر" : "Network error");
        } finally {
            setSaveLoading(false);
        }
    };

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh"
                }}
            >
                <h2>{t.loading || "Loading..."}</h2>
            </div>
        );
    }

    return (
        <main className="page">
            <section className="favorite-page-pro">
                <div className="favorite-header">
                    <img src="/logo.png" alt="Logo" style={{ width: "120px", height: "auto" }} />
                    <div>
                        <h1>{lang === "ar" ? "النادي المفضل" : "My Favorites"}</h1>
                    </div>
                </div>
                <div className="favorite-layout">
                    <aside className="favorite-card">
                        <h3>{lang === "ar" ? "اختر النادي" : "Select Club"}</h3>
                        <div className="club-stack">
                            {CLUBS.map((club) => (
                                <button
                                    key={club.id}
                                    type="button"
                                    className={`club-choice ${normalizeClubId(selectedClubId) === club.id ? "active" : ""}`}
                                    onClick={() => setSelectedClubId(club.id)}
                                >
                                    <span
                                        className="club-dot"
                                        style={{
                                            background: club.color
                                        }}
                                    />
                                    <span>{translateClubName(club.id)}</span>
                                    {normalizeClubId(selectedClubId) === club.id && (
                                        <span className="club-check">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <button
                            className="save-btn"
                            onClick={handleSaveFavorite}
                            disabled={saveLoading}
                        >
                            {saveLoading
                                ? lang === "ar"
                                    ? "جاري الحفظ..."
                                    : "Saving..."
                                : lang === "ar"
                                    ? "حفظ النادي المفضل"
                                    : "Save Favorite Club"}
                        </button>
                    </aside>
                    <section className="favorite-content">
                        <div className="selected-club-card">
                            <span
                                className="selected-club-logo"
                                style={{
                                    background: currentClub.color
                                }}
                            />
                            <div>
                                <h2>{translateClubName(currentClub.id)}</h2>
                                <p>
                                    {matches.length}{" "}
                                    {lang === "ar" ? "مباريات قادمة" : "upcoming matches"}
                                </p>
                            </div>
                        </div>
                        <h3 className="favorite-section-title">
                            📅 {lang === "ar" ? "المباريات القادمة" : "Upcoming Matches"}
                        </h3>
                        <div className="favorite-matches">
                            {matches.length === 0 ? (
                                <p
                                    style={{
                                        padding: "30px",
                                        textAlign: "center",
                                        color: "#888"
                                    }}
                                >
                                    {lang === "ar" ? "لا توجد مباريات قادمة" : "No upcoming matches"}
                                </p>
                            ) : (
                                matches.map((match) => (
                                    <div key={match.id} className="favorite-match-card">
                                        <div className="fav-teams">
                                            <div className="fav-team">
                                                <strong>{translateClubName(match.home_team)}</strong>
                                            </div>
                                            <div className="fav-score">{match.score || "VS"}</div>
                                            <div className="fav-team">
                                                <strong>{translateClubName(match.away_team)}</strong>
                                            </div>
                                        </div>
                                        <div className="fav-meta">
                                            <span>📅 {match.date}</span>
                                            <span>⏱ {match.time}</span>
                                            <span>🏟 {match.stadium}</span>
                                        </div>
                                        <div className="fav-footer">
                                            <div>
                                                <span className="fav-price-label">
                                                    {lang === "ar" ? "تبدأ من" : "Starts from"}
                                                </span>
                                                <strong>
                                                    {" "}
                                                    {match.price || 150} {lang === "ar" ? "ريال" : "SAR"}
                                                </strong>
                                            </div>
                                            <div className="fav-actions">
                                                <button
                                                    className="details-btn"
                                                    onClick={() => navigate("/tickets")}
                                                >
                                                    {lang === "ar" ? "عرض التفاصيل" : "View Details"}
                                                </button>
                                                <button
                                                    className="book-btn-mini"
                                                    onClick={() => navigate("/tickets")}
                                                >
                                                    {lang === "ar" ? "احجز تذكرة" : "Book Ticket"} →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </section>
        </main>
    );
}

export default FavoriteClub;