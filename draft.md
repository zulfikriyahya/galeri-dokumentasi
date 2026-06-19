## Direktory: ROOT

### File: `./.env`

```
IMMICH_BASE_URL=https://galeri-rohis.zedlabs.id
IMMICH_API_KEY=NUaPrJHlmuJJQAiaOWgXgKl2grOR2PzX9pnotGw
```

---

### File: `./astro.config.mjs`

```javascript
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    output: "server",
    adapter: node({ mode: "standalone" }),
    vite: {
        plugins: [tailwindcss()],
    },
});

```

---

### File: `./package.json`

```json
{
  "name": "",
  "type": "module",
  "version": "0.0.1",
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "@astrojs/node": "^10.1.4",
    "astro": "^6.4.8",
    "dotenv": "^17.4.2",
    "tailwindcss": "^4.3.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.1"
  }
}
```

---

### File: `./pnpm-workspace.yaml`

```yaml
allowBuilds:
  esbuild: true
  sharp: true

```

---

### File: `./tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}

```

---

## Direktory: src

### File: `./src/components/AlbumGrid.astro`

```astro
---
import type { ImmichAlbum } from "../lib/immich";
import { getAlbumCoverUrl } from "../lib/immich";

interface Props {
    albums: ImmichAlbum[];
}

const { albums } = Astro.props;

function spanFor(index: number): string {
    const pattern = index % 6;
    if (pattern === 0) return "sm:col-span-2 sm:row-span-2";
    if (pattern === 3) return "sm:col-span-2";
    return "";
}

const items = albums.map((album, index) => ({
    album,
    href: "/gallery/" + album.id,
    cover: getAlbumCoverUrl(album),
    span: spanFor(index),
}));
---

<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 auto-rows-[180px]">
  {items.map((item) => (
    <a
      href={item.href}
      class:list={["group relative overflow-hidden rounded-2xl glossy-card", item.span]}
    >
      {item.cover ? (
        <img
          src={item.cover}
          alt={item.album.albumName}
          loading="lazy"
          class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div class="absolute inset-0 flex items-center justify-center bg-[var(--color-canvas-subtle)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            class="w-10 h-10 text-[var(--color-fg-muted)]"
          >
            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <path d="M21 15l-5-5L5 21"></path>
          </svg>
        </div>
      )}
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
      <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 class="font-semibold leading-tight truncate">{item.album.albumName}</h3>
        <span class="text-xs text-white/70 mt-1 block">{item.album.assetCount} foto</span>
      </div>
    </a>
  ))}
</div>
```

---

### File: `./src/components/InfiniteSlider.astro`

```astro
---
import type { ImmichAsset } from "../lib/immich";
import { getThumbnailUrl } from "../lib/immich";

interface Props {
    assets: ImmichAsset[];
}

const { assets } = Astro.props;
const half = Math.ceil(assets.length / 2);
const rowOne = assets.slice(0, half);
const rowTwo = assets.slice(half);
---

<div class="space-y-4 py-6">
  <div class="zigzag-row">
    <div class="zigzag-track zigzag-left">
      {[...rowOne, ...rowOne].map((asset) => (
        <img
          src={getThumbnailUrl(asset.id, "preview")}
          alt={asset.originalFileName}
          loading="lazy"
          class="h-32 sm:h-40 w-auto rounded-xl object-cover glossy-card"
        />
      ))}
    </div>
  </div>
  <div class="zigzag-row">
    <div class="zigzag-track zigzag-right">
      {[...rowTwo, ...rowTwo].map((asset) => (
        <img
          src={getThumbnailUrl(asset.id, "preview")}
          alt={asset.originalFileName}
          loading="lazy"
          class="h-32 sm:h-40 w-auto rounded-xl object-cover glossy-card"
        />
      ))}
    </div>
  </div>
</div>
```

---

### File: `./src/components/Lightbox.astro`

```astro
---
import type { ImmichAsset } from "../lib/immich";
import { getThumbnailUrl, getDownloadUrl } from "../lib/immich";

interface Props {
    assets: ImmichAsset[];
}

const { assets } = Astro.props;
const images = assets.filter((a) => a.type === "IMAGE");
---

<div class="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3" id="photo-grid">
  {images.map((asset, i) => (
    <button
      class="block w-full overflow-hidden rounded-xl break-inside-avoid cursor-zoom-in glossy-card focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
      data-index={i}
      data-src={getThumbnailUrl(asset.id, "preview")}
      data-download={getDownloadUrl(asset.id)}
      data-name={asset.originalFileName}
      data-date={new Date(asset.fileCreatedAt).toLocaleDateString("id-ID", { dateStyle: "long" })}
      data-location={[asset.exifInfo?.city, asset.exifInfo?.country].filter(Boolean).join(", ")}
      aria-label={`Buka foto ${asset.originalFileName}`}
    >
      <img
        src={getThumbnailUrl(asset.id, "thumbnail")}
        alt={asset.originalFileName}
        loading="lazy"
        class="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
      />
    </button>
  ))}
