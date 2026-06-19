## Direktory: ROOT

zulfikriyahya@zedlabs:~/ZEDLABS/rohis.zedlabs.id$ tree
.
├── astro.config.mjs
├── generate.sh
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── public
│   ├── favicon.ico
│   └── favicon.svg
├── src
│   ├── components
│   │   ├── AlbumGrid.astro
│   │   └── Lightbox.astro
│   ├── lib
│   │   └── immich.ts
│   ├── pages
│   │   ├── gallery
│   │   │   └── [albumId].astro
│   │   ├── gallery.astro
│   │   └── index.astro
│   └── styles
│       └── global.css
└── tsconfig.json

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
    "astro": "^6.4.7",
    "dotenv": "^17.4.2",
    "tailwindcss": "^4.3.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.1"
  }
}
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
import { getAllAlbums, getAlbumCoverUrl } from "../lib/immich";

const albums = await getAllAlbums();
---

<section class="py-16 px-4 max-w-6xl mx-auto">
  <h2 class="text-3xl font-bold text-center mb-10 text-gray-800 dark:text-white">
    Galeri Foto
  </h2>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {albums.map((album) => {
      const cover = getAlbumCoverUrl(album);
      return (
        <a
          href={`/gallery/${album.id}`}
          class="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 bg-gray-100 dark:bg-gray-800"
        >
          {cover ? (
            <img
              src={cover}
              alt={album.albumName}
              class="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div class="w-full h-56 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <span class="text-gray-400 text-4xl">🖼️</span>
            </div>
          )}

          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 class="font-semibold text-lg leading-tight">{album.albumName}</h3>
            {album.description && (
              <p class="text-sm text-gray-300 mt-1 line-clamp-2">{album.description}</p>
            )}
            <span class="text-xs text-gray-400 mt-1 block">
              {album.assetCount} foto
            </span>
          </div>
        </a>
      );
    })}
  </div>
</section>
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

