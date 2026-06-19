## Direktory: ROOT

### File: `./.env`

```
IMMICH_BASE_URL=https://galeri-rohis.zedlabs.id
IMMICH_API_KEY=NUaPrJHlmuJJQAiaOWgXgKl2grOR2PzX9pnotGw

SITE_NAME=DOKUMENTASI ROHIS
SITE_SHORT_NAME=DOKUMENTASI ROHIS
SITE_DESCRIPTION=Dokumentasi kegiatan dalam satu tempat.
ORG_NAME=ROHIS
SCHOOL_NAME=SMKN 1 PANDEGLANG
POWERED_BY=ZEDLABS TEKNOLOGI INDONESIA
POWERED_BY_URL=https://zedlabs.id
```

---

### File: `./astro.config.mjs`

```javascript
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    output: "static",
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
    "sharp": "^0.35.1",
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
  canvas: set this to true or false
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

## Direktory: public

### File: `./public/sw.js`

```js
const CACHE_STATIC = "static-v1";
const CACHE_IMAGES = "images-v1";

const STATIC_ASSETS = ["/", "/albums", "/favicon.svg"];

self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE_STATIC).then((c) => c.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((k) => k !== CACHE_STATIC && k !== CACHE_IMAGES)
                    .map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (e) => {
    const { request } = e;
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/img")) {
        e.respondWith(
            caches.open(CACHE_IMAGES).then(async (cache) => {
                const cached = await cache.match(request);
                if (cached) return cached;
                const res = await fetch(request);
                if (res.ok) cache.put(request, res.clone());
                return res;
            })
        );
        return;
    }

    if (request.destination === "document" || request.destination === "script" || request.destination === "style") {
        e.respondWith(
            caches.open(CACHE_STATIC).then(async (cache) => {
                try {
                    const res = await fetch(request);
                    if (res.ok) cache.put(request, res.clone());
                    return res;
                } catch {
                    return cache.match(request);
                }
            })
        );
    }
});
```

---

## Direktory: scripts

### File: `./scripts/gen-icon.mjs`

```javascript
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

