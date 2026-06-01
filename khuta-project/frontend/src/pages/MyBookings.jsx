import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "../context/LanguageContext";

function MyBookings() {
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    const token = localStorage.getItem("token");

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const translateTeamName = (teamName) => {
        const teamMap = {
            "Al Hilal": t.alHilal,
            "Al Nassr": t.alNassr,
            "Al Raed": t.alRaed,
            "Al read": t.alRaed,
            "Al Riyadh": t.alRiyadh,
            "Al Wehda": t.alWehda,
            "Al Fayha": t.alFayha,
            "Al Taawon": t.alTaawon,
            "Al Ittihad": t.alIttihad,
            "Al Ahli": t.alAhli,
            "Al Qadsiah": t.alQadsiah,
            "Al Qadiah": t.alQadsiah,
            "Al Shabab": lang === "ar" ? "الشباب" : "Al Shabab",
            "Al Ettifaq": lang === "ar" ? "الاتفاق" : "Al Ettifaq"
        };

        return teamMap[teamName] || teamName;
    };

    const translateStadiumName = (stadiumName) => {
        const stadiumMap = {
            international_stadium: lang === "ar" ? "الاستاد الدولي" : "International Stadium",
            king_abdullah_sports_city: lang === "ar" ? "مدينة الملك عبدالله الرياضية" : "King Abdullah Sports City",
            "Prince Faisal Stadium": lang === "ar" ? "ملعب الأمير فيصل" : "Prince Faisal Stadium"
        };

        return stadiumMap[stadiumName] || stadiumName;
    };

    const translateStatus = (status) => {
        const statusMap = {
            booked: lang === "ar" ? "محجوزة" : "Booked",
            active: lang === "ar" ? "نشطة" : "Active",
            used: lang === "ar" ? "مستخدمة" : "Used",
            cancelled: lang === "ar" ? "ملغاة" : "Cancelled"
        };

        return statusMap[String(status || "").toLowerCase()] || status;
    };

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
                <p className="bookings-sub">
                    {t.myBookingsSub || (lang === "ar" ? "جميع حجوزاتك وتذاكرك في مكان واحد" : "All your bookings and tickets in one place")}
                </p>
            </div>

            {loading ? (
                <div className="empty-msg">{t.loading}</div>
            ) : tickets.length === 0 ? (
                <div className="empty-msg">
                    {t.noTicketsFound || (lang === "ar" ? "لا توجد تذاكر" : "No tickets found")}
                </div>
            ) : (
                <div className="tickets-grid">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="ticket-card">
                            <div className="ticket-header">
                                <div className="teams">
                                    {translateTeamName(ticket.home_team)}
                                    <span className="vs">
                                        {lang === "ar" ? "ضد" : "VS"}
                                    </span>
                                    {translateTeamName(ticket.away_team)}
                                </div>
                                <span className="status-badge badge-active">
                                    {translateStatus(ticket.status)}
                                </span>
                            </div>

                            <div className="ticket-details">
                                <div>📍 {translateStadiumName(ticket.stadium_name)}</div>
                                <div>📅 {ticket.match_date}</div>
                                <div>🕐 {ticket.match_time}</div>
                                <div>🎫 {t.seatNumber}: {ticket.seat_number}</div>
                                <div>💰 {ticket.price} {lang === "ar" ? "ريال" : "SAR"}</div>
                            </div>

                            {ticket.qr_token && (
                                <div className="qr-section">
                                    <QRCodeSVG
                                        value={`TICKET:${ticket.qr_token}`}
                                        size={140}
                                        level="H"
                                        marginSize={2}
                                    />
                                    <p className="qr-hint">
                                        {t.scanAtGate || (lang === "ar" ? "امسح الرمز عند البوابة" : "Scan at the gate")}
                                    </p>
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