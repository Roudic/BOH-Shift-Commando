import type { CoverageSummary } from '../lib/coverage';
import { formatHourLabel } from '../lib/hours';
import { DAY_LABELS, type DayOfWeek } from '../types/schedule';

type Props = {
  summaries: CoverageSummary[];
  selectedDay: DayOfWeek;
  weeklyTotal: number;
  weeklyBudget: number;
  onSelectDay: (day: DayOfWeek) => void;
  onClose: () => void;
};

export function CoveragePanel({
  summaries,
  selectedDay,
  weeklyTotal,
  weeklyBudget,
  onSelectDay,
  onClose,
}: Props) {
  const summary = summaries.find((s) => s.day === selectedDay) ?? summaries[0]!;
  const peak = summary.headcount.reduce((m, p) => Math.max(m, p.count), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="w-full max-w-2xl max-h-[90vh] bg-cfa-surface border border-cfa-border rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-cfa-border">
          <h2 className="text-lg font-semibold">Coverage Panel</h2>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 min-h-[44px] rounded-lg border border-cfa-border"
          >
            Close
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          <div className="flex gap-2 flex-wrap">
            {summaries.map((s) => (
              <button
                key={s.day}
                type="button"
                onClick={() => onSelectDay(s.day)}
                className={`px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium border ${
                  s.day === selectedDay
                    ? 'bg-cfa-red border-cfa-red text-white'
                    : 'border-cfa-border text-cfa-muted'
                }`}
              >
                {DAY_LABELS[s.day]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Closers"
              value={`${summary.closerCount} / ${summary.closerGoal}`}
              ok={summary.closerCount >= summary.closerMin}
              warn={summary.closerCount >= summary.closerMin && summary.closerCount < summary.closerGoal}
            />
            <StatCard
              label="Openers @ 1:30p"
              value={`${summary.openerAt130} / ${summary.openerMin}`}
              ok={summary.openerAt130 >= summary.openerMin}
            />
            <StatCard
              label="Daily hours"
              value={`${summary.dailyHours} / ${summary.dailyTarget}`}
              ok={summary.dailyHours <= summary.dailyTarget}
              warn={summary.dailyHours > summary.dailyTarget}
            />
            <StatCard
              label="Weekly total"
              value={`${weeklyTotal} / ${weeklyBudget}`}
              ok={weeklyTotal <= weeklyBudget}
              warn={weeklyTotal > weeklyBudget}
            />
          </div>

          <div>
            <p className="text-sm text-cfa-muted mb-2">
              Hourly headcount — {DAY_LABELS[selectedDay]} (peak: {peak})
            </p>
            <div className="flex items-end gap-0.5 h-32 bg-cfa-bg rounded-xl p-3 border border-cfa-border">
              {summary.headcount.map((point) => {
                const height = peak > 0 ? (point.count / peak) * 100 : 0;
                return (
                  <div
                    key={point.hour}
                    className="flex-1 flex flex-col items-center justify-end min-w-0"
                    title={`${formatHourLabel(point.hour * 60)}: ${point.count}`}
                  >
                    <div
                      className={`w-full rounded-t transition-all ${
                        point.count >= 4 ? 'bg-cfa-green' : point.count >= 3 ? 'bg-cfa-yellow' : 'bg-cfa-red'
                      }`}
                      style={{ height: `${Math.max(height, point.count > 0 ? 8 : 2)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-cfa-muted mt-1 px-1">
              <span>5a</span>
              <span>12p</span>
              <span>11p</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  ok,
  warn,
}: {
  label: string;
  value: string;
  ok?: boolean;
  warn?: boolean;
}) {
  const color = warn ? 'border-cfa-yellow/50 text-cfa-yellow' : ok ? 'border-cfa-green/50 text-cfa-green' : 'border-cfa-red/50 text-cfa-red';
  return (
    <div className={`rounded-xl border p-3 ${color}`}>
      <p className="text-xs text-cfa-muted">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
