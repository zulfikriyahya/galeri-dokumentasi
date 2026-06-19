export const prerender = true;
import type { APIRoute } from "astro";

const NAME = import.meta.env.SITE_NAME ?? "GALERI DOKUMENTASI";
const SHORT = import.meta.env.SITE_SHORT_NAME ?? "DOKUMENTASI";
const DESC = import.meta.env.SITE_DESCRIPTION ?? "Dokumentasi kegiatan dalam satu tempat.";

export const GET: APIRoute = () => {
    const manifest = {
        name: NAME,
        short_name: SHORT,
        description: DESC,
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0969da",
        orientation: "portrait-primary",
        icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
        screenshots: [
            { src: "/og.png", sizes: "1200x630", type: "image/png", form_factor: "wide" },
        ],
    };
    return new Response(JSON.stringify(manifest, null, 2), {
        headers: {
            "Content-Type": "application/manifest+json",
            "Cache-Control": "public, max-age=86400",
        },
    });
};