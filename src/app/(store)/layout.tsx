import { StoreHeader, StoreFooter } from "@/components/store/layout";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </>
  );
}
