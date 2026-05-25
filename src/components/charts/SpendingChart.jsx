import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { currency, monthLabel } from "../../lib/formatters.js";

export function SpendingChart({ data, dataKey = "spent" }) {
  const chartData = data.map((item) => ({
    ...item,
    label: monthLabel(item.month)
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid stroke="#d9ded8" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(value) => currency.format(value)} tickLine={false} axisLine={false} width={88} />
          <Tooltip formatter={(value) => currency.format(value)} cursor={{ fill: "#f6f3ed" }} />
          <Bar dataKey={dataKey} fill="#315f8f" radius={[6, 6, 2, 2]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
