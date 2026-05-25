import { useState } from "react";
import { Link } from "react-router-dom";

import API from "../api/api";
import { useLanguage } from "../context/LanguageContext";

function ResetPassword() {
    const { t } = useLanguage();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setMessage("");
        setError("");

        try {
            const response = await API.post("/auth/reset-password", {
                email
            });

            setMessage(
                response.data.message ||
                "Password reset instructions sent successfully"
            );

        } catch (error) {
            setError(
                error.response?.data?.detail ||
                "Failed to send reset request"
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-card">

                <div className="auth-icon">
                    🔐
                </div>

                <h1>
                    {t.resetPassword}
                </h1>

                <p>
                    {t.resetPasswordSubtitle ||
                        "Enter your email and we will send you reset instructions"}
                </p>

                <form onSubmit={handleSubmit}>

                    <label className="auth-label">
                        {t.email}
                    </label>

                    <input
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />

                    {error && (
                        <p className="field-error">
                            {error}
                        </p>
                    )}

                    {message && (
                        <p className="success-text">
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? t.loading
                            : t.resetPassword}
                    </button>

                </form>

                <div className="auth-links">
                    <p>
                        <Link to="/login">
                            {t.backToLogin || "Back to login"}
                        </Link>
                    </p>
                </div>

            </section>
        </main>
    );
}

export default ResetPassword;