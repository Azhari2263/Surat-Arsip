import {
  AppConfig,
  DokumenFinal,
  NaskahDinas,
  SuratKeluar,
  UserProfile,
  AktivitasNotifikasi,
  PengaturanItemSpreadsheet,
  RiwayatPenghapusanAudit,
} from '../types';
import { formatTanggalIndo, formatTanggalWaktuIndo } from './storage';

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * @fileoverview Google Apps Script Backend - BPS Provinsi Kalimantan Barat
 * Terintegrasi penuh untuk Sistem Pengelolaan Naskah Dinas, Arsip Digital, & Permintaan Nomor Surat Keluar
 * Unit Kerja: 61000 | Nomor Baru Mulai Dari: 367
 * Spreadsheet ID: 1Pf0RmsY1zaJYds2kN969J01gmhMybkehcAyjwHo4byg (atau 1LJGxOzDjvnBjzT9ZHYjAGtMgdIBXPCnh0bAd8UTLC5E)
 */

const SPREADSHEET_ID = "1Pf0RmsY1zaJYds2kN969J01gmhMybkehcAyjwHo4byg";
const SHEET_NAME = "Keluar26";
const SHEET_KELUAR = "Keluar26";
const SHEET_NASKAH = "NaskahDinas";
const SHEET_ARSIP = "ArsipDigital";
const SHEET_USERS = "Pengguna";
const SHEET_CONFIG = "Pengaturan";
const SHEET_LOG = "LogAktivitas";
const NOMOR_BARU_MULAI_DARI = 367;
const KODE_UNIT = "61000";

/**
 * Mendapatkan referensi Spreadsheet aktif
 */
function getSpreadsheet(customId) {
  const id = customId || SPREADSHEET_ID;
  try {
    return SpreadsheetApp.openById(id);
  } catch (err) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
}

/**
 * Handler Web App GET
 * Melayani permintaan API JSON dan tampilan Index HTML (jika tersedia)
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "";
  const targetSsId = (e && e.parameter && e.parameter.spreadsheetId) || SPREADSHEET_ID;
  
  if (action === "getAllData" || action === "getData") {
    return ContentService.createTextOutput(JSON.stringify(getAllData(targetSsId)))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "getConfig") {
    return ContentService.createTextOutput(JSON.stringify(getConfigData(targetSsId)))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "getLogs" || action === "getActivityLogs") {
    return ContentService.createTextOutput(JSON.stringify(getActivityLogs(targetSsId)))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "getNomorKosong") {
    const bulan = e.parameter.bulan || "Semua";
    return ContentService.createTextOutput(JSON.stringify(getNomorKosong(bulan, targetSsId)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "setupDatabase") {
    const res = setupDatabase(targetSsId);
    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Jika diakses langsung via browser tanpa aksi API, coba tampilkan Index jika ada
  try {
    return HtmlService.createHtmlOutputFromFile("Index")
      .setTitle("Permintaan Nomor Surat Keluar - BPS Prov. Kalbar")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "ONLINE",
      service: "Sistem Pengelolaan Naskah Dinas & Arsip Digital BPS Prov. Kalbar",
      spreadsheetId: targetSsId,
      unit: KODE_UNIT,
      nomorMulaiDari: NOMOR_BARU_MULAI_DARI,
      waktu: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handler Web App POST
 * Menerima payload JSON aksi dari aplikasi web AI Studio
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || "";
    const targetSsId = payload.spreadsheetId || SPREADSHEET_ID;

    // 1. Inisialisasi Database
    if (action === "setupDatabase") {
      const res = setupDatabase(targetSsId);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Surat Keluar (Submit Baru / Update / Hapus)
    if (action === "submitSurat") {
      const res = submitSurat(payload.data || payload, targetSsId);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "updateSurat") {
      const res = recordSuratKeluar(payload.data || payload, targetSsId);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "deleteSurat") {
      const res = deleteSuratKeluar(payload.data || payload, targetSsId);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Naskah Dinas (Tambah / Ubah / Hapus)
    if (action === "saveNaskah" || action === "updateNaskah") {
      const res = recordNaskahDinas(payload.data || payload, targetSsId);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "deleteNaskah") {
      const res = deleteNaskahDinas(payload.data || payload, targetSsId);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Arsip Digital (Ubah / Hapus)
    if (action === "updateArsip") {
      const res = updateArsipDigital(payload.data || payload, targetSsId);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "deleteArsip") {
      const res = deleteArsipDigital(payload.data || payload, targetSsId);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 5. Pengguna & Autentikasi (Tambah / Ubah / Hapus)
    if (action === "saveUser" || action === "updateUser") {
      const res = recordUser(payload.data || payload, targetSsId);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "deleteUser") {
      const res = deleteUserRecord(payload.data || payload, targetSsId);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 6. Google Drive Storage Otomatis (Hierarki: Tahun > Tim Kerja > Bulan > Draft / Arsip)
    if (action === "uploadDraftToDrive") {
      const res = handleUploadDraftDrive(payload.data || payload);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "archiveFinalToDrive") {
      const res = handleArchiveFinalDrive(payload.data || payload);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 7. Pengaturan Sistem Berbasis Spreadsheet
    if (action === "saveConfig" || action === "updateConfig") {
      const res = saveConfigData(payload.data || payload, targetSsId);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "getConfig") {
      const res = getConfigData(targetSsId);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 8. Penghapusan Berkas Google Drive Terintegrasi
    if (action === "deleteDriveFiles") {
      const res = handleDeleteDriveFiles(payload.data || payload);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 9. Pencatatan Log Aktivitas
    if (action === "logActivity") {
      const res = recordActivityLog(payload.data || payload, targetSsId);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Aksi tidak dikenal: " + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Inisialisasi Sheet Keluar26
 */
function initSheet(customSs) {
  const ss = customSs || getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    const headers = [
      "Nomor Surat Lengkap",
      "Kode Surat",
      "Nomor Urut",
      "Kode Klasifikasi",
      "Perihal",
      "Tujuan",
      "Tanggal Surat",
      "Bulan",
      "Nama Pegawai",
      "Tim Kerja",
      "Waktu Input",
      "Status"                 // L — LENGKAP / KOSONG (internal)
    ];
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setBackground("#1a6b3a")
               .setFontColor("#ffffff")
               .setFontWeight("bold")
               .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 240);
    sheet.setColumnWidth(5, 200);
    sheet.setColumnWidth(6, 200);
  }

  return sheet;
}

/**
 * Daftar Nama Bulan
 */
function getNamaBulan(dateObj) {
  const bulanList = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ];
  return bulanList[dateObj.getMonth()];
}

/**
 * Cek Duplikasi Nomor Urut
 */
function isDuplicate(nomorUrut, customSheet) {
  const sheet = customSheet || initSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  const data = sheet.getRange(2, 3, lastRow - 1, 1).getValues(); // Kolom C = Nomor Urut
  return data.some(r => Number(r[0]) === Number(nomorUrut));
}

/**
 * Dapatkan Nomor Urut Baru Berikutnya
 */
function getNextNomorBaru(customSheet) {
  const sheet = customSheet || initSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) return NOMOR_BARU_MULAI_DARI;

  const data = sheet.getRange(2, 3, lastRow - 1, 1).getValues(); // Kolom C
  const nomorList = data
    .map(r => Number(r[0]))
    .filter(n => n >= NOMOR_BARU_MULAI_DARI);

  if (nomorList.length === 0) return NOMOR_BARU_MULAI_DARI;

  return Math.max(...nomorList) + 1;
}

/**
 * Cek Hari Senin
 */
function isHariSenin() {
  const hariIni = new Date().getDay(); 
  return hariIni === 1; // 0 = Minggu, 1 = Senin, dst.
}

/**
 * Cek Orang Pertama Hari Ini
 */
function isOrangPertamaHariIni(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return true;

  const tz = Session.getScriptTimeZone() || "GMT+7";
  const hariIniStr = Utilities.formatDate(new Date(), tz, "dd/MM/yyyy");
  
  // Periksa kolom K (Waktu Input) pada baris-baris sebelumnya
  for (let i = 1; i < data.length; i++) {
    const waktuInput = data[i][10]; // Kolom K adalah indeks ke-10
    const status = data[i][11]; // Kolom L
    if (waktuInput && status !== "KOSONG") {
      const tanggalInputStr = waktuInput instanceof Date ? 
        Utilities.formatDate(waktuInput, tz, "dd/MM/yyyy") : 
        waktuInput.toString().substring(0, 10);
        
      if (tanggalInputStr === hariIniStr) {
        return false; // Sudah ada orang lain yang input hari ini
      }
    }
  }
  return true; // Belum ada input sama sekali hari ini
}

