export const prerender = false;
import type { APIRoute } from "astro";

const BASE_URL = import.meta.env.IMMICH_BASE_URL;
const API_KEY = import.meta.env.IMMICH_API_KEY;

export const GET: APIRoute = async ({ url }) => {
    const id = url.searchParams.get("id");
    const size = url.searchParams.get("size") ?? "thumbnail";
    const type = url.searchParams.get("type") ?? "thumbnail";

    if (!id) return new Response("missing id", { status: 400 });

    let upstream: string;
    if (type === "original") {
        upstream = `${BASE_URL}/api/assets/${id}/original`;
    } else {
        upstream = `${BASE_URL}/api/assets/${id}/thumbnail?size=${size}`;
    }

    const res = await fetch(upstream, {
        headers: { "x-api-key": API_KEY },
    });

    if (!res.ok) return new Response("upstream error", { status: res.status });

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const body = await res.arrayBuffer();

    return new Response(body, {
        status: 200,
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    });
};
