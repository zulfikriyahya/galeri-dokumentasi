export const prerender = true;
import type { APIRoute } from "astro";

const SITE_URL = import.meta.env.SITE_URL ?? "";

export const GET: APIRoute = () => {
    const body = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
    return new Response(body, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
};