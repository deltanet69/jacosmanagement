import { getHrLeaveData } from "./actions";
import { PerizinanListClient } from "@/components/hr/PerizinanListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Perizinan & Cuti HR - JACOS Management",
  description: "Pusat manajemen permohonan cuti, izin sakit, dinas luar, dan kuota saldo cuti karyawan JACOS",
};

export default async function HrPerizinanPage() {
  const result = await getHrLeaveData();

  return (
    <div className="max-w-full mx-auto pb-12 w-full">
      <PerizinanListClient
        initialRequests={result.requests || []}
        initialBalances={result.balances || []}
        leaveTypes={result.leaveTypes || []}
        employees={result.employees || []}
        initialStats={
          result.stats || {
            totalPending: 0,
            totalApprovedThisMonth: 0,
            totalRejectedThisMonth: 0,
            activeLeaveToday: 0,
            totalEmployees: 0,
          }
        }
      />
    </div>
  );
}
