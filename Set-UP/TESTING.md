# Quick Test Guide for MARIA Presensi

## Manual Testing Steps

### 1. Test Login

```bash
# In PowerShell, test login endpoint
$body = @{
    action = "login"
    id = "2"
    password = "password123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/sheets" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body -UseBasicParsing | Select-Object -ExpandProperty Content
```

### 2. Test History Retrieval

```bash
# Get attendance history for user
Invoke-WebRequest -Uri "http://localhost:3000/api/sheets?userId=2" `
  -Method GET -UseBasicParsing | Select-Object -ExpandProperty Content
```

### 3. Browser Testing

#### Test Login Page

1. Open http://localhost:3000/login in browser
2. Try login with invalid credentials (should show error)
3. Login with valid credentials (id: 2, password: password123)
4. Should redirect to dashboard

#### Test Dashboard

1. After login, you'll be on dashboard
2. Navigate to "Absensi" tab
3. Test check-in:
   - Click "Ambil Foto" to capture image
   - Allow camera access when prompted
   - Allow location access when prompted
   - Image will auto-compress if >45KB
   - Click "Absensi Masuk"
   - Should see "Absensi masuk berhasil! ✓"
4. Test check-out (if checked in earlier):
   - Click "Absensi Pulang"
   - Should see "Absensi pulang berhasil! ✓"
5. View attendance history:
   - Click "Riwayat" tab
   - Should see list of attendance records with compressed images

### 4. Image Compression Verification

#### Check Console Logs

1. Open browser DevTools (F12)
2. Go to Console tab
3. During check-in, look for messages like:
   ```
   Image too large (450KB), compressing...
   Compressed to 45KB, size: 42000 characters
   ```
4. This confirms compression is working

#### Test Different Image Sizes

- Small photo (< 40KB): Should skip compression
- Large photo (> 45KB): Should compress automatically
- Extra large photo (> 100KB): Should compress aggressively

### 5. Server-Side Verification

#### Watch Terminal Logs

During dev server (`npm run dev`), watch for:

- ✅ `200` responses = success
- ❌ `400` responses = client error (bad request)
- ❌ `500` responses = server error (check logs for details)

#### Check for Errors

Look for error messages like:

- "input contains more than 50000 characters" = image not compressed enough
- "user not found" = invalid credentials
- "Authorization failed" = auth token issue

---

## Troubleshooting

### Image Still Too Large

**Symptom**: "input contains more than 50000 characters in a single cell" error

**Solution**:

1. Edit `/lib/image-compression.ts`
2. Reduce `targetLimitCharacters` from 45000 to 40000
3. Or reduce starting quality from 0.8 to 0.7
4. Restart dev server

### Location Not Capturing

**Symptom**: "Lokasi tidak diketahui" message

**Issues**:

- Browser doesn't have geolocation permission
- Device GPS taking too long (timeout set to 30s)
- Nominatim API rate-limited/blocked

**Solution**:

1. Check browser geolocation permission
2. Wait longer (up to 30s) for GPS
3. Check browser console for reverse geocoding errors

### Image Doesn't Display in History

**Symptom**: Attendance records show but no image

**Causes**:

- Image data not saved correctly
- Base64 corrupted during compression

**Debugging**:

1. Check browser DevTools Storage → IndexedDB (if using cache)
2. Verify image base64 length in Google Sheets cell
3. Check server logs for save errors

---

## Expected Behavior

### Successful Check-In Flow

1. User clicks "Ambil Foto"
2. Camera opens, user takes photo
3. Photo displays in preview
4. User clicks "Absensi Masuk"
5. System shows:
   - "Memproses dan mengompres foto..." (2-3 sec)
   - "Mendapatkan lokasi..." (1-30 sec depending on GPS)
   - "Menyimpan absensi masuk..." (2-3 sec)
   - "Absensi masuk berhasil! ✓" (success message)
6. Button changes to "Absensi Pulang" (if not already checked out)

### Successful History Retrieval

1. User clicks "Riwayat" tab
2. Page loads attendance records
3. Each record shows:
   - Date, day, time
   - Location (with reverse geocoding)
   - Compressed photo thumbnail

---

## Performance Metrics to Observe

| Operation                      | Expected Time                |
| ------------------------------ | ---------------------------- |
| Image compression (2MB → 40KB) | 2-3 seconds                  |
| Geolocation capture            | 1-30 seconds (GPS dependent) |
| Sheet write (check-in/out)     | 2-3 seconds                  |
| History retrieval (10 records) | 1-2 seconds                  |
| **Total check-in flow**        | **5-40 seconds**             |

---

## Debug URLs

**API Endpoints** (test with curl/PowerShell):

- `GET http://localhost:3000/api/sheets?userId=2` - Get history
- `POST http://localhost:3000/api/sheets` - Login/check-in/check-out (requires JSON body)
- `POST http://localhost:3000/api/upload-image` - Image processing

**Pages**:

- http://localhost:3000 - Home
- http://localhost:3000/login - Login page
- http://localhost:3000/dashboard - Attendance dashboard

---

## Log Files Location

- **Dev server logs**: Terminal running `npm run dev`
- **Browser logs**: DevTools Console (F12)
- **Network requests**: DevTools Network tab
- **Errors**: Check both terminal and console

---

Last updated: After image compression implementation
Status: Ready for end-to-end testing