</div>

<div
  id="lightbox"
  class="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm hidden items-center justify-center"
  role="dialog"
  aria-modal="true"
  aria-label="Lightbox"
>
  <button
    id="lb-close"
    class="absolute top-4 right-4 text-white/70 hover:text-white z-10 transition-colors"
    aria-label="Tutup"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-7 h-7">
      <path d="M18 6 6 18M6 6l12 12"></path>
    </svg>
  </button>

  <button
    id="lb-prev"
    class="absolute left-3 sm:left-6 text-white/70 hover:text-white z-10 transition-colors"
    aria-label="Foto sebelumnya"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-9 h-9">
      <path d="M15 18l-6-6 6-6"></path>
    </svg>
  </button>

  <div class="flex flex-col items-center max-w-5xl w-full px-16">
    <img
      id="lb-img"
      src=""
      alt=""
      class="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl transition-opacity duration-200"
    />

    <div class="flex items-center justify-between w-full mt-4 px-2 gap-4">
      <div class="text-left min-w-0">
        <p id="lb-name" class="text-white text-sm font-medium truncate max-w-xs"></p>
        <p id="lb-meta" class="text-white/50 text-xs mt-0.5"></p>
      </div>
      <a
        id="lb-download"
        href="#"
        download
        class="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
          <path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"></path>
        </svg>
        Download
      </a>
    </div>

    <p id="lb-counter" class="text-white/30 text-xs mt-3"></p>
  </div>

  <button
    id="lb-next"
    class="absolute right-3 sm:right-6 text-white/70 hover:text-white z-10 transition-colors"
    aria-label="Foto berikutnya"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-9 h-9">
      <path d="M9 18l6-6-6-6"></path>
    </svg>
  </button>
</div>

<script>
  const lb       = document.getElementById("lightbox")!;
  const lbImg    = document.getElementById("lb-img") as HTMLImageElement;
  const lbName   = document.getElementById("lb-name")!;
  const lbMeta   = document.getElementById("lb-meta")!;
  const lbDl     = document.getElementById("lb-download") as HTMLAnchorElement;
  const lbCtr    = document.getElementById("lb-counter")!;
  const btnClose = document.getElementById("lb-close")!;
  const btnPrev  = document.getElementById("lb-prev")!;
  const btnNext  = document.getElementById("lb-next")!;

  const buttons  = Array.from(document.querySelectorAll<HTMLButtonElement>("#photo-grid button"));
  let current    = 0;

  function open(index: number) {
    current = index;
    render();
    lb.classList.remove("hidden");
    lb.classList.add("flex");
    document.body.style.overflow = "hidden";
  }

  function close() {
    lb.classList.add("hidden");
    lb.classList.remove("flex");
    document.body.style.overflow = "";
  }

  function render() {
    const btn      = buttons[current];
    const src      = btn.dataset.src!;
    const name     = btn.dataset.name!;
    const date     = btn.dataset.date!;
    const location = btn.dataset.location || "";
    const download = btn.dataset.download!;

    lbImg.style.opacity = "0";
    lbImg.src = src;
    lbImg.alt = name;
    lbImg.onload = () => { lbImg.style.opacity = "1"; };

    lbName.textContent = name;
    lbMeta.textContent = [date, location].filter(Boolean).join(" · ");
    lbDl.href = download;
    lbDl.download = name;
    lbCtr.textContent = `${current + 1} / ${buttons.length}`;

    btnPrev.style.visibility = current === 0 ? "hidden" : "visible";
    btnNext.style.visibility = current === buttons.length - 1 ? "hidden" : "visible";
  }

  buttons.forEach((btn, i) => btn.addEventListener("click", () => open(i)));

  btnPrev.addEventListener("click", () => { if (current > 0) { current--; render(); } });
  btnNext.addEventListener("click", () => { if (current < buttons.length - 1) { current++; render(); } });

  btnClose.addEventListener("click", close);
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });

  document.addEventListener("keydown", (e) => {
    if (lb.classList.contains("hidden")) return;
    if (e.key === "Escape")      close();
    if (e.key === "ArrowLeft"  && current > 0)                   { current--; render(); }
    if (e.key === "ArrowRight" && current < buttons.length - 1)  { current++; render(); }
  });
