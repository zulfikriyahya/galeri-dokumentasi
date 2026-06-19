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

## Direktory: public

### File: `./public/manifest.webmanifest`

```
{
    "name": "DOKUMENTASI ROHIS",
    "short_name": "ROHIS",
    "description": "Dokumentasi kegiatan ROHIS dalam satu tempat.",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#0969da",
    "orientation": "portrait-primary",
    "icons": [
        {
            "src": "/icons/icon-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "/icons/icon-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
        }
    ],
    "screenshots": [
        {
            "src": "/og.png",
            "sizes": "1200x630",
            "type": "image/png",
            "form_factor": "wide"
        }
    ]
}
```

---

### File: `./public/sw.js`

```js
const CACHE_STATIC = "rohis-static-v1";
const CACHE_IMAGES = "rohis-images-v1";

const STATIC_ASSETS = ["/", "/album", "/manifest.webmanifest", "/favicon.svg"];

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
import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

function draw(size) {
    const c = createCanvas(size, size);
    const ctx = c.getContext("2d");
    const r = size * 0.25;

    ctx.fillStyle = "#0969da";
    roundRect(ctx, 0, 0, size, size, size * 0.2);
    ctx.fill();

    const pad = size * 0.14;
    const gap = size * 0.06;
    const half = (size - pad * 2 - gap) / 2;

    const cells = [
        [pad, pad, half, half, 1],
        [pad + half + gap, pad, half, half, 0.7],
        [pad, pad + half + gap, half, half, 0.7],
        [pad + half + gap, pad + half + gap, half, half, 0.5],
    ];

    for (const [x, y, w, h, alpha] of cells) {
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        roundRect(ctx, x, y, w, h, size * 0.06);
        ctx.fill();
    }

    return c.toBuffer("image/png");
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

writeFileSync("public/icons/icon-192.png", draw(192));
writeFileSync("public/icons/icon-512.png", draw(512));
writeFileSync("public/og.png", draw(512));
console.log("Icons generated.");
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
    const p = index % 7;
    if (p === 0) return "sm:col-span-2 sm:row-span-2";
    if (p === 3) return "sm:col-span-2";
    return "";
}

const items = albums.map((album, i) => ({
    album,
    href: "/gallery/" + album.id,
    cover: getAlbumCoverUrl(album),
    span: spanFor(i),
}));
---

<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[160px] sm:auto-rows-[180px]">
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
          decoding="async"
          class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div class="absolute inset-0 flex items-center justify-center bg-[var(--color-canvas-subtle)]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-8 h-8 text-[var(--color-fg-muted)]">
            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <path d="M21 15l-5-5L5 21"></path>
          </svg>
        </div>
      )}
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
      <div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
        <h3 class="font-medium text-sm sm:text-base leading-tight truncate">{item.album.albumName}</h3>
        <span class="text-xs text-white/60 mt-0.5 block">{item.album.assetCount} foto</span>
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

<div class="space-y-3 py-4 overflow-hidden">
  <div class="zigzag-row">
    <div class="zigzag-track zigzag-left">
      {[...rowOne, ...rowOne].map((asset) => (
        <img
          src={getThumbnailUrl(asset.id, "preview")}
          alt={asset.originalFileName}
          loading="lazy"
          decoding="async"
          class="h-28 sm:h-36 w-auto rounded-xl object-cover glossy-card flex-shrink-0"
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
          decoding="async"
          class="h-28 sm:h-36 w-auto rounded-xl object-cover glossy-card flex-shrink-0"
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

<div class="columns-2 sm:columns-3 lg:columns-4 gap-2.5 space-y-2.5" id="photo-grid">
  {images.map((asset, i) => (
    <button
      class="block w-full overflow-hidden rounded-xl break-inside-avoid cursor-zoom-in glossy-card focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
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
        decoding="async"
        class="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
      />
    </button>
  ))}
</div>

<div
  id="lightbox"
  class="fixed inset-0 z-50 hidden"
  role="dialog"
  aria-modal="true"
  aria-label="Lightbox"
>
  <div class="absolute inset-0 bg-black/85 backdrop-blur-md" id="lb-backdrop"></div>

  <button id="lb-close" class="absolute top-4 right-4 z-20 p-2 rounded-full glass text-white/80 hover:text-white transition-colors" aria-label="Tutup">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
      <path d="M18 6 6 18M6 6l12 12"></path>
    </svg>
  </button>

  <button id="lb-prev" class="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full glass text-white/80 hover:text-white transition-colors" aria-label="Sebelumnya">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 sm:w-6 sm:h-6">
      <path d="M15 18l-6-6 6-6"></path>
    </svg>
  </button>

  <div class="absolute inset-0 z-10 flex flex-col items-center justify-center px-14 sm:px-20 gap-4">
    <div class="relative flex items-center justify-center w-full max-h-[78vh]">
      <img
        id="lb-img"
        src=""
        alt=""
        class="max-h-[78vh] max-w-full object-contain rounded-xl shadow-2xl"
        style="opacity:0;transition:opacity 0.2s ease"
      />
    </div>

    <div class="glass rounded-xl px-4 py-3 w-full max-w-xl flex items-center justify-between gap-4">
      <div class="min-w-0 flex-1">
        <p id="lb-name" class="text-white text-sm font-medium truncate"></p>
        <p id="lb-meta" class="text-white/50 text-xs mt-0.5 truncate"></p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <p id="lb-counter" class="text-white/40 text-xs tabular-nums"></p>
        <a
          id="lb-download"
          href="#"
          download
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
            <path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"></path>
          </svg>
          Unduh
        </a>
      </div>
    </div>
  </div>

  <button id="lb-next" class="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full glass text-white/80 hover:text-white transition-colors" aria-label="Berikutnya">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 sm:w-6 sm:h-6">
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
  const backdrop = document.getElementById("lb-backdrop")!;

  const buttons  = Array.from(document.querySelectorAll<HTMLButtonElement>("#photo-grid button"));
  let current    = 0;

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
    lbImg.src = btn.dataset.src!;
    lbImg.alt = btn.dataset.name!;
    lbImg.onload = () => { lbImg.style.opacity = "1"; };
    lbName.textContent = btn.dataset.name!;
    lbMeta.textContent = [btn.dataset.date, btn.dataset.location].filter(Boolean).join(" · ");
    lbDl.href     = btn.dataset.download!;
    lbDl.download = btn.dataset.name!;
    lbCtr.textContent = `${current + 1} / ${buttons.length}`;
    btnPrev.style.visibility = current === 0 ? "hidden" : "visible";
    btnNext.style.visibility = current === buttons.length - 1 ? "hidden" : "visible";

    if (current + 1 < buttons.length) {
      const pre = new Image();
      pre.src = buttons[current + 1].dataset.src!;
    }
  }

  buttons.forEach((btn, i) => btn.addEventListener("click", () => open(i)));
  btnPrev.addEventListener("click", () => { if (current > 0) { current--; render(); } });
  btnNext.addEventListener("click", () => { if (current < buttons.length - 1) { current++; render(); } });
  btnClose.addEventListener("click", close);
  backdrop.addEventListener("click", close);

  let startX = 0;
  lb.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) < 40) return;
    if (dx < 0 && current < buttons.length - 1) { current++; render(); }
    if (dx > 0 && current > 0)                  { current--; render(); }
  });

  document.addEventListener("keydown", (e) => {
    if (lb.classList.contains("hidden")) return;
    if (e.key === "Escape")     close();
    if (e.key === "ArrowLeft"  && current > 0)                  { current--; render(); }
    if (e.key === "ArrowRight" && current < buttons.length - 1) { current++; render(); }
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

<aside class="lg:w-64 lg:shrink-0 lg:border-r lg:border-[var(--color-border)] lg:h-screen lg:sticky lg:top-0 lg:overflow-y-auto lg:flex lg:flex-col glass">
  <div class="hidden lg:flex items-center px-5 py-5 border-b border-[var(--glass-border)] shrink-0">
    <a href="/" class="font-semibold tracking-tight text-[var(--color-fg)] text-base">DOKUMENTASI ROHIS</a>
  </div>

  <details class="lg:hidden border-b border-[var(--color-border)]">
    <summary class="px-4 py-3 cursor-pointer font-medium select-none text-sm">Album</summary>
    <nav class="px-3 pb-4 space-y-4">
      {groups.map((group) => (
        <div>
          <p class="px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-fg-muted)] mb-1.5">{group.year}</p>
          <ul class="space-y-0.5">
            {group.albums.map((album) => (
              <li>
                <a
                  href={`/gallery/${album.id}`}
                  class:list={[
                    "block px-2 py-1.5 rounded-lg text-sm truncate transition-colors",
                    activeId === album.id
                      ? "bg-[var(--color-accent)] text-white font-medium"
                      : "text-[var(--color-fg)] hover:bg-[var(--color-canvas-subtle)]",
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

  <nav class="hidden lg:block flex-1 px-3 py-4 space-y-5 overflow-y-auto">
    {groups.map((group) => (
      <div>
        <p class="px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-fg-muted)] mb-1.5">{group.year}</p>
        <ul class="space-y-0.5">
          {group.albums.map((album) => (
            <li>
              <a
                href={`/gallery/${album.id}`}
                class:list={[
                  "block px-2 py-1.5 rounded-lg text-sm truncate transition-colors",
                  activeId === album.id
                    ? "bg-[var(--color-accent)] text-white font-medium"
                    : "text-[var(--color-fg)] hover:bg-[var(--color-canvas-subtle)]",
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
</aside>
```

