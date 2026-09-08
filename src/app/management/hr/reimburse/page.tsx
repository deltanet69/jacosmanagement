import { getHrReimburseData } from "./actions";
import { ReimburseListClient } from "@/components/hr/ReimburseListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reimbursement Management - JACOS HR",
  description:
    "Pengajuan, persetujuan (approval), pemeriksaan bukti struk/kuitansi, dan pelacakan pembayaran reimburse operasional staf JACOS.",
};

export default async function HrReimbursePage() {
  const result = await getHrReimburseData();

  return (
    <div className="max-w-full mx-auto pb-12 w-full">
      <ReimburseListClient
        initialReimbursements={result.data.reimbursements || []}
        employees={result.data.employees || []}
        initialStats={result.data.stats}
      />
    </div>
  );
}