</script>
```

---

### File: `./src/components/Sidebar.astro`

```astro
---
import type { ImmichAlbum } from "../lib/immich";
import { groupAlbumsByYear } from "../lib/immich";

interface Props {
    albums: ImmichAlbum[];
    activeId?: string;
}

const { albums, activeId } = Astro.props;
const groups = groupAlbumsByYear(albums);
---

<aside class="lg:w-64 lg:shrink-0 lg:border-r lg:border-[var(--color-border)] lg:bg-[var(--color-canvas-subtle)] lg:h-screen lg:sticky lg:top-0 lg:overflow-y-auto">
  <details class="lg:hidden border-b border-[var(--color-border)]">
    <summary class="px-4 py-3 cursor-pointer font-medium select-none">Album</summary>
    <nav class="px-3 pb-4 space-y-5">
      {groups.map((group) => (
        <div>
          <p class="px-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-2">
            {group.year}
          </p>
          <ul class="space-y-1">
            {group.albums.map((album) => (
              <li>
                <a
                  href={`/gallery/${album.id}`}
                  class:list={[
                    "block px-2 py-1.5 rounded-md text-sm truncate transition-colors",
                    activeId === album.id
                      ? "bg-[var(--color-accent)] text-white"
                      : "text-[var(--color-fg)] hover:bg-[var(--color-canvas)]",
                  ]}
                >
                  {album.albumName}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  </details>

  <div class="hidden lg:flex lg:flex-col lg:h-full">
    <div class="px-5 py-6 border-b border-[var(--color-border)]">
      <a href="/" class="text-lg font-semibold text-[var(--color-fg)]">ROHIS Gallery</a>
    </div>
    <nav class="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
      {groups.map((group) => (
        <div>
          <p class="px-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-2">
            {group.year}
          </p>
          <ul class="space-y-1">
            {group.albums.map((album) => (
              <li>
                <a
                  href={`/gallery/${album.id}`}
                  class:list={[
                    "block px-2 py-1.5 rounded-md text-sm truncate transition-colors",
                    activeId === album.id
                      ? "bg-[var(--color-accent)] text-white"
                      : "text-[var(--color-fg)] hover:bg-[var(--color-canvas)]",
                  ]}
                >
                  {album.albumName}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  </div>
</aside>
```

---

### File: `./src/layouts/Layout.astro`

```astro
---
import "../styles/global.css";

interface Props {
    title?: string;
}

const { title = "ROHIS Gallery" } = Astro.props;
---

<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" href="/favicon.ico" />
    <title>{title}</title>
    <script is:inline>
      const stored = window.localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = stored ?? (prefersDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", theme === "dark");
    </script>
  </head>
  <body class="bg-[var(--color-canvas)] text-[var(--color-fg)] min-h-screen">
    <div class="lg:flex">
      <slot name="sidebar" />
      <div class="flex-1 min-w-0">
        <header class="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/90 backdrop-blur">
          <a href="/" class="font-semibold text-[var(--color-fg)]">ROHIS Gallery</a>
          <button
            id="theme-toggle"
            type="button"
            aria-label="Ganti tema"
            class="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-canvas-subtle)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 hidden dark:block">
              <circle cx="12" cy="12" r="4"></circle>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 block dark:hidden">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>
        </header>
        <main>
          <slot />
        </main>
      </div>
    </div>
    <script is:inline>
      document.getElementById("theme-toggle").addEventListener("click", () => {
        const isDark = document.documentElement.classList.toggle("dark");
        window.localStorage.setItem("theme", isDark ? "dark" : "light");
      });
    </script>
  </body>
</html>
```

---

### File: `./src/lib/immich.ts`

```ts
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
```

---

### File: `./src/pages/gallery/index.astro`

```astro
---
import Layout from "../../layouts/Layout.astro";
import Sidebar from "../../components/Sidebar.astro";
import AlbumGrid from "../../components/AlbumGrid.astro";
import { getAllAlbums } from "../../lib/immich";

const albums = await getAllAlbums();
---

<Layout title="Galeri - ROHIS Gallery">
  <Sidebar slot="sidebar" albums={albums} />

  <section class="px-4 sm:px-6 py-10">
    <h1 class="text-3xl font-bold mb-8">Semua Album</h1>
    <AlbumGrid albums={albums} />
  </section>
</Layout>
```

---

### File: `./src/pages/gallery/[albumId].astro`

```astro
---
export const prerender = true;

import { getAllAlbums, getAlbumById, getAlbumShareUrl } from "../../lib/immich";
import Lightbox from "../../components/Lightbox.astro";
import Layout from "../../layouts/Layout.astro";
import Sidebar from "../../components/Sidebar.astro";

export async function getStaticPaths() {
    const albums = await getAllAlbums();
    return albums.map((album) => ({
        params: { albumId: album.id },
    }));
}

const { albumId } = Astro.params;
const [album, albums] = await Promise.all([
    getAlbumById(albumId!),
    getAllAlbums(),
]);
---

<Layout title={`${album.albumName} - ROHIS Gallery`}>
  <Sidebar slot="sidebar" albums={albums} activeId={album.id} />

  <div class="px-4 sm:px-6 py-10">
    <a
      href="/gallery"
      class="inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline text-sm mb-6"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
        <path d="M15 18l-6-6 6-6"></path>
      </svg>
      Kembali ke Galeri
    </a>

    <h1 class="text-3xl sm:text-4xl font-bold">{album.albumName}</h1>

    {album.description && (
      <p class="text-[var(--color-fg-muted)] mt-2">{album.description}</p>
    )}

    <div class="flex items-center gap-4 mt-3">
      <span class="text-sm text-[var(--color-fg-muted)]">{album.assetCount} foto</span>
      {album.shared && (
        <a
          href={getAlbumShareUrl(album.id)}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-sm hover:opacity-90 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
            <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5"></path>
            <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L12.5 19.5"></path>
          </svg>
          Share Link
        </a>
      )}
    </div>

    <div class="mt-8">
      <Lightbox assets={album.assets} />
    </div>
  </div>
</Layout>
```

---

### File: `./src/pages/index.astro`

```astro
---
import Layout from "../layouts/Layout.astro";
import Sidebar from "../components/Sidebar.astro";
import InfiniteSlider from "../components/InfiniteSlider.astro";
import AlbumGrid from "../components/AlbumGrid.astro";
import { getAllAlbums, getRecentAssets } from "../lib/immich";

const albums = await getAllAlbums();
const recentAssets = await getRecentAssets(24);
---

<Layout title="ROHIS Gallery">
  <Sidebar slot="sidebar" albums={albums} />

  <section class="px-4 sm:px-6 py-10">
    <h1 class="text-3xl sm:text-4xl font-bold mb-2">Galeri ROHIS</h1>
    <p class="text-[var(--color-fg-muted)]">Dokumentasi kegiatan dalam satu tempat.</p>
  </section>

  {recentAssets.length > 0 && <InfiniteSlider assets={recentAssets} />}

  <section class="px-4 sm:px-6 py-10">
    <h2 class="text-xl font-semibold mb-6">Semua Album</h2>
    <AlbumGrid albums={albums} />
  </section>
</Layout>
```

---

### File: `./src/styles/global.css`

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
    --color-canvas: #ffffff;
    --color-canvas-subtle: #f6f8fa;
    --color-border: #d0d7de;
    --color-fg: #1f2328;
    --color-fg-muted: #656d76;
    --color-accent: #0969da;
}

.dark {
    --color-canvas: #0d1117;
    --color-canvas-subtle: #161b22;
    --color-border: #30363d;
    --color-fg: #e6edf3;
    --color-fg-muted: #8b949e;
    --color-accent: #58a6ff;
}

body {
    background-color: var(--color-canvas);
    color: var(--color-fg);
    transition: background-color 0.2s ease, color 0.2s ease;
}

.glossy-card {
    position: relative;
    background: linear-gradient(135deg,
            color-mix(in srgb, var(--color-canvas-subtle) 92%, transparent),
            color-mix(in srgb, var(--color-canvas) 70%, transparent));
    border: 1px solid var(--color-border);
    box-shadow:
        inset 0 1px 0 0 color-mix(in srgb, white 8%, transparent),
        0 8px 24px -10px rgba(0, 0, 0, 0.3);
}

.zigzag-row {
    width: 100%;
    overflow: hidden;
}

.zigzag-track {
    display: flex;
    gap: 1rem;
    width: max-content;
}

.zigzag-left {
    animation: zigzag-scroll-left 36s linear infinite;
}

.zigzag-right {
    animation: zigzag-scroll-right 36s linear infinite;
}

@keyframes zigzag-scroll-left {
    from {
        transform: translateX(0);
    }

    to {
        transform: translateX(-50%);
    }
}

@keyframes zigzag-scroll-right {
    from {
        transform: translateX(-50%);
    }

    to {
        transform: translateX(0);
    }
}

@media (prefers-reduced-motion: reduce) {

    .zigzag-left,
    .zigzag-right {
        animation: none;
    }
}
```

---

