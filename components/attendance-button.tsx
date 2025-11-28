"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentLocation, type LocationData } from "@/lib/geolocation";
import {
  compressImageToFitLimit,
  getBase64SizeKB,
  isImageWithinLimit,
} from "@/lib/image-compression";

// Upload image processing - compress to fit Google Sheets cell limit
// Target: keep base64 under 45K characters (50K cell limit minus buffer)
async function uploadImageToDrive(
  imageBase64: string,
  fileName: string
): Promise<{ success: boolean; message?: string; compressedImage?: string }> {
  let processedImage = imageBase64;

  // Check and compress if needed
  if (!isImageWithinLimit(processedImage, 45000)) {
    console.log(
      `Image too large (${getBase64SizeKB(processedImage)}KB), compressing...`
    );
    processedImage = await compressImageToFitLimit(imageBase64, 45000);
    console.log(
      `Compressed to ${getBase64SizeKB(processedImage)}KB, size: ${
        processedImage.length
      } characters`
    );
  }

  const res = await fetch("/api/upload-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64: processedImage,
      fileName,
    }),
  });
  const result = await res.json();

  // Return both success and the processed compressed image
  return {
    success: result.success,
    message: result.message,
    compressedImage: processedImage,
  };
}

// Client-side wrappers that call the server API at /api/sheets
async function submitCheckIn(payload: Record<string, any>) {
  const res = await fetch("/api/sheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "checkin", payload }),
  });
  return res.json();
}

async function submitCheckOut(
  userId: string,
  tanggal: string,
  jam_pulang: string
) {
  const res = await fetch("/api/sheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "checkout",
      payload: { userId, tanggal, jam_pulang },
    }),
  });
  return res.json();
}

async function hasCheckedInToday(userId: string, tanggal: string) {
  const res = await fetch(`/api/sheets?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) return false;
  const rows = await res.json();
  return rows.some((r: any) => r.tanggal === tanggal && r.jam_masuk);
}

async function canCheckOutToday(userId: string, tanggal: string) {
  const res = await fetch(`/api/sheets?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) return false;
  const rows = await res.json();
  // can check out if there exists a row for today with jam_masuk and no jam_pulang
  return rows.some(
    (r: any) => r.tanggal === tanggal && r.jam_masuk && !r.jam_pulang
  );
}
import { CameraCapture } from "@/components/camera-capture";
import {
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
  Navigation,
  Camera,
} from "lucide-react";

interface AttendanceButtonProps {
  user: {
    id: string;
    nip: string;
    nama: string;
  };
  onSuccess: () => void;
}

