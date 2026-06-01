import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { useLanguage } from "../context/LanguageContext";

const FALLBACK_MATCHES = [
    {
        id: 1,
        home_team: "Al Hilal",
        home_team_ar: "الهلال",
        away_team: "Al Nassr",
        away_team_ar: "النصر",
        date: "Saturday 3 May",
        date_ar: "السبت 3 مايو",
        time: "8:00 PM",
        time_ar: "8:00 مساءً",
        stadium_name: "Prince Faisal Stadium",
        stadium_name_ar: "ملعب الأمير فيصل",
        base_price: 75
    },
    {
        id: 2,
        home_team: "Al Ittihad",
        home_team_ar: "الاتحاد",
        away_team: "Al Ahli",
        away_team_ar: "الأهلي",
        date: "Sunday 4 May",
        date_ar: "الأحد 4 مايو",
        time: "6:00 PM",
        time_ar: "6:00 مساءً",
        stadium_name: "Prince Faisal Stadium",
        stadium_name_ar: "ملعب الأمير فيصل",
        base_price: 60
    },
    {
        id: 3,
        home_team: "Al Shabab",
        home_team_ar: "الشباب",
        away_team: "Al Raed",
        away_team_ar: "الرائد",
        date: "Monday 5 May",
        date_ar: "الاثنين 5 مايو",
        time: "9:00 PM",
        time_ar: "9:00 مساءً",
        stadium_name: "Prince Faisal Stadium",
        stadium_name_ar: "ملعب الأمير فيصل",
        base_price: 50
    }
];

export default function TicketsPage() {
    const { t, lang } = useLanguage();
    const navigate = useNavigate();
    const [matches, setMatches] = useState(FALLBACK_MATCHES);

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            const response = await API.get("/api/tickets/matches");
            const apiMatches = Array.isArray(response.data)
                ? response.data
                : response.data.matches || [];
            if (apiMatches.length > 0) {
                setMatches(apiMatches.slice(0, 12));
            }
        } catch (error) {
            console.error("Tickets matches error:", error);
        }
    };

    const translateTeamName = (teamName) => {
        const teamMap = {
            "Al Hilal": t.alHilal,
            "Al Nassr": t.alNassr,
            "Al Raed": t.alRaed,
            "Al read": t.alRaed,
            "Al Riyadh": t.alRiyadh,
            "Al Wehda": t.alWehda,
            "Al Fayha": t.alFayha,
            "Al Taawon": t.alTaawon,
            "Al Ittihad": t.alIttihad,
            "Al Ahli": t.alAhli,
            "Al Qadsiah": t.alQadsiah,
            "Al Qadiah": t.alQadsiah,
            "Al Shabab": lang === "ar" ? "الشباب" : "Al Shabab"
        };
        return teamMap[teamName] || teamName;
    };

    const translateStadiumName = (stadiumName) => {
        const stadiumMap = {
            international_stadium: lang === "ar" ? "الاستاد الدولي" : "International Stadium",
            king_abdullah_sports_city: lang === "ar" ? "مدينة الملك عبدالله الرياضية" : "King Abdullah Sports City",
            "Prince Faisal Stadium": lang === "ar" ? "ملعب الأمير فيصل" : "Prince Faisal Stadium"
        };
        return stadiumMap[stadiumName] || stadiumName;
    };

    const localize = (match, field) => {
        if (field === "home_team") {
            return lang === "ar" && match.home_team_ar ? match.home_team_ar : translateTeamName(match.home_team);
        }
        if (field === "away_team") {
            return lang === "ar" && match.away_team_ar ? match.away_team_ar : translateTeamName(match.away_team);
        }
        if (field === "stadium_name") {
            return lang === "ar" && match.stadium_name_ar ? match.stadium_name_ar : translateStadiumName(match.stadium_name);
        }
        return lang === "ar" && match[`${field}_ar`] ? match[`${field}_ar`] : match[field];
    };

    const toSeatMapInfo = (match) => {
        return {
            id: match.id,
            home: localize(match, "home_team"),
            away: localize(match, "away_team"),
            date: localize(match, "date"),
            time: localize(match, "time"),
            stadium: localize(match, "stadium_name"),
            price: match.base_price
        };
    };

    return (
        <main className="page">
            <section className="tickets-page-section">
                <div className="section-title">
                    <span />
                    {lang === "ar" ? "المباريات المتاحة" : "Available Matches"}
                </div>
                <div className="tickets-grid">
                    {matches.map((match) => (
                        <div className="ticket-card" key={match.id}>
                            <div className="teams">
                                {localize(match, "home_team")}
                                <span className="vs">
                                    {lang === "ar" ? "ضد" : "VS"}
                                </span>
                                {localize(match, "away_team")}
                            </div>
                            <div className="ticket-info">
                                <div>
                                    📅 {localize(match, "date")}
                                </div>
                                <div>
                                    🕐 {localize(match, "time")}
                                </div>
                                <div>
                                    🏟️ {localize(match, "stadium_name")}
                                </div>
                            </div>
                            <div className="price">
                                {lang === "ar" ? "تبدأ من" : "Starts from"}{" "}
                                {match.base_price} {lang === "ar" ? "ريال" : "SAR"}
                                <div className="price-note">
                                    {lang === "ar" ? "يعتمد على الفئة المختارة" : "Depends on selected category"}
                                </div>
                            </div>
                            <button
                                className="book-btn"
                                onClick={() => {
                                    const token = localStorage.getItem("token");
                                    if (!token) {
                                        navigate("/login");
                                        return;
                                    }
                                    navigate("/seat-map", {
                                        state: {
                                            match: toSeatMapInfo(match)
                                        }
                                    });
                                }}
                            >
                                {t.selectSeat} →
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}