const BASE_URL = import.meta.env.IMMICH_BASE_URL;
const API_KEY = import.meta.env.IMMICH_API_KEY;

const headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
};

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
    };
}

export interface ImmichAlbumDetail extends ImmichAlbum {
    assets: ImmichAsset[];
}

export async function getAllAlbums(): Promise<ImmichAlbum[]> {
    const res = await fetch(`${BASE_URL}/api/albums`, { headers });
    if (!res.ok) throw new Error(`Gagal fetch albums: ${res.statusText}`);
    return res.json();
}

export async function getAlbumById(albumId: string): Promise<ImmichAlbumDetail> {
    const res = await fetch(`${BASE_URL}/api/albums/${albumId}`, { headers });
    if (!res.ok) throw new Error(`Gagal fetch album ${albumId}: ${res.statusText}`);
    return res.json();
}

export function getThumbnailUrl(
    assetId: string,
    size: "thumbnail" | "preview" = "thumbnail"
): string {
    return `${BASE_URL}/api/assets/${assetId}/thumbnail?size=${size}&key=${API_KEY}`;
}

export function getDownloadUrl(assetId: string): string {
    return `${BASE_URL}/api/assets/${assetId}/original?key=${API_KEY}`;
}

export function getAlbumShareUrl(albumId: string): string {
    return `${BASE_URL}/share/${albumId}`;
}

export function getAlbumCoverUrl(album: ImmichAlbum): string | null {
    if (!album.albumThumbnailAssetId) return null;
    return getThumbnailUrl(album.albumThumbnailAssetId, "preview");
}

export async function getRecentAssets(limit = 24): Promise<ImmichAsset[]> {
    const albums = await getAllAlbums();
    const sorted = [...albums].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    const assets: ImmichAsset[] = [];
    for (const album of sorted) {
        if (assets.length >= limit) break;
        const detail = await getAlbumById(album.id);
        assets.push(...detail.assets.filter((a) => a.type === "IMAGE"));
    }
    return assets.slice(0, limit);
}

export function groupAlbumsByYear(
    albums: ImmichAlbum[]
): { year: string; albums: ImmichAlbum[] }[] {
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