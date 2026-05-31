import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../api/api";
import { useLanguage } from "../context/LanguageContext";

const emptyForm = {
    name_ar: "",
    type: "",
    geom: ""
};

function OrganizerFacilities() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [facilities, setFacilities] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        loadFacilities();
    }, []);

    const loadFacilities = async () => {
        try {
            const response = await API.get("/organizer/facilities");
            setFacilities(response.data.facilities || []);
        } catch (error) {
            console.error("Facilities error:", error);
        }
    };

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setMessage("");

        try {
            await API.post("/organizer/facilities", formData);

            setFormData(emptyForm);
            setMessage(t.facilityAdded);
            loadFacilities();

        } catch (error) {
            console.error("Add facility error:", error);
            setMessage(t.facilityAddFailed);

        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (facilityId) => {
        const confirmDelete = window.confirm(
            t.confirmDeleteFacility
        );

        if (!confirmDelete) return;

        try {
            await API.delete(`/organizer/facilities/${facilityId}`);
            loadFacilities();
        } catch (error) {
            console.error("Delete facility error:", error);
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
                        className="side-panel-link"
                        onClick={() => navigate("/organizer/matches")}
                    >
                        {t.matches}
                    </button>

                    <button
                        className="side-panel-link active"
                        onClick={() => navigate("/organizer/facilities")}
                    >
                        {t.facilities}
                    </button>
                </aside>

                <div className="organizer-main-content">
                    <h1>{t.manageFacilities}</h1>
                    <p>{t.manageFacilitiesDesc}</p>

                    <form className="organizer-form" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div>
                                <label>{t.facilityName}</label>

                                <input
                                    type="text"
                                    name="name_ar"
                                    value={formData.name_ar}
                                    onChange={handleChange}
                                    required
                                    placeholder="Food Area"
                                />
                            </div>

                            <div>
                                <label>{t.facilityType}</label>

                                <input
                                    type="text"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                    placeholder="  food / restroom / Medical "
                                />
                            </div>

                            <div>
                                <label>{t.geom}</label>

                                <input
                                    type="text"
                                    name="geom"
                                    value={formData.geom}
                                    onChange={handleChange}
                                    required
                                    placeholder="POINT(39.1225 22.0899)"
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
                                {loading ? t.loading : t.addFacility}
                            </button>
                        </div>
                    </form>

                    <div className="table-wrapper">
                        <table className="organizer-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>{t.name}</th>
                                    <th>{t.facilityType}</th>
                                    <th>{t.geom}</th>
                                    <th>{t.actions}</th>
                                </tr>
                            </thead>

                            <tbody>
                                {facilities.map((facility) => (
                                    <tr key={facility.id}>
                                        <td>{facility.id}</td>
                                        <td>{facility.name}</td>
                                        <td>{facility.type}</td>
                                        <td>{facility.geom}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="danger-action"
                                                onClick={() => handleDelete(facility.id)}
                                            >
                                                {t.delete}
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {facilities.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: "center" }}>
                                            {t.noFacilitiesFound}
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

export default OrganizerFacilities;