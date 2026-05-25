import { useEffect, useState } from "react";

import API from "../api/api";
import { useLanguage } from "../context/LanguageContext";

function Home() {

    const { t } = useLanguage();

    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            const response = await API.get("/matches/upcoming");
            setMatches(response.data.matches || []);
        } catch (error) {
            console.error("Matches error:", error);
        } finally {
            setLoading(false);
        }
    };
    const liveMatches = matches.filter(
    (match) =>
        match.status === "1H" ||
        match.status === "2H" ||
        match.status === "HT"
        );

        const upcomingMatches = matches.filter(
            (match) => match.status === "NS"
        );

    return (
        <main className="page">

            <section className="hero">
                <h1>{t.welcome}</h1>
                <p>{t.subtitle}</p>
            </section>

            <section className="matches-section">

                <h2>Upcoming Matches</h2>

                {loading && <p>Loading matches...</p>}

                <div className="matches-grid">
                    {
                        (upcomingMatches.length > 0
                            ? upcomingMatches
                            : matches.slice(0, 6)
                        ).map((match) => (
                        <div className="match-card" key={match.id}>

                            <div className="match-status">
                                {match.status}
                            </div>

                            <div className="match-teams">

                                <div className="match-team">
                                    <img src={match.home_logo} alt={match.home_team} />
                                    <span>{match.home_team}</span>
                                </div>

                                <strong>
                                    {match.home_goals ?? "-"} : {match.away_goals ?? "-"}
                                </strong>

                                <div className="match-team">
                                    <img src={match.away_logo} alt={match.away_team} />
                                    <span>{match.away_team}</span>
                                </div>

                            </div>

                            <p className="match-date">
                                {new Date(match.date).toLocaleString()}
                            </p>

                        </div>
                    ))}
                </div>

            </section>

        </main>
    );
}

export default Home;