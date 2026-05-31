import { Routes, Route, Navigate } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import ResetPassword from "../pages/ResetPassword";
import StadiumMap from "../pages/StadiumMap";
import FavoriteClub from "../pages/FavoriteClub";

import TicketsPage from "../pages/TicketsPage";
import SeatMap from "../pages/SeatMap";
import PaymentPage from "../pages/PaymentPage";
import MyBookings from "../pages/MyBookings";

import ProtectedRoute from "./ProtectedRoute";
import VerifyEmail from "../pages/VerifyEmail";

import Organizer from "../pages/Organizer";
import OrganizerMatches from "../pages/OrganizerMatches";
import OrganizerFacilities from "../pages/OrganizerFacilities";

function AppRoutes() {
    const isOrganizer =
        localStorage.getItem("role") === "organizer";

    return (
        <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />

            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/map" element={<StadiumMap />} />

            <Route
                path="/favorite-club"
                element={
                    <ProtectedRoute>
                        <FavoriteClub />
                    </ProtectedRoute>
                }
            />

            <Route path="/tickets" element={<TicketsPage />} />

            <Route
                path="/seat-map"
                element={
                    <ProtectedRoute>
                        <SeatMap />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/payment"
                element={
                    <ProtectedRoute>
                        <PaymentPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/bookings"
                element={
                    <ProtectedRoute>
                        <MyBookings />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                }
            />

            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route
                path="/organizer"
                element={
                    isOrganizer
                        ? <Organizer />
                        : <Navigate to="/" replace />
                }
            />

            <Route
                path="/organizer/matches"
                element={
                    isOrganizer
                        ? <OrganizerMatches />
                        : <Navigate to="/" replace />
                }
            />

            <Route
                path="/organizer/facilities"
                element={
                    isOrganizer
                        ? <OrganizerFacilities />
                        : <Navigate to="/" replace />
                }
            />
        </Routes>
    );
}

export default AppRoutes;