/**
 * Fungsi Pembantu Buat Placeholder atau Pengajuan
 */
function buatPlaceholderAtauPengajuan(nomorUrutAwal, kodeSurat, kodeKlasifikasi, tahun, customSs) {
  const sheet = initSheet(customSs);
  const tz = Session.getScriptTimeZone() || "GMT+7";
  const waktu = Utilities.formatDate(new Date(), tz, "dd/MM/yyyy HH:mm:ss");
  
  let nomorUrutFinal = nomorUrutAwal;

  if (isHariSenin() && isOrangPertamaHariIni(sheet)) {
    if (!isDuplicate(nomorUrutFinal, sheet)) {
      const nomorSuratKosong = kodeSurat + "-" + nomorUrutFinal + "/" + KODE_UNIT + "/" + kodeKlasifikasi + "/" + tahun;
      sheet.appendRow([
        nomorSuratKosong, kodeSurat, nomorUrutFinal, kodeKlasifikasi,
        "", "", "", "", "", "", waktu, "KOSONG"
      ]);
    }
    nomorUrutFinal = nomorUrutFinal + 1;
  }

  if (isDuplicate(nomorUrutFinal, sheet)) return;

  const nomorSuratAsli = kodeSurat + "-" + nomorUrutFinal + "/" + KODE_UNIT + "/" + kodeKlasifikasi + "/" + tahun;
  sheet.appendRow([
    nomorSuratAsli,
    kodeSurat,
    nomorUrutFinal,
    kodeKlasifikasi,
    "Perihal Surat...",
    "Tujuan...", 
    "", 
    "", 
    "", 
    "", 
    waktu,       
    "TERISI"
  ]);
}

/**
 * Ambil Daftar Nomor Kosong
 */
function getNomorKosong(bulanFilter, customSs) {
  try {
    const sheet = initSheet(customSs ? getSpreadsheet(customSs) : null);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
    const result = [];

    data.forEach((row, i) => {
      const nomorSuratLengkap = row[0];
      const kode    = row[1];
      const nomorUrutVal = row[2];
      const klasif  = row[3];
      const perihal = row[4];
      const tujuan  = row[5];
      const tgl     = row[6];
      const bulan   = row[7];
      const status  = row[11];

      const isEmpty = status === "KOSONG" || (!perihal && !tujuan && !tgl);
      if (!isEmpty || !nomorUrutVal) return;

      if (bulanFilter && bulanFilter !== "Semua") {
        if (String(bulan || "").toLowerCase() !== String(bulanFilter).toLowerCase()) return;
      }

      let tglKirim = "";
      let tglTampilan = "";
      
      if (tgl) {
        let d = (tgl instanceof Date) ? tgl : new Date(tgl);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          tglKirim = yyyy + "-" + mm + "-" + dd;
          tglTampilan = dd + "/" + mm + "/" + yyyy;
        }
      }

      const labelKeterangan = tglTampilan 
        ? ("No: " + nomorUrutVal + " (Tanggal: " + tglTampilan + ")")
        : ("No: " + nomorUrutVal + " (Tanpa Tanggal)");

      result.push({
        nomorUrut:  Number(nomorUrutVal),
        nomorSurat: nomorSuratLengkap || (kode + "-" + nomorUrutVal + "/" + KODE_UNIT + "/" + klasif + "/..."),
        keterangan: labelKeterangan, 
        tanggal:    tglKirim,        
        bulan: bulanFilter,
        rowIndex:   i + 2
      });
    });

    result.sort((a, b) => a.nomorUrut - b.nomorUrut);
    return result;
  } catch (e) {
    console.error("Error: " + e.message);
    return [];
  }
}

/**
 * FUNGSI UTAMA: Submit Surat Keluar
 */
function submitSurat(data, customSs) {
  try {
    const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();
    const sheet = initSheet(ss);
    const tz = Session.getScriptTimeZone() || "GMT+7";
    const waktuSekarang = Utilities.formatDate(new Date(), tz, "dd/MM/yyyy HH:mm:ss");

    const tglObj  = new Date();
    const tahun   = tglObj.getFullYear();
    const namaBulan = getNamaBulan(tglObj);

    const timKerja = data.timKerja === "Lainnya"
      ? (data.timKerjaLainnya || "Lainnya")
      : (data.timKerja || "Tim Umum");

    let nomorUrut;
    let targetRow = null;

    // 1. MODE ISI NOMOR KOSONG (Klaim Placeholder)
    if (data.isKosongMode && data.nomorUrutKosong) {
      nomorUrut = Number(data.nomorUrutKosong);

      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const rows = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
        for (let i = 0; i < rows.length; i++) {
          if (Number(rows[i][0]) === nomorUrut) {
            targetRow = i + 2;
            break;
          }
        }
      }

    // 2. MODE BARU (Pengajuan Normal / Aturan Senin)
    } else {
      nomorUrut = getNextNomorBaru(sheet);

      if (isHariSenin() && isOrangPertamaHariIni(sheet)) {
        if (!isDuplicate(nomorUrut, sheet)) {
          const nomorSuratKosong = "-" + nomorUrut + "/" + KODE_UNIT + "//" + tahun;
          sheet.appendRow([
            nomorSuratKosong, "", nomorUrut, "",
            "", "", tglObj, namaBulan, "", "", waktuSekarang, "KOSONG"
          ]);
        }
        nomorUrut = nomorUrut + 1;
      }

      while (isDuplicate(nomorUrut, sheet)) {
        nomorUrut++;
      }
    }

    const kodeKlasif = data.kodeKlasifikasi || "TU.010";
    const nomorSurat = data.nomorSuratLengkap || ((data.kodeSurat || "B") + "-" + nomorUrut + "/" + KODE_UNIT + "/" + kodeKlasif + "/" + tahun);
    const tglFormatted = Utilities.formatDate(tglObj, tz, "dd/MM/yyyy");
    const waktuInput   = data.waktuInput || waktuSekarang;

    const rowData = [
      nomorSurat,
      data.kodeSurat || "B",
      nomorUrut,
      kodeKlasif,
      data.perihal || "",
      data.tujuan || "",
      data.tanggalSurat || tglFormatted,
      data.bulan || namaBulan,
      data.namaPegawai || "",
      timKerja,
      waktuInput,
      data.status || "LENGKAP"
    ];

    if (targetRow) {
      sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
      const newRow = sheet.getLastRow();
      sheet.getRange(newRow, 1, 1, rowData.length)
           .setBackground(newRow % 2 === 0 ? "#f0faf4" : "#ffffff");
    }

    return {
      success:         true,
      nomorUrut:       nomorUrut,
      nomorSurat:      nomorSurat,
      kodeSurat:       data.kodeSurat || "B",
      kodeKlasifikasi: kodeKlasif,
      perihal:         data.perihal || "",
      tujuan:          data.tujuan || "",
      tanggalSurat:    data.tanggalSurat || tglFormatted,
      bulan:           data.bulan || namaBulan,
      namaPegawai:     data.namaPegawai || "",
      timKerja:        timKerja,
      waktuInput:      waktuInput
    };

  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Rekam / Update Surat Keluar (Upsert)
 */
function recordSuratKeluar(data, customSs) {
  const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_KELUAR);
  if (!sheet) {
    setupDatabase(customSs);
    sheet = ss.getSheetByName(SHEET_KELUAR);
  }

  const row = [
    data.nomorSuratLengkap || "",
    data.kodeSurat || "B",
    data.nomorUrut || "",
    data.kodeKlasifikasi || "",
    data.perihal || "",
    data.tujuan || "",
    data.tanggalSurat || "",
    data.bulan || "",
    data.namaPegawai || "",
    data.timKerja || "",
    data.waktuInput || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "dd/MM/yyyy HH:mm:ss"),
    data.status || "LENGKAP"
  ];

  const lastRow = sheet.getLastRow();
  let foundRow = -1;
  if (lastRow > 1) {
    const urutVals = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
    for (let i = 0; i < urutVals.length; i++) {
      if (Number(urutVals[i][0]) === Number(data.nomorUrut)) {
        foundRow = i + 2;
        break;
      }
    }
  }

  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return { success: true, nomorSurat: data.nomorSuratLengkap, action: foundRow !== -1 ? "updated" : "inserted" };
}

