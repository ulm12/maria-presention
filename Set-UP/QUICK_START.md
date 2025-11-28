# MARIA Presensi - Quick Start Checklist

## ✅ What's Been Done

### Phase 1: Build & Architecture ✅

- [x] Fixed ES Modules configuration
- [x] Set up Turbopack compatibility
- [x] Created server-side API routes with `runtime = "nodejs"`
- [x] Removed all server imports from client components
- [x] Configured environment variables

### Phase 2: Authentication ✅

- [x] Implemented JWT authentication with Google Service Account
- [x] Created login endpoint that validates credentials against LOGIN sheet
- [x] Set up session management in React context
- [x] Stored user session in localStorage

### Phase 3: Attendance System ✅

- [x] Implemented check-in endpoint (records photo, location, time)
- [x] Implemented check-out endpoint (records departure time)
- [x] Implemented attendance history retrieval
- [x] Created delete endpoint for record removal
- [x] Set up proper error handling and logging

### Phase 4: Image Handling ✅

- [x] Created image compression utility library
- [x] Implemented automatic compression to <45KB
- [x] Handles images up to 3MB+ with auto-fallback
- [x] Maintains readable quality (60% JPEG)
- [x] Returns compressed image from upload function

### Phase 5: Location Capture ✅

- [x] Implemented geolocation API integration
- [x] Added permission checks
- [x] Increased timeout to 30 seconds
- [x] Added reverse geocoding via Nominatim
- [x] Fallback handling for unavailable location

### Phase 6: UI Components ✅

- [x] Created camera capture interface
- [x] Implemented check-in/check-out buttons
- [x] Created attendance history display
- [x] Added loading states and error messages
- [x] Responsive mobile design

---

## 🚀 How to Use

### Start Dev Server

```powershell
cd "e:\Works\KAI\MARIA\maria_presensi"
npm run dev
```

Then open: http://localhost:3000

### Login

- ID: `2`
- Password: `password123`
  (Or any valid credentials from LOGIN sheet in Google Sheets)

### Check-in

1. Navigate to Dashboard → Absensi tab
2. Click "Ambil Foto" to take photo
3. Click "Absensi Masuk"
4. System will:
   - Compress photo automatically
   - Get your location
   - Save to Google Sheets
   - Show success message

### Check-out

1. After check-in, click "Absensi Pulang"
2. System records departure time

### View History

1. Click "Riwayat" tab
2. See all your attendance records with photos

---
 
## 📁 Key Files to Know

| File                                 | Purpose            | Status        |
| ------------------------------------ | ------------------ | ------------- |
| `/app/api/sheets/route.ts`           | Main API handler   | ✅ Complete   |
| `/app/api/upload-image/route.ts`     | Image processing   | ✅ Complete   |
| `/components/attendance-button.tsx`  | Check-in/out UI    | ✅ Complete   |
| `/components/attendance-history.tsx` | History display    | ✅ Complete   |
| `/lib/image-compression.ts`          | Image compression  | ✅ Complete   |
| `/lib/geolocation.ts`                | Location capture   | ✅ Complete   |
| `/contexts/auth-context.tsx`         | Auth state         | ✅ Complete   |
| `.env.local`                         | Environment config | ✅ Configured |
| `service-account.json`               | Google credentials | ✅ Present    |

---

## 🧪 Quick Tests

### Test 1: Check API is Running

```powershell
# In PowerShell, should return 200 + JSON
Invoke-WebRequest -Uri "http://localhost:3000/api/sheets?userId=2" `
  -Method GET -UseBasicParsing | Select-Object StatusCode
