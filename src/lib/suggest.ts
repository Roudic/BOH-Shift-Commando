import type {
  AppSettings,
  DayOfWeek,
  ShiftBlock,
  TeamMember,
  WeekAssignments,
} from '../types/schedule';
import { DAYS } from '../types/schedule';
import { getCloserCount, getOpenerCountAt130 } from './coverage';
import { canAssignShift, createEmptyAssignments, getMemberWeeklyHours } from './hours';

const DAY_PRIORITY: DayOfWeek[] = ['sat', 'wed', 'fri', 'thu', 'mon', 'tue'];

function getCloseMembers(members: TeamMember[]): TeamMember[] {
  return members.filter((m) => m.crew === 'close');
}

function getOpenMembers(members: TeamMember[]): TeamMember[] {
  return members.filter((m) => m.crew === 'open');
}

function getSlMembers(members: TeamMember[]): TeamMember[] {
  return members.filter((m) => m.crew === 'sl');
}

function pickCloseBlock(
  member: TeamMember,
  assignments: WeekAssignments,
  shiftBlocks: ShiftBlock[],
): string {
  const hours = getMemberWeeklyHours(member.id, assignments, shiftBlocks);
  const remaining = member.weeklyCap - hours;
  if (remaining <= 7 || member.allowedShiftBlockIds.includes('close-short')) {
    if (member.allowedShiftBlockIds.includes('close-short')) return 'close-short';
  }
  return member.allowedShiftBlockIds.includes('close-full')
    ? 'close-full'
    : member.allowedShiftBlockIds[0] ?? 'OFF';
}

function assignIfAllowed(
  assignments: WeekAssignments,
  member: TeamMember,
  day: DayOfWeek,
  blockId: string,
  shiftBlocks: ShiftBlock[],
): boolean {
  if (!canAssignShift(member, day, blockId)) return false;
  const currentHours = getMemberWeeklyHours(member.id, assignments, shiftBlocks);
  const block = shiftBlocks.find((b) => b.id === blockId);
  if (!block) return false;
  if (currentHours + block.hours > member.weeklyCap) return false;
  if (!assignments[member.id]) {
    assignments[member.id] = {
      mon: 'OFF',
      tue: 'OFF',
      wed: 'OFF',
      thu: 'OFF',
      fri: 'OFF',
      sat: 'OFF',
    };
  }
  assignments[member.id][day] = blockId;
  return true;
}

function fillClosers(
  assignments: WeekAssignments,
  members: TeamMember[],
  shiftBlocks: ShiftBlock[],
  settings: AppSettings,
): void {
  const closeMembers = getCloseMembers(members);

  for (const day of DAY_PRIORITY) {
    const targets = settings.closerTargets[day];
    let count = getCloserCount(day, assignments, members, shiftBlocks);

    while (count < targets.goal) {
      const candidates = closeMembers
        .filter((m) => {
          const current = assignments[m.id]?.[day] ?? 'OFF';
          if (current !== 'OFF') return false;
          return m.allowedShiftBlockIds.some((id) =>
            canAssignShift(m, day, id) &&
            getMemberWeeklyHours(m.id, assignments, shiftBlocks) +
              (shiftBlocks.find((b) => b.id === id)?.hours ?? 0) <=
              m.weeklyCap,
          );
        })
        .sort((a, b) => {
          const ha = getMemberWeeklyHours(a.id, assignments, shiftBlocks);
          const hb = getMemberWeeklyHours(b.id, assignments, shiftBlocks);
          return ha - hb;
        });

      if (candidates.length === 0) break;

      const member = candidates[0]!;
      const blockId = pickCloseBlock(member, assignments, shiftBlocks);
      if (assignIfAllowed(assignments, member, day, blockId, shiftBlocks)) {
        count++;
      } else {
        break;
      }
    }

    count = getCloserCount(day, assignments, members, shiftBlocks);
    if (count < targets.min) {
      for (const member of closeMembers) {
        if (count >= targets.min) break;
        const current = assignments[member.id]?.[day] ?? 'OFF';
        if (current !== 'OFF') continue;
        const blockId = pickCloseBlock(member, assignments, shiftBlocks);
        if (assignIfAllowed(assignments, member, day, blockId, shiftBlocks)) {
          count++;
        }
      }
    }
  }

  // Justin as SL on Thu when Cam is off
  const justin = closeMembers.find((m) => m.id === 'justin');
  const cam = closeMembers.find((m) => m.id === 'cam');
  if (justin && cam?.offDays.includes('thu')) {
    const blockId = pickCloseBlock(justin, assignments, shiftBlocks);
    assignIfAllowed(assignments, justin, 'thu', blockId, shiftBlocks);
  }

  // Cam closes every night except off days
  if (cam) {
    for (const day of DAYS) {
      if (cam.offDays.includes(day)) continue;
      const current = assignments[cam.id]?.[day] ?? 'OFF';
      if (current === 'OFF') {
        const blockId = pickCloseBlock(cam, assignments, shiftBlocks);
        assignIfAllowed(assignments, cam, day, blockId, shiftBlocks);
      }
    }
  }
}