/**
 * Hapus Surat Keluar dari Sheet Keluar26
 */
function deleteSuratKeluar(data, customSs) {
  const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_KELUAR);
  if (!sheet || sheet.getLastRow() <= 1) return { success: false, error: "Sheet kosong" };

  const targetNomorUrut = Number(data.nomorUrut || 0);
  const targetNomorSurat = String(data.nomorSuratLengkap || "");
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();

  for (let i = 0; i < values.length; i++) {
    const noSurat = String(values[i][0]);
    const noUrut = Number(values[i][2]);
    if ((targetNomorUrut > 0 && noUrut === targetNomorUrut) || (targetNomorSurat && noSurat === targetNomorSurat)) {
      sheet.deleteRow(i + 2);
      return { success: true, deleted: targetNomorSurat || targetNomorUrut };
    }
  }
  return { success: false, error: "Nomor surat tidak ditemukan di spreadsheet" };
}

/**
 * Inisialisasi Seluruh Lembar Database (Keluar26, NaskahDinas, ArsipDigital)
 */
function setupDatabase(customSs) {
  const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();

  // 1. Sheet Keluar26
  let sheetKeluar = ss.getSheetByName(SHEET_KELUAR);
  if (!sheetKeluar) sheetKeluar = ss.insertSheet(SHEET_KELUAR);
  if (sheetKeluar.getLastRow() === 0) {
    const headersKeluar = [
      "Nomor Surat Lengkap", "Kode Surat", "Nomor Urut", "Kode Klasifikasi",
      "Perihal", "Tujuan", "Tanggal Surat", "Bulan", "Nama Pegawai",
      "Tim Kerja", "Waktu Input", "Status"
    ];
    sheetKeluar.getRange(1, 1, 1, headersKeluar.length).setValues([headersKeluar]);
    sheetKeluar.getRange(1, 1, 1, headersKeluar.length)
      .setBackground("#1a6b3a")
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    sheetKeluar.setFrozenRows(1);
    sheetKeluar.setColumnWidth(1, 260);
    sheetKeluar.setColumnWidth(5, 240);
    sheetKeluar.setColumnWidth(6, 220);
  }

  // 2. Sheet NaskahDinas
  let sheetNaskah = ss.getSheetByName(SHEET_NASKAH);
  if (!sheetNaskah) sheetNaskah = ss.insertSheet(SHEET_NASKAH);
  if (sheetNaskah.getLastRow() === 0) {
    const headersNaskah = [
      "Nomor Registrasi", "Jenis Naskah", "Perihal", "Unit Kerja",
      "Nama Konseptor", "Tanggal Pengajuan", "Verifikator Ditunjuk",
      "Status", "Nomor Surat Dipesan", "Klasifikasi Arsip", "Waktu Update",
      "Detail JSON (Riwayat Versi & Verifikasi)"
    ];
    sheetNaskah.getRange(1, 1, 1, headersNaskah.length).setValues([headersNaskah]);
    sheetNaskah.getRange(1, 1, 1, headersNaskah.length)
      .setBackground("#0f4c82")
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    sheetNaskah.setFrozenRows(1);
    sheetNaskah.setColumnWidth(1, 140);
    sheetNaskah.setColumnWidth(3, 260);
  }

  // 3. Sheet ArsipDigital
  let sheetArsip = ss.getSheetByName(SHEET_ARSIP);
  if (!sheetArsip) sheetArsip = ss.insertSheet(SHEET_ARSIP);
  if (sheetArsip.getLastRow() === 0) {
    const headersArsip = [
      "Nomor Surat Resmi", "Jenis Naskah", "Perihal", "Unit Kerja",
      "Tanggal Penetapan", "Metode Tanda Tangan", "Pejabat Penandatangan",
      "Nama Berkas PDF", "Tingkat Keamanan", "Lokasi Penyimpanan", "Waktu Unggah"
    ];
    sheetArsip.getRange(1, 1, 1, headersArsip.length).setValues([headersArsip]);
    sheetArsip.getRange(1, 1, 1, headersArsip.length)
      .setBackground("#e06c1a")
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    sheetArsip.setFrozenRows(1);
    sheetArsip.setColumnWidth(1, 260);
    sheetArsip.setColumnWidth(3, 260);
  }

  // 4. Sheet Pengguna (Akun Pengguna & Hak Akses)
  let sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (!sheetUsers) sheetUsers = ss.insertSheet(SHEET_USERS);
  if (sheetUsers.getLastRow() === 0) {
    const headersUsers = [
      "ID", "Username", "Password", "NIP", "Nama Lengkap",
      "Jabatan", "Unit Kerja", "Role", "Lingkup Verifikasi",
      "Allowed Tabs", "Status Aktif", "Waktu Update"
    ];
    sheetUsers.getRange(1, 1, 1, headersUsers.length).setValues([headersUsers]);
    sheetUsers.getRange(1, 1, 1, headersUsers.length)
      .setBackground("#3b28cc")
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    sheetUsers.setFrozenRows(1);
    sheetUsers.setColumnWidth(1, 130);
    sheetUsers.setColumnWidth(2, 120);
    sheetUsers.setColumnWidth(5, 200);

    const initialUsers = [
      ["usr-admin-tu", "admin", "bpskalbar61000()", "197609211999031002", "Administrator Tata Usaha", "Koordinator Tata Usaha Kepala BPS", "Pimpinan & TU Kepala", "ADMIN", "Akses Penuh Pengelolaan & Konfigurasi", "dashboard,pengajuan,verifikasi,arsip,pedoman,penomoran,pengguna", "AKTIF", "Awal"],
      ["usr-arsiparis-1", "arsiparis", "arsiparis61000", "197905102003122001", "Arsiparis Ahli BPS Kalbar", "Arsiparis Koordinator Tata Kearsipan", "Tata Usaha / Kearsipan", "ARSIPARIS", "Seluruh Tata Kelola Naskah Dinas & Kearsipan", "dashboard,verifikasi,arsip,pedoman,penomoran", "AKTIF", "Awal"],
      ["usr-konseptor-1", "konseptor", "konseptor61000", "199503152019011002", "Dwi Prasetyo, S.Tr.Stat", "Statistisi Ahli Pertama / Konseptor", "Sosial", "KONSEPTOR", "Penyusunan Draf Naskah Dinas", "dashboard,pengajuan,arsip,pedoman,penomoran", "AKTIF", "Awal"],
      ["usr-verif-yun", "yun", "yun61000", "198708122010012003", "Yun", "Verifikator SDM & Keuangan", "SDM dan Keuangan", "VERIFIKATOR_YUN", "Tim SDM dan Keuangan", "dashboard,verifikasi,arsip,pedoman", "AKTIF", "Awal"],
      ["usr-verif-amanda", "amanda", "amanda61000", "199004222014022004", "Amanda", "Verifikator Perencanaan & Neraca", "Neraca Wilayah", "VERIFIKATOR_AMANDA", "Tim Perencanaan dan Neraca", "dashboard,verifikasi,arsip,pedoman", "AKTIF", "Awal"],
      ["usr-verif-rania", "rania", "rania61000", "199211052015032001", "Rania", "Verifikator Distribusi & Sosial", "Statistik Distribusi", "VERIFIKATOR_RANIA", "Tim Distribusi dan Sosial", "dashboard,verifikasi,arsip,pedoman", "AKTIF", "Awal"],
      ["usr-verif-vivi", "vivi", "vivi61000", "198906182012012005", "Vivi", "Verifikator Produksi", "Statistik Produksi", "VERIFIKATOR_VIVI", "Tim Produksi", "dashboard,verifikasi,arsip,pedoman", "AKTIF", "Awal"],
      ["usr-verif-agus", "agus", "agus61000", "198602142009011004", "Agus", "Verifikator IPDS & Umum/Humas", "IPDS dan Tim Umum", "VERIFIKATOR_AGUS", "Tim IPDS, Tim Umum dan Humas", "dashboard,verifikasi,arsip,pedoman", "AKTIF", "Awal"],
      ["usr-viewer-1", "viewer", "viewer61000", "199801012022011001", "Pengamat / Tamu Eksternal", "Auditor / Pengamat Monitoring", "Pengawasan / Tamu", "VIEWER", "Pemantauan Arsip & Register (Read-Only)", "dashboard,arsip,pedoman,penomoran", "AKTIF", "Awal"]
    ];
    sheetUsers.getRange(2, 1, initialUsers.length, initialUsers[0].length).setValues(initialUsers);
  }

  // 5. Sheet Pengaturan (Database Pengaturan & Konfigurasi Aplikasi Terpusat)
  let sheetConfig = ss.getSheetByName(SHEET_CONFIG);
  if (!sheetConfig) sheetConfig = ss.insertSheet(SHEET_CONFIG);
  if (sheetConfig.getLastRow() === 0) {
    const headersConfig = [
      "Kunci", "Nilai", "Kategori", "Deskripsi", "Waktu Update", "Diupdate Oleh"
    ];
    sheetConfig.getRange(1, 1, 1, headersConfig.length).setValues([headersConfig]);
    sheetConfig.getRange(1, 1, 1, headersConfig.length)
      .setBackground("#0d9488")
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    sheetConfig.setFrozenRows(1);
    sheetConfig.setColumnWidth(1, 180);
    sheetConfig.setColumnWidth(2, 320);
    sheetConfig.setColumnWidth(4, 280);

    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "dd/MM/yyyy HH:mm:ss");
    const initialConfigs = [
      ["nomorBaruMulaiDari", "367", "Penomoran", "Nomor urut surat baru mulai dari (Sheet Keluar26)", now, "Sistem Inisial"],
      ["kodeUnit", "6100", "Organisasi", "Kode unit kerja BPS Provinsi Kalimantan Barat", now, "Sistem Inisial"],
      ["whatsappAdmin", "6281253817688", "Bantuan", "Nomor WhatsApp admin layanan persuratan", now, "Sistem Inisial"],
      ["enableMondayRule", "true", "Aturan Penomoran", "Aktifkan aturan slot nomor kosong otomatis hari Senin", now, "Sistem Inisial"],
      ["googleDriveFolderId", "1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S", "Penyimpanan Drive", "ID Folder Induk Google Drive untuk penyimpanan draf & arsip digital", now, "Sistem Inisial"],
      ["daftarTimKerja", JSON.stringify([
        "Tim SDM","Tim Keuangan","Tim Perencanaan","Tim Neraca","Tim Distribusi",
        "Tim Sosial","Tim Produksi","Tim IPDS","Tim Umum & Humas","Tata Usaha / Kearsipan","Pimpinan & TU Kepala"
      ]), "Master Data", "Daftar Tim Kerja resmi BPS Provinsi Kalimantan Barat", now, "Sistem Inisial"],
      ["syncIntervalSeconds", "10", "Sinkronisasi", "Interval sinkronisasi latar belakang otomatis (detik)", now, "Sistem Inisial"]
    ];
    sheetConfig.getRange(2, 1, initialConfigs.length, initialConfigs[0].length).setValues(initialConfigs);
  }

  // 6. Sheet LogAktivitas (Sinkronisasi Multi-Pengguna & Audit Penghapusan)
  let sheetLog = ss.getSheetByName(SHEET_LOG);
  if (!sheetLog) sheetLog = ss.insertSheet(SHEET_LOG);
  if (sheetLog.getLastRow() === 0) {
    const headersLog = [
      "ID", "Waktu", "Aktivitas", "Pengguna", "Role", "Nomor Registrasi", "Nomor Surat", "Keterangan", "Status Drive"
    ];
    sheetLog.getRange(1, 1, 1, headersLog.length).setValues([headersLog]);
    sheetLog.getRange(1, 1, 1, headersLog.length)
      .setBackground("#475569")
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    sheetLog.setFrozenRows(1);
    sheetLog.setColumnWidth(1, 140);
    sheetLog.setColumnWidth(2, 160);
    sheetLog.setColumnWidth(8, 300);
  }

  return {
    success: true,
    message: "Struktur database (Keluar26, NaskahDinas, ArsipDigital, Pengguna, Pengaturan, LogAktivitas) berhasil disiapkan!",
    spreadsheetId: ss.getId()
  };
}

