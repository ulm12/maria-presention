# Setup Google Drive Folder untuk Dokumentasi Absensi

## Langkah 1: Buat Folder di Google Drive

1. Buka https://drive.google.com
2. Klik "Folder Baru" atau icon folder
3. Beri nama: `Maria Presensi - Dokumentasi` (atau nama lain sesuai preferensi)
4. Salin ID folder dari URL:
   - URL folder akan terlihat seperti: `https://drive.google.com/drive/folders/FOLDER_ID_PANJANG`
   - Copy bagian `FOLDER_ID_PANJANG`

## Langkah 2: Share Folder ke Service Account

1. Buka folder yang baru dibuat
2. Klik "Share" di kanan atas
3. Copy email ini dari `service-account.json` (cari field `client_email`):
   ```
   service-account-presensi@chromium1-300007.iam.gserviceaccount.com
   ```
4. Paste ke Share box → beri akses **Editor**
5. Uncheck "Notify people" → Share

## Langkah 3: Konfigurasi Environment Variable

1. Buat/edit file `.env.local` di root project:

   ```bash
   GOOGLE_DRIVE_FOLDER_ID=FOLDER_ID_YANG_SUDAH_DICOPY
   ```

2. Contoh isi `.env.local`:
   ```
   GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
   ```

## Langkah 4: Restart Dev Server

```bash
pnpm dev
# atau
npm run dev
```

## Apa yang Terjadi?

- Saat user klik "Absen Masuk" dengan foto:
  1. Foto di-upload ke folder Google Drive yang ditentukan
  2. File dibuat public (anyone dengan link bisa lihat)
  3. Google Drive shareable link disimpan di sheet (bukan base64)
  4. Dokumentasi bisa di-view via link di Google Sheets

## Verifikasi Berhasil

1. Login & coba Absen Masuk dengan foto
2. Jika berhasil, buka Google Sheets
3. Di kolom "dokumentasi", seharusnya ada URL seperti:
   ```
   https://drive.google.com/uc?export=view&id=XXXX
   ```
4. Klik URL → gambar terbuka di tab baru

## Troubleshooting

- **Error "GOOGLE_DRIVE_FOLDER_ID not configured"**

  - Pastikan `.env.local` memiliki `GOOGLE_DRIVE_FOLDER_ID` yang benar
  - Restart dev server setelah update .env

- **Error "permission denied"**

  - Pastikan service account sudah di-share ke folder Google Drive sebagai Editor

- **Foto tidak muncul / link broken**
  - Verifikasi folder di Drive masih ada
  - Cek izin file di folder tersebut

## Catatan Keamanan

- Link dibuat public (anyone dengan link bisa view), tapi tidak bisa delete/edit
- Jika ingin lebih secure, ubah permission dari "anyone" ke "authenticated user"
- Untuk production, pertimbangkan auto-delete foto lama atau archive ke storage lain
