"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { formatVND } from "@/lib/format";

interface DataPoint { month: string; revenue: number; orders: number }

export function RevenueChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="left"
            tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`}
            tick={{ fontSize: 12 }}
          />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value, name) => {
              const v = typeof value === "number" ? value : Number(value);
              return name === "revenue" ? [formatVND(v), "Doanh thu"] : [v, "Đơn hàng"];
            }}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 12 }}
          />
          <Bar yAxisId="left" dataKey="revenue" fill="#e35e14" radius={[4, 4, 0, 0]} name="revenue" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="orders"
            stroke="#16a34a"
            strokeWidth={2}
            name="orders"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
