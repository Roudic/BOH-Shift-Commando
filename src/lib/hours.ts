import type { DayOfWeek, ShiftBlock, TeamMember, WeekAssignments } from '../types/schedule';
import { DAYS } from '../types/schedule';

export function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function formatHourLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const ampm = h >= 12 ? 'p' : 'a';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${ampm}`;
}

export function isWorkingAtTime(block: ShiftBlock, minuteOfDay: number): boolean {
  const start = parseTime(block.start);
  let end = parseTime(block.end);
  if (end <= start) end += 24 * 60;
  return minuteOfDay >= start && minuteOfDay < end;
}

export function getMemberWeeklyHours(
  memberId: string,
  assignments: WeekAssignments,
  shiftBlocks: ShiftBlock[],
): number {
  const blockMap = new Map(shiftBlocks.map((b) => [b.id, b]));
  const memberDays = assignments[memberId] ?? {};
  let total = 0;
  for (const day of DAYS) {
    const assignment = memberDays[day] ?? 'OFF';
    if (assignment === 'OFF') continue;
    const block = blockMap.get(assignment);
    if (block) total += block.hours;
  }
  return total;
}

export function getDailyHours(
  day: DayOfWeek,
  assignments: WeekAssignments,
  members: TeamMember[],
  shiftBlocks: ShiftBlock[],
): number {
  const blockMap = new Map(shiftBlocks.map((b) => [b.id, b]));
  let total = 0;
  for (const member of members) {
    const assignment = assignments[member.id]?.[day] ?? 'OFF';
    if (assignment === 'OFF') continue;
    const block = blockMap.get(assignment);
    if (block) total += block.hours;
  }
  return total;
}

export function getWeeklyTotalHours(
  assignments: WeekAssignments,
  members: TeamMember[],
  shiftBlocks: ShiftBlock[],
): number {
  return DAYS.reduce(
    (sum, day) => sum + getDailyHours(day, assignments, members, shiftBlocks),
    0,
  );
}

export function createEmptyAssignments(members: TeamMember[]): WeekAssignments {
  const assignments: WeekAssignments = {};
  for (const member of members) {
    assignments[member.id] = {
      mon: 'OFF',
      tue: 'OFF',
      wed: 'OFF',
      thu: 'OFF',
      fri: 'OFF',
      sat: 'OFF',
    };
  }
  return assignments;
}

export function getMondayOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T12:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 5);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function canAssignShift(
  member: TeamMember,
  day: DayOfWeek,
  blockId: string,
): boolean {
  if (member.offDays.includes(day)) return false;
  if (member.noFridayNights && day === 'fri' && blockId.startsWith('close')) return false;
  return member.allowedShiftBlockIds.includes(blockId);
}

export function getNextAssignment(
  member: TeamMember,
  day: DayOfWeek,
  current: string,
  _shiftBlocks: ShiftBlock[],
): string {
  const options = ['OFF', ...member.allowedShiftBlockIds.filter((id) => {
    if (member.noFridayNights && day === 'fri' && id.startsWith('close')) return false;
    return true;
  })];
  if (member.offDays.includes(day)) return 'OFF';
  const idx = options.indexOf(current);
  const nextIdx = idx === -1 ? 0 : (idx + 1) % options.length;
  return options[nextIdx] ?? 'OFF';
}

export function getShiftBlockColor(type: ShiftBlock['type']): string {
  switch (type) {
    case 'close':
      return 'bg-cfa-red/25 border-cfa-red/50 text-cfa-red';
    case 'open':
      return 'bg-blue-500/20 border-blue-500/40 text-blue-300';
    case 'breakfast':
      return 'bg-amber-500/20 border-amber-500/40 text-amber-300';
    case 'mid':
      return 'bg-purple-500/20 border-purple-500/40 text-purple-300';
    default:
      return 'bg-cfa-border text-cfa-muted';
  }
}
