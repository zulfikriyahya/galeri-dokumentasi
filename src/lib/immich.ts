const BASE_URL = import.meta.env.IMMICH_BASE_URL;
const API_KEY = import.meta.env.IMMICH_API_KEY;

const HEADERS = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
};

function getExcludedKeywords(): string[] {
    const raw = import.meta.env.EXCLUDED_ALBUM_KEYWORDS ?? "UNGGAH DOKUMENTASI";
    return raw.split(",").map((k: string) => k.trim()).filter(Boolean);
}

export interface ImmichAlbum {
    id: string;
    albumName: string;
    description: string;
    albumThumbnailAssetId: string | null;
    assetCount: number;
    createdAt: string;
    updatedAt: string;
    shared: boolean;
    sharedUsers: { id: string; name: string }[];
}

export interface ImmichAsset {
    id: string;
    originalFileName: string;
    fileCreatedAt: string;
    type: "IMAGE" | "VIDEO";
    exifInfo?: {
        description?: string;
        city?: string;
        country?: string;
        make?: string;
        model?: string;
    };
}

export interface ImmichAlbumDetail extends ImmichAlbum {
    assets: ImmichAsset[];
}

export function isExcludedAlbum(album: ImmichAlbum): boolean {
    const keywords = getExcludedKeywords();
    return keywords.some((kw) =>
        album.albumName.toUpperCase().includes(kw.toUpperCase())
    );
}

export async function getAllAlbums(): Promise<ImmichAlbum[]> {
    const res = await fetch(`${BASE_URL}/api/albums?shared=true`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Gagal fetch albums: ${res.statusText}`);
    const all: ImmichAlbum[] = await res.json();
    return all
        .filter((a) => a.shared && !isExcludedAlbum(a))
        .sort((a, b) =>
            a.albumName.localeCompare(b.albumName, "id", { numeric: true, sensitivity: "base" })
        );
}

export async function getAlbumById(albumId: string): Promise<ImmichAlbumDetail> {
    const res = await fetch(`${BASE_URL}/api/albums/${albumId}`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Gagal fetch album ${albumId}: ${res.statusText}`);
    return res.json();
}

export function getThumbnailUrl(assetId: string, size: "thumbnail" | "preview" = "thumbnail"): string {
    return `/api/img?id=${assetId}&size=${size}`;
}

export function getDownloadUrl(assetId: string): string {
    return `/api/img?id=${assetId}&type=original`;
}

export function getAlbumShareUrl(albumId: string): string {
    return `${BASE_URL}/s/${albumId}`;
}

export function getAlbumCoverUrl(album: ImmichAlbum): string | null {
    if (!album.albumThumbnailAssetId) return null;
    return getThumbnailUrl(album.albumThumbnailAssetId, "thumbnail");
}

export async function getRecentAssets(limit = 30): Promise<ImmichAsset[]> {
    const albums = await getAllAlbums();
    const sorted = [...albums].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    const results = await Promise.all(sorted.map((a) => getAlbumById(a.id)));
    return results
        .flatMap((d) => d.assets.filter((a) => a.type === "IMAGE"))
        .slice(0, limit);
}

export function groupAlbumsByYear(albums: ImmichAlbum[]): { year: string; albums: ImmichAlbum[] }[] {
    const map = new Map<string, ImmichAlbum[]>();
    for (const album of albums) {
        const year = new Date(album.createdAt).getFullYear().toString();
        const list = map.get(year) ?? [];
        list.push(album);
        map.set(year, list);
    }
    return Array.from(map.entries())
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .map(([year, items]) => ({ year, albums: items }));
}
