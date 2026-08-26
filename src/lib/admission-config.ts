// ==============================================================================
// KONFIGURASI RANGE BULAN & PERIODE BATCH APPROVAL ADMISI
// ==============================================================================
// Catatan untuk Developer / Admin:
// Anda dapat dengan mudah mengubah range bulan, label, maupun deskripsi masing-masing
// batch pada objek BATCH_CONFIG di bawah ini.
//
// Format Bulan: 1 = Januari, 2 = Februari, ..., 11 = November, 12 = Desember.
// ==============================================================================

export type AdmissionBatchKey = "BATCH_1" | "BATCH_2" | "BATCH_3";

export interface BatchConfigItem {
  key: AdmissionBatchKey;
  label: string;
  subLabel: string;
  periodLabel: string;
  description: string;
  // >>> EDIT RANGE BULAN DI SINI <<<
  // Angka bulan di mana batch ini aktif secara default (1-12)
  activeMonths: number[];
  theme: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    gradient: string;
  };
}

export const BATCH_CONFIG: Record<AdmissionBatchKey, BatchConfigItem> = {
  BATCH_1: {
    key: "BATCH_1",
    label: "Batch 1",
    subLabel: "Gelombang Pertama",
    periodLabel: "Sekarang – September", // <-- Ubah label periode di sini jika perlu
    description: "Pendaftaran dan approval gelombang awal (Juli - September)",
    // >>> Range Bulan Batch 1: Juni (6) s.d November (11) <<<
    activeMonths: [6, 7, 8, 9],
    theme: {
      bg: "bg-sky-50",
      border: "border-sky-200",
      text: "text-sky-700",
      badge: "bg-sky-100 text-sky-700 border-sky-300",
      gradient: "from-sky-500 to-sky-600",
    },
  },
  BATCH_2: {
    key: "BATCH_2",
    label: "Batch 2",
    subLabel: "Gelombang Kedua",
    periodLabel: "Oktober – Desember", // <-- Ubah label periode di sini jika perlu
    description: "Pendaftaran dan approval gelombang pertengahan (Oktober - Desember)",
    // >>> Range Bulan Batch 2: Desember (12), Januari (1), Februari (2) <<<
    activeMonths: [10, 11, 12],
    theme: {
      bg: "bg-leaf-50",
      border: "border-leaf-200",
      text: "text-leaf-700",
      badge: "bg-leaf-100 text-leaf-700 border-leaf-300",
      gradient: "from-leaf-500 to-leaf-600",
    },
  },
  BATCH_3: {
    key: "BATCH_3",
    label: "Batch 3",
    subLabel: "Gelombang Ketiga",
    periodLabel: "Januari – Maret", // <-- Ubah label periode di sini jika perlu
    description: "Pendaftaran dan approval gelombang akhir (Januari - Maret)",
    // >>> Range Bulan Batch 3: Maret (3), April (4), Mei (5) <<<
    activeMonths: [12, 1, 2],
    theme: {
      bg: "bg-gold-50",
      border: "border-gold-200",
      text: "text-gold-700",
      badge: "bg-gold-100 text-gold-700 border-gold-300",
      gradient: "from-gold-400 to-gold-500",
    },
  },
};

export const BATCH_LIST = Object.values(BATCH_CONFIG);

/**
 * Mendapatkan key batch yang sedang aktif secara otomatis berdasarkan tanggal/bulan hari ini.
 * Default: "BATCH_1"
 */
export function getCurrentActiveBatch(date: Date = new Date()): AdmissionBatchKey {
  const currentMonth = date.getMonth() + 1; // 1 - 12
  for (const item of BATCH_LIST) {
    if (item.activeMonths.includes(currentMonth)) {
      return item.key;
    }
  }
  return "BATCH_1";
}

/**
 * Mendapatkan detail informasi batch berdasarkan key
 */
export function getBatchInfo(key?: string | null): BatchConfigItem {
  if (key && key in BATCH_CONFIG) {
    return BATCH_CONFIG[key as AdmissionBatchKey];
  }
  return BATCH_CONFIG.BATCH_1;
}

/**
 * Format label batch untuk tampilan tabel dan detail
 */
export function formatBatchLabel(key?: string | null): string {
  if (!key) return "Batch 1";
  const item = getBatchInfo(key);
  return `${item.label} (${item.periodLabel})`;
}
