import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { useLanguage } from "../context/LanguageContext";

const FALLBACK_MATCHES = [
    {
        id: 1,
        home_team: "Al Hilal",
        away_team: "Al Nassr",
        date: "Saturday 3 May",
        time: "8:00 PM",
        stadium_name: "International Stadium",
        base_price: 75
    },
    {
        id: 2,
        home_team: "Al Ittihad",
        away_team: "Al Ahli",
        date: "Sunday 4 May",
        time: "6:00 PM",
        stadium_name: "Mrsool Park",
        base_price: 60
    },
    {
        id: 3,
        home_team: "Al Shabab",
        away_team: "Al Raed",
        date: "Monday 5 May",
        time: "9:00 PM",
        stadium_name: "Prince Faisal Stadium",
        base_price: 50
    }
];

export default function TicketsPage({
    goToSeatMap,
    goToBookings
}) {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [matches, setMatches] = useState(FALLBACK_MATCHES);

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            const response = await API.get("/matches/upcoming");

            const apiMatches = response.data.matches || [];

            if (apiMatches.length > 0) {
                const formattedMatches = apiMatches.slice(0, 12).map((match) => ({
                    id: match.id,
                    home_team: match.home_team,
                    away_team: match.away_team,
                    date: new Date(match.date).toLocaleDateString(),
                    time: new Date(match.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                    }),
                    stadium_name: match.league || "Saudi League",
                    base_price: 75
                }));

                setMatches(formattedMatches);
            }

        } catch (error) {
            console.error("Tickets matches error:", error);
        }
    };

    function toSeatMapInfo(match) {
        return {
            id: match.id,
            home: match.home_team,
            away: match.away_team,
            date: match.date,
            time: match.time,
            stadium: match.stadium_name,
            price: match.base_price
        };
    }

    return (
        <main className="page">

            <section className="hero">
                <div className="hero-content">
                    <div>
                        <h1>
                            🎫 {t.tickets}
                        </h1>

                        <p>
                            {t.ticketHeroSubtitle ||
                                "Choose your match and enjoy the stadium experience"}
                        </p>
                    </div>

                    <button className="hero-btn">
                        {t.bookNow}
                    </button>
                </div>
            </section>

            <section className="tickets-page-section">

                <div className="section-title">
                    <span />
                    {t.availableMatches || "Available Matches"}
                </div>

                <div className="tickets-grid">

                    {matches.map((match) => (

                        <div
                            className="ticket-card"
                            key={match.id}
                        >

                            <div className="teams">
                                {match.home_team}

                                <span className="vs">
                                    VS
                                </span>

                                {match.away_team}
                            </div>

                            <div className="ticket-info">
                                <div>
                                    📅 {match.date}
                                </div>

                                <div>
                                    🕐 {match.time}
                                </div>

                                <div>
                                    🏟️ {match.stadium_name}
                                </div>
                            </div>

                            <div className="price">
                                {t.startsFrom || "Starts from"}{" "}
                                {match.base_price} SAR

                                <div className="price-note">
                                    {t.priceByCategory ||
                                        "Depends on selected category"}
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

                <button
                    type="button"
                    className="secondary-btn"
                    onClick={goToBookings}
                >
                    📋 {t.myBookings}
                </button>

            </section>

        </main>
    );
}