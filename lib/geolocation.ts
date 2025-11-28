export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  accuracy: number;
}

export async function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation tidak didukung oleh browser ini"));
      return;
    }

    // Optional: quick permission check (may not be supported in all browsers)
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (navigator.permissions && navigator.permissions.query) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        navigator.permissions
          .query({ name: "geolocation" })
          .then((p: any) => {
            if (p.state === "denied") {
              reject(
                new Error(
                  "Akses lokasi diblokir oleh pengguna atau browser. Silakan izinkan akses lokasi."
                )
              );
              return;
            }
          })
          .catch(() => {
            // ignore permission query errors
          });
      }
    } catch (e) {
      // ignore if permissions API not available
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Get address from coordinates using reverse geocoding
        let address = "Lokasi tidak diketahui";
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          address = data.display_name || "Lokasi tidak diketahui";
        } catch (error) {
          console.error("Error getting address:", error);
        }

        resolve({
          latitude,
          longitude,
          address,
          accuracy,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new Error("Akses lokasi ditolak. Silakan izinkan akses lokasi.")
            );
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Informasi lokasi tidak tersedia."));
            break;
          case error.TIMEOUT:
            reject(new Error("Waktu permintaan lokasi habis."));
            break;
          default:
            reject(new Error("Terjadi kesalahan saat mendapatkan lokasi."));
        }
      },
      {
        enableHighAccuracy: true,
        // increase timeout to allow GPS fix on slow devices
        timeout: 30000,
        maximumAge: 0,
      }
    );
  });
}
