# Galeri Dokumentasi

Aplikasi galeri dokumentasi kegiatan berbasis Astro yang mengambil data album dan foto dari Immich melalui API, ditampilkan dalam bentuk situs publik dengan dukungan PWA, SEO, dan caching gambar.

## Stack Teknis

- Framework: Astro 6 (mode `server`, adapter `@astrojs/node` standalone)
- Styling: Tailwind CSS v4 (via plugin Vite)
- Image processing: sharp (generate icon PWA)
- Runtime: Node.js >= 22.12.0
- Package manager: pnpm
- Process manager produksi: PM2
- Reverse proxy: Nginx
- Sumber data: Immich API (self-hosted)

## Struktur Direktori

```
.
├── nginx/                  Template konfigurasi Nginx
├── public/                 Aset statis, service worker
├── scripts/
│   ├── deploy.sh            Script deploy interaktif (provisioning + build + PM2)
│   └── gen-icon.mjs         Generate icon PWA dari favicon.svg
├── src/
│   ├── components/          Komponen Astro (UI)
│   ├── layouts/              Layout.astro
│   ├── lib/                   immich.ts (wrapper API Immich)
│   ├── pages/                Routing
│   │   ├── api/img.ts          Proxy + cache gambar
│   │   ├── albums/             Daftar album & detail album
│   │   ├── index.astro         Beranda
│   │   ├── robots.txt.ts
│   │   ├── sitemap.xml.ts
│   │   └── manifest.webmanifest.ts
│   ├── styles/global.css     Tema warna, utilitas CSS kustom
│   └── env.d.ts              Tipe environment variable
├── ecosystem.config.cjs     Konfigurasi PM2
├── astro.config.mjs
└── .env
```

## Environment Variables

Seluruh konfigurasi yang berubah antar-instansi/klien diletakkan di `.env`, tidak ada yang di-hardcode di kode.

| Variabel | Keterangan |
|---|---|
| `IMMICH_BASE_URL` | URL base instance Immich |
| `IMMICH_API_KEY` | API key Immich dengan permission yang dibutuhkan |
| `SITE_NAME` | Nama lengkap situs, dipakai di title & meta |
| `SITE_SHORT_NAME` | Nama pendek, dipakai di header mobile & manifest PWA |
| `SITE_DESCRIPTION` | Deskripsi situs untuk meta description & OG |
| `ORG_NAME` | Nama organisasi pemilik situs |
| `SCHOOL_NAME` | Nama instansi/sekolah |
| `POWERED_BY` | Nama pihak pengembang/penyedia jasa di footer |
| `POWERED_BY_URL` | URL terkait `POWERED_BY` |
| `EXCLUDED_ALBUM_KEYWORDS` | Daftar kata kunci (pisah koma) untuk menyaring album yang tidak ditampilkan |
| `SOCIAL_INSTAGRAM_URL` | URL Instagram, kosongkan untuk menyembunyikan ikon |
| `SOCIAL_YOUTUBE_URL` | URL YouTube, kosongkan untuk menyembunyikan ikon |
| `UPLOAD_URL` | URL tujuan tombol unggah foto, kosongkan untuk menyembunyikan ikon |
| `SITE_URL` | URL absolut situs produksi, dipakai untuk canonical, sitemap, OG |
| `DEVELOPER_NAME` | Nama pengembang, masuk ke metadata terstruktur |
| `DEVELOPER_ROLE` | Jabatan/peran pengembang |
| `DEVELOPER_URL` | URL profil pengembang (GitHub/portofolio) |
| `DEVELOPER_INSTAGRAM_URL` | URL Instagram pengembang, opsional |
| `DEVELOPER_LINKEDIN_URL` | URL LinkedIn pengembang, opsional |

Permission API key Immich yang dibutuhkan:

- `album.read`
- `asset.read`
- `asset.view`
- `asset.download`
- `sharedLink.read`

## Integrasi Immich (`src/lib/immich.ts`)

Seluruh komunikasi dengan Immich terpusat di file ini.