function generateSVG(size) {
    const r = size * 0.2;
    const pad = size * 0.14;
    const gap = size * 0.06;
    const half = (size - pad * 2 - gap) / 2;
    const innerR = size * 0.06;

    return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${size}" height="${size}" rx="${r}" fill="#0969da" />
        
        <rect x="${pad}" y="${pad}" width="${half}" height="${half}" rx="${innerR}" fill="rgba(255,255,255,1)" />
        <rect x="${pad + half + gap}" y="${pad}" width="${half}" height="${half}" rx="${innerR}" fill="rgba(255,255,255,0.7)" />
        <rect x="${pad}" y="${pad + half + gap}" width="${half}" height="${half}" rx="${innerR}" fill="rgba(255,255,255,0.7)" />
        <rect x="${pad + half + gap}" y="${pad + half + gap}" width="${half}" height="${half}" rx="${innerR}" fill="rgba(255,255,255,0.5)" />
    </svg>
    `;
}

async function createIcons() {
    const svg192 = Buffer.from(generateSVG(192));
    const svg512 = Buffer.from(generateSVG(512));

    await sharp(svg192).png().toFile("public/icons/icon-192.png");
    await sharp(svg512).png().toFile("public/icons/icon-512.png");
    await sharp(svg512).png().toFile("public/og.png");

    console.log("🚀 Icons successfully generated via sharp!");
}

createIcons().catch(console.error);
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
  const p = index % 9;
  if (p === 0) return "sm:col-span-2 sm:row-span-2";
  if (p === 4) return "sm:col-span-2";
  if (p === 7) return "sm:col-span-2";
  return "";
}

const items = albums.map((album, i) => ({
  album,
  href: "/albums/" + album.id,
  cover: getAlbumCoverUrl(album),
  span: spanFor(i),
}));
---

{
  albums.length === 0 ? (
    <div class="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div class="w-14 h-14 rounded-2xl bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="w-6 h-6 text-[var(--color-fg-subtle)]"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p class="text-sm text-[var(--color-fg-muted)] font-medium">
        Belum ada data
      </p>
    </div>
  ) : (
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 auto-rows-[150px] sm:auto-rows-[175px]">
      {items.map((item) => (
        <a
          href={item.href}
          class:list={[
            "group relative overflow-hidden rounded-2xl glossy-card focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
            item.span,
          ]}
        >
          {item.cover ? (
            <img
              src={item.cover}
              alt={item.album.albumName}
              loading="lazy"
              decoding="async"
              class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div class="absolute inset-0 flex items-center justify-center bg-[var(--color-canvas-inset)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                class="w-8 h-8 text-[var(--color-fg-subtle)]"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
          <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent group-hover:from-black/80 transition-all duration-300" />
          <div class="absolute bottom-0 left-0 right-0 p-3 sm:p-3.5 text-white z-10">
            <h3 class="font-semibold text-sm sm:text-[0.9rem] leading-snug line-clamp-2">
              {item.album.albumName}
            </h3>
            <span class="text-[11px] text-white/55 mt-0.5 block">
              {item.album.assetCount} foto
            </span>
          </div>
          {item.album.shared && (
            <div class="absolute top-2.5 right-2.5 z-10">
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-[10px] font-medium text-white/80">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  class="w-2.5 h-2.5"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                </svg>
                Publik
              </span>
            </div>
          )}
        </a>
      ))}
    </div>
  )
}

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

<div class="space-y-2.5 py-4 overflow-hidden select-none">
  <div class="zigzag-row">
    <div class="zigzag-track zigzag-left">
      {
        [...rowOne, ...rowOne].map((asset) => (
          <img
            src={getThumbnailUrl(asset.id, "preview")}
            alt={asset.originalFileName}
            loading="lazy"
            decoding="async"
            class="h-28 sm:h-36 w-auto rounded-xl object-cover glossy-card flex-shrink-0 pointer-events-none"
          />
        ))
      }
    </div>
  </div>
  <div class="zigzag-row">
    <div class="zigzag-track zigzag-right">
      {
        [...rowTwo, ...rowTwo].map((asset) => (
          <img
            src={getThumbnailUrl(asset.id, "preview")}
            alt={asset.originalFileName}
            loading="lazy"
            decoding="async"
            class="h-28 sm:h-36 w-auto rounded-xl object-cover glossy-card flex-shrink-0 pointer-events-none"
          />
        ))
      }
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

{
  images.length === 0 ? (
    <div class="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div class="w-14 h-14 rounded-2xl bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="w-6 h-6 text-[var(--color-fg-subtle)]"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
      <p class="text-sm text-[var(--color-fg-muted)] font-medium">
        Belum ada foto di album ini
      </p>
    </div>
  ) : (
    <div
      id="photo-grid"
      class="columns-2 sm:columns-3 lg:columns-4 gap-2 sm:gap-2.5 space-y-2 sm:space-y-2.5"
    >
      {images.map((asset, i) => (
        <button
          class="block w-full overflow-hidden rounded-xl break-inside-avoid cursor-zoom-in glossy-card focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 relative group"
          data-index={i}
          data-src={getThumbnailUrl(asset.id, "preview")}
          data-download={getDownloadUrl(asset.id)}
          data-name={asset.originalFileName}
          data-date={new Date(asset.fileCreatedAt).toLocaleDateString("id-ID", {
            dateStyle: "long",
          })}
          data-location={[asset.exifInfo?.city, asset.exifInfo?.country]
            .filter(Boolean)
            .join(", ")}
          aria-label={`Buka foto ${asset.originalFileName}`}
        >
          <img
            src={getThumbnailUrl(asset.id, "thumbnail")}
            alt={asset.originalFileName}
            loading="lazy"
            decoding="async"
            class="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500 ease-out block"
          />
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300 rounded-xl" />
          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="2"
                class="w-4 h-4"
              >
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

<div
  id="lightbox"
  class="fixed inset-0 z-50 hidden"
  role="dialog"
  aria-modal="true"
  aria-label="Lightbox foto"
>
  <div class="absolute inset-0 bg-black/90 backdrop-blur-xl" id="lb-backdrop">
  </div>

  <button
    id="lb-close"
    class="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/10"
    aria-label="Tutup lightbox"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      class="w-5 h-5"
    >
      <path d="M18 6 6 18M6 6l12 12"></path>
    </svg>
  </button>

  <button
    id="lb-prev"
    class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/10"
    aria-label="Foto sebelumnya"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      class="w-5 h-5"
    >
      <path d="M15 18l-6-6 6-6"></path>
    </svg>
  </button>

  <div
    class="absolute inset-0 z-10 flex flex-col items-center justify-center px-14 sm:px-20 gap-3 sm:gap-4"
  >
    <div
      class="relative flex items-center justify-center w-full"
      style="max-height: calc(100vh - 8rem)"
    >
      <img
        id="lb-img"
        src=""
        alt=""
        class="max-h-[calc(100vh-8rem)] max-w-full object-contain rounded-xl"
        style="opacity:0;transition:opacity 0.22s ease, transform 0.22s ease;transform:scale(0.97)"
      />
    </div>

    <div
      class="glass rounded-2xl px-4 sm:px-5 py-3 w-full max-w-lg flex items-center justify-between gap-3 sm:gap-4"
    >
      <div class="min-w-0 flex-1">
        <p
          id="lb-name"
          class="text-white text-xs sm:text-sm font-medium truncate leading-snug"
        >
        </p>
        <p id="lb-meta" class="text-white/45 text-[11px] mt-0.5 truncate"></p>
      </div>
      <div class="flex items-center gap-2.5 shrink-0">
        <p
          id="lb-counter"
          class="text-white/35 text-[11px] tabular-nums font-medium hidden sm:block"
        >
        </p>
        <a
          id="lb-download"
          href="#"
          download
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-semibold transition-all duration-200 border border-white/10 hover:border-white/20"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            class="w-3 h-3"
          >
            <path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"></path>
          </svg>
          Unduh
        </a>
      </div>
    </div>
  </div>

  <button
    id="lb-next"
    class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/10"
    aria-label="Foto berikutnya"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      class="w-5 h-5"
    >
      <path d="M9 18l6-6-6-6"></path>
    </svg>
  </button>
</div>

<script>
  const lb = document.getElementById("lightbox")!;
  const lbImg = document.getElementById("lb-img") as HTMLImageElement;
  const lbName = document.getElementById("lb-name")!;
  const lbMeta = document.getElementById("lb-meta")!;
  const lbDl = document.getElementById("lb-download") as HTMLAnchorElement;
  const lbCtr = document.getElementById("lb-counter")!;
  const btnClose = document.getElementById("lb-close")!;
  const btnPrev = document.getElementById("lb-prev")!;
  const btnNext = document.getElementById("lb-next")!;
  const backdrop = document.getElementById("lb-backdrop")!;

  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("#photo-grid button"),
  );
  let current = 0;

  function open(index: number) {
    current = index;
    lb.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    render();
  }

  function close() {
    lb.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function render() {
    const btn = buttons[current];
    lbImg.style.opacity = "0";
    lbImg.style.transform = "scale(0.97)";
    lbImg.src = btn.dataset.src!;
    lbImg.alt = btn.dataset.name!;
    lbImg.onload = () => {
      lbImg.style.opacity = "1";
      lbImg.style.transform = "scale(1)";
    };
    lbName.textContent = btn.dataset.name!;
    const meta = [btn.dataset.date, btn.dataset.location]
      .filter(Boolean)
      .join("  ·  ");
    lbMeta.textContent = meta;
    lbDl.href = btn.dataset.download!;
    lbDl.download = btn.dataset.name!;
    lbCtr.textContent = `${current + 1} / ${buttons.length}`;

    btnPrev.style.visibility = current === 0 ? "hidden" : "visible";
    btnNext.style.visibility =
      current === buttons.length - 1 ? "hidden" : "visible";

    if (current + 1 < buttons.length) {
      const pre = new Image();
      pre.src = buttons[current + 1].dataset.src!;
    }
  }

  buttons.forEach((btn, i) => btn.addEventListener("click", () => open(i)));
  btnClose.addEventListener("click", close);
  backdrop.addEventListener("click", close);

  btnPrev.addEventListener("click", () => {
    if (current > 0) {
      current--;
      render();
    }
  });
  btnNext.addEventListener("click", () => {
    if (current < buttons.length - 1) {
      current++;
      render();
    }
  });

  let startX = 0;
  let startY = 0;
  lb.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    },
    { passive: true },
  );
  lb.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (Math.abs(dx) < 40) return;
    if (dx < 0 && current < buttons.length - 1) {
      current++;
      render();
    }
    if (dx > 0 && current > 0) {
      current--;
      render();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (lb.classList.contains("hidden")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft" && current > 0) {
      current--;
      render();
    }
    if (e.key === "ArrowRight" && current < buttons.length - 1) {
      current++;
      render();
    }
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
const SITE_NAME = import.meta.env.SITE_NAME ?? "GALERI DOKUMENTASI";
const SITE_SHORT_NAME = import.meta.env.SITE_SHORT_NAME ?? "DOKUMENTASI";

const { albums, activeId } = Astro.props;
const groups = groupAlbumsByYear(albums);
const currentPath = Astro.url.pathname;
const isHome = currentPath === "/";
const isAlbums = currentPath === "/albums";
const isAlbumPage = currentPath.startsWith("/albums/");
---

<aside
  id="app-sidebar"
  class="hidden lg:flex fixed top-0 left-0 h-screen flex-col z-40 glass border-r border-[var(--glass-border)] overflow-hidden"
  aria-label="Sidebar navigasi"
>
  <div
    class="flex items-center h-14 px-3 border-b border-[var(--glass-border)] shrink-0 gap-2 overflow-hidden"
  >
    <!-- <span
      class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-accent)] shrink-0"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        stroke-width="2"
        class="w-3.5 h-3.5"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
      </svg>
    </span>
    <span
      class="sb-label text-xs font-semibold text-[var(--color-fg-subtle)] uppercase tracking-widest truncate whitespace-nowrap"
    >
      Navigasi
    </span> -->
    <a
      href="/"
      class="flex items-center gap-2 font-semibold tracking-tight text-[var(--color-fg)] text-sm"
    >
      <span
        class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-accent)] shrink-0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2"
          class="w-3.5 h-3.5"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
        </svg>
      </span>
      <span class="hidden sm:block leading-tight">{SITE_NAME}</span>
      <span class="sm:hidden leading-tight">{SITE_SHORT_NAME}</span>
    </a>
  </div>

  <div class="px-2 pt-2.5 pb-1 space-y-0.5 shrink-0">
    <a
      href="/"
      class:list={[
        "sb-nav-item flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
        isHome
          ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
          : "text-[var(--color-fg-muted)] hover:bg-[var(--color-canvas-subtle)] hover:text-[var(--color-fg)]",
      ]}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="w-4 h-4 shrink-0"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
      <span class="sb-label">Beranda</span>
    </a>

    <a
      href="/albums"
      class:list={[
        "sb-nav-item flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
        isAlbums || isAlbumPage
          ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
          : "text-[var(--color-fg-muted)] hover:bg-[var(--color-canvas-subtle)] hover:text-[var(--color-fg)]",
      ]}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="w-4 h-4 shrink-0"
      >
        <path
          d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
        ></path>
      </svg>
      <span class="sb-label">Semua Album</span>
    </a>
  </div>

  <div class="sb-expanded flex-1 overflow-y-auto px-2 pb-4">
    <div class="space-y-4 pt-2">
      {
        groups.map((group) => (
          <div>
            <p class="px-2.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-fg-subtle)] mb-1.5 flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
              <span class="w-3 h-px bg-[var(--color-border)] inline-block shrink-0" />
              {group.year}
            </p>
            <ul class="space-y-0.5">
              {group.albums.map((album) => {
                const active = activeId === album.id;
                return (
                  <li>
                    <a
                      href={`/albums/${album.id}`}
                      class:list={[
                        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm truncate transition-colors group",
                        active
                          ? "bg-[var(--color-accent)] text-white font-medium shadow-sm"
                          : "text-[var(--color-fg-muted)] hover:bg-[var(--color-canvas-subtle)] hover:text-[var(--color-fg)]",
                      ]}
                    >
                      <span
                        class:list={[
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          active ? "bg-white/60" : "bg-[var(--color-border)]",
                        ]}
                      />
                      <span class="truncate">{album.albumName}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      }
    </div>
  </div>
</aside>

```

---

### File: `./src/env.d.ts`

```ts
interface ImportMetaEnv {
    readonly IMMICH_BASE_URL: string;
    readonly IMMICH_API_KEY: string;
    readonly SITE_NAME: string;
    readonly SITE_SHORT_NAME: string;
    readonly SITE_DESCRIPTION: string;
    readonly ORG_NAME: string;
    readonly SCHOOL_NAME: string;
    readonly POWERED_BY: string;
    readonly POWERED_BY_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
```

---

### File: `./src/layouts/Layout.astro`

```astro
---
import "../styles/global.css";

interface Props {
  title?: string;
  description?: string;
  activePath?: string;
}

const SITE_NAME = import.meta.env.SITE_NAME ?? "GALERI DOKUMENTASI";
const SITE_SHORT_NAME = import.meta.env.SITE_SHORT_NAME ?? "DOKUMENTASI";
const SITE_DESCRIPTION =
  import.meta.env.SITE_DESCRIPTION ?? "Dokumentasi kegiatan dalam satu tempat.";
const SCHOOL_NAME =
  import.meta.env.SCHOOL_NAME ?? "ZEDLABS TEKNOLOGI INDONESIA";
const ORG_NAME = import.meta.env.ORG_NAME ?? "ZEDLABS TEKNOLOGI INDONESIA";
const POWERED_BY = import.meta.env.POWERED_BY ?? "ZEDLABS TEKNOLOGI INDONESIA";
const POWERED_BY_URL = import.meta.env.POWERED_BY_URL ?? "https://zedlabs.id";

const {
  title = SITE_NAME,
  description = SITE_DESCRIPTION,
  activePath = Astro.url.pathname,
} = Astro.props;

const isHome = activePath === "/";
const isAlbums = activePath.startsWith("/albums");
const year = new Date().getFullYear();
---

<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <meta
      name="theme-color"
      content="#0969da"
      media="(prefers-color-scheme: light)"
    />
    <meta
      name="theme-color"
      content="#0d1117"
      media="(prefers-color-scheme: dark)"
    />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content="/og.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content={SITE_SHORT_NAME} />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
    <script is:inline>
      (function () {
        var s = localStorage.getItem("theme");
        var d = matchMedia("(prefers-color-scheme: dark)").matches;
        if ((s ?? (d ? "dark" : "light")) === "dark")
          document.documentElement.classList.add("dark");
        if (localStorage.getItem("sb-collapsed") === "1")
          document.body.classList.add("sb-collapsed");
      })();
    </script>
  </head>

  <body
    class="bg-[var(--color-canvas)] text-[var(--color-fg)] min-h-screen antialiased"
  >
    <slot name="sidebar" />

    <div id="app-content" class="flex flex-col min-h-screen">
      <header
        class="glass sticky top-0 z-30 flex items-center justify-between px-4 sm:px-5 h-14 border-b border-[var(--glass-border)] shrink-0"
      >
        <div class="flex items-center gap-2">
          <button
            id="sidebar-toggle"
            type="button"
            aria-label="Toggle sidebar"
            class="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--color-border-muted)] hover:bg-[var(--color-canvas-subtle)] hover:border-[var(--color-border)] transition-all duration-200 shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="w-4 h-4"
            >
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        <button
          id="theme-toggle"
          type="button"
          aria-label="Ganti tema"
          class="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border-muted)] hover:bg-[var(--color-canvas-subtle)] hover:border-[var(--color-border)] transition-all duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="w-4 h-4 hidden dark:block"
          >
            <circle cx="12" cy="12" r="4"></circle>
            <path
              d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
            ></path>
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="w-4 h-4 block dark:hidden"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
      </header>

      <main class="flex-1 pb-20 lg:pb-0">
        <slot />
      </main>

      <footer
        class="hidden lg:block px-6 py-4 border-t border-[var(--color-border-muted)]"
      >
        <div
          class="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs text-[var(--color-fg-subtle)]"
        >
          <p>&copy; {year} {ORG_NAME} &mdash; {SCHOOL_NAME}</p>
          <p>
            Powered by{" "}
            <a
              href={POWERED_BY_URL}
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-[var(--color-accent)] hover:underline"
            >
              {POWERED_BY}
            </a>
          </p>
        </div>
      </footer>
    </div>

    <nav
      class="mobile-nav fixed bottom-0 left-0 right-0 z-40 lg:hidden glass border-t border-[var(--glass-border)]"
      aria-label="Navigasi utama"
    >
      <div
        class="flex items-stretch h-16"
        style="max-width:360px;margin:0 auto"
      >
        <a
          href="/"
          aria-label="Beranda"
          class={`mobile-nav-item ${isHome ? "mobile-nav-active" : "mobile-nav-inactive"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="w-[22px] h-[22px]"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Beranda</span>
        </a>
        <a
          href="/albums"
          aria-label="Album"
          class={`mobile-nav-item ${isAlbums ? "mobile-nav-active" : "mobile-nav-inactive"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="w-[22px] h-[22px]"
          >
            <path
              d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
            ></path>
          </svg>
          <span>Album</span>
        </a>
      </div>
    </nav>

    <div
      id="install-banner"
      class="fixed z-50 w-[calc(100%-2.5rem)] max-w-sm"
      style="bottom:5.5rem;left:50%;transform:translateX(-50%) translateY(calc(100% + 1.5rem));opacity:0;pointer-events:none;transition:transform 0.38s cubic-bezier(0.34,1.56,0.64,1),opacity 0.38s ease"
      aria-live="polite"
    >
      <div
        class="glass rounded-2xl px-5 py-4 shadow-[var(--shadow-lg)] border border-[var(--glass-border)]"
      >
        <div class="flex items-start gap-3 mb-3">
          <span
            class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-accent)] shrink-0 mt-0.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="2"
              class="w-4 h-4"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
            </svg>
          </span>
          <div>
            <p
              class="text-sm font-semibold text-[var(--color-fg)] leading-tight"
            >
              Install Aplikasi
            </p>
            <p class="text-xs text-[var(--color-fg-muted)] mt-0.5">
              Akses dokumentasi {ORG_NAME} lebih cepat dari layar utama.
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            id="install-btn"
            class="flex-1 py-2 rounded-xl bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
            >Install</button
          >
          <button
            id="install-dismiss"
            class="flex-1 py-2 rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-fg-muted)] hover:bg-[var(--color-canvas-subtle)] active:scale-95 transition-all"
            >Nanti</button
          >
        </div>
      </div>
    </div>

    <script is:inline>
      document
        .getElementById("theme-toggle")
        .addEventListener("click", function () {
          var isDark = document.documentElement.classList.toggle("dark");
          localStorage.setItem("theme", isDark ? "dark" : "light");
        });

      var sbToggle = document.getElementById("sidebar-toggle");
      sbToggle &&
        sbToggle.addEventListener("click", function () {
          var c = document.body.classList.toggle("sb-collapsed");
          localStorage.setItem("sb-collapsed", c ? "1" : "0");
        });

      var deferredPrompt = null;
      var banner = document.getElementById("install-banner");
      var btnInst = document.getElementById("install-btn");
      var btnDism = document.getElementById("install-dismiss");

      function showBanner() {
        banner.style.transform = "translateX(-50%) translateY(0)";
        banner.style.opacity = "1";
        banner.style.pointerEvents = "auto";
      }
      function hideBanner() {
        banner.style.transform =
          "translateX(-50%) translateY(calc(100% + 1.5rem))";
        banner.style.opacity = "0";
        banner.style.pointerEvents = "none";
      }

      window.addEventListener("beforeinstallprompt", function (e) {
        e.preventDefault();
        deferredPrompt = e;
        if (!localStorage.getItem("pwa-dismissed")) {
          setTimeout(showBanner, 2500);
        }
      });

      btnInst &&
        btnInst.addEventListener("click", async function () {
          hideBanner();
          if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
          }
        });

      btnDism &&
        btnDism.addEventListener("click", function () {
          hideBanner();
          localStorage.setItem("pwa-dismissed", "1");
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

const HEADERS = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
};

const EXCLUDED_ALBUM_KEYWORDS = ["UNGGAH DOKUMENTASI"];

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
    return EXCLUDED_ALBUM_KEYWORDS.some((kw) =>
        album.albumName.toUpperCase().includes(kw.toUpperCase())
    );
}

export async function getAllAlbums(): Promise<ImmichAlbum[]> {
    const res = await fetch(`${BASE_URL}/api/albums?shared=true`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Gagal fetch albums: ${res.statusText}`);
    const all: ImmichAlbum[] = await res.json();
    return all.filter((a) => a.shared && !isExcludedAlbum(a));
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
    return getThumbnailUrl(album.albumThumbnailAssetId, "preview");
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
```

---

### File: `./src/pages/albums/index.astro`

```astro
---
import Layout from "../../layouts/Layout.astro";
import Sidebar from "../../components/Sidebar.astro";
import AlbumGrid from "../../components/AlbumGrid.astro";
import { getAllAlbums } from "../../lib/immich";

const SITE_NAME = import.meta.env.SITE_NAME ?? "DOKUMENTASI";
const albums = await getAllAlbums();
---

<Layout title={`Album — ${SITE_NAME}`} activePath="/albums">
  <Sidebar slot="sidebar" albums={albums} />

  <section class="px-5 sm:px-8 py-10">
    <div class="flex items-baseline gap-3 mb-6">
      <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight">
        Semua Album
      </h1>
      <span class="text-sm text-[var(--color-fg-muted)] font-medium"
        >{albums.length} Album Publik</span
      >
    </div>
    <AlbumGrid albums={albums} />
  </section>
</Layout>

```

---

### File: `./src/pages/albums/[albumId].astro`

```astro
---
export const prerender = false;

import { getAllAlbums, getAlbumById, isExcludedAlbum } from "../../lib/immich";
import Lightbox from "../../components/Lightbox.astro";
import Layout from "../../layouts/Layout.astro";
import Sidebar from "../../components/Sidebar.astro";

const SITE_NAME = import.meta.env.SITE_NAME ?? "GALERI DOKUMENTASI";

const { albumId } = Astro.params;
if (!albumId) return Astro.redirect("/albums");

let album, albums;
try {
  [album, albums] = await Promise.all([getAlbumById(albumId), getAllAlbums()]);
} catch {
  return Astro.redirect("/albums");
}

if (!album.shared || isExcludedAlbum(album)) return Astro.redirect("/albums");

const imageCount = album.assets.filter((a) => a.type === "IMAGE").length;
const albumDate = new Date(album.createdAt).toLocaleDateString("id-ID", {
  dateStyle: "long",
});
const pageUrl = Astro.url.href;
const shareTitle = `${album.albumName} — ${SITE_NAME}`;
const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + "\n" + pageUrl)}`;
const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
---

<Layout
  title={`${album.albumName} — ${SITE_NAME}`}
  description={album.description || `${album.albumName} — ${imageCount} foto`}
  activePath={`/albums/${albumId}`}
>
  <Sidebar slot="sidebar" albums={albums} activeId={album.id} />

  <div class="px-5 sm:px-7 py-10">
    <a
      href="/albums"
      class="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors mb-8 group"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        class="w-3 h-3 group-hover:-translate-x-0.5 transition-transform"
      >
        <path d="M15 18l-6-6 6-6"></path>
      </svg>
      Kembali ke Album
    </a>

    <div class="mb-8">
      <h1
        class="text-2xl sm:text-3xl font-semibold tracking-tight leading-snug mb-2"
      >
        {album.albumName}
      </h1>
      {
        album.description && (
          <p class="text-[var(--color-fg-muted)] text-sm leading-relaxed max-w-lg mb-4">
            {album.description}
          </p>
        )
      }

      <div class="flex items-center gap-2.5 flex-wrap mb-4">
        <span
          class="inline-flex items-center gap-1.5 text-xs text-[var(--color-fg-muted)] bg-[var(--color-canvas-subtle)] border border-[var(--color-border-muted)] px-2.5 py-1 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="w-3 h-3"
          >
            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <path d="M21 15l-5-5L5 21"></path>
          </svg>
          {imageCount} Foto
        </span>
        <span
          class="inline-flex items-center gap-1.5 text-xs text-[var(--color-fg-muted)] bg-[var(--color-canvas-subtle)] border border-[var(--color-border-muted)] px-2.5 py-1 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="w-3 h-3"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          {albumDate}
        </span>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold transition-all active:scale-95 shadow-sm"
          style="background-color:#25D366"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-3.5 h-3.5"
          >
            <path
              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
            ></path>
            <path
              d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.824L.057 23.882a.5.5 0 0 0 .614.632l6.284-1.634A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.519-5.21-1.42l-.374-.222-3.878 1.009 1.049-3.756-.245-.388A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"
            ></path>
          </svg>
          WhatsApp
        </a>

        <a
          href={fbUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold transition-all active:scale-95 shadow-sm"
          style="background-color:#1877F2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-3.5 h-3.5"
          >
            <path
              d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
            ></path>
          </svg>
          Facebook
        </a>

        <button
          id="btn-copy-link"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-canvas-subtle)] border border-[var(--color-border-muted)] text-[var(--color-fg)] text-xs font-semibold hover:bg-[var(--color-canvas-inset)] transition-all active:scale-95"
        >
          <svg
            id="icon-copy"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="w-3.5 h-3.5"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
            ></path>
          </svg>
          <svg
            id="icon-check"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            class="w-3.5 h-3.5 hidden"
            style="color:var(--color-success)"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span id="copy-label">Salin Tautan</span>
        </button>
      </div>
    </div>

    <Lightbox assets={album.assets} />
  </div>
</Layout>

<script>
  const pageUrl = window.location.href;
  const albumName = document.querySelector("h1")?.textContent?.trim() ?? "";

  const btnCopy = document.getElementById("btn-copy-link");
  const iconCopy = document.getElementById("icon-copy");
  const iconCheck = document.getElementById("icon-check");
  const copyLabel = document.getElementById("copy-label");

  btnCopy?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      iconCopy?.classList.add("hidden");
      iconCheck?.classList.remove("hidden");
      if (copyLabel) copyLabel.textContent = "Tersalin!";
      setTimeout(() => {
        iconCopy?.classList.remove("hidden");
        iconCheck?.classList.add("hidden");
        if (copyLabel) copyLabel.textContent = "Salin Tautan";
      }, 2000);
    } catch {}
  });
</script>

```

