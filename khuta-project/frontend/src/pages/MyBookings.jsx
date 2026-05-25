import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function MyBookings() {
    const navigate = useNavigate();
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
                    يجب تسجيل الدخول أولاً
                    <br />
                    <button onClick={() => navigate("/login")}>
                        تسجيل الدخول
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="bookings-header">
                <h1 className="bookings-title">حجوزاتي</h1>
                <p className="bookings-sub">جميع التذاكر التي قمت بحجزها</p>
            </div>

            {loading ? (
                <div className="empty-msg">جاري تحميل الحجوزات...</div>
            ) : tickets.length === 0 ? (
                <div className="empty-msg">لا توجد لديك حجوزات حالياً</div>
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
                                <div>🎫 المقعد: {ticket.seat_number}</div>
                                <div>💰 {ticket.price} ريال</div>
                            </div>

                            <div className="qr-section">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${ticket.qr_token}`}
                                    alt="QR"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyBookings;