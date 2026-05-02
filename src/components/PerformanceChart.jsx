import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-bold">{label}</p>
      <p className="text-emerald-400 font-semibold mt-0.5">
        Alpha: {payload[0]?.value?.toFixed(1)}
      </p>
      {d?.action && (
        <p className={`mt-0.5 font-medium ${
          d.action === 'EXECUTED' ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          {d.action.replace('REJECTED_', '').replace('_', ' ')}
        </p>
      )}
    </div>
  );
};

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  const color = payload.action === 'EXECUTED' ? '#10b981' : '#f43f5e';
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} strokeWidth={0} />;
};

export default function PerformanceChart({ evaluations = [] }) {
  const data = [...evaluations]
    .reverse()
    .map((e) => {
      const raw = e.final_alpha_score ?? e.total_consensus_score ?? 0;
      return {
        name: e.ticker,
        score: parseFloat((raw > 1 ? raw : raw * 100).toFixed(1)),
        action: e.action_taken,
      };
    });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Alpha Score Trend</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {data.length} evaluations · threshold at 65
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Executed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            Rejected
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-52 flex items-center justify-center">
          <p className="text-sm text-slate-600">
            No evaluations yet — evaluate a ticker to populate this chart.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="alphaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              ticks={[0, 25, 50, 65, 75, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={65}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{ value: '65', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#alphaGrad)"
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
