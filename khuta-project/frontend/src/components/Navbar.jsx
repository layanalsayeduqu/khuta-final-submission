import { useState } from "react";
import { Link } from "react-router-dom";

import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

import logo from "../assets/logo.png";

function Navbar() {

    const { lang, toggleLanguage, t } = useLanguage();

    const { theme, toggleTheme } = useTheme();

    const [open, setOpen] = useState(false);

    const isLoggedIn =
        !!localStorage.getItem("token");

    const role = localStorage.getItem("role");

    const isOrganizer =
        role?.toLowerCase() === "organizer";

    const logout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_email");
        localStorage.removeItem("role");

        window.location.href = "/login";
    };

    return (

        <nav className="navbar">

            <div className="logo">

                <Link to="/">

                    <img
                        src={logo}
                        alt="Khuta Logo"
                        className="logo-image"
                    />

                </Link>

            </div>

            <div className="nav-links">

                <Link to="/">
                    {t.home}
                </Link>

                <Link to="/tickets">
                    {t.tickets}
                </Link>

                <Link to="/map">
                    {t.map}
                </Link>

                <Link
                    to={
                        isLoggedIn
                            ? "/favorite-club"
                            : "/login"
                    }
                >
                    {t.favorites}
                </Link>

                <Link
                    to={
                        isLoggedIn
                            ? "/bookings"
                            : "/login"
                    }
                >
                    {t.myBookings}
                </Link>

                {isOrganizer && (
                    <Link to="/organizer">
                        {t.organizerDashboard}
                    </Link>
                )}

            </div>

            <div className="nav-actions">

                <button
                    type="button"
                    className={`theme-switch ${theme === "dark" ? "dark" : ""}`}
                    onClick={toggleTheme}
                >
                    <span className="theme-thumb"></span>

                    <span className="theme-moon">🌙</span>

                    <span className="theme-star star-1">✦</span>
                    <span className="theme-star star-2">✦</span>
                    <span className="theme-star star-3">✦</span>

                    <span className="theme-sun">☀️</span>
                </button>

                <button onClick={toggleLanguage}>

                    {lang === "en"
                        ? "العربية"
                        : "English"}

                </button>

                {!isLoggedIn ? (

                    <button
                        onClick={() =>
                            window.location.href = "/login"
                        }
                    >
                        {t.login}
                    </button>

                ) : (

                    <div className="profile-menu">

                        <button
                            className="profile-circle"
                            onClick={() => setOpen(!open)}
                        >
                            👤
                        </button>

                        {open && (

                            <div className="profile-dropdown">

                                <Link to="/profile">
                                    {t.profile}
                                </Link>

                                <Link to="/favorite-club">
                                    {t.favorites}
                                </Link>

                                <Link to="/bookings">
                                    {t.myBookings}
                                </Link>

                                {isOrganizer && (
                                    <Link to="/organizer">
                                        {t.organizerDashboard}
                                    </Link>
                                )}

                                <button onClick={logout}>
                                    {t.logout}
                                </button>

                            </div>

                        )}

                    </div>

                )}

            </div>

        </nav>
    );
}

export default Navbar;