import { Fragment, useMemo, useState } from 'react';
import { CREW_LABELS } from '../data/defaultRoster';
import { getCloserCount } from '../lib/coverage';
import {
  formatWeekRange,
  getMemberWeeklyHours,
  getNextAssignment,
} from '../lib/hours';
import type { DayOfWeek, ShiftBlock, TeamMember, ViewMode, WeekAssignments } from '../types/schedule';
import { DAYS, DAY_LABELS } from '../types/schedule';
import { ShiftPill } from './ShiftPill';
import { ShiftPicker } from './ShiftPicker';

type Props = {
  weekStart: string;
  members: TeamMember[];
  shiftBlocks: ShiftBlock[];
  assignments: WeekAssignments;
  viewMode: ViewMode;
  closerTargets: Record<DayOfWeek, { min: number; goal: number }>;
  onAssign: (memberId: string, day: DayOfWeek, value: string) => void;
  onWeekChange: (direction: -1 | 1) => void;
};

export function WeekGrid({
  weekStart,
  members,
  shiftBlocks,
  assignments,
  viewMode,
  closerTargets,
  onAssign,
  onWeekChange,
}: Props) {
  const readOnly = viewMode === 'team';
  const blockMap = useMemo(() => new Map(shiftBlocks.map((b) => [b.id, b])), [shiftBlocks]);
  const [picker, setPicker] = useState<{
    memberId: string;
    day: DayOfWeek;
  } | null>(null);

  const grouped = useMemo(() => {
    const groups: { crew: TeamMember['crew']; members: TeamMember[] }[] = [];
    const crews: TeamMember['crew'][] = ['close', 'open', 'sl'];
    for (const crew of crews) {
      const crewMembers = members.filter((m) => m.crew === crew);
      if (crewMembers.length > 0) groups.push({ crew, members: crewMembers });
    }
    return groups;
  }, [members]);

  const closerCounts = useMemo(
    () =>
      DAYS.map((day) => ({
        day,
        count: getCloserCount(day, assignments, members, shiftBlocks),
        targets: closerTargets[day],
      })),
    [assignments, members, shiftBlocks, closerTargets],
  );

  const handleCellClick = (member: TeamMember, day: DayOfWeek) => {
    if (readOnly || member.offDays.includes(day)) return;
    const current = assignments[member.id]?.[day] ?? 'OFF';
    const next = getNextAssignment(member, day, current, shiftBlocks);
    onAssign(member.id, day, next);
  };

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <div className="flex items-center justify-between mb-3 min-w-[720px]">
        <button
          type="button"
          onClick={() => onWeekChange(-1)}
          className="px-4 py-3 min-h-[44px] rounded-lg border border-cfa-border"
        >
          ← Prev
        </button>
        <span className="font-semibold">{formatWeekRange(weekStart)}</span>
        <button
          type="button"
          onClick={() => onWeekChange(1)}
          className="px-4 py-3 min-h-[44px] rounded-lg border border-cfa-border"
        >
          Next →
        </button>
      </div>

      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="border-b border-cfa-border">
            <th className="text-left py-2 pr-2 text-sm text-cfa-muted w-28 sticky left-0 bg-cfa-bg z-10">
              Name
            </th>
            {DAYS.map((day) => (
              <th key={day} className="py-2 px-1 text-xs text-cfa-muted font-medium">
                {DAY_LABELS[day]}
              </th>
            ))}
            <th className="py-2 px-1 text-xs text-cfa-muted w-14">Hrs</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(({ crew, members: crewMembers }) => (
            <Fragment key={crew}>
              <tr key={`header-${crew}`}>
                <td
                  colSpan={DAYS.length + 2}
                  className="pt-4 pb-1 text-xs font-semibold text-cfa-red uppercase tracking-wide"
                >
                  {CREW_LABELS[crew]}
                </td>
              </tr>
              {crewMembers.map((member) => {
                const hours = getMemberWeeklyHours(member.id, assignments, shiftBlocks);
                const overCap = hours > member.weeklyCap;
                return (
                  <tr key={member.id} className="border-b border-cfa-border/50">
                    <td className="py-1 pr-2 sticky left-0 bg-cfa-bg z-10">
                      <div className="text-sm font-medium truncate max-w-[7rem]">{member.name}</div>
                      <div className="text-[10px] text-cfa-muted">{member.role}</div>
                    </td>
                    {DAYS.map((day) => {
                      const assignment = assignments[member.id]?.[day] ?? 'OFF';
                      const isOffDay = member.offDays.includes(day);
                      const block =
                        assignment !== 'OFF' ? blockMap.get(assignment) : undefined;

                      return (
                        <td key={day} className="p-0.5">
                          {isOffDay ? (
                            <div className="min-h-[44px] flex items-center justify-center text-[10px] text-cfa-muted/40 bg-cfa-bg rounded-lg border border-dashed border-cfa-border/30">
                              off
                            </div>
                          ) : (
                            <ShiftPill
                              label={block?.label ?? 'OFF'}
                              type={block?.type}
                              compact
                              isOff={assignment === 'OFF'}
                              readOnly={readOnly}
                              onClick={() => handleCellClick(member, day)}
                              onLongPress={() =>
                                !readOnly && setPicker({ memberId: member.id, day })
                              }
                            />
                          )}
                        </td>
                      );
                    })}
                    <td
                      className={`py-1 px-1 text-center text-sm font-semibold ${
                        overCap ? 'text-cfa-red' : hours > member.weeklyCap - 2 ? 'text-cfa-yellow' : 'text-cfa-green'
                      }`}
                    >
                      {hours}
                    </td>
                  </tr>
                );
              })}
            </Fragment>
          ))}

          <tr className="border-t-2 border-cfa-border">
            <td className="py-2 pr-2 text-xs font-semibold text-cfa-muted sticky left-0 bg-cfa-bg">
              Closers
            </td>
            {closerCounts.map(({ day, count, targets }) => {
              const isBad = count < targets.min || (day === 'sat' && count < 4);
              const isWarn = !isBad && count < targets.goal;
              return (
                <td
                  key={day}
                  className={`py-2 text-center text-sm font-bold ${
                    isBad ? 'text-cfa-red' : isWarn ? 'text-cfa-yellow' : 'text-cfa-green'
                  }`}
                >
                  {count}
                </td>
              );
            })}
            <td />
          </tr>
        </tbody>
      </table>

      {picker && (
        <ShiftPicker
          member={members.find((m) => m.id === picker.memberId)!}
          day={picker.day}
          shiftBlocks={shiftBlocks}
          current={assignments[picker.memberId]?.[picker.day] ?? 'OFF'}
          onSelect={(value) => {
            onAssign(picker.memberId, picker.day, value);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