function fillOpeners(
  assignments: WeekAssignments,
  members: TeamMember[],
  shiftBlocks: ShiftBlock[],
  settings: AppSettings,
): void {
  const openMembers = getOpenMembers(members);

  for (const day of DAYS) {
    let openerCount = getOpenerCountAt130(day, assignments, members, shiftBlocks);

    while (openerCount < settings.openerMinAt130) {
      const candidates = openMembers
        .filter((m) => {
          const current = assignments[m.id]?.[day] ?? 'OFF';
          if (current !== 'OFF') return false;
          const staggerOk = canAssignShift(m, day, 'open-stagger');
          const standardOk = canAssignShift(m, day, 'open-standard');
          return staggerOk || standardOk;
        })
        .sort((a, b) => {
          return (
            getMemberWeeklyHours(a.id, assignments, shiftBlocks) -
            getMemberWeeklyHours(b.id, assignments, shiftBlocks)
          );
        });

      if (candidates.length === 0) break;

      const member = candidates[0]!;
      const preferStagger = openerCount < settings.openerMinAt130;
      const blockId =
        preferStagger && canAssignShift(member, day, 'open-stagger')
          ? 'open-stagger'
          : canAssignShift(member, day, 'open-standard')
            ? 'open-standard'
            : member.allowedShiftBlockIds[0] ?? 'OFF';

      if (blockId === 'OFF' || !assignIfAllowed(assignments, member, day, blockId, shiftBlocks)) {
        break;
      }
      openerCount = getOpenerCountAt130(day, assignments, members, shiftBlocks);
    }

    // Fill remaining open shifts for coverage
    const assignedToday = openMembers.filter(
      (m) => (assignments[m.id]?.[day] ?? 'OFF') !== 'OFF',
    ).length;
    const targetOpeners = Math.min(openMembers.length, 4);

    if (assignedToday < targetOpeners) {
      for (const member of openMembers) {
        if (assignedToday >= targetOpeners) break;
        const current = assignments[member.id]?.[day] ?? 'OFF';
        if (current !== 'OFF') continue;
        const hours = getMemberWeeklyHours(member.id, assignments, shiftBlocks);
        let blockId = 'open-standard';
        if (member.id === 'cordell') blockId = 'open-standard';
        if (member.id === 'darius' && hours > member.weeklyCap - 8) blockId = 'open-short';
        if (canAssignShift(member, day, blockId)) {
          assignIfAllowed(assignments, member, day, blockId, shiftBlocks);
        }
      }
    }
  }
}

function fillSlShifts(
  assignments: WeekAssignments,
  members: TeamMember[],
  shiftBlocks: ShiftBlock[],
): void {
  const slMembers = getSlMembers(members);

  for (const member of slMembers) {
    let daysAssigned = 0;
    const maxDays = member.id === 'nikki' ? 3 : 5;

    for (const day of DAYS) {
      if (member.offDays.includes(day)) continue;
      if (daysAssigned >= maxDays) break;
      const current = assignments[member.id]?.[day] ?? 'OFF';
      if (current !== 'OFF') {
        daysAssigned++;
        continue;
      }

      const blockId =
        member.id === 'nikki'
          ? 'breakfast-sl'
          : member.allowedShiftBlockIds.includes('breakfast-mid-sl')
            ? 'breakfast-mid-sl'
            : 'breakfast-sl';

      if (assignIfAllowed(assignments, member, day, blockId, shiftBlocks)) {
        daysAssigned++;
      }
    }
  }
}

function balanceHours(
  assignments: WeekAssignments,
  members: TeamMember[],
  shiftBlocks: ShiftBlock[],
): void {
  for (const member of members) {
    let hours = getMemberWeeklyHours(member.id, assignments, shiftBlocks);
    if (hours <= member.weeklyCap) continue;

    for (const day of DAYS) {
      if (hours <= member.weeklyCap) break;
      const assignment = assignments[member.id]?.[day] ?? 'OFF';
      if (assignment === 'close-full' && member.allowedShiftBlockIds.includes('close-short')) {
        const block = shiftBlocks.find((b) => b.id === 'close-short');
        if (block && hours - 9 + block.hours <= member.weeklyCap) {
          assignments[member.id]![day] = 'close-short';
          hours = getMemberWeeklyHours(member.id, assignments, shiftBlocks);
        }
      }
    }
  }
}

export function suggestWeek(
  members: TeamMember[],
  shiftBlocks: ShiftBlock[],
  settings: AppSettings,
): WeekAssignments {
  const assignments = createEmptyAssignments(members);

  fillClosers(assignments, members, shiftBlocks, settings);
  fillOpeners(assignments, members, shiftBlocks, settings);
  fillSlShifts(assignments, members, shiftBlocks);
  balanceHours(assignments, members, shiftBlocks);

  return assignments;
}
