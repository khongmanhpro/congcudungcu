import { StoreHeader, StoreFooter, getSettings } from "@/components/store/layout";
import { FloatingContact } from "@/components/store/floating-contact";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <>
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
      <FloatingContact
        hotline={settings.contact_hotline || "0978.39.03.39"}
        zalo={settings.contact_zalo}
        messenger={settings.social_messenger}
      />
    </>
  );
}
