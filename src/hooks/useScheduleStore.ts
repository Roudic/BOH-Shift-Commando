import { useEffect, useReducer, useRef } from 'react';
import { DEFAULT_ROSTER, DEFAULT_SETTINGS } from '../data/defaultRoster';
import { DEFAULT_SHIFT_BLOCKS } from '../data/defaultShiftBlocks';
import { createEmptyAssignments, getMondayOfWeek } from '../lib/hours';
import { suggestWeek } from '../lib/suggest';
import type {
  AppSettings,
  AppState,
  DayOfWeek,
  ScheduleTemplate,
  ShiftBlock,
  TeamMember,
  ViewMode,
  WeekAssignments,
} from '../types/schedule';

const STORAGE_KEY = 'boh-shift-commando-v1';
const MAX_UNDO = 50;

function buildInitialState(): AppState {
  const members = DEFAULT_ROSTER;
  return {
    version: 1,
    members,
    shiftBlocks: DEFAULT_SHIFT_BLOCKS,
    settings: DEFAULT_SETTINGS,
    currentWeekStart: getMondayOfWeek(),
    assignments: createEmptyAssignments(members),
    templates: [],
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.version || !parsed.members) return buildInitialState();
    return parsed;
  } catch {
    return buildInitialState();
  }
}

function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

type StoreState = {
  app: AppState;
  undoStack: WeekAssignments[];
  redoStack: WeekAssignments[];
  viewMode: ViewMode;
  selectedDay: DayOfWeek;
  showCoverage: boolean;
  showSettings: boolean;
};

type Action =
  | { type: 'SET_ASSIGNMENT'; memberId: string; day: DayOfWeek; value: string }
  | { type: 'SET_ASSIGNMENTS'; assignments: WeekAssignments; pushUndo?: boolean }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SUGGEST_WEEK' }
  | { type: 'CLEAR_WEEK' }
  | { type: 'SET_WEEK_START'; weekStart: string }
  | { type: 'UPDATE_SETTINGS'; settings: AppSettings }
  | { type: 'UPDATE_MEMBERS'; members: TeamMember[] }
  | { type: 'UPDATE_SHIFT_BLOCKS'; shiftBlocks: ShiftBlock[] }
  | { type: 'SAVE_TEMPLATE'; name: string }
  | { type: 'LOAD_TEMPLATE'; templateId: string }
  | { type: 'DELETE_TEMPLATE'; templateId: string }
  | { type: 'IMPORT_STATE'; state: AppState }
  | { type: 'SET_VIEW_MODE'; mode: ViewMode }
  | { type: 'SET_SELECTED_DAY'; day: DayOfWeek }
  | { type: 'TOGGLE_COVERAGE' }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'RESET_DEFAULTS' };

function pushUndo(state: StoreState): WeekAssignments[] {
  const stack = [...state.undoStack, structuredClone(state.app.assignments)];
  return stack.slice(-MAX_UNDO);
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'SET_ASSIGNMENT': {
      const undoStack = pushUndo(state);
      const assignments = structuredClone(state.app.assignments);
      if (!assignments[action.memberId]) {
        assignments[action.memberId] = {
          mon: 'OFF',
          tue: 'OFF',
          wed: 'OFF',
          thu: 'OFF',
          fri: 'OFF',
          sat: 'OFF',
        };
      }
      assignments[action.memberId][action.day] = action.value as WeekAssignments[string][DayOfWeek];
      return {
        ...state,
        undoStack,
        redoStack: [],
        app: { ...state.app, assignments },
      };
    }
    case 'SET_ASSIGNMENTS': {
      const undoStack = action.pushUndo !== false ? pushUndo(state) : state.undoStack;
      return {
        ...state,
        undoStack,
        redoStack: action.pushUndo !== false ? [] : state.redoStack,
        app: { ...state.app, assignments: structuredClone(action.assignments) },
      };
    }
    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1]!;
      return {
        ...state,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, structuredClone(state.app.assignments)],
        app: { ...state.app, assignments: structuredClone(prev) },
      };
    }
    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1]!;
      return {
        ...state,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: pushUndo(state),
        app: { ...state.app, assignments: structuredClone(next) },
      };
    }
    case 'SUGGEST_WEEK': {
      const suggested = suggestWeek(
        state.app.members,
        state.app.shiftBlocks,
        state.app.settings,
      );
      return {
        ...state,
        undoStack: pushUndo(state),
        redoStack: [],
        app: { ...state.app, assignments: suggested },
      };
    }
    case 'CLEAR_WEEK': {
      return {
        ...state,
        undoStack: pushUndo(state),
        redoStack: [],
        app: {
          ...state.app,
          assignments: createEmptyAssignments(state.app.members),
        },
      };
    }
    case 'SET_WEEK_START':
      return {
        ...state,
        app: { ...state.app, currentWeekStart: action.weekStart },
      };
    case 'UPDATE_SETTINGS':
      return { ...state, app: { ...state.app, settings: action.settings } };
    case 'UPDATE_MEMBERS': {
      const assignments = createEmptyAssignments(action.members);
      for (const m of action.members) {
        if (state.app.assignments[m.id]) {
          assignments[m.id] = { ...state.app.assignments[m.id] };
        }
      }
      return {
        ...state,
        app: { ...state.app, members: action.members, assignments },
      };
    }
    case 'UPDATE_SHIFT_BLOCKS':
      return { ...state, app: { ...state.app, shiftBlocks: action.shiftBlocks } };
    case 'SAVE_TEMPLATE': {
      const template: ScheduleTemplate = {
        id: crypto.randomUUID(),
        name: action.name,
        assignments: structuredClone(state.app.assignments),
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        app: {
          ...state.app,
          templates: [...state.app.templates, template],
        },
      };
    }
    case 'LOAD_TEMPLATE': {
      const template = state.app.templates.find((t) => t.id === action.templateId);
      if (!template) return state;
      return {
        ...state,
        undoStack: pushUndo(state),
        redoStack: [],
        app: { ...state.app, assignments: structuredClone(template.assignments) },
      };
    }
    case 'DELETE_TEMPLATE':
      return {
        ...state,
        app: {
          ...state.app,
          templates: state.app.templates.filter((t) => t.id !== action.templateId),
        },
      };
    case 'IMPORT_STATE':
      return {
        ...state,
        undoStack: [],
        redoStack: [],
        app: action.state,
      };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode };
    case 'SET_SELECTED_DAY':
      return { ...state, selectedDay: action.day };
    case 'TOGGLE_COVERAGE':
      return { ...state, showCoverage: !state.showCoverage };
    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: !state.showSettings };
    case 'RESET_DEFAULTS':
      return {
        ...state,
        undoStack: [],
        redoStack: [],
        app: buildInitialState(),
      };
    default:
      return state;
  }
}

export function useScheduleStore() {
  const initialized = useRef(false);
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    app: loadState(),
    undoStack: [] as WeekAssignments[],
    redoStack: [] as WeekAssignments[],
    viewMode: 'team' as ViewMode,
    selectedDay: 'mon' as DayOfWeek,
    showCoverage: false,
    showSettings: false,
  }));

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    saveState(state.app);
  }, [state.app]);

  return { state, dispatch };
}

export type ScheduleStore = ReturnType<typeof useScheduleStore>;
