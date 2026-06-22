export const prerender = false;
import type { APIRoute } from "astro";
import { getAllAlbums, getAlbumCoverUrl } from "../lib/immich";

const SITE_URL = import.meta.env.SITE_URL ?? "";

function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export const GET: APIRoute = async () => {
    const albums = await getAllAlbums();

    const staticUrls = [
        `<url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>`,
        `<url><loc>${SITE_URL}/albums</loc><priority>0.8</priority></url>`,
    ];

    const albumUrls = albums.map((a) => {
        const cover = getAlbumCoverUrl(a);
        const image = cover
            ? `<image:image><image:loc>${escapeXml(`${SITE_URL}${cover}`)}</image:loc><image:title>${escapeXml(a.albumName)}</image:title></image:image>`
            : "";
        return `<url><loc>${escapeXml(`${SITE_URL}/albums/${a.id}`)}</loc><lastmod>${new Date(a.updatedAt).toISOString()}</lastmod><priority>0.6</priority>${image}</url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticUrls.join("\n")}
${albumUrls.join("\n")}
</urlset>`;

    return new Response(xml, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
};