/**
 * Mengambil Data Konfigurasi dari Sheet Pengaturan
 */
function getConfigData(customSs) {
  const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_CONFIG);
  if (!sheet) {
    setupDatabase(customSs);
    sheet = ss.getSheetByName(SHEET_CONFIG);
  }

  const result = {
    success: true,
    config: {},
    items: []
  };

  if (!sheet || sheet.getLastRow() <= 1) return result;

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  data.forEach(function(r) {
    if (r[0]) {
      const k = String(r[0]).trim();
      const v = String(r[1] || "");
      result.config[k] = v;
      result.items.push({
        kunci: k,
        nilai: v,
        kategori: String(r[2] || "Umum"),
        deskripsi: String(r[3] || ""),
        waktuUpdate: String(r[4] || ""),
        diupdateOleh: String(r[5] || "")
      });
    }
  });

  return result;
}

/**
 * Menyimpan / Memperbarui Konfigurasi ke Sheet Pengaturan
 */
function saveConfigData(payload, customSs) {
  const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_CONFIG);
  if (!sheet) {
    setupDatabase(customSs);
    sheet = ss.getSheetByName(SHEET_CONFIG);
  }

  const rawItems = Array.isArray(payload.items) ? payload.items : (Array.isArray(payload) ? payload : []);
  const tz = Session.getScriptTimeZone() || "GMT+7";
  const now = Utilities.formatDate(new Date(), tz, "dd/MM/yyyy HH:mm:ss");
  const actor = payload.diupdateOleh || payload.actor || "Administrator";
  const items = [];

  if (rawItems.length > 0) {
    rawItems.forEach(function(it) { items.push(it); });
  } else if (typeof payload === "object") {
    for (const key in payload) {
      if (key !== "action" && key !== "spreadsheetId" && key !== "diupdateOleh" && key !== "actor") {
        let valStr = payload[key];
        if (typeof valStr === "object") valStr = JSON.stringify(valStr);
        items.push({
          kunci: key,
          nilai: String(valStr),
          kategori: "Aplikasi",
          deskripsi: "Pengaturan " + key,
          waktuUpdate: now,
          diupdateOleh: actor
        });
      }
    }
  }

  if (sheet.getLastRow() <= 1) {
    items.forEach(function(item) {
      sheet.appendRow([item.kunci, item.nilai, item.kategori || "Aplikasi", item.deskripsi || "", now, actor]);
    });
    return { success: true, count: items.length };
  }

  const lastRow = sheet.getLastRow();
  const existingKeys = sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function(r) { return String(r[0]).trim(); });

  items.forEach(function(item) {
    const idx = existingKeys.indexOf(item.kunci);
    if (idx !== -1) {
      const rowNum = idx + 2;
      sheet.getRange(rowNum, 2).setValue(item.nilai);
      if (item.kategori) sheet.getRange(rowNum, 3).setValue(item.kategori);
      if (item.deskripsi) sheet.getRange(rowNum, 4).setValue(item.deskripsi);
      sheet.getRange(rowNum, 5).setValue(now);
      sheet.getRange(rowNum, 6).setValue(actor);
    } else {
      sheet.appendRow([item.kunci, item.nilai, item.kategori || "Aplikasi", item.deskripsi || "", now, actor]);
      existingKeys.push(item.kunci);
    }
  });

  return { success: true, count: items.length };
}

/**
 * Mencatat Log Aktivitas ke Sheet LogAktivitas
 */
