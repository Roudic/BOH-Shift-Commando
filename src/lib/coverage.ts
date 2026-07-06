import type {
  AppSettings,
  DayOfWeek,
  HeadcountPoint,
  ShiftBlock,
  TeamMember,
  WeekAssignments,
} from '../types/schedule';
import { DAYS } from '../types/schedule';
import { getDailyHours, isWorkingAtTime, parseTime } from './hours';

export function getCloserCount(
  day: DayOfWeek,
  assignments: WeekAssignments,
  members: TeamMember[],
  shiftBlocks: ShiftBlock[],
): number {
  const blockMap = new Map(shiftBlocks.map((b) => [b.id, b]));
  let count = 0;
  for (const member of members) {
    const assignment = assignments[member.id]?.[day] ?? 'OFF';
    if (assignment === 'OFF') continue;
    const block = blockMap.get(assignment);
    if (block?.type === 'close') count++;
  }
  return count;
}

export function coversOpenerWindow(block: ShiftBlock): boolean {
  const endMinutes = parseTime(block.end);
  const startMinutes = parseTime(block.start);
  if (block.type !== 'open' && block.type !== 'breakfast') return false;
  return endMinutes > 13 * 60 || (startMinutes <= 13 * 60 && endMinutes >= 14 * 60);
}

export function getOpenerCountAt130(
  day: DayOfWeek,
  assignments: WeekAssignments,
  members: TeamMember[],
  shiftBlocks: ShiftBlock[],
): number {
  const blockMap = new Map(shiftBlocks.map((b) => [b.id, b]));
  const checkMinute = 13 * 60 + 30;
  let count = 0;
  for (const member of members) {
    const assignment = assignments[member.id]?.[day] ?? 'OFF';
    if (assignment === 'OFF') continue;
    const block = blockMap.get(assignment);
    if (!block) continue;
    if ((block.type === 'open' || block.type === 'breakfast') && isWorkingAtTime(block, checkMinute)) {
      count++;
    }
  }
  return count;
}

export function getHourlyHeadcount(
  day: DayOfWeek,
  assignments: WeekAssignments,
  members: TeamMember[],
  shiftBlocks: ShiftBlock[],
): HeadcountPoint[] {
  const blockMap = new Map(shiftBlocks.map((b) => [b.id, b]));
  const points: HeadcountPoint[] = [];
  for (let hour = 5; hour <= 23; hour++) {
    const minute = hour * 60;
    let count = 0;
    for (const member of members) {
      const assignment = assignments[member.id]?.[day] ?? 'OFF';
      if (assignment === 'OFF') continue;
      const block = blockMap.get(assignment);
      if (block && isWorkingAtTime(block, minute)) count++;
    }
    points.push({ hour, count });
  }
  return points;
}

export function getPeakHeadcount(points: HeadcountPoint[]): number {
  return points.reduce((max, p) => Math.max(max, p.count), 0);
}

export type CoverageSummary = {
  day: DayOfWeek;
  closerCount: number;
  closerMin: number;
  closerGoal: number;
  openerAt130: number;
  openerMin: number;
  dailyHours: number;
  dailyTarget: number;
  headcount: HeadcountPoint[];
};

export function getCoverageSummary(
  day: DayOfWeek,
  assignments: WeekAssignments,
  members: TeamMember[],
  shiftBlocks: ShiftBlock[],
  settings: AppSettings,
): CoverageSummary {
  const targets = settings.closerTargets[day];
  return {
    day,
    closerCount: getCloserCount(day, assignments, members, shiftBlocks),
    closerMin: targets.min,
    closerGoal: targets.goal,
    openerAt130: getOpenerCountAt130(day, assignments, members, shiftBlocks),
    openerMin: settings.openerMinAt130,
    dailyHours: getDailyHours(day, assignments, members, shiftBlocks),
    dailyTarget: settings.dailyHourTarget,
    headcount: getHourlyHeadcount(day, assignments, members, shiftBlocks),
  };
}

export function getAllCoverageSummaries(
  assignments: WeekAssignments,
  members: TeamMember[],
  shiftBlocks: ShiftBlock[],
  settings: AppSettings,
): CoverageSummary[] {
  return DAYS.map((day) =>
    getCoverageSummary(day, assignments, members, shiftBlocks, settings),
  );
}
