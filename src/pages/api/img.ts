export const prerender = false;
import type { APIRoute } from "astro";

const BASE_URL = import.meta.env.IMMICH_BASE_URL;
const API_KEY = import.meta.env.IMMICH_API_KEY;

const THUMB_TTL = "public, max-age=31536000, immutable";
const ORIGINAL_TTL = "public, max-age=86400";

export const GET: APIRoute = async ({ url, request }) => {
    const id = url.searchParams.get("id");
    const size = url.searchParams.get("size") ?? "thumbnail";
    const type = url.searchParams.get("type") ?? "thumbnail";

    if (!id) return new Response("missing id", { status: 400 });

    const upstream =
        type === "original"
            ? `${BASE_URL}/api/assets/${id}/original`
            : `${BASE_URL}/api/assets/${id}/thumbnail?size=${size}`;

    const ifNoneMatch = request.headers.get("if-none-match");
    const ifModifiedSince = request.headers.get("if-modified-since");

    const upstreamHeaders: Record<string, string> = { "x-api-key": API_KEY };
    if (ifNoneMatch) upstreamHeaders["if-none-match"] = ifNoneMatch;
    if (ifModifiedSince) upstreamHeaders["if-modified-since"] = ifModifiedSince;

    const res = await fetch(upstream, { headers: upstreamHeaders });

    if (res.status === 304) {
        return new Response(null, {
            status: 304,
            headers: {
                "Cache-Control": type === "original" ? ORIGINAL_TTL : THUMB_TTL,
                ...(res.headers.get("etag") ? { ETag: res.headers.get("etag")! } : {}),
            },
        });
    }

    if (!res.ok) return new Response("upstream error", { status: res.status });

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const etag = res.headers.get("etag");
    const lastModified = res.headers.get("last-modified");
    const body = await res.arrayBuffer();

    const responseHeaders: Record<string, string> = {
        "Content-Type": contentType,
        "Cache-Control": type === "original" ? ORIGINAL_TTL : THUMB_TTL,
        "Vary": "Accept-Encoding",
    };

    if (etag) responseHeaders["ETag"] = etag;
    if (lastModified) responseHeaders["Last-Modified"] = lastModified;

    return new Response(body, { status: 200, headers: responseHeaders });
};