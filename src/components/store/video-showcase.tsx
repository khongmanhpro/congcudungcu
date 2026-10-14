"use client";

import { useState } from "react";
import { Play } from "lucide-react";

export type ShowcaseVideo = { id: string; title: string };

/** Video lớn bên trái + danh sách video bên phải (bấm để đổi video đang phát). */
export function VideoShowcase({ videos, channelUrl, channelName }: { videos: ShowcaseVideo[]; channelUrl?: string; channelName: string }) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const video = videos[current];
  if (!video) return null;

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_440px]">
      <div className="overflow-hidden rounded-md border border-gold/70">
        <div className="relative aspect-video bg-black">
          {playing ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1`}
              title={video.title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0" aria-label={`Phát video ${video.title}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt={video.title} className="h-full w-full object-cover" />
              <span className="absolute left-1/2 top-1/2 grid h-12 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-black/70 text-white transition group-hover:bg-[#ff0000]">
                <Play className="h-6 w-6 fill-current" />
              </span>
            </button>
          )}
        </div>
        <div className="space-y-2 bg-white p-3">
          <h3 className="line-clamp-1 text-base font-bold text-[#0f172a]">{video.title}</h3>
          <p className="text-xs text-[#475569]"><strong className="text-brand">{channelName}</strong></p>
          {channelUrl && (
            <div className="flex gap-2">
              <a href={channelUrl} target="_blank" rel="noopener" className="rounded-md border border-[#0f172a] px-2.5 py-1 text-xs font-bold text-[#0f172a] hover:bg-[#f1f5f9]">Mở kênh</a>
              <a href={channelUrl} target="_blank" rel="noopener" className="rounded-md bg-price px-2.5 py-1 text-xs font-bold text-white hover:brightness-110">Like &amp; Subscribe</a>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 rounded-md border border-gold/70 bg-white p-2">
        {videos.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setCurrent(index);
              setPlaying(true);
            }}
            className={`flex w-full gap-3 rounded-md border p-1 text-left transition ${index === current ? "border-gold bg-gold/10" : "border-gold/50 hover:border-gold"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`} alt={item.title} className="aspect-video w-32 shrink-0 rounded object-cover" />
            <span className="line-clamp-3 py-1 text-xs font-bold leading-4 text-[#0f172a]">{item.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