function recordActivityLog(data, customSs) {
  try {
    const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_LOG);
    if (!sheet) {
      setupDatabase(customSs);
      sheet = ss.getSheetByName(SHEET_LOG);
    }

    const tz = Session.getScriptTimeZone() || "GMT+7";
    const now = Utilities.formatDate(new Date(), tz, "dd/MM/yyyy HH:mm:ss");
    const logId = "log-" + Date.now();

    const rowData = [
      logId,
      now,
      String(data.aktivitas || data.tipe || "AKTIVITAS"),
      String(data.pengguna || data.aktor || "Sistem"),
      String(data.role || data.roleAktor || "-"),
      String(data.nomorRegistrasi || "-"),
      String(data.nomorSurat || "-"),
      String(data.keterangan || data.pesan || "-"),
      String(data.statusDrive || "-")
    ];

    sheet.appendRow(rowData);
    return { success: true, logId: logId };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Membaca Log Aktivitas Terkini
 */
function getActivityLogs(customSs) {
  const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_LOG);
  const logs = [];
  if (sheet && sheet.getLastRow() > 1) {
    const lStart = Math.max(2, sheet.getLastRow() - 35);
    const lCount = sheet.getLastRow() - lStart + 1;
    const lData = sheet.getRange(lStart, 1, lCount, 9).getValues();
    lData.forEach(function(r, idx) {
      if (r[0] || r[1]) {
        logs.push({
          id: String(r[0] || ("log-" + idx)),
          waktu: String(r[1] || ""),
          aktivitas: String(r[2] || ""),
          pengguna: String(r[3] || ""),
          role: String(r[4] || ""),
          nomorRegistrasi: String(r[5] || ""),
          nomorSurat: String(r[6] || ""),
          keterangan: String(r[7] || ""),
          statusDrive: String(r[8] || "")
        });
      }
    });
    logs.reverse();
  }
  return { success: true, logs: logs };
}

/**
 * Penghapusan Berkas Google Drive Terintegrasi
 */
function handleDeleteDriveFiles(data) {
  try {
    const fileIds = Array.isArray(data.fileIds) ? data.fileIds : (data.fileId ? [data.fileId] : []);
    const nomorRegistrasi = String(data.nomorRegistrasi || "-");
    const nomorSurat = String(data.nomorSurat || "-");
    const perihal = String(data.perihal || "-");
    const actor = String(data.actor || "Pengguna");
    const actorRole = String(data.actorRole || "-");

    const deletedIds = [];
    const failedIds = [];

    fileIds.forEach(function(rawId) {
      if (!rawId || typeof rawId !== "string") return;
      const cleanId = rawId.trim();
      // Lindungi folder induk dari penghapusan tidak sengaja
      if (cleanId === "1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S" || cleanId.length < 10) return;

      try {
        const file = DriveApp.getFileById(cleanId);
        file.setTrashed(true);
        deletedIds.push(cleanId);
      } catch (err) {
        failedIds.push({ id: cleanId, error: err.toString() });
      }
    });

    const statusDrive = failedIds.length === 0 ? "BERHASIL" : (deletedIds.length > 0 ? "SEBAGIAN" : "GAGAL");

    // Catat ke sheet LogAktivitas
    recordActivityLog({
      aktivitas: "HAPUS_DOKUMEN_DRIVE",
      pengguna: actor,
      role: actorRole,
      nomorRegistrasi: nomorRegistrasi,
      nomorSurat: nomorSurat,
      keterangan: "Penghapusan berkas terkait: " + perihal + " (Terhapus: " + deletedIds.length + ", Gagal: " + failedIds.length + ")",
      statusDrive: statusDrive
    });

    return {
      success: failedIds.length === 0,
      deletedCount: deletedIds.length,
      deletedIds: deletedIds,
      failedIds: failedIds,
      statusDrive: statusDrive
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Mengambil Seluruh Data dari Spreadsheet
 */
function getAllData(customSs) {
  const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();
  
  // Baca Surat Keluar
  const sheetKeluar = ss.getSheetByName(SHEET_KELUAR);
  const suratList = [];
  if (sheetKeluar && sheetKeluar.getLastRow() > 1) {
    const data = sheetKeluar.getRange(2, 1, sheetKeluar.getLastRow() - 1, 12).getValues();
    data.forEach(function(r, i) {
      if (r[0] || r[2]) {
        suratList.push({
          id: "surat-" + (r[2] || i),
          nomorSuratLengkap: String(r[0] || ""),
          kodeSurat: String(r[1] || "B"),
          nomorUrut: Number(r[2] || 0),
          kodeKlasifikasi: String(r[3] || ""),
          perihal: String(r[4] || ""),
          tujuan: String(r[5] || ""),
          tanggalSurat: String(r[6] || ""),
          bulan: String(r[7] || ""),
          namaPegawai: String(r[8] || ""),
          timKerja: String(r[9] || ""),
          waktuInput: String(r[10] || ""),
          status: String(r[11] || "LENGKAP")
        });
      }
    });
  }

  // Baca Naskah Dinas
  const sheetNaskah = ss.getSheetByName(SHEET_NASKAH);
  const naskahList = [];
  if (sheetNaskah && sheetNaskah.getLastRow() > 1) {
    const dataN = sheetNaskah.getRange(2, 1, sheetNaskah.getLastRow() - 1, 12).getValues();
    dataN.forEach(function(r, i) {
      if (r[0]) {
        let details = {};
        try { details = JSON.parse(r[11] || "{}"); } catch (e) {}

        naskahList.push({
          id: details.id || ("nd-" + i),
          nomorRegistrasi: String(r[0] || ""),
          jenisNaskah: String(r[1] || "Surat Dinas Biasa"),
          perihal: String(r[2] || ""),
          unitKerja: String(r[3] || ""),
          namaKonseptor: String(r[4] || ""),
          tanggalPengajuan: String(r[5] || ""),
          verifikatorDitunjuk: String(r[6] || ""),
          roleVerifikatorDitunjuk: details.roleVerifikatorDitunjuk || "ARSIPARIS",
          status: String(r[7] || "DRAF_DIAJUKAN"),
          nomorSuratDipesan: String(r[8] || ""),
          klasifikasiArsip: String(r[9] || ""),
          waktuUpdate: String(r[10] || ""),
          drafFile: details.drafFile || { name: "draf.docx", size: 0, type: "docx" },
          riwayatVersi: details.riwayatVersi || [],
          riwayatVerifikasi: details.riwayatVerifikasi || [],
          dokumenFinal: details.dokumenFinal
        });
      }
    });
  }

  // Baca Pengguna dari Sheet Pengguna
  const sheetUsers = ss.getSheetByName(SHEET_USERS);
  const userList = [];
  if (sheetUsers && sheetUsers.getLastRow() > 1) {
    const dataU = sheetUsers.getRange(2, 1, sheetUsers.getLastRow() - 1, 12).getValues();
    dataU.forEach(function(r, i) {
      if (r[0] || r[1]) {
        var rawTabs = String(r[9] || "");
        var tabsArr = rawTabs ? rawTabs.split(",").map(function(s) { return s.trim(); }) : [];
        userList.push({
          id: String(r[0] || "usr-" + i),
          username: String(r[1] || "").toLowerCase(),
          password: String(r[2] || ""),
          nip: String(r[3] || ""),
          nama: String(r[4] || ""),
          jabatan: String(r[5] || ""),
          unitKerja: String(r[6] || ""),
          role: String(r[7] || "VIEWER"),
          lingkupVerifikasi: String(r[8] || ""),
          allowedTabs: tabsArr,
          statusAktif: String(r[10] || "AKTIF").toUpperCase() !== "NONAKTIF" && String(r[10] || "true").toLowerCase() !== "false"
        });
      }
    });
  }

  // Baca Pengaturan dari Sheet Pengaturan
  const configRes = getConfigData(customSs);

  // Baca Log Aktivitas terkini dari Sheet LogAktivitas
  const logRes = getActivityLogs(customSs);

  return {
    success: true,
    suratList: suratList,
    naskahList: naskahList,
    userList: userList,
    configData: configRes.config,
    configItems: configRes.items,
    activityLogs: logRes.logs
  };
}

/**
 * Rekam / Update Naskah Dinas
 */
function recordNaskahDinas(naskah, customSs) {
  const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NASKAH);
  if (!sheet) {
    setupDatabase(customSs);
    sheet = ss.getSheetByName(SHEET_NASKAH);
  }

  const detailsJSON = JSON.stringify({
    id: naskah.id,
    roleVerifikatorDitunjuk: naskah.roleVerifikatorDitunjuk,
    drafFile: naskah.drafFile,
    riwayatVersi: naskah.riwayatVersi,
    riwayatVerifikasi: naskah.riwayatVerifikasi,
    dokumenFinal: naskah.dokumenFinal
  });

  const rowData = [
    naskah.nomorRegistrasi || "",
    naskah.jenisNaskah || "",
    naskah.perihal || "",
    naskah.unitKerja || "",
    naskah.namaKonseptor || "",
    naskah.tanggalPengajuan || "",
    naskah.verifikatorDitunjuk || "",
    naskah.status || "DRAF_DIAJUKAN",
    naskah.nomorSuratDipesan || "",
    naskah.klasifikasiArsip || "",
    naskah.waktuUpdate || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "dd/MM/yyyy HH:mm:ss"),
    detailsJSON
  ];

  const lastRow = sheet.getLastRow();
  let foundRow = -1;
  if (lastRow > 1) {
    const regList = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < regList.length; i++) {
      if (String(regList[i][0]) === String(naskah.nomorRegistrasi)) {
        foundRow = i + 2;
        break;
      }
    }
  }

  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  if (naskah.status === "FINAL_DIARSIPKAN" && naskah.dokumenFinal) {
    recordArsipDigital(naskah, customSs);
  }

  return { success: true, nomorRegistrasi: naskah.nomorRegistrasi };
}

