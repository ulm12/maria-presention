"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CameraCaptureProps {
  onCapture: (imageUrl: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function CameraCapture({ onCapture, onClose, isOpen }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [uploading, setUploading] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setCapturedImage(null);

      if (stream) stream.getTracks().forEach((t) => t.stop());

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error(err);
      setError("Tidak dapat mengakses kamera.");
    }
  }, [facingMode, stream]);

  const stopCamera = useCallback(() => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const base64Image = canvas.toDataURL("image/jpeg", 0.8);

    setCapturedImage(base64Image);
    stopCamera();
  };

  // 🔥 Convert Base64 → Blob
  function base64ToBlob(base64: string) {
    const byteString = atob(base64.split(",")[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }

    return new Blob([intArray], { type: "image/jpeg" });
  }

  const confirmPhoto = async () => {
    if (!capturedImage) return;

    setUploading(true);

    const blob = base64ToBlob(capturedImage);
    const formData = new FormData();
    const fileName = `absensi_${Date.now()}.jpg`;

    formData.append("file", blob, fileName);
    formData.append("fileName", fileName);

    const res = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploading(false);

    if (data.success) {
      onCapture(data.url);
      handleClose();
    } else {
      alert("Gagal upload foto: " + data.error);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    onClose();
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    startCamera();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? startCamera() : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ambil Foto Dokumentasi</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {capturedImage ? (
            <>
              <img src={capturedImage} className="w-full rounded-lg" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={startCamera}>Ulangi</Button>
                <Button onClick={confirmPhoto} disabled={uploading}>
                  {uploading ? "Mengupload..." : "Gunakan Foto"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={switchCamera}>Ganti Kamera</Button>
                <Button onClick={capturePhoto}>Ambil Foto</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
