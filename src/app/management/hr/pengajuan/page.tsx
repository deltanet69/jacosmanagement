import { getHrItemRequestsData } from "./actions";
import { PengajuanListClient } from "@/components/hr/PengajuanListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengajuan Barang & Lisensi - JACOS HR",
  description:
    "Manajemen permohonan kebutuhan sarana prasarana, perangkat hardware, lisensi software, ATK, dan perlengkapan kelas guru & staf.",
};

export default async function HrPengajuanPage() {
  const result = await getHrItemRequestsData();

  return (
    <div className="max-w-full mx-auto pb-12 w-full">
      <PengajuanListClient
        initialRequests={result.data.itemRequests || []}
        employees={result.data.employees || []}
        initialStats={result.data.summaryStats}
      />
    </div>
  );
}
