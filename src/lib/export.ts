import type {
  AppSettings,
  TeamMember,
  ShiftBlock,
  ValidationFlag,
  WeekAssignments,
} from '../types/schedule';
import { DAYS, DAY_LABELS } from '../types/schedule';
import { getAllCoverageSummaries } from './coverage';
import { formatWeekRange, getMemberWeeklyHours, getWeeklyTotalHours } from './hours';
import { hasErrors } from './validate';

export function exportCsv(
  _weekStart: string,
  assignments: WeekAssignments,
  members: TeamMember[],
  shiftBlocks: ShiftBlock[],
): string {
  const headers = ['Name', 'Role', 'Crew', ...DAYS.map((d) => DAY_LABELS[d]), 'Weekly Hrs'];
  const rows = members.map((member) => {
    const days = DAYS.map((d) => {
      const a = assignments[member.id]?.[d] ?? 'OFF';
      const block = shiftBlocks.find((b) => b.id === a);
      if (a === 'OFF') return 'OFF';
      return block ? `${block.label} (${block.hours}h)` : a;
    });
    const hours = getMemberWeeklyHours(member.id, assignments, shiftBlocks);
    return [member.name, member.role, member.crew, ...days, String(hours)];
  });

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

export function exportSlackSummary(
  weekStart: string,
  assignments: WeekAssignments,
  members: TeamMember[],
  shiftBlocks: ShiftBlock[],
  settings: AppSettings,
  flags: ValidationFlag[],
): string {
  const lines: string[] = [];
  lines.push(`*BOH Schedule — ${formatWeekRange(weekStart)}*`);
  lines.push(`Store #03339 Vestavia Hills`);
  lines.push('');

  const weeklyTotal = getWeeklyTotalHours(assignments, members, shiftBlocks);
  lines.push(
    `*Weekly hours:* ${weeklyTotal} / ${settings.weeklyHourBudget} budget`,
  );
  lines.push(`*SPLH goal:* $${settings.splhGoal}`);
  lines.push('');

  const summaries = getAllCoverageSummaries(
    assignments,
    members,
    shiftBlocks,
    settings,
  );
  lines.push('*Closer counts:*');
  for (const s of summaries) {
    const icon = s.closerCount >= s.closerGoal ? '✓' : s.closerCount >= s.closerMin ? '⚠' : '✗';
    lines.push(
      `${icon} ${DAY_LABELS[s.day]}: ${s.closerCount} closers (min ${s.closerMin}, goal ${s.closerGoal})`,
    );
  }
  lines.push('');

  lines.push('*1:30 PM opener coverage:*');
  for (const s of summaries) {
    const icon = s.openerAt130 >= s.openerMin ? '✓' : '✗';
    lines.push(
      `${icon} ${DAY_LABELS[s.day]}: ${s.openerAt130} openers (need ${s.openerMin})`,
    );
  }
  lines.push('');

  if (flags.length > 0) {
    lines.push(`*Validation (${hasErrors(flags) ? 'BLOCKED' : 'warnings'}):*`);
    for (const f of flags) {
      lines.push(`${f.severity === 'error' ? '🔴' : '🟡'} ${f.message}`);
    }
    lines.push('');
  } else {
    lines.push('✓ No validation issues — ready for HotSchedules entry');
    lines.push('');
  }

  lines.push('*Per-person hours:*');
  for (const member of members) {
    const hrs = getMemberWeeklyHours(member.id, assignments, shiftBlocks);
    const status = hrs > member.weeklyCap ? '🔴' : hrs > member.weeklyCap - 2 ? '🟡' : '✓';
    lines.push(`${status} ${member.name}: ${hrs}/${member.weeklyCap} hrs`);
  }

  return lines.join('\n');
}

export function downloadText(content: string, filename: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportJson(state: unknown): string {
  return JSON.stringify(state, null, 2);
}
