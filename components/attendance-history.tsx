"use client";

import { useState, useEffect } from "react";
// Use client-side wrapper to call server API
export type AttendanceRecord = {
  id: string;
  nama: string;
  jam_masuk: string;
  jam_pulang: string;
  hari: string;
  tanggal: string;
  pekerjaan: string;
  status: string;
  dokumentasi: string;
  location: string;
};

async function getAttendanceHistory(
  userId: string
): Promise<AttendanceRecord[]> {
  const res = await fetch(`/api/sheets?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data as AttendanceRecord[];
}
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MapPin,
  Clock,
  Calendar,
  Navigation,
  Briefcase,
  ImageIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AttendanceHistoryProps {
  userId: string;
}

export function AttendanceHistory({ userId }: AttendanceHistoryProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const data = await getAttendanceHistory(userId);
        // Sort by tanggal descending (newest first)
        const sorted = data.sort((a, b) => {
          // Parse Indonesian date format (DD/MM/YYYY)
          const parseDate = (dateStr: string) => {
            const parts = dateStr.split("/");
            if (parts.length === 3) {
              return new Date(
                Number.parseInt(parts[2]),
                Number.parseInt(parts[1]) - 1,
                Number.parseInt(parts[0])
              );
            }
            return new Date(dateStr);
          };
          return (
            parseDate(b.tanggal).getTime() - parseDate(a.tanggal).getTime()
          );
        });
        setRecords(sorted);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Belum ada riwayat absensi</p>
        <p className="text-sm text-muted-foreground mt-1">
          Lakukan absensi pertama Anda untuk melihat riwayat
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {records.map((record, index) => (
          <div
            key={`${record.id}-${record.tanggal}-${index}`}
            className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
                  <Navigation className="w-5 h-5" />
                </div>
                <div className="space-y-2 flex-1">
                  {/* Date and Day */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-medium">
                      {record.hari}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {record.tanggal}
                    </span>
                    <Badge
                      variant={
                        record.status === "Hadir" ? "default" : "secondary"
                      }
                      className={
                        record.status === "Hadir" ? "bg-green-600" : ""
                      }>
                      {record.status || "Hadir"}
                    </Badge>
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <Clock className="w-3 h-3" />
                      Masuk: {record.jam_masuk || "-"}
                    </span>
                    <span className="flex items-center gap-1 text-orange-600">
                      <Clock className="w-3 h-3" />
                      Pulang: {record.jam_pulang || "-"}
                    </span>
                  </div>

                  {/* Location */}
                  {record.location && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{record.location}</span>
                    </p>
                  )}

                  {/* Pekerjaan */}
                  {record.pekerjaan && record.pekerjaan !== "-" && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <Briefcase className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{record.pekerjaan}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Documentation Image Thumbnail */}
              {record.dokumentasi &&
                record.dokumentasi.startsWith("data:image") && (
                  <button
                    onClick={() => setSelectedImage(record.dokumentasi)}
                    className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors">
                    <img
                      src={record.dokumentasi || "/placeholder.svg"}
                      alt="Dokumentasi"
                      className="w-full h-full object-cover"
                    />
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Dokumentasi Foto
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Dokumentasi"
                className="w-full h-auto"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