---

### File: `./src/layouts/Layout.astro`

```astro
---
import "../styles/global.css";

interface Props {
    title?: string;
    description?: string;
}

const { title = "DOKUMENTASI ROHIS", description = "Dokumentasi kegiatan ROHIS dalam satu tempat." } = Astro.props;
const ogImage = "/og.png";
---

<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <meta name="theme-color" content="#0969da" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0d1117" media="(prefers-color-scheme: dark)" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImage} />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="DOKUMENTASI ROHIS" />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" href="/favicon.ico" />
    <title>{title}</title>
    <script is:inline>
      const stored = localStorage.getItem("theme");
      const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", (stored ?? (prefersDark ? "dark" : "light")) === "dark");
    </script>
  </head>
  <body class="bg-[var(--color-canvas)] text-[var(--color-fg)] min-h-screen">

    <div class="lg:flex">
      <slot name="sidebar" />
      <div class="flex-1 min-w-0 flex flex-col">
        <header class="glass sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[var(--glass-border)]">
          <a href="/" class="font-semibold tracking-tight text-[var(--color-fg)]">DOKUMENTASI ROHIS</a>
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
        <main class="flex-1">
          <slot />
        </main>

        <footer class="px-6 py-4 text-center text-xs text-[var(--color-fg-muted)] border-t border-[var(--color-border)]">
          <p>
            &copy; {new Date().getFullYear()} ROHIS SMKN 1 PANDEGLANG
          </p>
          <p class="mt-1 opacity-75">
            Powered by{" "}
            <a
              href="https://zedlabs.id"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-[var(--color-accent)] hover:underline"
            >
              ZEDLABS TEKNOLOGI INDONESIA
            </a>
          </p>
        </footer>

      </div>
    </div>

    <div
      id="install-banner"
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm glass rounded-2xl px-5 py-4 shadow-xl border border-[var(--glass-border)] hidden"
    >
      <p class="text-sm font-medium text-[var(--color-fg)] mb-3">Install DOKUMENTASI ROHIS ke layar utama?</p>
      <div class="flex gap-2">
        <button id="install-btn" class="flex-1 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity">Install</button>
        <button id="install-dismiss" class="flex-1 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-fg-muted)] hover:bg-[var(--color-canvas-subtle)] transition-colors">Nanti</button>
      </div>
    </div>

    <script is:inline>
      document.getElementById("theme-toggle").addEventListener("click", () => {
        const isDark = document.documentElement.classList.toggle("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
      });

      let deferredPrompt;
      const banner   = document.getElementById("install-banner");
      const btnInst  = document.getElementById("install-btn");
      const btnDism  = document.getElementById("install-dismiss");

      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (!localStorage.getItem("pwa-dismissed")) {
          banner.classList.remove("hidden");
          requestAnimationFrame(() => banner.classList.add("show"));
        }
      });

      btnInst && btnInst.addEventListener("click", async () => {
        banner.classList.remove("show");
        setTimeout(() => banner.classList.add("hidden"), 350);
        if (deferredPrompt) {
          deferredPrompt.prompt();
          await deferredPrompt.userChoice;
          deferredPrompt = null;
        }
      });

      btnDism && btnDism.addEventListener("click", () => {
        banner.classList.remove("show");
        setTimeout(() => banner.classList.add("hidden"), 350);
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
    return `/api/img?id=${assetId}&size=${size}`;
}

export function getDownloadUrl(assetId: string): string {
    return `/api/img?id=${assetId}&type=original`;
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

    const results = await Promise.all(
        sorted.slice(0, 6).map((a) => getAlbumById(a.id))
    );

    return results
        .flatMap((d) => d.assets.filter((a) => a.type === "IMAGE"))
        .slice(0, limit);
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

### File: `./src/pages/album/index.astro`

```astro
---
import Layout from "../../layouts/Layout.astro";
import Sidebar from "../../components/Sidebar.astro";
import AlbumGrid from "../../components/AlbumGrid.astro";
import { getAllAlbums } from "../../lib/immich";

