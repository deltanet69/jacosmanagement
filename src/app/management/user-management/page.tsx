import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "User Management & RBAC - JACOS Admin",
};

export default function UserManagementPage() {
  return (
    <UnderDevelopment
      title="User Management & Hak Akses (RBAC)"
      category="Other"
      description="Pengaturan akun pengguna, manajer hak akses berbasis peran (Superadmin, Tata Usaha, Guru, Bendahara, Wali Kelas), dan audit log aktivitas."
      iconName="shield-check"
      expectedFeatures={[
        "Manajemen data akun staf administrasi dan tenaga pendidik",
        "Role-Based Access Control (RBAC) dengan permission granular",
        "Pencatatan Audit Trail aktivitas login dan perubahan data sensitive",
        "Fitur reset password aman dan otentikasi dua faktor (2FA)"
      ]}
    />
  );
}
