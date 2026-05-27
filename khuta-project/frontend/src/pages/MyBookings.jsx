import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "../context/LanguageContext";

function MyBookings() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const token = localStorage.getItem("token");

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        fetch("http://127.0.0.1:8000/api/bookings/", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                setTickets(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => {
                setTickets([]);
                setLoading(false);
            });
    }, [token]);

    if (!token) {
        return (
            <div className="page">
                <div className="empty-msg">
                    <br />
                    <button onClick={() => navigate("/login")}>
                        {t.login}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="bookings-header">
                <h1 className="bookings-title">{t.myBookings}</h1>
                <p className="bookings-sub">{t.myBookingsSub}</p>
            </div>

            {loading ? (
                <div className="empty-msg">{t.loading}</div>
            ) : tickets.length === 0 ? (
                <div className="empty-msg">{t.noTicketsFound}</div>
            ) : (
                <div className="tickets-grid">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="ticket-card">
                            <div className="ticket-header">
                                <div className="teams">
                                    {ticket.home_team}
                                    <span className="vs">VS</span>
                                    {ticket.away_team}
                                </div>
                                <span className="status-badge badge-active">
                                    {ticket.status}
                                </span>
                            </div>

                            <div className="ticket-details">
                                <div>📍 {ticket.stadium_name}</div>
                                <div>📅 {ticket.match_date}</div>
                                <div>🕐 {ticket.match_time}</div>
                                <div>🎫 {t.seatNumber}: {ticket.seat_number}</div>
                                <div>💰 {ticket.price} SAR</div>
                            </div>

                            {ticket.qr_token && (
                                <div className="qr-section">
                                    <QRCodeSVG
                                        value={`TICKET:${ticket.qr_token}`}
                                        size={140}
                                        level="H"
                                        marginSize={2}
                                    />
                                    <p className="qr-hint">{t.scanAtGate}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyBookings;