const albums = await getAllAlbums();
---

<Layout title="Album - DOKUMENTASI ROHIS">
  <Sidebar slot="sidebar" albums={albums} />

  <section class="px-4 sm:px-8 py-10">
    <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight mb-6">Semua Album</h1>
    <AlbumGrid albums={albums} />
  </section>
</Layout>
```

---

### File: `./src/pages/album/[albumId].astro`

```astro
---
export const prerender = false;

import { getAllAlbums, getAlbumById, getAlbumShareUrl } from "../../lib/immich";
import Lightbox from "../../components/Lightbox.astro";
import Layout from "../../layouts/Layout.astro";
import Sidebar from "../../components/Sidebar.astro";

const { albumId } = Astro.params;

if (!albumId) return Astro.redirect("/gallery");

let album, albums;
try {
    [album, albums] = await Promise.all([
        getAlbumById(albumId),
        getAllAlbums(),
    ]);
} catch {
    return Astro.redirect("/gallery");
}
---

<Layout title={`${album.albumName} - DOKUMENTASI ROHIS`}>
  <Sidebar slot="sidebar" albums={albums} activeId={album.id} />

  <div class="px-4 sm:px-6 py-10">
    <a
      href="/gallery"
      class="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors mb-6"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
        <path d="M15 18l-6-6 6-6"></path>
      </svg>
      Kembali ke Album
    </a>

    <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight">{album.albumName}</h1>

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

