import { prisma } from "@/lib/prisma";
import { MediaManager } from "./media-manager";
import { Image as ImageIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Media Library</h1>
        <p className="text-sm text-muted-foreground">{media.length} ảnh/tệp</p>
      </div>
      {media.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center text-muted-foreground">
          <ImageIcon className="mx-auto mb-2 h-8 w-8 opacity-50" />
          Chưa có media nào. Thêm ảnh bằng URL bên dưới.
        </div>
      ) : null}
      <MediaManager initialMedia={media.map((m) => ({ id: m.id, url: m.url, alt: m.alt, type: m.type, createdAt: m.createdAt.toISOString() }))} />
    </div>
  );
}
