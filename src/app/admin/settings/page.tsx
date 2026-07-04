import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await prisma.setting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt</h1>
        <p className="text-sm text-muted-foreground">Thông tin cửa hàng, liên hệ, SEO</p>
      </div>
      <SettingsForm initial={map} />
    </div>
  );
}
