import type {
  AppSettings,
  TeamMember,
  ShiftBlock,
  ValidationFlag,
  WeekAssignments,
} from '../types/schedule';
import { DAYS, DAY_LABELS } from '../types/schedule';
import { getCloserCount, getOpenerCountAt130 } from './coverage';
import { getMemberWeeklyHours, getWeeklyTotalHours } from './hours';

export function validateSchedule(
  assignments: WeekAssignments,
  members: TeamMember[],
  shiftBlocks: ShiftBlock[],
  settings: AppSettings,
): ValidationFlag[] {
  const flags: ValidationFlag[] = [];
  const blockMap = new Map(shiftBlocks.map((b) => [b.id, b]));

  for (const member of members) {
    const hours = getMemberWeeklyHours(member.id, assignments, shiftBlocks);
    if (hours > member.weeklyCap) {
      flags.push({
        id: `cap-${member.id}`,
        severity: 'error',
        message: `${member.name} over cap: ${hours}/${member.weeklyCap} hrs`,
      });
    } else if (hours > member.weeklyCap - 2) {
      flags.push({
        id: `cap-warn-${member.id}`,
        severity: 'warning',
        message: `${member.name} near cap: ${hours}/${member.weeklyCap} hrs`,
      });
    }

    for (const day of DAYS) {
      const assignment = assignments[member.id]?.[day] ?? 'OFF';
      if (assignment === 'OFF') continue;
      if (member.offDays.includes(day)) {
        flags.push({
          id: `offday-${member.id}-${day}`,
          severity: 'error',
          message: `${member.name} scheduled on ${DAY_LABELS[day]} (off day)`,
        });
      }
      if (member.noFridayNights && day === 'fri' && assignment.startsWith('close')) {
        flags.push({
          id: `fri-night-${member.id}`,
          severity: 'error',
          message: `${member.name} on Friday close (not allowed)`,
        });
      }
      if (!member.allowedShiftBlockIds.includes(assignment)) {
        flags.push({
          id: `block-${member.id}-${day}`,
          severity: 'error',
          message: `${member.name} has invalid shift on ${DAY_LABELS[day]}`,
        });
      }
    }
  }

  for (const day of DAYS) {
    const closerCount = getCloserCount(day, assignments, members, shiftBlocks);
    const targets = settings.closerTargets[day];
    if (closerCount < targets.min) {
      flags.push({
        id: `closer-${day}`,
        severity: day === 'sat' ? 'error' : 'error',
        message: `${DAY_LABELS[day]} close: ${closerCount} closers (need ${targets.min}+)`,
      });
    } else if (closerCount < targets.goal) {
      flags.push({
        id: `closer-warn-${day}`,
        severity: 'warning',
        message: `${DAY_LABELS[day]} close: ${closerCount} closers (target ${targets.goal})`,
      });
    }

    const openerCount = getOpenerCountAt130(day, assignments, members, shiftBlocks);
    if (openerCount < settings.openerMinAt130) {
      flags.push({
        id: `opener-${day}`,
        severity: 'error',
        message: `${DAY_LABELS[day]} 1:30 PM: ${openerCount} openers on clock (need ${settings.openerMinAt130})`,
      });
    }
  }

  const weeklyTotal = getWeeklyTotalHours(assignments, members, shiftBlocks);
  if (weeklyTotal > settings.weeklyHourBudget) {
    flags.push({
      id: 'weekly-budget',
      severity: 'error',
      message: `Week total: ${weeklyTotal} hrs (budget ${settings.weeklyHourBudget})`,
    });
  } else if (weeklyTotal > settings.weeklyHourBudget - 50) {
    flags.push({
      id: 'weekly-budget-warn',
      severity: 'warning',
      message: `Week total: ${weeklyTotal} hrs (budget ${settings.weeklyHourBudget})`,
    });
  }

  for (const day of DAYS) {
    let dailyHours = 0;
    for (const member of members) {
      const assignment = assignments[member.id]?.[day] ?? 'OFF';
      if (assignment === 'OFF') continue;
      const block = blockMap.get(assignment);
      if (block) dailyHours += block.hours;
    }
    if (dailyHours > settings.dailyHourTarget) {
      flags.push({
        id: `daily-${day}`,
        severity: 'warning',
        message: `${DAY_LABELS[day]}: ${dailyHours} hrs (target < ${settings.dailyHourTarget})`,
      });
    }
  }

  return flags;
}

export function hasErrors(flags: ValidationFlag[]): boolean {
  return flags.some((f) => f.severity === 'error');
}
