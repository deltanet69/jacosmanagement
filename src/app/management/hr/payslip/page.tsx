import { getPayslipManagementData } from "./actions";
import { PayslipListClient } from "@/components/hr/PayslipListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Payslip & Payroll Management - JACOS HR",
  description:
    "Pengelolaan slip gaji, master komponen gaji tetap/variabel, integrasi KPI & lembur, serta cetak slip resmi JACOS.",
};

export default async function HrPayslipPage() {
  const result = await getPayslipManagementData();

  return (
    <div className="max-w-full mx-auto pb-12 w-full">
      <PayslipListClient
        initialPayslips={result.data.payslips || []}
        initialSalaryComponents={result.data.salaryComponents || []}
        employees={result.data.employees || []}
        initialStats={result.data.summaryStats}
        currentMonth={result.data.currentMonth}
        currentYear={result.data.currentYear}
      />
    </div>
  );
}