- `getAllAlbums()` — mengambil album dengan `shared=true`, menyaring yang mengandung kata kunci `EXCLUDED_ALBUM_KEYWORDS`, lalu mengurutkan secara alfabetis (`localeCompare` dengan `numeric: true`) agar urutan angka di nama album rapi secara natural.
- `getAlbumById(albumId)` — detail album beserta seluruh asset di dalamnya.
- `isExcludedAlbum(album)` — pengecekan keyword exclude, case-insensitive.
- `getThumbnailUrl(assetId, size)` — menghasilkan URL internal `/api/img` (bukan URL Immich langsung), size `"thumbnail"` atau `"preview"`.
- `getDownloadUrl(assetId)` — URL internal `/api/img` dengan `type=original` untuk unduhan resolusi asli.
- `getAlbumCoverUrl(album)` — thumbnail cover album, `null` jika album tidak punya `albumThumbnailAssetId`.
- `getRecentAssets(limit)` — mengambil seluruh album, urutkan berdasarkan `updatedAt` terbaru, flatten seluruh asset bertipe `IMAGE`, dipotong sesuai limit. Dipakai oleh slider di beranda.
- `groupAlbumsByYear(albums)` — mengelompokkan album berdasarkan tahun `createdAt`, diurutkan tahun terbaru ke terlama. Dipakai oleh sidebar.

API key tidak pernah dikirim ke client. Setiap request ke Immich (termasuk pengambilan bytes gambar) berjalan di server lewat endpoint `/api/img`, sehingga `IMMICH_API_KEY` tidak pernah terekspos ke browser.

## Endpoint Internal

### `GET /api/img`

Proxy gambar dari Immich ke client.

Query parameter:
- `id` — wajib, asset ID
- `size` — `thumbnail` (default) atau `preview`, dipakai jika `type` bukan `original`
- `type` — `thumbnail` (default) atau `original`

Response di-set header `Cache-Control: public, max-age=31536000, immutable`, sehingga browser dan CDN/Nginx bisa menyimpan cache jangka panjang tanpa perlu request ulang ke Immich setiap saat.

### `GET /sitemap.xml`

Di-generate dinamis (`prerender = false`) setiap kali diakses, langsung memanggil `getAllAlbums()`. Tidak butuh rebuild saat ada album baru di Immich. Berisi:
- URL statis (`/`, `/albums`)
- URL setiap album publik beserta `lastmod`
- Image sitemap extension (`image:image`) berisi cover album

Seluruh nilai yang masuk ke XML di-escape (`&`, `<`, `>`, `"`, `'`) untuk mencegah XML invalid, termasuk URL gambar yang mengandung query string `&`.

### `GET /robots.txt`

Statis (`prerender = true`), mereferensikan `sitemap.xml` berdasarkan `SITE_URL`.

### `GET /manifest.webmanifest`

Manifest PWA, statis, berisi nama, ikon, dan screenshot yang sumbernya dari `SITE_NAME`/`SITE_SHORT_NAME`/`SITE_DESCRIPTION`.

## Halaman

### `/` (Beranda)

Menampilkan ringkasan statistik (jumlah album, jumlah foto), infinite slider foto terbaru, dan grid seluruh album publik.

### `/albums`

Grid seluruh album publik dalam tata letak bento grid.

### `/albums/[albumId]`

Detail album: header info (jumlah foto, tanggal), tombol bagikan (WhatsApp, Facebook, salin tautan), dan grid foto dalam layout masonry yang dapat dibuka sebagai lightbox.

Jika album tidak ditemukan, tidak `shared`, atau termasuk excluded keyword, redirect ke `/albums`.

Halaman ini `prerender = false` karena bergantung pada parameter dinamis dan data live dari Immich.

## Komponen

### `Sidebar.astro`

Navigasi utama desktop (`lg` ke atas). Menampilkan daftar album dikelompokkan per tahun (`groupAlbumsByYear`). Dapat di-collapse, status collapse disimpan di `localStorage` (`sb-collapsed`) agar persisten antar-sesi.

### `AlbumGrid.astro`

Grid album dengan pola bento (variasi `col-span`/`row-span` berdasarkan index modulo 9), menampilkan cover, nama album, jumlah foto, dan badge "Publik" jika album berstatus shared.

### `InfiniteSlider.astro`

Dua baris marquee berjalan berlawanan arah (CSS `@keyframes`, dihormati `prefers-reduced-motion`). Setiap gambar adalah `<button>` dengan data atribut (`data-src`, `data-download`, `data-name`, `data-meta`), klik membuka lightbox internal komponen ini (terpisah dari `Lightbox.astro`) lengkap dengan tombol unduh.

