import { redirect } from "next/navigation";

export default function LegacyGuruRedirect() {
  redirect("/management/hr/guru");
}
