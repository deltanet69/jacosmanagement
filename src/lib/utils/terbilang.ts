/**
 * Konversi angka rupiah ke kata terbilang Bahasa Indonesia
 * Contoh: 7200000 -> "Tujuh Juta Dua Ratus Ribu Rupiah"
 */
export function angkaKeTerbilang(nominal: number): string {
  if (nominal === 0) return "Nol Rupiah";
  
  const satuan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  function sebut(angka: number): string {
    angka = Math.floor(Math.abs(angka));
    let hasil = "";

    if (angka < 12) {
      hasil = " " + satuan[angka];
    } else if (angka < 20) {
      hasil = sebut(angka - 10) + " Belas";
    } else if (angka < 100) {
      hasil = sebut(Math.floor(angka / 10)) + " Puluh" + sebut(angka % 10);
    } else if (angka < 200) {
      hasil = " Seratus" + sebut(angka - 100);
    } else if (angka < 1000) {
      hasil = sebut(Math.floor(angka / 100)) + " Ratus" + sebut(angka % 100);
    } else if (angka < 2000) {
      hasil = " Seribu" + sebut(angka - 1000);
    } else if (angka < 1000000) {
      hasil = sebut(Math.floor(angka / 1000)) + " Ribu" + sebut(angka % 1000);
    } else if (angka < 1000000000) {
      hasil = sebut(Math.floor(angka / 1000000)) + " Juta" + sebut(angka % 1000000);
    } else if (angka < 1000000000000) {
      hasil = sebut(Math.floor(angka / 1000000000)) + " Miliar" + sebut(angka % 1000000000);
    } else if (angka < 1000000000000000) {
      hasil = sebut(Math.floor(angka / 1000000000000)) + " Triliun" + sebut(angka % 1000000000000);
    }

    return hasil;
  }

  const hasilKata = sebut(nominal).trim();
  return `${hasilKata} Rupiah`;
}

export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