export function AttendanceButton({ user, onSuccess }: AttendanceButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState<LocationData | null>(null);

  const [pekerjaan, setPekerjaan] = useState("");
  const [dokumentasi, setDokumentasi] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const [checkedIn, setCheckedIn] = useState(false);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const getTodayDate = () => {
    const now = new Date();
    return now.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getTodayDay = () => {
    const now = new Date();
    return now.toLocaleDateString("id-ID", { weekday: "long" });
  };

  useEffect(() => {
    const checkStatus = async () => {
      setCheckingStatus(true);
      const tanggal = getTodayDate();

      const hasCheckedIn = await hasCheckedInToday(user.id, tanggal);
      const canCheckOutStatus = await canCheckOutToday(user.id, tanggal);

      setCheckedIn(hasCheckedIn);
      setCanCheckOut(canCheckOutStatus);
      setCheckingStatus(false);
    };

    checkStatus();
  }, [user.id]);

  const handleCheckIn = async () => {
    if (!dokumentasi) {
      setStatus("error");
      setMessage("Silakan ambil foto dokumentasi terlebih dahulu");
      return;
    }

    setIsLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      // Compress and process image
      setMessage("Memproses dan mengompres foto...");
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, "-");
      const fileName = `absensi-${user.id}-${timestamp}.jpg`;
      const uploadResult = await uploadImageToDrive(dokumentasi, fileName);

      if (!uploadResult.success) {
        setStatus("error");
        setMessage(uploadResult.message || "Gagal memproses foto");
        return;
      }

      // Use compressed image base64 returned from upload function
      const dokumentasiLink = uploadResult.compressedImage || dokumentasi;

      // Get current location
      setMessage("Mendapatkan lokasi...");
      const locationData = await getCurrentLocation();
      setLocation(locationData);

      // Get current time
      const jam_masuk = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const tanggal = getTodayDate();
      const hari = getTodayDay();

      // Submit check-in with image data
      setMessage("Menyimpan absensi masuk...");
      const result = await submitCheckIn({
        id: user.id,
        nama: user.nama,
        jam_masuk,
        hari,
        tanggal,
        pekerjaan: pekerjaan || "-",
        status: "Hadir",
        dokumentasi: dokumentasiLink,
        location: locationData.address,
      });

      if (result.success) {
        setStatus("success");
        setMessage(result.message);
        setCheckedIn(true);
        setCanCheckOut(true);
        setPekerjaan("");
        setDokumentasi(null);
        onSuccess();
      } else {
        setStatus("error");
        setMessage(result.message);
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      // Get current location
      setMessage("Mendapatkan lokasi...");
      const locationData = await getCurrentLocation();
      setLocation(locationData);

      // Get current time
      const now = new Date();
      const jam_pulang = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const tanggal = getTodayDate();

      // Submit check-out
      setMessage("Menyimpan absensi pulang...");
      const result = await submitCheckOut(user.id, tanggal, jam_pulang);

      if (result.success) {
        setStatus("success");
        setMessage(result.message);
        setCanCheckOut(false);
        onSuccess();
      } else {
        setStatus("error");
        setMessage(result.message);
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraCapture = (imageData: string) => {
    setDokumentasi(imageData);
    setShowCamera(false);
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">
          Memeriksa status absensi...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Check-in Section */}
      {!checkedIn && (
        <div className="space-y-4 p-4 border border-border rounded-lg">
          <h3 className="font-semibold text-foreground">Absen Masuk</h3>

          {/* Pekerjaan Input */}
          <div className="space-y-2">
            <Label htmlFor="pekerjaan">Pekerjaan Hari Ini (opsional)</Label>
            <Textarea
              id="pekerjaan"
              placeholder="Deskripsikan pekerjaan yang akan dilakukan..."
              value={pekerjaan}
              onChange={(e) => setPekerjaan(e.target.value)}
              rows={2}
            />
          </div>

          {/* Camera/Documentation Section */}
          <div className="space-y-2">
            <Label>Dokumentasi Foto (wajib)</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setShowCamera(true)}>
                <Camera className="w-4 h-4 mr-2" />
                {dokumentasi ? "Ganti Foto" : "Ambil Foto"}
              </Button>
            </div>

            {dokumentasi && (
              <div className="relative mt-2">
                <img
                  src={dokumentasi || "/placeholder.svg"}
                  alt="Dokumentasi"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Foto siap
                </div>
              </div>
            )}
          </div>

          {/* Check-in Button */}
          <Button
            size="lg"
            className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"
            onClick={handleCheckIn}
            disabled={isLoading || !dokumentasi}>
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Navigation className="w-6 h-6 mr-2" />
                Absen Masuk
              </>
            )}
          </Button>
        </div>
      )}

      {/* Check-out Section */}
      {checkedIn && canCheckOut && (
        <div className="space-y-4 p-4 border border-border rounded-lg">
          <h3 className="font-semibold text-foreground">Absen Pulang</h3>
          <p className="text-sm text-muted-foreground">
            Anda sudah absen masuk hari ini. Klik tombol di bawah untuk absen
            pulang.
          </p>

          <Button
            size="lg"
            className="w-full h-16 text-lg bg-orange-600 hover:bg-orange-700"
            onClick={handleCheckOut}
            disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Navigation className="w-6 h-6 mr-2 rotate-180" />
                Absen Pulang
              </>
            )}
          </Button>
        </div>
      )}

      {/* Already completed for today */}
      {checkedIn && !canCheckOut && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-green-800">
            Absensi Hari Ini Selesai
          </h3>
          <p className="text-sm text-green-600 mt-1">
            Anda sudah menyelesaikan absensi masuk dan pulang hari ini.
          </p>
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            status === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : status === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-muted text-muted-foreground"
          }`}>
          {status === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : status === "error" ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <Loader2 className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin" />
          )}
          <div className="flex-1">
            <p className="font-medium">{message}</p>
            {location && status === "success" && (
              <div className="mt-2 text-sm opacity-80 space-y-1">
                <p className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {location.address}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium text-foreground mb-2">Petunjuk:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>1. Pastikan GPS/Lokasi pada perangkat Anda aktif</li>
          <li>2. Izinkan akses lokasi dan kamera pada browser</li>
          <li>3. Ambil foto dokumentasi sebelum absen masuk</li>
          <li>4. Tekan tombol Absen Masuk saat tiba di lokasi</li>
          <li>5. Tekan tombol Absen Pulang saat akan meninggalkan lokasi</li>
        </ul>
      </div>

      {/* Camera Dialog */}
      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
