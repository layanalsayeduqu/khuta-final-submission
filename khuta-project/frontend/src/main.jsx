import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./styles/globals.css";

import ThemeProvider from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";

ReactDOM.createRoot(
    document.getElementById("root")
).render(
    <React.StrictMode>
        <LanguageProvider>
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </LanguageProvider>
    </React.StrictMode>
);