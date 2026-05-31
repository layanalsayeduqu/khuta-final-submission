import { useNavigate } from "react-router-dom";

import { useLanguage } from "../context/LanguageContext";

function Organizer() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <main className="page" dir="ltr">
            <section className="page-shell organizer-layout">

                <aside className="organizer-side-panel">
                    <h2>{t.organizerPanel}</h2>

                    <button
                        className="side-panel-link active"
                        onClick={() => navigate("/organizer")}
                    >
                        {t.dashboard}
                    </button>

                    <button
                        className="side-panel-link"
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
                    <h1>{t.organizerDashboard}</h1>
                    <p>{t.organizerDashboardDesc}</p>

                    <div className="tickets-grid" style={{ marginTop: "30px" }}>
                        <div className="ticket-card">
                            <h2>{t.matches}</h2>

                            <p>
                                {t.manageMatchesDesc}
                            </p>

                            <button
                                className="book-btn"
                                onClick={() => navigate("/organizer/matches")}
                            >
                                {t.manageMatches}
                            </button>
                        </div>

                        <div className="ticket-card">
                            <h2>{t.facilities}</h2>

                            <p>
                                {t.manageFacilitiesDesc}
                            </p>

                            <button
                                className="book-btn"
                                onClick={() => navigate("/organizer/facilities")}
                            >
                                {t.manageFacilities}
                            </button>
                        </div>
                    </div>
                </div>

            </section>
        </main>
    );
}

export default Organizer;