import { Routes, Route } from "react-router-dom";

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

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />

            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/map" element={<StadiumMap />} />

            <Route path="/favorite-club" element={<FavoriteClub />} />

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
            <Route
                path="/verify-email"
                element={<VerifyEmail />}
            />
        </Routes>
    );
}

export default AppRoutes;