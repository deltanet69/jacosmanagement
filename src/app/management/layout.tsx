import { DashboardSidebar } from "@/components/shared/DashboardSidebar";
import { TopNav } from "@/components/shared/TopNav";

export const metadata = {
  title: "Dashboard - JACOS",
  description: "Management Dashboard for JACOS",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-cloud text-ink font-body">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-cloud p-4 sm:p-6 lg:p-8 2xl:p-10">
          <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
