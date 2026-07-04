"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatVND } from "@/lib/format";

interface DataPoint { label: string; revenue: number }

export function DashboardChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0757c9" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#0757c9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}tr`} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [formatVND(Number(value)), "Doanh thu"]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 12 }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#0757c9" strokeWidth={2} fill="url(#revGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