const [albums, recentAssets] = await Promise.all([
    getAllAlbums(),
    getRecentAssets(24),
]);
---

<Layout title="DOKUMENTASI ROHIS">
  <Sidebar slot="sidebar" albums={albums} />

  <section class="px-4 sm:px-8 pt-10 pb-4">
    <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight mb-1">Semua Kegiatan</h1>
    <p class="text-sm text-[var(--color-fg-muted)]">Dokumentasi kegiatan dalam satu tempat.</p>
  </section>

  {recentAssets.length > 0 && <InfiniteSlider assets={recentAssets} />}

  <section class="px-4 sm:px-8 py-8">
    <h2 class="text-base font-semibold mb-4 text-[var(--color-fg-muted)] uppercase tracking-widest text-xs">Semua Album</h2>
    <AlbumGrid albums={albums} />
  </section>
</Layout>

<script is:inline>
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
  }
</script>
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
    --color-border: #d0d7de;
    --color-fg: #1f2328;
    --color-fg-muted: #656d76;
    --color-accent: #0969da;
    --color-accent-subtle: #ddf4ff;
    --glass-bg: rgba(246, 248, 250, 0.72);
    --glass-border: rgba(208, 215, 222, 0.6);
}

.dark {
    --color-canvas: #0d1117;
    --color-canvas-subtle: #161b22;
    --color-border: #30363d;
    --color-fg: #e6edf3;
    --color-fg-muted: #8b949e;
    --color-accent: #58a6ff;
    --color-accent-subtle: #121d2f;
    --glass-bg: rgba(22, 27, 34, 0.72);
    --glass-border: rgba(48, 54, 61, 0.6);
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
    transition: background-color 0.2s ease, color 0.2s ease;
    -webkit-font-smoothing: antialiased;
}

.glass {
    background: var(--glass-bg);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid var(--glass-border);
}

.glossy-card {
    position: relative;
    background: linear-gradient(135deg,
            color-mix(in srgb, var(--color-canvas-subtle) 92%, transparent),
            color-mix(in srgb, var(--color-canvas) 70%, transparent));
    border: 1px solid var(--color-border);
    box-shadow:
        inset 0 1px 0 0 color-mix(in srgb, white 8%, transparent),
        0 4px 16px -6px rgba(0, 0, 0, 0.18);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.glossy-card:hover {
    box-shadow:
        inset 0 1px 0 0 color-mix(in srgb, white 12%, transparent),
        0 8px 28px -8px rgba(0, 0, 0, 0.28);
}

.zigzag-row {
    width: 100%;
    overflow: hidden;
}

.zigzag-track {
    display: flex;
    gap: 0.75rem;
    width: max-content;
}

.zigzag-left {
    animation: scroll-left 40s linear infinite;
}

.zigzag-right {
    animation: scroll-right 40s linear infinite;
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

.lb-fade-enter {
    animation: lb-in 0.18s ease forwards;
}

@keyframes lb-in {
    from {
        opacity: 0;
        transform: scale(0.97);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

#install-banner {
    transform: translateY(100%);
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

#install-banner.show {
    transform: translateY(0);
}

::-webkit-scrollbar {
    width: 6px;
    height: 6px;
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
```

---

