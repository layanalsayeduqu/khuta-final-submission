import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/api";
import { useLanguage } from "../context/LanguageContext";

function VerifyEmail() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const email = params.get("email");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const handleVerify = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            await API.post("/auth/verify-email", {
                email,
                code
            });
            setSuccess("Email verified successfully");
            setTimeout(() => {
                navigate("/login");
            }, 1200);
        } catch (error) {
            setError(
                error.response?.data?.detail ||
                "Verification failed"
            );

        } finally {
            setLoading(false);
      }
    };
    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-icon">✉️</div>

                <h1>{t.verifyEmail || "Verify Email"}</h1>

                <p>
                    {t.verifyEmailSubtitle ||
                        "Enter the code sent to your email"}
                </p>

                <form onSubmit={handleVerify}>
                    <label className="auth-label">{t.email}</label>
                    <input type="email" value={email || ""} disabled />

                    <label className="auth-label">
                        {t.verificationCode || "Verification Code"}
                    </label>

                    <input
                        type="text"
                        placeholder="123456"
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                    />

                    {error && <p className="field-error">{error}</p>}

                    {success && (
                        <p className="success-message">
                            {success}
                        </p>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? t.loading : t.verify || "Verify"}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default VerifyEmail;