<!-- Grid Foto -->
<div class="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3" id="photo-grid">
  {images.map((asset, i) => (
    <button
      class="block w-full overflow-hidden rounded-xl break-inside-avoid cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-blue-500"
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

<!-- Lightbox Overlay -->
<div
  id="lightbox"
  class="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm hidden items-center justify-center"
  role="dialog"
  aria-modal="true"
  aria-label="Lightbox"
>
  <!-- Tombol Tutup -->
  <button
    id="lb-close"
    class="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none z-10 transition-colors"
    aria-label="Tutup"
  >✕</button>

  <!-- Tombol Prev -->
  <button
    id="lb-prev"
    class="absolute left-3 sm:left-6 text-white/70 hover:text-white text-4xl z-10 transition-colors select-none"
    aria-label="Foto sebelumnya"
  >‹</button>

  <!-- Gambar Utama -->
  <div class="flex flex-col items-center max-w-5xl w-full px-16">
    <img
      id="lb-img"
      src=""
      alt=""
      class="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl transition-opacity duration-200"
    />

    <!-- Info + Tombol Download -->
    <div class="flex items-center justify-between w-full mt-4 px-2 gap-4">
      <div class="text-left">
        <p id="lb-name" class="text-white text-sm font-medium truncate max-w-xs"></p>
        <p id="lb-meta" class="text-white/50 text-xs mt-0.5"></p>
      </div>
      <a
        id="lb-download"
        href="#"
        download
        class="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
      >
        ↓ Download
      </a>
    </div>

    <!-- Indikator posisi -->
    <p id="lb-counter" class="text-white/30 text-xs mt-3"></p>
  </div>

  <!-- Tombol Next -->
  <button
    id="lb-next"
    class="absolute right-3 sm:right-6 text-white/70 hover:text-white text-4xl z-10 transition-colors select-none"
    aria-label="Foto berikutnya"
  >›</button>
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
    lbImg.focus();
  }

  function close() {
    lb.classList.add("hidden");
    lb.classList.remove("flex");
    document.body.style.overflow = "";
  }

  function render() {
    const btn = buttons[current];
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

  // Event: klik foto
  buttons.forEach((btn, i) => btn.addEventListener("click", () => open(i)));

  // Navigasi
  btnPrev.addEventListener("click", () => { if (current > 0) { current--; render(); } });
  btnNext.addEventListener("click", () => { if (current < buttons.length - 1) { current++; render(); } });

  // Tutup
  btnClose.addEventListener("click", close);
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (lb.classList.contains("hidden")) return;
    if (e.key === "Escape")      close();
    if (e.key === "ArrowLeft"  && current > 0)               { current--; render(); }
    if (e.key === "ArrowRight" && current < buttons.length - 1) { current++; render(); }
  });
</script>
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

// --- Types ---
export interface ImmichAlbum {
    id: string;
    albumName: string;
    description: string;
    albumThumbnailAssetId: string | null;
    assetCount: number;
    createdAt: string;
    updatedAt: string;
    shared: boolean;          // tersedia dari album.share
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

// --- API Functions ---

/**
 * Ambil semua album (READ)
 * Permission: album.read
 */
export async function getAllAlbums(): Promise<ImmichAlbum[]> {
    const res = await fetch(`${BASE_URL}/api/albums`, { headers });
    if (!res.ok) throw new Error(`Gagal fetch albums: ${res.statusText}`);
    return res.json();
}

/**
 * Ambil detail album beserta aset di dalamnya (READ)
 * Permission: album.read
 */
export async function getAlbumById(albumId: string): Promise<ImmichAlbumDetail> {
    const res = await fetch(`${BASE_URL}/api/albums/${albumId}`, { headers });
    if (!res.ok) throw new Error(`Gagal fetch album ${albumId}: ${res.statusText}`);
    return res.json();
}

/**
 * Generate URL thumbnail aset
 * Permission: album.read
 */
export function getThumbnailUrl(
    assetId: string,
    size: "thumbnail" | "preview" = "thumbnail"
): string {
    return `${BASE_URL}/api/assets/${assetId}/thumbnail?size=${size}&key=${API_KEY}`;
}

/**
 * Generate URL download foto original
 * Permission: album.download
 */
export function getDownloadUrl(assetId: string): string {
    return `${BASE_URL}/api/assets/${assetId}/original?key=${API_KEY}`;
}

/**
 * Generate URL share link album (jika album berstatus shared)
 * Permission: album.share
 */
export function getAlbumShareUrl(albumId: string): string {
    return `${BASE_URL}/share/${albumId}`;
}

/**
 * Generate URL cover/thumbnail album
 * Permission: album.read
 */
export function getAlbumCoverUrl(album: ImmichAlbum): string | null {
    if (!album.albumThumbnailAssetId) return null;
    return getThumbnailUrl(album.albumThumbnailAssetId, "preview");
}
```

---

### File: `./src/pages/gallery.astro`

```astro

```

---

### File: `./src/pages/gallery/[albumId].astro`

```astro
---
import { getAllAlbums, getAlbumById, getAlbumShareUrl } from "../../lib/immich";
import Lightbox from "../../components/Lightbox.astro";
import Layout from "../../layouts/Layout.astro";

export async function getStaticPaths() {
  const albums = await getAllAlbums();
  return albums.map((album) => ({
    params: { albumId: album.id },
  }));
}

const { albumId } = Astro.params;
const album = await getAlbumById(albumId!);
---

<Layout title={album.albumName}>
  <div class="max-w-6xl mx-auto px-4 py-12">

    <!-- Header -->
    <div class="mb-8">
      <a href="/gallery" class="text-blue-500 hover:underline text-sm mb-4 inline-block">
        ← Kembali ke Galeri
      </a>
      <h1 class="text-4xl font-bold text-gray-800 dark:text-white">{album.albumName}</h1>
      {album.description && (
        <p class="text-gray-500 dark:text-gray-400 mt-2">{album.description}</p>
      )}
      <div class="flex items-center gap-4 mt-3">
        <span class="text-sm text-gray-400">{album.assetCount} foto</span>
        {album.shared && (
          <a
            href={getAlbumShareUrl(album.id)}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
          >
            🔗 Share Link
          </a>
        )}
      </div>
    </div>

    <!-- Lightbox + Grid Foto -->
    <Lightbox assets={album.assets} />

  </div>
</Layout>
```

---

### File: `./src/pages/index.astro`

```astro
---

---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
		<link rel="icon" href="/favicon.ico" />
		<meta name="viewport" content="width=device-width" />
		<meta name="generator" content={Astro.generator} />
		<title>Astro</title>
	</head>
	<body>
		<h1>Astro</h1>
	</body>
</html>

```

---

### File: `./src/styles/global.css`

```css
@import "tailwindcss";
```

---

