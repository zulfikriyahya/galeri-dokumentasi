## Direktory: ROOT

### File: `./.env`

```
SITE_URL=https://dokumentasi.mtsn1pandeglang.sch.id

IMMICH_BASE_URL=https://galeri.mtsn1pandeglang.sch.id
IMMICH_API_KEY=iAoSqQJRJgTc9j5TxVnHQo3lX030HDRnnv08q8tXeWY

SITE_NAME=DOKUMENTASI MADRASAH
SITE_SHORT_NAME=DOKUMENTASI
SITE_DESCRIPTION=Dokumentasi kegiatan dalam satu tempat
ORG_NAME=DOKUMENTASI
SCHOOL_NAME=MTsN 1 PANDEGLANG
POWERED_BY=ZEDLABS TEKNOLOGI INDONESIA
POWERED_BY_URL=https://zedlabs.id
EXCLUDED_ALBUM_KEYWORDS=UNGGAH DOKUMENTASI

SOCIAL_INSTAGRAM_URL=https://www.instagram.com/mtsn1_pandeglang
SOCIAL_YOUTUBE_URL=https://www.youtube.com/@mtsn1pandeglangofficial
UPLOAD_URL=https://galeri.mtsn1pandeglang.sch.id/s/unggah-dokumentasi

DEVELOPER_NAME=Yahya Zulfikri
DEVELOPER_ROLE=Staf Tata Usaha & IT Madrasah
DEVELOPER_URL=https://github.com/zulfikriyahya
DEVELOPER_INSTAGRAM_URL=https://www.instagram.com/zulfikriyahya_
DEVELOPER_LINKEDIN_URL=https://id.linkedin.com/in/zulfikriyahya/en

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

### File: `./ecosystem.config.cjs`

```javascript
module.exports = {
    apps: [
        {
            name: "dokumentasi-madrasah",
            script: "./dist/server/entry.mjs",
            interpreter: "node",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "512M",
            env: {
                NODE_ENV: "production",
                HOST: "0.0.0.0",
                PORT: 4322,
            },
        },
    ],
};
```

---

### File: `./package.json`

```json
{
  "name": "galeri-dokumentasi",
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
    "@astrojs/node": "^11.0.0",
    "astro": "^7.0.0",
    "dotenv": "^17.4.2",
    "sharp": "^0.35.2",
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
minimumReleaseAgeExclude:
  - '@astrojs/markdown-satteri@0.3.1'
  - '@astrojs/node@11.0.0'
  - astro@7.0.0

```

---

### File: `./tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [
    ".astro/types.d.ts",
    "**/*"
  ],
  "exclude": [
    "dist"
  ]
}
```

---

## Direktory: nginx

### File: `./nginx/config.nginx`

```
server {
    listen 80;
    server_name dokumentasi.mtsn1pandeglang.sch.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name dokumentasi.mtsn1pandeglang.sch.id;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    location / {
        proxy_pass http://127.0.0.1:4322;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }

    location ~* \.(ico|svg|png|jpg|jpeg|webp|woff2|woff|ttf)$ {
        proxy_pass http://127.0.0.1:4322;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    location ~* \.(css|js)$ {
        proxy_pass http://127.0.0.1:4322;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

---

## Direktory: public

### File: `./public/sw.js`

```js
const CACHE_STATIC = "static-v2";
const CACHE_IMAGES = "images-v2";
const CACHE_PAGES = "pages-v1";

const STATIC_ASSETS = ["/", "/albums", "/favicon.svg", "/og.png"];

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
                    .filter((k) => k !== CACHE_STATIC && k !== CACHE_IMAGES && k !== CACHE_PAGES)
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
                try {
                    const res = await fetch(request);
                    if (res.ok) cache.put(request, res.clone());
                    return res;
                } catch {
                    return new Response("", { status: 503 });
                }
            })
        );
        return;
    }

    if (request.destination === "document") {
        e.respondWith(
            caches.open(CACHE_PAGES).then(async (cache) => {
                try {
                    const res = await fetch(request);
                    if (res.ok) cache.put(request, res.clone());
                    return res;
                } catch {
                    const cached = await cache.match(request);
                    return cached ?? caches.match("/");
                }
            })
        );
        return;
    }

    if (request.destination === "script" || request.destination === "style") {
        e.respondWith(
            caches.open(CACHE_STATIC).then(async (cache) => {
                const cached = await cache.match(request);
                if (cached) return cached;
                try {
                    const res = await fetch(request);
                    if (res.ok) cache.put(request, res.clone());
                    return res;
                } catch {
                    return cached ?? new Response("", { status: 503 });
                }
            })
        );
        return;
    }

    if (request.destination === "font") {
        e.respondWith(
            caches.open(CACHE_STATIC).then(async (cache) => {
                const cached = await cache.match(request);
                if (cached) return cached;
                const res = await fetch(request);
                if (res.ok) cache.put(request, res.clone());
                return res;
            })
        );
        return;
    }
});
```

---

## Direktory: scripts

### File: `./scripts/gen-icon.mjs`

```javascript
import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

const svg = readFileSync("public/favicon.svg");

await sharp(svg).resize(192).png().toFile("public/icons/icon-192.png");
await sharp(svg).resize(512).png().toFile("public/icons/icon-512.png");
await sharp(svg).resize(1200).png().toFile("public/og.png");

console.log("Icons successfully generated from favicon.svg!");
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
import { getThumbnailUrl, getDownloadUrl } from "../lib/immich";

interface Props {
  assets: ImmichAsset[];
}

const { assets } = Astro.props;
const half = Math.ceil(assets.length / 2);
const rowOne = assets.slice(0, half);
const rowTwo = assets.slice(half);

function metaFor(asset: ImmichAsset): string {
  const date = new Date(asset.fileCreatedAt).toLocaleDateString("id-ID", {
    dateStyle: "long",
  });
  const location = [asset.exifInfo?.city, asset.exifInfo?.country]
    .filter(Boolean)
    .join(", ");
  return [date, location].filter(Boolean).join("  ·  ");
}
---

<div class="space-y-2.5 py-4 overflow-hidden select-none">
  <div class="zigzag-row">
    <div class="zigzag-track zigzag-left">
      {
        [...rowOne, ...rowOne].map((asset, i) => (
          <button
            type="button"
            class="slider-img-btn relative group h-28 sm:h-36 w-auto flex-shrink-0 rounded-xl overflow-hidden glossy-card cursor-zoom-in"
            data-src={getThumbnailUrl(asset.id, "preview")}
            data-download={getDownloadUrl(asset.id)}
            data-name={asset.originalFileName}
            data-meta={metaFor(asset)}
            aria-label={`Buka foto ${asset.originalFileName}`}
          >
            <img
              src={i < 6 ? getThumbnailUrl(asset.id, "thumbnail") : undefined}
              data-src={
                i >= 6 ? getThumbnailUrl(asset.id, "thumbnail") : undefined
              }
              alt={asset.exifInfo?.description || asset.originalFileName}
              decoding="async"
              fetchpriority={i < 2 ? "high" : "auto"}
              width="160"
              height="112"
              class:list={[
                "h-full w-auto object-cover pointer-events-none group-hover:scale-105 transition-transform duration-500 ease-out block",
                i >= 6 ? "lazy-slider" : "",
              ]}
            />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300 pointer-events-none" />
          </button>
        ))
      }
    </div>
  </div>
  <div class="zigzag-row">
    <div class="zigzag-track zigzag-right">
      {
        [...rowTwo, ...rowTwo].map((asset, i) => (
          <button
            type="button"
            class="slider-img-btn relative group h-28 sm:h-36 w-auto flex-shrink-0 rounded-xl overflow-hidden glossy-card cursor-zoom-in"
            data-src={getThumbnailUrl(asset.id, "preview")}
            data-download={getDownloadUrl(asset.id)}
            data-name={asset.originalFileName}
            data-meta={metaFor(asset)}
            aria-label={`Buka foto ${asset.originalFileName}`}
          >
            <img
              src={i < 6 ? getThumbnailUrl(asset.id, "thumbnail") : undefined}
              data-src={
                i >= 6 ? getThumbnailUrl(asset.id, "thumbnail") : undefined
              }
              alt={asset.exifInfo?.description || asset.originalFileName}
              decoding="async"
              width="160"
              height="112"
              class:list={[
                "h-full w-auto object-cover pointer-events-none group-hover:scale-105 transition-transform duration-500 ease-out block",
                i >= 6 ? "lazy-slider" : "",
              ]}
            />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300 pointer-events-none" />
          </button>
        ))
      }
    </div>
  </div>
</div>

<div
  id="slider-lightbox"
  class="fixed inset-0 z-50 hidden"
  role="dialog"
  aria-modal="true"
  aria-label="Lightbox foto slider"
>
  <div
    class="absolute inset-0 bg-black/90 backdrop-blur-xl"
    id="slider-lb-backdrop"
  >
  </div>

  <button
    id="slider-lb-close"
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

  <div
    class="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 sm:px-20 gap-3 sm:gap-4"
  >
    <div
      class="relative flex items-center justify-center w-full"
      style="max-height: calc(100vh - 8rem)"
    >
      <img
        id="slider-lb-img"
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
          id="slider-lb-name"
          class="text-white text-xs sm:text-sm font-medium truncate leading-snug"
        >
        </p>
        <p
          id="slider-lb-meta"
          class="text-white/45 text-[11px] mt-0.5 truncate"
        >
        </p>
      </div>
      <a
        id="slider-lb-download"
        href="#"
        download
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-semibold transition-all duration-200 border border-white/10 hover:border-white/20 shrink-0"
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

<script>
  const lb = document.getElementById("slider-lightbox")!;
  const lbImg = document.getElementById("slider-lb-img") as HTMLImageElement;
  const lbName = document.getElementById("slider-lb-name")!;
  const lbMeta = document.getElementById("slider-lb-meta")!;
  const lbDl = document.getElementById(
    "slider-lb-download",
  ) as HTMLAnchorElement;
  const btnClose = document.getElementById("slider-lb-close")!;
  const backdrop = document.getElementById("slider-lb-backdrop")!;

  function loadSliderImages() {
    const lazys = document.querySelectorAll<HTMLImageElement>(".lazy-slider");
    if (!lazys.length) return;
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => batchLoad(lazys), { timeout: 1200 });
    } else {
      setTimeout(() => batchLoad(lazys), 300);
    }
  }

  function batchLoad(imgs: NodeListOf<HTMLImageElement>) {
    let i = 0;
    function next() {
      if (i >= imgs.length) return;
      const img = imgs[i++];
      const src = img.dataset.src;
      if (src) {
        img.src = src;
        delete img.dataset.src;
      }
      if (i < imgs.length) requestAnimationFrame(next);
    }
    next();
  }

  if (document.readyState === "complete") {
    loadSliderImages();
  } else {
    window.addEventListener("load", loadSliderImages, { once: true });
  }

  const tracks = Array.from(
    document.querySelectorAll<HTMLElement>(".zigzag-track"),
  );

  tracks.forEach((track) => {
    const pause = () => {
      track.style.animationPlayState = "paused";
    };
    const resume = () => {
      track.style.animationPlayState = "running";
    };
    track.addEventListener("pointerdown", pause);
    track.addEventListener("pointerup", resume);
    track.addEventListener("pointercancel", resume);
    track.addEventListener("pointerleave", resume);
  });

  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".slider-img-btn"),
  );

  function openLightbox(btn: HTMLButtonElement) {
    lb.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    lbImg.style.opacity = "0";
    lbImg.style.transform = "scale(0.97)";
    lbImg.src = btn.dataset.src!;
    lbImg.alt = btn.dataset.name!;
    lbImg.onload = () => {
      lbImg.style.opacity = "1";
      lbImg.style.transform = "scale(1)";
    };
    lbName.textContent = btn.dataset.name!;
    lbMeta.textContent = btn.dataset.meta!;
    lbDl.href = btn.dataset.download!;
    lbDl.download = btn.dataset.name!;
  }

  function closeLightbox() {
    lb.classList.add("hidden");
    document.body.style.overflow = "";
  }

  buttons.forEach((btn) =>
    btn.addEventListener("click", () => openLightbox(btn)),
  );
  btnClose.addEventListener("click", closeLightbox);
  backdrop.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (e) => {
    if (lb.classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightbox();
  });
</script>

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
            src={i < 8 ? getThumbnailUrl(asset.id, "thumbnail") : undefined}
            data-src={
              i >= 8 ? getThumbnailUrl(asset.id, "thumbnail") : undefined
            }
            alt={asset.exifInfo?.description || asset.originalFileName}
            decoding={i < 4 ? "sync" : "async"}
            fetchpriority={i < 2 ? "high" : "auto"}
            width="400"
            height="300"
            class:list={[
              "w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500 ease-out block",
              i >= 8 ? "lazy-grid" : "",
            ]}
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

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          delete img.dataset.src;
        }
        io.unobserve(img);
      });
    },
    { rootMargin: "0px 0px 400px 0px" },
  );

  document
    .querySelectorAll<HTMLImageElement>(".lazy-grid")
    .forEach((img) => io.observe(img));

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
    if (current - 1 >= 0) {
      const pre = new Image();
      pre.src = buttons[current - 1].dataset.src!;
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
    if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < 40) return;
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
    <a
      href="/"
      class="flex items-center gap-2 font-semibold tracking-tight text-[var(--color-fg)] text-sm min-w-0"
    >
      <span
        class="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[var(--color-border)] shrink-0 overflow-hidden p-1"
      >
        <img src="/favicon.svg" class="w-full h-full object-contain" />
      </span>
      <span class="sb-label leading-tight truncate">{SITE_NAME}</span>
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
    readonly EXCLUDED_ALBUM_KEYWORDS: string;
    readonly SOCIAL_INSTAGRAM_URL: string;
    readonly SOCIAL_YOUTUBE_URL: string;
    readonly UPLOAD_URL: string;
    readonly SITE_URL: string;
    readonly DEVELOPER_NAME: string;
    readonly DEVELOPER_ROLE: string;
    readonly DEVELOPER_URL: string;
    readonly DEVELOPER_INSTAGRAM_URL: string;
    readonly DEVELOPER_LINKEDIN_URL: string;
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
  ogImage?: string;
  canonicalUrl?: string;
}
const SITE_URL = import.meta.env.SITE_URL ?? "";
const SITE_NAME = import.meta.env.SITE_NAME ?? "GALERI DOKUMENTASI";
const SITE_SHORT_NAME = import.meta.env.SITE_SHORT_NAME ?? "DOKUMENTASI";
const SITE_DESCRIPTION =
  import.meta.env.SITE_DESCRIPTION ?? "Dokumentasi kegiatan dalam satu tempat.";
const SCHOOL_NAME =
  import.meta.env.SCHOOL_NAME ?? "ZEDLABS TEKNOLOGI INDONESIA";
const ORG_NAME = import.meta.env.ORG_NAME ?? "ZEDLABS TEKNOLOGI INDONESIA";
const POWERED_BY = import.meta.env.POWERED_BY ?? "ZEDLABS TEKNOLOGI INDONESIA";
const POWERED_BY_URL = import.meta.env.POWERED_BY_URL ?? "https://zedlabs.id";
const SOCIAL_INSTAGRAM_URL = import.meta.env.SOCIAL_INSTAGRAM_URL;
const SOCIAL_YOUTUBE_URL = import.meta.env.SOCIAL_YOUTUBE_URL;
const UPLOAD_URL = import.meta.env.UPLOAD_URL;

const DEVELOPER_NAME = import.meta.env.DEVELOPER_NAME ?? "Yahya Zulfikri";
const DEVELOPER_ROLE =
  import.meta.env.DEVELOPER_ROLE ?? "Staf Tata Usaha & IT Madrasah";
const DEVELOPER_URL =
  import.meta.env.DEVELOPER_URL ?? "https://github.com/zulfikriyahya";
const DEVELOPER_INSTAGRAM_URL = import.meta.env.DEVELOPER_INSTAGRAM_URL;
const DEVELOPER_LINKEDIN_URL = import.meta.env.DEVELOPER_LINKEDIN_URL;

const {
  title = SITE_NAME,
  description = SITE_DESCRIPTION,
  activePath = Astro.url.pathname,
  ogImage,
  canonicalUrl,
} = Astro.props;

const resolvedCanonical = canonicalUrl ?? `${SITE_URL}${activePath}`;
const resolvedOgImage = ogImage
  ? ogImage.startsWith("http")
    ? ogImage
    : `${SITE_URL}${ogImage}`
  : `${SITE_URL}/og.png`;

const isHome = activePath === "/";
const isAlbums = activePath.startsWith("/albums");
const year = new Date().getFullYear();

const developerPerson = {
  "@type": "Person",
  name: DEVELOPER_NAME,
  jobTitle: DEVELOPER_ROLE,
  url: DEVELOPER_URL,
  sameAs: [
    DEVELOPER_URL,
    DEVELOPER_INSTAGRAM_URL,
    DEVELOPER_LINKEDIN_URL,
  ].filter(Boolean),
  worksFor: {
    "@type": "EducationalOrganization",
    name: SCHOOL_NAME,
  },
  description:
    "Staf Tata Usaha dan satu-satunya tenaga IT di MTs Negeri 1 Pandeglang yang membangun infrastruktur dan kebutuhan IT madrasah dari awal hingga terus dikembangkan sampai saat ini, serta berperan dalam pengembangan sistem IT di beberapa sekolah/madrasah lain di Kabupaten Pandeglang. Juga aktif sebagai bagian dari Humas, Kurikulum, dan Kesiswaan MTsN 1 Pandeglang.",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: title,
  url: SITE_URL || Astro.url.origin,
  description,
  creator: developerPerson,
  author: developerPerson,
};
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
    <meta property="og:image" content={resolvedOgImage} />
    <meta property="og:url" content={resolvedCanonical} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={resolvedOgImage} />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content={SITE_SHORT_NAME} />
    <link rel="canonical" href={resolvedCanonical} />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="author" content={DEVELOPER_NAME} />
    <title>{title}</title>
    <script
      type="application/ld+json"
      set:html={JSON.stringify(websiteJsonLd)}
    />
    <script is:inline>
      (function () {
        var s = localStorage.getItem("theme");
        var d = matchMedia("(prefers-color-scheme: dark)").matches;
        if ((s ?? (d ? "dark" : "light")) === "dark")
          document.documentElement.classList.add("dark");
        if (localStorage.getItem("sb-collapsed") === "1")
          document.documentElement.classList.add("sb-collapsed");
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
        <div class="flex items-center gap-3">
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
              class="w-4 h-4 sidebar-icon-open"
            >
              <rect x="3" y="3" width="7" height="18" rx="1.5" opacity="0.3"
              ></rect>
              <line x1="14" y1="7" x2="21" y2="7"></line>
              <line x1="14" y1="12" x2="21" y2="12"></line>
              <line x1="14" y1="17" x2="21" y2="17"></line>
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="w-4 h-4 sidebar-icon-closed hidden"
            >
              <rect x="14" y="3" width="7" height="18" rx="1.5" opacity="0.3"
              ></rect>
              <line x1="3" y1="7" x2="10" y2="7"></line>
              <line x1="3" y1="12" x2="10" y2="12"></line>
              <line x1="3" y1="17" x2="10" y2="17"></line>
            </svg>
          </button>
          <a
            href="/"
            class="lg:hidden flex items-center gap-2.5 font-semibold
          tracking-tight text-[var(--color-fg)] text-sm"
          >
            <span
              class="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[var(--color-border)] shrink-0 overflow-hidden p-1"
            >
              <img src="/favicon.svg" class="w-full h-full object-contain" />
            </span>
            <span class="leading-tight truncate max-w-[160px] sm:max-w-xs"
              >{SITE_SHORT_NAME}</span
            >
            <!-- <span
              class="hidden sm:inline leading-tight truncate max-w-[160px] sm:max-w-xs"
              >{SITE_SHORT_NAME}</span
            > -->
          </a>
        </div>

        <!-- <div class="flex items-center gap-2"> -->
        <div class="flex items-center gap-1 sm:gap-2">
          {
            SOCIAL_INSTAGRAM_URL && (
              <a
                href={SOCIAL_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                class="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border-muted)] hover:bg-[var(--color-canvas-subtle)] hover:border-[var(--color-border)] transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="w-4 h-4"
                >
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.4.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421C8.415 2.176 8.794 2.16 12 2.16zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.79-4 4-4 2.209 0 4 1.79 4 4 0 2.209-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                </svg>
              </a>
            )
          }
          {
            SOCIAL_YOUTUBE_URL && (
              <a
                href={SOCIAL_YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                class="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border-muted)] hover:bg-[var(--color-canvas-subtle)] hover:border-[var(--color-border)] transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="w-4 h-4"
                >
                  <path d="M23.498 6.186a2.997 2.997 0 0 0-2.112-2.117C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.386.524A2.997 2.997 0 0 0 .502 6.186 31.27 31.27 0 0 0 0 12a31.27 31.27 0 0 0 .502 5.814 2.997 2.997 0 0 0 2.112 2.117c1.881.524 9.386.524 9.386.524s7.505 0 9.386-.524a2.997 2.997 0 0 0 2.112-2.117A31.27 31.27 0 0 0 24 12a31.27 31.27 0 0 0-.502-5.814zM9.75 15.568V8.432L15.818 12 9.75 15.568z" />
                </svg>
              </a>
            )
          }
          {
            UPLOAD_URL && (
              <a
                href={UPLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Unggah Foto"
                class="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border-muted)] hover:bg-[var(--color-canvas-subtle)] hover:border-[var(--color-border)] transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="w-4 h-4"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </a>
            )
          }
          <a
            href="https://github.com/zulfikriyahya"
            target="_blank"
            rel="noopener
        noreferrer"
            aria-label="GitHub"
            class="w-8 h-8 flex items-center
        justify-center rounded-lg border border-[var(--color-border-muted)]
        hover:bg-[var(--color-canvas-subtle)] hover:border-[var(--color-border)]
        transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="w-4 h-4"
            >
              <path
                d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"
              ></path>
            </svg>
          </a>
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
        </div>
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
      <div class="flex items-stretch h-16 max-w-sm mx-auto">
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
            class="flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--color-border)] shrink-0 overflow-hidden p-1"
          >
            <img src="/favicon.svg" class="w-full h-full object-contain" />
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
          var c = document.documentElement.classList.toggle("sb-collapsed");
          localStorage.setItem("sb-collapsed", c ? "1" : "0");
          var iconOpen = sbToggle.querySelector(".sidebar-icon-open");
          var iconClosed = sbToggle.querySelector(".sidebar-icon-closed");
          if (c) {
            iconOpen && iconOpen.classList.add("hidden");
            iconClosed && iconClosed.classList.remove("hidden");
          } else {
            iconOpen && iconOpen.classList.remove("hidden");
            iconClosed && iconClosed.classList.add("hidden");
          }
        });

      (function () {
        var c = document.documentElement.classList.contains("sb-collapsed");
        var sbToggle = document.getElementById("sidebar-toggle");

        if (!sbToggle) return;
        var iconOpen = sbToggle.querySelector(".sidebar-icon-open");
        var iconClosed = sbToggle.querySelector(".sidebar-icon-closed");
        if (c) {
          iconOpen && iconOpen.classList.add("hidden");
          iconClosed && iconClosed.classList.remove("hidden");
        }
      })();

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

import {
  getAllAlbums,
  getAlbumById,
  isExcludedAlbum,
  getAlbumCoverUrl,
  getThumbnailUrl,
} from "../../lib/immich";
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

const coverUrl = getAlbumCoverUrl(album);
const SITE_URL = import.meta.env.SITE_URL ?? "";

const imageCount = album.assets.filter((a) => a.type === "IMAGE").length;
const albumDate = new Date(album.createdAt).toLocaleDateString("id-ID", {
  dateStyle: "long",
});
const pageUrl = Astro.url.href;
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ImageGallery",
  name: album.albumName,
  description: album.description || `${album.albumName} — ${imageCount} foto`,
  url: pageUrl,
  associatedMedia: album.assets
    .filter((a) => a.type === "IMAGE")
    .map((a) => ({
      "@type": "ImageObject",
      contentUrl: `${SITE_URL}${getThumbnailUrl(a.id, "preview")}`,
      name: a.exifInfo?.description || a.originalFileName,
    })),
};
const shareTitle = `${album.albumName} — ${SITE_NAME}`;
const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + "\n" + pageUrl)}`;
const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
---

<Layout
  title={`${album.albumName} — ${SITE_NAME}`}
  description={album.description || `${album.albumName} — ${imageCount} foto`}
  activePath={`/albums/${albumId}`}
  ogImage={coverUrl ?? undefined}
>
  <script
    type="application/ld+json"
    set:html={JSON.stringify(jsonLd)}
    slot="head"
  />
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

### File: `./src/pages/robots.txt.ts`

```ts
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
```

---

### File: `./src/pages/sitemap.xml.ts`

```ts
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
    --color-canvas-inset: #f6f8fa;
    --color-border: #d1d9e0;
    --color-border-muted: #d8dee4;
    --color-fg: #1f2328;
    --color-fg-muted: #59636e;
    --color-fg-subtle: #6e7781;
    --color-accent: #0969da;
    --color-accent-hover: #0757ba;
    --color-accent-subtle: #ddf4ff;
    --color-success: #1a7f37;
    --color-danger: #d1242f;
    --color-attention: #9a6700;
    --color-done: #8250df;
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
    --color-border: #3d444d;
    --color-border-muted: #21262d;
    --color-fg: #e6edf3;
    --color-fg-muted: #848d97;
    --color-fg-subtle: #6e7681;
    --color-accent: #4493f8;
    --color-accent-hover: #79b8ff;
    --color-accent-subtle: #121d2f;
    --color-success: #3fb950;
    --color-danger: #f85149;
    --color-attention: #d29922;
    --color-done: #ab7df8;
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

    html.sb-collapsed #app-sidebar {
        width: var(--sb-width-collapsed);
    }

    html.sb-collapsed #app-content {
        padding-left: var(--sb-width-collapsed);
    }
}

html.sb-collapsed #app-sidebar .sb-label,
html.sb-collapsed #app-sidebar .sb-expanded {
    display: none;
}

html.sb-collapsed #app-sidebar .sb-nav-item {
    justify-content: center;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
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

