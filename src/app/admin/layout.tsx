import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { AdminShell } from "./admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    redirect("/login?next=/admin");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
