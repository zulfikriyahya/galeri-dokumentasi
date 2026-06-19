## Permission dari API
- album.read
- asset.read
- asset.view
- asset.download
- sharedLink.read 

---

## Aturan
- Tanpa Komentar dan emoticon
- tema warna : github light & github dark
- Mode : Hybrid (Island Architecture (SSG + SSR))
- Card Glossy
- Bento Grid
- Infinite Slider Zigzag
- Sidebar: Kelompokkan Per-album
- Gambar ketika diklik muncul Lightbox (Diperindah, cepat dan responsive)
- Responsive (Smartphone First) 
- Font Family : Lexend 
- Jadikan Tampilannya Lebih Proporsional, simetris dan Elegan (Perbaiki Menu Pada tampilan Smartphone) (Perlu Implementasi)
- Jadikan PWA dan dapat diinstall (Popup Permintaan Install) 
- Caching data Agar Cepat ketika load gambar 
- Glassmorphism
- Tampilkan hanya Album yang dishare ke publik
- Jangan Pernah Ambil data Album yang mengandung nama "UNGGAH DOKUMENTASI"
- Asset/Berkas Dokumentasi di slider mengambil semua data yang di publish (Publik/Dishare dari API)
- Tambahkan Tombol Bagikan (Ke Facebook dan ke Whatsapp)
- Title dan nama instansi (ROHIS & SMKN 1 PANDEGLANG) pindahkan ke .env agar dinamis untuk project lainnya

## Catatan
- untuk font dan tampilan warna tema saya suka (sudah pas)

## Issue
- Logo dan brand name di tampilan smartphone tidak ada (perbaiki)
- logo dan brand name di tampilan desktop cukup satu di sidebar dan sembunyikan brandname ketika toggle hidden (cukup logo saja yang terlihat)
- ubah svg berikut agar lebih matching tuntuk toggle button dan sembunyikan ketika toggle hidden
```
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
```
- pindahkan daftar pengecualian ke .env `const EXCLUDED_ALBUM_KEYWORDS = ["UNGGAH DOKUMENTASI"];` agar mudah suatu saat untuk perubahannya.

finalkan project ini!
