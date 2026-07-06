export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export const DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
};

export type ShiftType = 'open' | 'close' | 'mid' | 'breakfast';

export type ShiftBlock = {
  id: string;
  label: string;
  start: string;
  end: string;
  hours: number;
  type: ShiftType;
};

export type CrewGroup = 'close' | 'open' | 'sl';

export type TeamMember = {
  id: string;
  name: string;
  role: 'SL' | 'TM';
  crew: CrewGroup;
  weeklyCap: number;
  offDays: DayOfWeek[];
  allowedShiftBlockIds: string[];
  noFridayNights?: boolean;
  notes?: string;
};

export type Assignment = ShiftBlock['id'] | 'OFF';

export type WeekAssignments = Record<string, Record<DayOfWeek, Assignment>>;

export type WeekSchedule = {
  weekStart: string;
  assignments: WeekAssignments;
};

export type CloserTargets = Record<DayOfWeek, { min: number; goal: number }>;

export type AppSettings = {
  directorPin: string;
  splhGoal: number;
  weeklyHourBudget: number;
  dailyHourTarget: number;
  closerTargets: CloserTargets;
  openerMinAt130: number;
};

export type ScheduleTemplate = {
  id: string;
  name: string;
  assignments: WeekAssignments;
  createdAt: string;
};

export type ValidationFlag = {
  id: string;
  severity: 'error' | 'warning';
  message: string;
};

export type HeadcountPoint = {
  hour: number;
  count: number;
};

export type AppState = {
  version: number;
  members: TeamMember[];
  shiftBlocks: ShiftBlock[];
  settings: AppSettings;
  currentWeekStart: string;
  assignments: WeekAssignments;
  templates: ScheduleTemplate[];
};

export type ViewMode = 'director' | 'team';
