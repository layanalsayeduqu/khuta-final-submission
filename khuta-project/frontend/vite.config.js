import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            manifest: {
                name: "Khuta Stadium",
                short_name: "Khuta",
                description: "Book tickets and navigate inside the stadium",
                theme_color: "#7c3aed",
                background_color: "#f5eddf",
                display: "standalone",
                start_url: "/",
                icons: [
                    {
                        src: "/logo.png",
                        sizes: "192x192",
                        type: "image/png"
                    },
                    {
                        src: "/logo.png",
                        sizes: "512x512",
                        type: "image/png"
                    }
                ]
            }
        })
    ]
});