/**
 * Hapus Naskah Dinas dari Sheet NaskahDinas
 */
function deleteNaskahDinas(data, customSs) {
  const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NASKAH);
  if (!sheet || sheet.getLastRow() <= 1) return { success: false, error: "Sheet kosong" };

  const targetReg = String(data.nomorRegistrasi || data.id || "");
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === targetReg) {
      sheet.deleteRow(i + 2);
      return { success: true, deleted: targetReg };
    }
  }
  return { success: false, error: "Nomor registrasi draf tidak ditemukan" };
}

/**
 * Rekam Dokumen Final ke Sheet ArsipDigital
 */
function recordArsipDigital(naskah, customSs) {
  const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ARSIP);
  if (!sheet) {
    setupDatabase(customSs);
    sheet = ss.getSheetByName(SHEET_ARSIP);
  }

  const doc = naskah.dokumenFinal;
  const row = [
    doc.nomorSuratResmi || "",
    naskah.jenisNaskah || "",
    naskah.perihal || "",
    naskah.unitKerja || "",
    doc.tanggalPenetapan || "",
    doc.tipeTandaTangan || "TTE",
    doc.pejabatPenandatangan || "",
    doc.namaFile || "",
    doc.tingkatKeamanan || "Biasa",
    doc.lokasiPenyimpanan || "",
    doc.waktuUnggah || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "dd/MM/yyyy HH:mm:ss")
  ];

  const lastRow = sheet.getLastRow();
  let foundRow = -1;
  if (lastRow > 1) {
    const vals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < vals.length; i++) {
      if (String(vals[i][0]) === String(doc.nomorSuratResmi)) {
        foundRow = i + 2;
        break;
      }
    }
  }

  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

/**
 * Update Metadata Arsip Digital
 */
function updateArsipDigital(data, customSs) {
  const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ARSIP);
  if (!sheet || sheet.getLastRow() <= 1) return { success: false, error: "Sheet kosong" };

  const targetNo = String(data.nomorSuratResmi || "");
  const lastRow = sheet.getLastRow();
  const vals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) === targetNo) {
      const rowIdx = i + 2;
      if (data.pejabatPenandatangan) sheet.getRange(rowIdx, 7).setValue(data.pejabatPenandatangan);
      if (data.tingkatKeamanan) sheet.getRange(rowIdx, 9).setValue(data.tingkatKeamanan);
      if (data.lokasiPenyimpanan) sheet.getRange(rowIdx, 10).setValue(data.lokasiPenyimpanan);
      if (data.tanggalPenetapan) sheet.getRange(rowIdx, 5).setValue(data.tanggalPenetapan);
      return { success: true, updated: targetNo };
    }
  }
  return { success: false, error: "Arsip tidak ditemukan" };
}

/**
 * Hapus Arsip Digital dari Sheet ArsipDigital
 */
function deleteArsipDigital(data, customSs) {
  const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ARSIP);
  if (!sheet || sheet.getLastRow() <= 1) return { success: false, error: "Sheet kosong" };

  const targetNo = String(data.nomorSuratResmi || "");
  const lastRow = sheet.getLastRow();
  const vals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) === targetNo) {
      sheet.deleteRow(i + 2);
      return { success: true, deleted: targetNo };
    }
  }
  return { success: false, error: "Arsip tidak ditemukan di spreadsheet" };
}

/**
 * Rekam / Update Pengguna di Sheet Pengguna
 */
function recordUser(user, customSs) {
  const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) {
    setupDatabase(customSs);
    sheet = ss.getSheetByName(SHEET_USERS);
  }

  const userId = user.id || ("usr-" + Utilities.getUuid().slice(0, 8));
  const tabsStr = Array.isArray(user.allowedTabs) ? user.allowedTabs.join(",") : (user.allowedTabs || "");
  const statusStr = user.statusAktif !== false ? "AKTIF" : "NONAKTIF";

  const rowData = [
    userId,
    String(user.username || "").trim().toLowerCase(),
    String(user.password || ""),
    String(user.nip || ""),
    String(user.nama || ""),
    String(user.jabatan || ""),
    String(user.unitKerja || ""),
    String(user.role || "VIEWER"),
    String(user.lingkupVerifikasi || ""),
    tabsStr,
    statusStr,
    Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "dd/MM/yyyy HH:mm:ss")
  ];

  const lastRow = sheet.getLastRow();
  let foundRow = -1;
  if (lastRow > 1) {
    const vals = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (let i = 0; i < vals.length; i++) {
      const rowId = String(vals[i][0]);
      const rowUsername = String(vals[i][1]).toLowerCase();
      if ((userId && rowId === userId) || (user.username && rowUsername === String(user.username).trim().toLowerCase())) {
        foundRow = i + 2;
        break;
      }
    }
  }

  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { success: true, username: user.username, action: foundRow !== -1 ? "updated" : "inserted" };
}

/**
 * Hapus Pengguna dari Sheet Pengguna
 */
function deleteUserRecord(data, customSs) {
  const ss = customSs ? getSpreadsheet(customSs) : getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet || sheet.getLastRow() <= 1) return { success: false, error: "Sheet Pengguna kosong" };

  const targetId = String(data.id || "");
  const targetUsername = String(data.username || "").toLowerCase();
  const lastRow = sheet.getLastRow();
  const vals = sheet.getRange(2, 1, lastRow - 1, 2).getValues();

  for (let i = 0; i < vals.length; i++) {
    const rowId = String(vals[i][0]);
    const rowUsername = String(vals[i][1]).toLowerCase();
    if ((targetId && rowId === targetId) || (targetUsername && rowUsername === targetUsername)) {
      sheet.deleteRow(i + 2);
      return { success: true, deleted: targetUsername || targetId };
    }
  }
  return { success: false, error: "Pengguna tidak ditemukan di sheet Pengguna" };
}

/**
 * ══════════════════════════════════════════════════════════════════
 * GOOGLE DRIVE HIERARCHICAL STORAGE AUTOMATION
 * Folder Induk: 1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S
 * └── {Tahun} (cth: 2026)
 *     └── {Tim Kerja} (cth: Tim Sosial)
 *         └── {Bulan} (cth: 11 - November)
 *             ├── Draft
 *             └── Arsip
 * ══════════════════════════════════════════════════════════════════
 */
function getOrCreateDriveFolder(parentFolder, name) {
  const folders = parentFolder.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(name);
}

function resolveDriveTargetFolder(rootFolderId, tahun, timKerja, bulan, subfolderName) {
  const root = DriveApp.getFolderById(rootFolderId || "1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S");
  const fTahun = getOrCreateDriveFolder(root, String(tahun));
  const fTim = getOrCreateDriveFolder(fTahun, String(timKerja));
  const fBulan = getOrCreateDriveFolder(fTim, String(bulan));
  const fTarget = getOrCreateDriveFolder(fBulan, String(subfolderName));
  return fTarget;
}

