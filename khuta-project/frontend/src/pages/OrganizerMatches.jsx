import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../api/api";
import { useLanguage } from "../context/LanguageContext";

const emptyForm = {
    home_team: "",
    away_team: "",
    match_time: "",
    stadium: "",
    status: "upcoming",
    home_score: 0,
    away_score: 0,
    minute: 0,
    base_price: 150
};

function OrganizerMatches() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [matches, setMatches] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        loadMatches();
    }, []);

    const loadMatches = async () => {
        try {
            const response = await API.get("/organizer/matches");
            setMatches(response.data.matches || []);
        } catch (error) {
            console.error("Matches error:", error);
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setMessage("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setMessage("");

        try {
            const payload = {
                ...formData,
                home_score: Number(formData.home_score),
                away_score: Number(formData.away_score),
                minute: Number(formData.minute),
                base_price: Number(formData.base_price)
            };

            if (editingId) {
                await API.put(`/organizer/matches/${editingId}`, payload);
                setMessage(t.matchUpdated);
            } else {
                await API.post("/organizer/matches", payload);
                setMessage(t.matchAdded);
            }

            resetForm();
            loadMatches();

        } catch (error) {
            console.error("Save match error:", error);
            setMessage(t.matchSaveFailed);

        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (match) => {
        setEditingId(match.id);

        setFormData({
            home_team: match.home_team || "",
            away_team: match.away_team || "",
            match_time: match.match_time
                ? match.match_time.slice(0, 16)
                : "",
            stadium: match.stadium || "",
            status: match.status || "upcoming",
            home_score: match.home_score ?? 0,
            away_score: match.away_score ?? 0,
            minute: match.minute ?? 0,
            base_price: match.base_price ?? 150
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelMatch = async (matchId) => {
        const confirmCancel = window.confirm(
            t.confirmCancelMatch
        );

        if (!confirmCancel) return;

        try {
            await API.put(`/organizer/matches/${matchId}/cancel`);
            loadMatches();
        } catch (error) {
            console.error("Cancel match error:", error);
        }
    };

    return (
        <main className="page" dir="ltr">
            <section className="page-shell organizer-layout">

                <aside className="organizer-side-panel">
                    <h2>{t.organizerPanel}</h2>

                    <button
                        className="side-panel-link"
                        onClick={() => navigate("/organizer")}
                    >
                        {t.dashboard}
                    </button>

                    <button
                        className="side-panel-link active"
                        onClick={() => navigate("/organizer/matches")}
                    >
                        {t.matches}
                    </button>

                    <button
                        className="side-panel-link"
                        onClick={() => navigate("/organizer/facilities")}
                    >
                        {t.facilities}
                    </button>
                </aside>

                <div className="organizer-main-content">
                    <h1>{t.manageMatches}</h1>
                    <p>{t.manageMatchesDesc}</p>

                    <form className="organizer-form" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div>
                                <label>{t.homeTeam}</label>

                                <input
                                    type="text"
                                    name="home_team"
                                    value={formData.home_team}
                                    onChange={handleChange}
                                    required
                                    placeholder="الهلال"
                                />
                            </div>

                            <div>
                                <label>{t.awayTeam}</label>

                                <input
                                    type="text"
                                    name="away_team"
                                    value={formData.away_team}
                                    onChange={handleChange}
                                    required
                                    placeholder="النصر"
                                />
                            </div>

                            <div>
                                <label>{t.matchTime}</label>

                                <input
                                    type="datetime-local"
                                    name="match_time"
                                    value={formData.match_time}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label>{t.stadium}</label>

                                <input
                                    type="text"
                                    name="stadium"
                                    value={formData.stadium}
                                    onChange={handleChange}
                                    required
                                    placeholder="الملعب الدولي"
                                />
                            </div>

                            <div>
                                <label>{t.status}</label>

                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="upcoming">upcoming</option>
                                    <option value="live">live</option>
                                    <option value="completed">completed</option>
                                    <option value="cancelled">cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label>{t.basePrice}</label>

                                <input
                                    type="number"
                                    name="base_price"
                                    value={formData.base_price}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>

                            <div>
                                <label>{t.homeScore}</label>

                                <input
                                    type="number"
                                    name="home_score"
                                    value={formData.home_score}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>

                            <div>
                                <label>{t.awayScore}</label>

                                <input
                                    type="number"
                                    name="away_score"
                                    value={formData.away_score}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>

                            <div>
                                <label>{t.minute}</label>

                                <input
                                    type="number"
                                    name="minute"
                                    value={formData.minute}
                                    onChange={handleChange}
                                    min="0"
                                    max="120"
                                />
                            </div>
                        </div>

                        {message && (
                            <p className="success-text">
                                {message}
                            </p>
                        )}

                        <div className="organizer-actions">
                            <button
                                type="submit"
                                className="book-btn"
                                disabled={loading}
                            >
                                {loading
                                    ? t.loading
                                    : editingId
                                        ? t.updateMatch
                                        : t.addMatch}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={resetForm}
                                >
                                    {t.cancelEdit}
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="table-wrapper">
                        <table className="organizer-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>{t.homeTeam}</th>
                                    <th>{t.awayTeam}</th>
                                    <th>{t.matchTime}</th>
                                    <th>{t.stadium}</th>
                                    <th>{t.status}</th>
                                    <th>{t.score}</th>
                                    <th>{t.basePrice}</th>
                                    <th>{t.actions}</th>
                                </tr>
                            </thead>

                            <tbody>
                                {matches.map((match) => (
                                    <tr key={match.id}>
                                        <td>{match.id}</td>
                                        <td>{match.home_team}</td>
                                        <td>{match.away_team}</td>
                                        <td>
                                            {match.match_time
                                                ? new Date(match.match_time).toLocaleString()
                                                : "-"}
                                        </td>
                                        <td>{match.stadium}</td>
                                        <td>{match.status}</td>
                                        <td>
                                            {match.home_score ?? 0} - {match.away_score ?? 0}
                                        </td>
                                        <td>{match.base_price} SAR</td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    type="button"
                                                    className="secondary-btn"
                                                    onClick={() => handleEdit(match)}
                                                >
                                                    {t.edit}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="danger-action"
                                                    onClick={() => handleCancelMatch(match.id)}
                                                    disabled={match.status === "cancelled"}
                                                >
                                                    {t.cancel}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {matches.length === 0 && (
                                    <tr>
                                        <td colSpan="9" style={{ textAlign: "center" }}>
                                            {t.noMatchesFound}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </section>
        </main>
    );
}

export default OrganizerMatches;