Penanganan khusus mobile: animasi di-pause via event `pointerdown` dan dilanjutkan via `pointerup`/`pointercancel`/`pointerleave`. Ini mencegah mismatch target klik pada touch device, karena `click` event di touch browser di-resolve berdasarkan posisi elemen saat `touchend`, sementara gambar terus bergerak akibat animasi marquee.

### `Lightbox.astro`

Digunakan di halaman detail album. Grid foto masonry (`columns-2/3/4`), klik membuka overlay fullscreen dengan navigasi prev/next, dukungan keyboard (`Escape`, `ArrowLeft`, `ArrowRight`), swipe touch, preload gambar berikutnya, serta tombol unduh dan info nama/tanggal/lokasi (dari EXIF jika tersedia).

### `Layout.astro`

Kerangka HTML utama. Berisi:
- Toggle tema dark/light, disimpan di `localStorage` (`theme`), default mengikuti `prefers-color-scheme`
- Header dengan ikon sosial (Instagram, YouTube, tombol unggah, GitHub) yang dirender kondisional berdasarkan environment variable — kosongkan env terkait untuk menyembunyikan ikon
- Bottom navigation untuk mobile
- Banner instalasi PWA (`beforeinstallprompt`), dismissable dan status dismiss disimpan di `localStorage` (`pwa-dismissed`)
- Meta tag SEO: canonical, Open Graph, Twitter Card, `meta[name="author"]`
- JSON-LD `WebSite` dengan `creator`/`author` berisi schema `Person` (nama, jabatan, afiliasi instansi, profil sosial pengembang) — seluruhnya tidak dirender ke tampilan, hanya untuk konsumsi mesin pencari

## Tema dan Styling

Variabel warna didefinisikan di `src/styles/global.css` mengikuti palet GitHub (light dan dark), menggunakan custom property CSS dan `@custom-variant dark`. Font: Lexend, dimuat dari Google Fonts.

Kelas utilitas kustom: `.glass` (glassmorphism), `.glossy-card` (efek kartu dengan gradient overlay tipis), `.zigzag-track`/`.zigzag-left`/`.zigzag-right` (animasi marquee).

## PWA

- `public/sw.js` — service worker dengan dua strategi cache: cache-first untuk gambar (`/api/img`), network-first dengan fallback cache untuk dokumen/script/style.
- Manifest di-generate dari `manifest.webmanifest.ts`.
- Icon PWA (`icon-192.png`, `icon-512.png`, `og.png`) dihasilkan dari `public/favicon.svg` melalui `scripts/gen-icon.mjs`, dijalankan otomatis saat proses deploy.

## Build dan Jalankan Lokal

```
pnpm install
pnpm dev
```

Build produksi:

```
node scripts/gen-icon.mjs
pnpm build
pnpm preview
```

## Deploy Produksi

`scripts/deploy.sh` adalah script interaktif yang menjalankan seluruh proses provisioning server hingga aplikasi berjalan:

1. Input konfigurasi (nama aplikasi, repo, branch, port, seluruh isi `.env`, domain, opsi SSL)
2. Install dependency sistem jika belum ada: Nginx, Node.js 26, pnpm, pm2, Certbot (jika SSL diaktifkan)
3. Clone atau pull repository
4. Generate `.env` dan `ecosystem.config.cjs` dari input
5. Generate konfigurasi Nginx dan reload
6. Pasang SSL via Certbot jika dipilih
7. Install dependency, generate icon, build aplikasi
8. Jalankan/restart aplikasi via PM2, simpan state PM2

Konfigurasi PM2 (`ecosystem.config.cjs`): satu instance, `autorestart` aktif, `max_memory_restart` 512MB.

Konfigurasi Nginx (`nginx/config.nginx`): redirect HTTP ke HTTPS, gzip untuk teks/JSON/SVG, proxy ke port aplikasi, cache header berbeda untuk aset gambar/font (30 hari) dan aset CSS/JS (1 tahun, immutable).

## Aturan Bisnis Penting

- Hanya album dengan status `shared: true` di Immich yang ditampilkan.
- Album dengan nama yang mengandung salah satu kata kunci di `EXCLUDED_ALBUM_KEYWORDS` tidak akan pernah muncul di manapun (grid, sidebar, sitemap), termasuk diakses langsung lewat URL — akan redirect ke `/albums`.
- Seluruh teks identitas (nama situs, nama instansi, nama organisasi) sepenuhnya dikendalikan lewat `.env`, tidak ada yang di-hardcode, agar codebase yang sama dapat dipakai ulang untuk instansi lain.