function handleUploadDraftDrive(data) {
  try {
    const rootId = data.rootFolderId || "1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S";
    const tahun = data.tahun || String(new Date().getFullYear());
    const timKerja = data.timKerja || "Tim Umum";
    const bulan = data.bulan || "01 - Januari";
    const fileName = data.fileName || ("DRAF_" + data.nomorRegistrasi + ".docx");
    const targetFolder = resolveDriveTargetFolder(rootId, tahun, timKerja, bulan, "Draft");

    let existingFile = null;
    if (data.existingFileId) {
      try { existingFile = DriveApp.getFileById(data.existingFileId); } catch(e) {}
    }
    if (!existingFile) {
      const files = targetFolder.getFilesByName(fileName);
      if (files.hasNext()) {
        existingFile = files.next();
      }
    }

    let file;
    let actionTaken = "created";

    if (data.fileDataUrl && data.fileDataUrl.indexOf("base64,") !== -1) {
      const base64Data = data.fileDataUrl.split("base64,")[1];
      const decodedBytes = Utilities.base64Decode(base64Data);
      const blob = Utilities.newBlob(decodedBytes, data.mimeType || "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileName);
      if (existingFile) {
        existingFile.setTrashed(true);
        actionTaken = "updated";
      }
      file = targetFolder.createFile(blob);
    } else if (existingFile) {
      file = existingFile;
      actionTaken = "updated";
    } else {
      file = targetFolder.createFile(fileName, "Draf Naskah Dinas BPS Kalbar (" + data.nomorRegistrasi + ")", data.mimeType || MimeType.PLAIN_TEXT);
    }

    return {
      success: true,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      folderId: targetFolder.getId(),
      folderUrl: targetFolder.getUrl(),
      actionTaken: actionTaken
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function handleArchiveFinalDrive(data) {
  try {
    const rootId = data.rootFolderId || "1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S";
    const tahun = data.tahun || String(new Date().getFullYear());
    const timKerja = data.timKerja || "Tim Umum";
    const bulan = data.bulan || "01 - Januari";
    const fileName = data.fileName || (data.nomorSuratResmi + ".pdf");
    const targetFolder = resolveDriveTargetFolder(rootId, tahun, timKerja, bulan, "Arsip");

    // Bersihkan draft lama di folder Draft untuk mencegah duplikasi
    if (data.draftFileId) {
      try {
        const oldDraft = DriveApp.getFileById(data.draftFileId);
        oldDraft.setTrashed(true);
      } catch(e) {}
    }

    let file;
    if (data.fileDataUrl && data.fileDataUrl.indexOf("base64,") !== -1) {
      const base64Data = data.fileDataUrl.split("base64,")[1];
      const decodedBytes = Utilities.base64Decode(base64Data);
      const blob = Utilities.newBlob(decodedBytes, data.mimeType || "application/pdf", fileName);
      file = targetFolder.createFile(blob);
    } else {
      file = targetFolder.createFile(fileName, "Arsip Dokumen Final BPS Kalbar (" + data.nomorSuratResmi + ")", "application/pdf");
    }

    return {
      success: true,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      folderId: targetFolder.getId(),
      folderUrl: targetFolder.getUrl(),
      actionTaken: "moved"
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}
`;

/**
 * Mengirim aksi ke Apps Script Web App
 */
export async function sendAppsScriptAction(
  action: string,
  data: any,
  config: AppConfig
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const url = config.appsScriptUrl;
    if (!url) {
      return { success: false, error: 'URL Google Apps Script belum dikonfigurasi.' };
    }

    const payload = JSON.stringify({
      action,
      data,
      spreadsheetId: config.spreadsheetId,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: payload,
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const text = await response.text();
    try {
      const json = JSON.parse(text);
      return { success: true, data: json };
    } catch {
      // Return success if status was 200 even if response was HTML redirect
      return { success: true, data: text };
    }
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Inisialisasi struktur sheet database pada Spreadsheet ID
 */
export async function setupDatabaseSpreadsheet(
  config: AppConfig
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await sendAppsScriptAction('setupDatabase', {}, config);
  if (res.success) {
    return {
      success: true,
      message: 'Struktur database sheet Keluar26, NaskahDinas, ArsipDigital, dan Pengguna berhasil disiapkan!',
    };
  }
  return {
    success: false,
    error: res.error || 'Gagal menghubungi Google Apps Script.',
  };
}

/**
 * Mengambil data realtime dari Spreadsheet
 */
export async function fetchSpreadsheetData(
  config: AppConfig
): Promise<{
  success: boolean;
  suratList?: SuratKeluar[];
  naskahList?: NaskahDinas[];
  userList?: UserProfile[];
  remoteConfig?: Partial<AppConfig>;
  configItems?: PengaturanItemSpreadsheet[];
  activityLogs?: any[];
  error?: string;
}> {
  try {
    const url = `${config.appsScriptUrl}?action=getAllData&t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const json = await response.json();
    if (json.success) {
      let remoteConfig: Partial<AppConfig> | undefined;
      if (json.configData && typeof json.configData === 'object') {
        const c = json.configData;
        remoteConfig = {
          nomorBaruMulaiDari: c.nomorBaruMulaiDari ? Number(c.nomorBaruMulaiDari) : undefined,
          kodeUnit: c.kodeUnit || undefined,
          whatsappAdmin: c.whatsappAdmin || undefined,
          enableMondayRule: c.enableMondayRule !== undefined ? String(c.enableMondayRule) !== 'false' : undefined,
          googleDriveFolderId: c.googleDriveFolderId || undefined,
          syncIntervalSeconds: c.syncIntervalSeconds ? Number(c.syncIntervalSeconds) : undefined,
          lastConfigUpdate: c.lastConfigUpdate || new Date().toISOString(),
          updatedBy: c.updatedBy || 'Spreadsheet',
        };

        if (c.daftarTimKerja) {
          try {
            const parsed = JSON.parse(c.daftarTimKerja);
            if (Array.isArray(parsed)) remoteConfig.daftarTimKerja = parsed;
          } catch {}
        }
        if (c.pemetaanVerifikator) {
          try {
            const parsed = JSON.parse(c.pemetaanVerifikator);
            if (typeof parsed === 'object') remoteConfig.pemetaanVerifikator = parsed;
          } catch {}
        }
      }

      return {
        success: true,
        suratList: Array.isArray(json.suratList)
          ? json.suratList.map((s: SuratKeluar) => ({
              ...s,
              tanggalSurat: s.tanggalSurat ? formatTanggalIndo(s.tanggalSurat) : s.tanggalSurat,
              waktuInput: s.waktuInput ? formatTanggalWaktuIndo(s.waktuInput) : s.waktuInput,
            }))
          : [],
        naskahList: Array.isArray(json.naskahList)
          ? json.naskahList.map((n: NaskahDinas) => ({
              ...n,
              tanggalPengajuan: n.tanggalPengajuan ? formatTanggalIndo(n.tanggalPengajuan) : n.tanggalPengajuan,
              waktuUpdate: n.waktuUpdate ? formatTanggalWaktuIndo(n.waktuUpdate) : n.waktuUpdate,
            }))
          : [],
        userList: Array.isArray(json.userList) ? json.userList : [],
        remoteConfig,
        configItems: Array.isArray(json.configItems) ? json.configItems : [],
        activityLogs: Array.isArray(json.activityLogs) ? json.activityLogs : [],
      };
    }
    return { success: false, error: json.error || 'Respon spreadsheet tidak valid.' };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Mengambil konfigurasi langsung dari Sheet Pengaturan
 */
export async function fetchSpreadsheetConfig(
  config: AppConfig
): Promise<{ success: boolean; config?: Partial<AppConfig>; items?: PengaturanItemSpreadsheet[]; error?: string }> {
  try {
    if (!config.appsScriptUrl) return { success: false, error: 'URL Google Apps Script belum dikonfigurasi.' };
    const url = `${config.appsScriptUrl}?action=getConfig&spreadsheetId=${encodeURIComponent(config.spreadsheetId)}&t=${Date.now()}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.success) {
      let parsedConfig: Partial<AppConfig> = {};
      if (json.config) {
        parsedConfig = {
          nomorBaruMulaiDari: json.config.nomorBaruMulaiDari ? Number(json.config.nomorBaruMulaiDari) : undefined,
          kodeUnit: json.config.kodeUnit || undefined,
          whatsappAdmin: json.config.whatsappAdmin || undefined,
          enableMondayRule: json.config.enableMondayRule !== undefined ? String(json.config.enableMondayRule) !== 'false' : undefined,
          googleDriveFolderId: json.config.googleDriveFolderId || undefined,
          syncIntervalSeconds: json.config.syncIntervalSeconds ? Number(json.config.syncIntervalSeconds) : undefined,
          lastConfigUpdate: new Date().toISOString(),
        };
        if (json.config.daftarTimKerja) {
          try {
            const arr = JSON.parse(json.config.daftarTimKerja);
            if (Array.isArray(arr)) parsedConfig.daftarTimKerja = arr;
          } catch {}
        }
        if (json.config.pemetaanVerifikator) {
          try {
            const map = JSON.parse(json.config.pemetaanVerifikator);
            if (typeof map === 'object') parsedConfig.pemetaanVerifikator = map;
          } catch {}
        }
      }
      return {
        success: true,
        config: parsedConfig,
        items: Array.isArray(json.items) ? json.items : [],
      };
    }
    return { success: false, error: json.error || 'Gagal membaca sheet Pengaturan' };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Menyimpan seluruh konfigurasi terpusat ke Sheet Pengaturan
 */
export async function syncSaveSpreadsheetConfig(
  newConfig: AppConfig,
  actor?: UserProfile | { nama: string; role: string }
): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();
  const actorStr = actor ? `${actor.nama} (${actor.role})` : 'Administrator';

  const items: PengaturanItemSpreadsheet[] = [
    {
      kunci: 'nomorBaruMulaiDari',
      nilai: String(newConfig.nomorBaruMulaiDari || 367),
      kategori: 'Penomoran',
      deskripsi: 'Nomor urut surat baru mulai dari (Sheet Keluar26)',
      waktuUpdate: now,
      diupdateOleh: actorStr,
    },
    {
      kunci: 'kodeUnit',
      nilai: String(newConfig.kodeUnit || '6100'),
      kategori: 'Organisasi',
      deskripsi: 'Kode Unit Kerja BPS Provinsi Kalimantan Barat',
      waktuUpdate: now,
      diupdateOleh: actorStr,
    },
    {
      kunci: 'whatsappAdmin',
      nilai: String(newConfig.whatsappAdmin || '6281253817688'),
      kategori: 'Layanan',
      deskripsi: 'Nomor WhatsApp Admin untuk bantuan & permohonan',
      waktuUpdate: now,
      diupdateOleh: actorStr,
    },
    {
      kunci: 'enableMondayRule',
      nilai: String(newConfig.enableMondayRule !== false),
      kategori: 'Penomoran',
      deskripsi: 'Aturan otomatisasi nomor kosong hari Senin',
      waktuUpdate: now,
      diupdateOleh: actorStr,
    },
    {
      kunci: 'googleDriveFolderId',
      nilai: String(newConfig.googleDriveFolderId || '1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S'),
      kategori: 'Penyimpanan Drive',
      deskripsi: 'ID Folder Induk Google Drive untuk penyimpanan draf dan arsip digital',
      waktuUpdate: now,
      diupdateOleh: actorStr,
    },
    {
      kunci: 'daftarTimKerja',
      nilai: JSON.stringify(newConfig.daftarTimKerja || []),
      kategori: 'Master Data',
      deskripsi: 'Daftar resmi Tim Kerja BPS Provinsi Kalimantan Barat',
      waktuUpdate: now,
      diupdateOleh: actorStr,
    },
    {
      kunci: 'pemetaanVerifikator',
      nilai: JSON.stringify(newConfig.pemetaanVerifikator || {}),
      kategori: 'Tata Kelola',
      deskripsi: 'Pemetaan Tim Kerja terhadap Verifikator yang berwenang',
      waktuUpdate: now,
      diupdateOleh: actorStr,
    },
    {
      kunci: 'syncIntervalSeconds',
      nilai: String(newConfig.syncIntervalSeconds || 10),
      kategori: 'Sinkronisasi',
      deskripsi: 'Interval polling pembaruan realtime latar belakang (detik)',
      waktuUpdate: now,
      diupdateOleh: actorStr,
    },
  ];

  return sendAppsScriptAction('saveConfig', { items, diupdateOleh: actorStr }, newConfig);
}

/**
 * Menghapus berkas dari Google Drive via Google Apps Script backend
 */
export async function syncDeleteDriveFiles(
  fileIds: string[],
  context: { nomorRegistrasi?: string; nomorSurat?: string; perihal?: string },
  config: AppConfig,
  actor: UserProfile | { nama: string; role: string }
): Promise<{ success: boolean; deletedCount?: number; deletedIds?: string[]; failedIds?: any[]; error?: string }> {
  if (!fileIds || fileIds.length === 0) {
    return { success: true, deletedCount: 0, deletedIds: [] };
  }

  const payload = {
    fileIds,
    nomorRegistrasi: context.nomorRegistrasi || '-',
    nomorSurat: context.nomorSurat || '-',
    perihal: context.perihal || '-',
    actor: actor.nama,
    actorRole: actor.role,
  };

  const res = await sendAppsScriptAction('deleteDriveFiles', payload, config);
  if (res.success && res.data) {
    return {
      success: res.data.success !== false,
      deletedCount: res.data.deletedCount || 0,
      deletedIds: res.data.deletedIds || [],
      failedIds: res.data.failedIds || [],
      error: res.data.error,
    };
  }
  return { success: false, error: res.error || 'Gagal memproses penghapusan Google Drive' };
}

/**
 * Mencatat log aktivitas ke Google Spreadsheet Sheet LogAktivitas
 */
export async function syncLogActivity(
  activity: AktivitasNotifikasi,
  config: AppConfig
): Promise<{ success: boolean; error?: string }> {
  return sendAppsScriptAction('logActivity', {
    aktivitas: activity.tipeAktivitas || activity.tipe,
    pengguna: activity.pelaku || activity.aktor || 'Sistem',
    role: activity.rolePelaku || activity.roleAktor || '-',
    nomorRegistrasi: activity.nomorRegistrasi,
    nomorSurat: activity.nomorSurat,
    keterangan: activity.deskripsi || activity.pesan,
    statusDrive: '-',
  }, config);
}

/**
 * Sinkronisasi update surat keluar ke Google Spreadsheet
 */
export async function syncUpdateSurat(
  surat: SuratKeluar,
  config: AppConfig
): Promise<{ success: boolean; error?: string }> {
  return sendAppsScriptAction('updateSurat', surat, config);
}

/**
 * Sinkronisasi hapus surat keluar dari Google Spreadsheet
 */
export async function syncDeleteSurat(
  nomorUrut: number,
  nomorSuratLengkap: string,
  config: AppConfig
): Promise<{ success: boolean; error?: string }> {
  return sendAppsScriptAction('deleteSurat', { nomorUrut, nomorSuratLengkap }, config);
}

/**
 * Sinkronisasi hapus naskah dinas dari Google Spreadsheet
 */
export async function syncDeleteNaskah(
  nomorRegistrasi: string,
  id: string,
  config: AppConfig
): Promise<{ success: boolean; error?: string }> {
  return sendAppsScriptAction('deleteNaskah', { nomorRegistrasi, id }, config);
}

/**
 * Sinkronisasi update arsip digital ke Google Spreadsheet
 */
export async function syncUpdateArsip(
  nomorSuratResmi: string,
  data: Partial<DokumenFinal>,
  config: AppConfig
): Promise<{ success: boolean; error?: string }> {
  return sendAppsScriptAction('updateArsip', { nomorSuratResmi, ...data }, config);
}

/**
 * Sinkronisasi hapus arsip digital dari Google Spreadsheet
 */
export async function syncDeleteArsip(
  nomorSuratResmi: string,
  config: AppConfig
): Promise<{ success: boolean; error?: string }> {
  return sendAppsScriptAction('deleteArsip', { nomorSuratResmi }, config);
}

/**
 * Sinkronisasi simpan/update pengguna ke Google Spreadsheet (Sheet Pengguna)
 */
export async function syncSaveUser(
  user: UserProfile,
  config: AppConfig
): Promise<{ success: boolean; error?: string }> {
  return sendAppsScriptAction('saveUser', user, config);
}

/**
 * Sinkronisasi hapus pengguna dari Google Spreadsheet (Sheet Pengguna)
 */
export async function syncDeleteUser(
  userId: string,
  username: string,
  config: AppConfig
): Promise<{ success: boolean; error?: string }> {
  return sendAppsScriptAction('deleteUser', { id: userId, username }, config);
}
