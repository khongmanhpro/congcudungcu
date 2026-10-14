import { StoreHeader, StoreFooter, getSettings } from "@/components/store/layout";
import { FloatingContact } from "@/components/store/floating-contact";
import { JsonLd, siteJsonLd } from "@/lib/seo";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <>
      <JsonLd data={siteJsonLd(settings)} />
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
      <FloatingContact
        hotline={settings.contact_hotline || "0978.39.03.39"}
        zalo={settings.contact_zalo}
        messenger={settings.social_messenger}
        facebook={settings.social_facebook}
      />
    </>
  );
}