---

### File: `./src/pages/api/img.ts`

```ts
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

const SITE_DESCRIPTION =
  import.meta.env.SITE_DESCRIPTION ?? "Dokumentasi kegiatan dalam satu tempat.";
const ORG_NAME = import.meta.env.ORG_NAME ?? "DOKUMENTASI";
const SCHOOL_NAME =
  import.meta.env.SCHOOL_NAME ?? "ZEDLABS TEKNOLOGI INDONESIA";

const [albums, recentAssets] = await Promise.all([
  getAllAlbums(),
  getRecentAssets(30),
]);

const totalPhotos = albums.reduce((s, a) => s + a.assetCount, 0);
---

<Layout activePath="/">
  <Sidebar slot="sidebar" albums={albums} />

  <section class="px-5 sm:px-8 pt-10 pb-6">
    <div class="max-w-2xl">
      <p
        class="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)] mb-2"
      >
        Dokumentasi Kegiatan
      </p>
      <!-- <h1
        class="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--color-fg)] mb-2 leading-tight"
      >
        Semua kegiatan {ORG_NAME}<br />dalam satu tempat.
      </h1> -->
      <p class="text-sm text-[var(--color-fg-muted)] leading-relaxed">
        {SITE_DESCRIPTION} &mdash; {SCHOOL_NAME}.
      </p>
    </div>

    <div class="flex items-center gap-5 mt-6 flex-wrap">
      <div class="flex items-baseline gap-1.5">
        <span
          class="text-2xl sm:text-3xl font-bold tabular-nums text-[var(--color-fg)]"
          >{albums.length}</span
        >
        <span class="text-xs text-[var(--color-fg-muted)] font-medium"
          >Album Publik</span
        >
      </div>
      <div class="w-px h-6 bg-[var(--color-border)]"></div>
      <div class="flex items-baseline gap-1.5">
        <span
          class="text-2xl sm:text-3xl font-bold tabular-nums text-[var(--color-fg)]"
          >{totalPhotos.toLocaleString("id-ID")}</span
        >
        <span class="text-xs text-[var(--color-fg-muted)] font-medium"
          >Foto</span
        >
      </div>
      <div class="w-px h-6 bg-[var(--color-border)]"></div>
      <a
        href="/albums"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] hover:underline"
      >
        Lihat semua album
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          class="w-3 h-3"
        >
          <path d="M5 12h14M12 5l7 7-7 7"></path>
        </svg>
      </a>
    </div>
  </section>

  {
    recentAssets.length > 0 && (
      <div class="border-y border-[var(--color-border-muted)] bg-[var(--color-canvas-subtle)]">
        <InfiniteSlider assets={recentAssets} />
      </div>
    )
  }

  <section class="px-5 sm:px-8 py-8">
    <div class="flex items-center justify-between mb-5">
      <h2
        class="text-xs font-semibold uppercase tracking-widest text-[var(--color-fg-subtle)]"
      >
        Album Publik
      </h2>
      <a
        href="/albums"
        class="text-xs text-[var(--color-accent)] font-medium hover:underline"
        >Lihat semua</a
      >
    </div>
    <AlbumGrid albums={albums} />
  </section>
</Layout>

<script is:inline>
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js");
    });
  }
</script>

```

