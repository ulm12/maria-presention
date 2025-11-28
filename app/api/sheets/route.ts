import { NextRequest, NextResponse } from "next/server";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import fs from "fs";
import path from "path";

// Ensure this route runs in a Node.js runtime (required by google-spreadsheet)
export const runtime = "nodejs";

const SPREADSHEET_ID = "1stoWPEO4R45LzD5jzzlOduvkSMWcE3ENsGdXPGG2tWE";
const SERVICE_ACCOUNT_FILE = path.join(process.cwd(), "service-account.json");

function loadServiceAccountRaw() {
  // Prefer credentials from environment (useful on hosting platforms)
  const envJson =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.SERVICE_ACCOUNT_JSON;
  if (envJson) {
    try {
      return JSON.parse(envJson);
    } catch (e) {
      const errMsg = `Invalid GOOGLE_SERVICE_ACCOUNT_JSON env var: ${
        e instanceof Error ? e.message : String(e)
      }`;
      console.error(errMsg);
      throw new Error(errMsg);
    }
  }

  try {
    const raw = fs.readFileSync(SERVICE_ACCOUNT_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    const errMsg = `Failed to load service account from ${SERVICE_ACCOUNT_FILE}: ${
      e instanceof Error ? e.message : String(e)
    }`;
    console.error(errMsg);
    throw new Error(errMsg);
  }
}

async function getSheet(sheetName: string) {
  const creds = loadServiceAccountRaw();

  // Create JWT auth object
  const auth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
  try {
    await doc.loadInfo();
  } catch (e) {
    console.error("Failed to load spreadsheet info:", e);
    throw e;
  }

  const sheet = doc.sheetsByTitle[sheetName];
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found in spreadsheet`);
  }
  return sheet;
}

export async function POST(req: NextRequest) {
  const { action, payload } = await req.json();
  // Login action: validate user against LOGIN sheet
  if (action === "login") {
    try {
      const sheet = await getSheet("LOGIN");
      const rows = await sheet.getRows();
      const found = rows.find(
        (row: any) =>
          row.get("nip") === payload.nip &&
          row.get("password") === payload.password
      );
      if (!found) {
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }
      return NextResponse.json({
        success: true,
        user: {
          id: (found as any).get("id") || "",
          nip: (found as any).get("nip") || "",
          nama: (found as any).get("nama") || "",
        },
      });
    } catch (error) {
      const errorMsg =
        process.env.NODE_ENV !== "production"
          ? error instanceof Error
            ? error.message
            : String(error)
          : "Login failed";
      console.error("Login error:", error);
      return NextResponse.json(
        { success: false, message: errorMsg },
        { status: 500 }
      );
    }
  }
  if (action === "checkin") {
    try {
      const sheet = await getSheet("PRESENSI");
      const newRow: any = await sheet.addRow({
        id: payload.id,
        nama: payload.nama,
        jam_masuk: payload.jam_masuk,
        jam_pulang: "",
        hari: payload.hari,
        tanggal: payload.tanggal,
        pekerjaan: payload.pekerjaan,
        status: payload.status,
        dokumentasi: payload.dokumentasi,
        location: payload.location,
      });
      const rowNum = newRow._rowNumber ?? newRow.rowNumber ?? null;
      return NextResponse.json({
        success: true,
        message: `Absensi masuk berhasil disimpan!${
          rowNum ? ` (Row: ${rowNum})` : ""
        }`,
      });
    } catch (error) {
      const errorMsg =
        process.env.NODE_ENV !== "production"
          ? error instanceof Error
            ? error.message
            : String(error)
          : "Gagal menyimpan absensi masuk";
      console.error("Check-in error:", error);
      return NextResponse.json(
        { success: false, message: errorMsg },
        { status: 500 }
      );
    }
  }
  if (action === "checkout") {
    try {
      const sheet = await getSheet("PRESENSI");
      const rows = await sheet.getRows();
      const targetRow = rows.find(
        (row: any) =>
          row.get("id") === payload.userId &&
          row.get("tanggal") === payload.tanggal &&
          !row.get("jam_pulang")
      );
      if (!targetRow) {
        return NextResponse.json({
          success: false,
          message: "Data absensi masuk tidak ditemukan",
        });
      }
      (targetRow as any).set("jam_pulang", payload.jam_pulang);
      await targetRow.save();
      return NextResponse.json({
        success: true,
        message: "Absensi pulang berhasil disimpan!",
      });
    } catch (error) {
      const errorMsg =
        process.env.NODE_ENV !== "production"
          ? error instanceof Error
            ? error.message
            : String(error)
          : "Gagal menyimpan absensi pulang";
      console.error("Check-out error:", error);
      return NextResponse.json(
        { success: false, message: errorMsg },
        { status: 500 }
      );
    }
  }
  if (action === "delete") {
    try {
      const sheet = await getSheet("PRESENSI");
      const rows = await sheet.getRows();
      const targetRow = rows.find(
        (row: any) =>
          row.get("id") === payload.userId &&
          row.get("tanggal") === payload.tanggal
      );
      if (!targetRow) {
        return NextResponse.json({
          success: false,
          message: "Data tidak ditemukan",
        });
      }
      await targetRow.delete();
      return NextResponse.json({
        success: true,
        message: "Data berhasil dihapus!",
      });
    } catch (error) {
      const errorMsg =
        process.env.NODE_ENV !== "production"
          ? error instanceof Error
            ? error.message
            : String(error)
          : "Gagal menghapus data";
      console.error("Delete attendance error:", error);
      return NextResponse.json(
        { success: false, message: errorMsg },
        { status: 500 }
      );
    }
  }
  return NextResponse.json({
    success: false,
    message: "Action tidak dikenali",
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json([]);
  try {
    const sheet = await getSheet("PRESENSI");
    const rows = await sheet.getRows();
    const history = rows
      .filter((row: any) => row.get("id") === userId)
      .map((row: any) => ({
        id: row.get("id") || "",
        nama: row.get("nama") || "",
        jam_masuk: row.get("jam_masuk") || "",
        jam_pulang: row.get("jam_pulang") || "",
        hari: row.get("hari") || "",
        tanggal: row.get("tanggal") || "",
        pekerjaan: row.get("pekerjaan") || "",
        status: row.get("status") || "",
        dokumentasi: row.get("dokumentasi") || "",
        location: row.get("location") || "",
      }));
    return NextResponse.json(history);
  } catch (error) {
    console.error("Get history error:", error);
    if (process.env.NODE_ENV !== "production") {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Detailed error:", errorMsg);
    }
    return NextResponse.json([]);
  }
}