```

### Test 2: Check Login Works

```powershell
$body = @{
    action = "login"
    id = "2"
    password = "password123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/sheets" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body -UseBasicParsing | Select-Object StatusCode
```

### Test 3: Check History Retrieval

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/sheets?userId=2" `
  -Method GET -UseBasicParsing | Select-Object StatusCode
```

All should return Status Code: `200`

---

## 🎯 What to Test in Browser

### Critical Path

1. [ ] Go to http://localhost:3000/login
2. [ ] Enter credentials (id: 2, password: password123)
3. [ ] Click login
4. [ ] Should redirect to dashboard
5. [ ] Click "Absensi" tab
6. [ ] Click "Ambil Foto" → Allow camera
7. [ ] Click "Absensi Masuk" → Should succeed
8. [ ] Click "Absensi Pulang" → Should succeed
9. [ ] Click "Riwayat" tab → Should show records

### Image Compression Verification

1. [ ] Open DevTools Console (F12)
2. [ ] Do check-in with large photo (>2MB)
3. [ ] Look for messages:
   - "Image too large (XXX KB), compressing..."
   - "Compressed to XX KB, size: XXXXX characters"
4. [ ] Confirm image was saved (view in history)

### Location Capture

1. [ ] During check-in, allow location access
2. [ ] In history, location should show (e.g., "Jakarta, Indonesia")
3. [ ] Latitude/longitude should be recorded

---

## ⚠️ Common Issues & Quick Fixes

### Issue: "Can't find localhost:3000"

**Fix**: Make sure dev server is running

```powershell
cd "e:\Works\KAI\MARIA\maria_presensi"
npm run dev
```

### Issue: API returns 500 error

**Fix**: Check terminal for error details

- Usually auth-related
- Verify service-account.json exists
- Check `.env.local` for GOOGLE_DRIVE_FOLDER_ID

### Issue: "Input contains more than 50000 characters"

**Fix**: Image not compressed enough

- Already handled automatically
- If still occurs, edit `/lib/image-compression.ts`
- Reduce `targetLimitCharacters` from 45000 to 40000

### Issue: Login fails

**Fix**: Verify credentials

- Check ID and password in Google Sheets LOGIN sheet
- Ensure formatting matches exactly
- Check terminal for auth error details

### Issue: Camera not working

**Fix**: Allow permissions

- Browser may need permission (check address bar)
- Some environments block camera access

### Issue: Location shows "Lokasi tidak diketahui"

**Fix**: This is normal sometimes

- GPS takes time (up to 30 seconds)
- Nominatim API may be rate-limited
- Latitude/longitude coordinates still saved

---

## 📊 Performance Expectations

| Action                  | Expected Time            |
| ----------------------- | ------------------------ |
| Page load               | <2 sec                   |
| Login                   | 1-2 sec                  |
| Image compression       | 2-3 sec                  |
| Location capture        | 1-30 sec (GPS dependent) |
| Check-in save           | 2-3 sec                  |
| History load            | 1-2 sec                  |
| **Total check-in flow** | **5-40 sec**             |

---

## 🔍 Where to Look for Errors

### Browser DevTools (F12)

- **Console**: Client-side errors and logs
- **Network**: API request status and responses
- **Application**: LocalStorage (user session data)

### Terminal (Dev Server Output)

- Shows HTTP status codes (200, 400, 500)
- Shows API response times
- Shows any server-side errors

### Google Sheets

- Check PRESENSI sheet for saved records
- Verify columns: id, nama, tanggal, jam_masuk, dokumentasi
- Verify image is stored in dokumentasi column

---

## 💡 Pro Tips

1. **Check-in without camera?**

   - Image capture is required for check-in
   - But location will fallback if GPS fails

2. **Multiple check-ins same day?**

   - Only one check-in per day allowed
   - Must check-out first, then can check-in again next day

3. **View raw image data?**

   - Open Google Sheets → PRESENSI sheet
   - Click dokumentasi cell → See base64 data
   - First 100 characters show: `data:image/jpeg;base64,/9j/4AAQ...`

4. **Debug image size?**
   - Open DevTools Console
   - Run: `localStorage.getItem('lastImageBase64')?.length`
   - Should be <50000 characters

---

## 📞 Need Help?

### Check These Docs

1. **For implementation details**: See `IMPLEMENTATION.md`
2. **For testing guide**: See `TESTING.md`
3. **For progress tracking**: See `PROGRESS.md`

### Terminal Command Reference

```powershell
# Start dev server
npm run dev

# Stop dev server (if hung)
Stop-Process -Name node -Force

# Check npm version
npm -v

# Reinstall dependencies
npm install

# Clear cache and restart
Remove-Item -Path .\.next -Force -Recurse
npm run dev
```

---

## ✨ You're All Set!

Everything is configured and ready to test. Just:

1. Run `npm run dev`
2. Open http://localhost:3000
3. Login and test the attendance flow

If something doesn't work, check the error in browser console or terminal, then refer to the troubleshooting section above.

**Happy testing! 🎉**

---

**Status**: ✅ System Ready for Production Testing
**Last Updated**: November 26, 2025
**Dev Server**: http://localhost:3000
