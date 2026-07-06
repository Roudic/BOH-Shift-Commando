import { useMemo, type ReactNode } from 'react';
import { CoveragePanel } from './components/CoveragePanel';
import { PinGate } from './components/PinGate';
import { SettingsDrawer } from './components/SettingsDrawer';
import { ValidationBanner } from './components/ValidationBanner';
import { WeekGrid } from './components/WeekGrid';
import { useScheduleStore } from './hooks/useScheduleStore';
import { getAllCoverageSummaries } from './lib/coverage';
import { downloadText, exportCsv, exportSlackSummary } from './lib/export';
import { getWeeklyTotalHours } from './lib/hours';
import { validateSchedule } from './lib/validate';

function App() {
  const { state, dispatch } = useScheduleStore();
  const { app, viewMode, selectedDay, showCoverage, showSettings } = state;

  const flags = useMemo(
    () =>
      validateSchedule(
        app.assignments,
        app.members,
        app.shiftBlocks,
        app.settings,
      ),
    [app.assignments, app.members, app.shiftBlocks, app.settings],
  );

  const weeklyTotal = useMemo(
    () => getWeeklyTotalHours(app.assignments, app.members, app.shiftBlocks),
    [app.assignments, app.members, app.shiftBlocks],
  );

  const coverageSummaries = useMemo(
    () =>
      getAllCoverageSummaries(
        app.assignments,
        app.members,
        app.shiftBlocks,
        app.settings,
      ),
    [app.assignments, app.members, app.shiftBlocks, app.settings],
  );

  const shiftWeek = (direction: -1 | 1) => {
    const d = new Date(app.currentWeekStart + 'T12:00:00');
    d.setDate(d.getDate() + direction * 7);
    dispatch({ type: 'SET_WEEK_START', weekStart: d.toISOString().slice(0, 10) });
  };

  const handleExportCsv = () => {
    const csv = exportCsv(
      app.currentWeekStart,
      app.assignments,
      app.members,
      app.shiftBlocks,
    );
    downloadText(csv, `boh-schedule-${app.currentWeekStart}.csv`, 'text/csv');
  };

  const handleExportSlack = async () => {
    const text = exportSlackSummary(
      app.currentWeekStart,
      app.assignments,
      app.members,
      app.shiftBlocks,
      app.settings,
      flags,
    );
    try {
      await navigator.clipboard.writeText(text);
      alert('Slack summary copied to clipboard');
    } catch {
      downloadText(text, `boh-schedule-${app.currentWeekStart}.txt`);
    }
  };

  const isDirector = viewMode === 'director';

  return (
    <PinGate
      correctPin={app.settings.directorPin}
      viewMode={viewMode}
      onUnlock={(mode) => dispatch({ type: 'SET_VIEW_MODE', mode })}
    >
      <div className="min-h-full flex flex-col bg-cfa-bg">
        <header className="sticky top-0 z-40 bg-cfa-bg/95 backdrop-blur border-b border-cfa-border px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-cfa-red">BOH Shift Commando</h1>
              <p className="text-xs text-cfa-muted">
                {isDirector ? 'Director' : 'Team'} · HotSchedules draft & validate
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isDirector && (
                <>
                  <ActionButton onClick={() => dispatch({ type: 'SUGGEST_WEEK' })}>
                    Suggest Week
                  </ActionButton>
                  <ActionButton onClick={() => dispatch({ type: 'UNDO' })}>Undo</ActionButton>
                  <ActionButton onClick={() => dispatch({ type: 'REDO' })}>Redo</ActionButton>
                  <ActionButton
                    onClick={() => {
                      if (confirm('Clear all assignments for this week?')) {
                        dispatch({ type: 'CLEAR_WEEK' });
                      }
                    }}
                  >
                    Clear
                  </ActionButton>
                </>
              )}
              <ActionButton onClick={() => dispatch({ type: 'TOGGLE_COVERAGE' })}>
                Coverage
              </ActionButton>
              <ActionButton onClick={handleExportCsv}>CSV</ActionButton>
              <ActionButton onClick={handleExportSlack}>Slack</ActionButton>
              {isDirector && (
                <ActionButton onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}>
                  Settings
                </ActionButton>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 space-y-4 max-w-6xl mx-auto w-full">
          <ValidationBanner flags={flags} />

          <div className="flex items-center gap-4 text-sm">
            <span className="text-cfa-muted">
              Week: <strong className="text-cfa-text">{weeklyTotal}</strong> /{' '}
              {app.settings.weeklyHourBudget} hrs
            </span>
            <span className="text-cfa-muted">
              SPLH: <strong className="text-cfa-text">${app.settings.splhGoal}</strong>
            </span>
          </div>

          <WeekGrid
            weekStart={app.currentWeekStart}
            members={app.members}
            shiftBlocks={app.shiftBlocks}
            assignments={app.assignments}
            viewMode={viewMode}
            closerTargets={app.settings.closerTargets}
            onAssign={(memberId, day, value) =>
              dispatch({ type: 'SET_ASSIGNMENT', memberId, day, value })
            }
            onWeekChange={shiftWeek}
          />
        </main>

        {showCoverage && (
          <CoveragePanel
            summaries={coverageSummaries}
            selectedDay={selectedDay}
            weeklyTotal={weeklyTotal}
            weeklyBudget={app.settings.weeklyHourBudget}
            onSelectDay={(day) => dispatch({ type: 'SET_SELECTED_DAY', day })}
            onClose={() => dispatch({ type: 'TOGGLE_COVERAGE' })}
          />
        )}

        {showSettings && isDirector && (
          <SettingsDrawer
            app={app}
            onUpdateSettings={(settings) => dispatch({ type: 'UPDATE_SETTINGS', settings })}
            onUpdateMembers={(members) => dispatch({ type: 'UPDATE_MEMBERS', members })}
            onUpdateShiftBlocks={(blocks) =>
              dispatch({ type: 'UPDATE_SHIFT_BLOCKS', shiftBlocks: blocks })
            }
            onSaveTemplate={(name) => dispatch({ type: 'SAVE_TEMPLATE', name })}
            onLoadTemplate={(id) => dispatch({ type: 'LOAD_TEMPLATE', templateId: id })}
            onDeleteTemplate={(id) => dispatch({ type: 'DELETE_TEMPLATE', templateId: id })}
            onImport={(imported) => dispatch({ type: 'IMPORT_STATE', state: imported })}
            onReset={() => dispatch({ type: 'RESET_DEFAULTS' })}
            onClose={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
          />
        )}
      </div>
    </PinGate>
  );
}

function ActionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 min-h-[44px] rounded-lg border border-cfa-border text-sm font-medium active:bg-cfa-surface"
    >
      {children}
    </button>
  );
}

export default App;