---

### File: `./src/pages/manifest.webmanifest.ts`

```ts
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
```

---

### File: `./src/styles/global.css`

```css
@import url("https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap");

@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
    --color-canvas: #ffffff;
    --color-canvas-subtle: #f6f8fa;
    --color-canvas-inset: #f0f2f5;
    --color-border: #d0d7de;
    --color-border-muted: #e4e8ec;
    --color-fg: #1f2328;
    --color-fg-muted: #656d76;
    --color-fg-subtle: #8c959f;
    --color-accent: #0969da;
    --color-accent-hover: #0757ba;
    --color-accent-subtle: #ddf4ff;
    --color-success: #1a7f37;
    --glass-bg: rgba(255, 255, 255, 0.75);
    --glass-border: rgba(208, 215, 222, 0.55);
    --shadow-sm: 0 1px 3px rgba(31, 35, 40, 0.08), 0 1px 2px rgba(31, 35, 40, 0.06);
    --shadow-md: 0 4px 16px rgba(31, 35, 40, 0.10), 0 2px 6px rgba(31, 35, 40, 0.06);
    --shadow-lg: 0 12px 40px rgba(31, 35, 40, 0.14), 0 4px 12px rgba(31, 35, 40, 0.08);
    --sb-width: 15rem;
    --sb-width-collapsed: 3.5rem;
}

.dark {
    --color-canvas: #0d1117;
    --color-canvas-subtle: #161b22;
    --color-canvas-inset: #010409;
    --color-border: #30363d;
    --color-border-muted: #21262d;
    --color-fg: #e6edf3;
    --color-fg-muted: #8b949e;
    --color-fg-subtle: #6e7681;
    --color-accent: #58a6ff;
    --color-accent-hover: #79b8ff;
    --color-accent-subtle: #121d2f;
    --color-success: #3fb950;
    --glass-bg: rgba(22, 27, 34, 0.78);
    --glass-border: rgba(48, 54, 61, 0.65);
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.25);
    --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3);
}

*,
*::before,
*::after {
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: "Lexend", system-ui, sans-serif;
    background-color: var(--color-canvas);
    color: var(--color-fg);
    transition: background-color 0.25s ease, color 0.25s ease;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* ── Sidebar layout (desktop only) ─────────────────────────── */
@media (min-width: 1024px) {
    #app-sidebar {
        width: var(--sb-width);
        transition: width 0.28s ease;
    }

    #app-content {
        padding-left: var(--sb-width);
        transition: padding-left 0.28s ease;
    }

    body.sb-collapsed #app-sidebar {
        width: var(--sb-width-collapsed);
    }

    body.sb-collapsed #app-content {
        padding-left: var(--sb-width-collapsed);
    }
}

/* ── Sidebar collapsed state ────────────────────────────────── */
body.sb-collapsed #app-sidebar .sb-label,
body.sb-collapsed #app-sidebar .sb-expanded {
    display: none;
}

body.sb-collapsed #app-sidebar .sb-nav-item {
    justify-content: center;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
}

/* ── Mobile bottom nav ──────────────────────────────────────── */
.mobile-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    flex: 1;
    min-width: 0;
    font-size: 0.625rem;
    font-weight: 500;
    padding: 0.5rem 0.25rem;
    pointer-events: auto;
    -webkit-tap-highlight-color: transparent;
    transition: color 0.18s ease;
    text-decoration: none;
}

.mobile-nav-active {
    color: var(--color-accent);
}

.mobile-nav-inactive {
    color: var(--color-fg-muted);
}

.mobile-nav-inactive:hover {
    color: var(--color-fg);
}

/* ── Glass ──────────────────────────────────────────────────── */
.glass {
    background: var(--glass-bg);
    backdrop-filter: blur(20px) saturate(200%);
    -webkit-backdrop-filter: blur(20px) saturate(200%);
    border: 1px solid var(--glass-border);
}

/* ── Glossy card ────────────────────────────────────────────── */
.glossy-card {
    position: relative;
    background: var(--color-canvas-subtle);
    border: 1px solid var(--color-border-muted);
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease;
}

.glossy-card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-border);
}

.glossy-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, transparent 60%);
    pointer-events: none;
    z-index: 1;
}

/* ── Infinite slider ────────────────────────────────────────── */
.zigzag-row {
    width: 100%;
    overflow: hidden;
}

.zigzag-track {
    display: flex;
    gap: 0.625rem;
    width: max-content;
    will-change: transform;
}

.zigzag-left {
    animation: scroll-left 45s linear infinite;
}

.zigzag-right {
    animation: scroll-right 45s linear infinite;
}

@keyframes scroll-left {
    from {
        transform: translateX(0);
    }

    to {
        transform: translateX(-50%);
    }
}

@keyframes scroll-right {
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

/* ── Scrollbar ──────────────────────────────────────────────── */
::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--color-fg-muted);
}

/* ── Selection ──────────────────────────────────────────────── */
::selection {
    background: var(--color-accent-subtle);
    color: var(--color-fg);
}
```

---

