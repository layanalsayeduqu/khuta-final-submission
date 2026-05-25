import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function PaymentPage() {
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    const booking = location.state?.booking || {};
    const match = booking.match || {};
    const seats = booking.seats || [];
    const total = booking.total || 0;

    const [cardName, setCardName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [ticketData, setTicketData] = useState([]);
    const [error, setError] = useState("");

    const formatCard = (value) =>
        value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

    const formatExp = (value) => {
        const digits = value.replace(/\D/g, "").slice(0, 4);
        return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    };

    async function handlePay(event) {
        event.preventDefault();

        if (!cardName || cardNumber.replace(/\s/g, "").length < 16 || expiry.length < 5 || cvv.length < 3) {
            setError(t.fillCardError || "Please fill all card details correctly");
            return;
        }

        setError("");
        setLoading(true);

        const last4 = cardNumber.replace(/\s/g, "").slice(-4);
        const purchased = [];

        for (const seat of seats) {
            try {
                const response = await fetch("http://127.0.0.1:8000/api/payment/purchase", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        match_id: match.id,
                        seat_id: 0,
                        seat_label: seat.id,
                        amount: seat.price,
                        payment_method: "card",
                        card_last4: last4
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        typeof data.detail === "string"
                            ? data.detail
                            : JSON.stringify(data.detail || "Payment failed")
                    );
                }

                purchased.push({
                    seat,
                    ticket_code: data.ticket_code,
                    qr_token: data.qr_token,
                    ticket_id: data.ticket_id
                });

            } catch (error) {
                setError(error.message || "Payment failed");
                setLoading(false);
                return;
            }
        }

        setTicketData(purchased);
        setLoading(false);
        setSuccess(true);
    }

    if (!match.id || seats.length === 0) {
        return (
            <main className="page">
                <section className="pay-page">
                    <div className="pay-card">
                        <h1>{t.confirmPayment}</h1>
                        <p>{t.noBookingSelected}</p>
                        <button onClick={() => navigate("/tickets")}>{t.tickets}</button>
                    </div>
                </section>
            </main>
        );
    }

    if (success) {
        return (
            <main className="page">
                <section className="pay-page">
                    <div className="success-card">
                        <div className="success-icon">✅</div>
                        <h2 className="success-title">{t.bookingSuccess}</h2>
                        <p className="success-sub">{t.successSub}</p>

                        <div className="tickets-issued">
                            {ticketData.map(({ seat, ticket_code, qr_token }) => (
                                <div key={seat.id} className="issued-ticket">
                                    <div className="issued-top">
                                        <span>{match.home} <span className="vs">VS</span> {match.away}</span>
                                        <span className="issued-seat">{t.seatNumber} {seat.id}</span>
                                    </div>

                                    <div className="issued-code">{ticket_code}</div>

                                    {qr_token && (
                                        <div className="qr-wrapper">
                                            <QRCodeSVG
                                                value={`TICKET:${qr_token}`}
                                                size={180}
                                                level="H"
                                                marginSize={2}
                                                className="qr-svg"
                                            />
                                            <p className="qr-hint">{t.scanAtGate}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="success-actions">
                            <button className="bookings-btn" onClick={() => navigate("/bookings")}>
                                {t.myBookings}
                            </button>
                            <button className="home-btn" onClick={() => navigate("/")}>
                                {t.home}
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="page">
            <section className="pay-page">
                <div className="pay-card">
                    <h1 className="pay-title">{t.confirmPayment}</h1>
                    <p className="pay-sub">{t.reviewBooking}</p>

                    <div className="summary-box">
                        <div className="summary-header">
                            <div className="summary-teams">
                                {match.home} <span className="vs">VS</span> {match.away}
                            </div>
                            <div className="summary-meta">
                                🏟️ {match.stadium} · 📅 {match.date} · 🕐 {match.time}
                            </div>
                        </div>

                        <div className="seats-list">
                            {seats.map((seat) => (
                                <div key={seat.id} className="seat-line">
                                    <span>{t.seatNumber} <strong>{seat.id}</strong> ({seat.cat})</span>
                                    <span className="seat-price">{seat.price} SAR</span>
                                </div>
                            ))}
                        </div>

                        <div className="total-line">
                            <span>{t.total} ({seats.length})</span>
                            <span>{total} SAR</span>
                        </div>
                    </div>

                    <form onSubmit={handlePay} className="pay-form">
                        <div className="form-label">{t.paymentDetails}</div>

                        <input
                            className="pay-input"
                            placeholder={t.cardHolder}
                            value={cardName}
                            onChange={(event) => setCardName(event.target.value)}
                        />

                        <input
                            className="pay-input"
                            placeholder={t.cardNumber}
                            value={cardNumber}
                            onChange={(event) => setCardNumber(formatCard(event.target.value))}
                            inputMode="numeric"
                        />

                        <div className="input-row">
                            <input
                                className="pay-input"
                                placeholder="MM/YY"
                                value={expiry}
                                onChange={(event) => setExpiry(formatExp(event.target.value))}
                                inputMode="numeric"
                            />

                            <input
                                className="pay-input"
                                placeholder="CVV"
                                value={cvv}
                                onChange={(event) =>
                                    setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))
                                }
                                inputMode="numeric"
                            />
                        </div>

                        {error && <div className="form-error">{error}</div>}

                        <button className="pay-btn" type="submit" disabled={loading}>
                            {loading ? t.loading : `${t.confirmPayment} - ${total} SAR`}
                        </button>
                    </form>

                    <div className="secure-note">{t.securePayment || "Secure payment"}</div>

                    <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => navigate("/seat-map", { state: { match } })}
                    >
                        ← {t.back}
                    </button>
                </div>
            </section>
        </main>
    );
}