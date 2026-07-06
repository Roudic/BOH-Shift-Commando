import { useState } from 'react';
import type { AppSettings, AppState, ScheduleTemplate, ShiftBlock, TeamMember } from '../types/schedule';
import { DAYS, DAY_LABELS } from '../types/schedule';
import { exportJson } from '../lib/export';

type Props = {
  app: AppState;
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateMembers: (members: TeamMember[]) => void;
  onUpdateShiftBlocks: (blocks: ShiftBlock[]) => void;
  onSaveTemplate: (name: string) => void;
  onLoadTemplate: (id: string) => void;
  onDeleteTemplate: (id: string) => void;
  onImport: (state: AppState) => void;
  onReset: () => void;
  onClose: () => void;
};

export function SettingsDrawer({
  app,
  onUpdateSettings,
  onUpdateMembers,
  onUpdateShiftBlocks,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  onImport,
  onReset,
  onClose,
}: Props) {
  const [tab, setTab] = useState<'budget' | 'roster' | 'blocks' | 'templates' | 'backup'>('budget');
  const [settings, setSettings] = useState(app.settings);
  const [members, setMembers] = useState(app.members);
  const [blocks, setBlocks] = useState(app.shiftBlocks);
  const [templateName, setTemplateName] = useState('');

  const saveSettings = () => onUpdateSettings(settings);
  const saveMembers = () => onUpdateMembers(members);
  const saveBlocks = () => onUpdateShiftBlocks(blocks);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as AppState;
        onImport(parsed);
      } catch {
        alert('Invalid JSON file');
      }
    };
    input.click();
  };

  const tabs = [
    { id: 'budget' as const, label: 'Budget' },
    { id: 'roster' as const, label: 'Roster' },
    { id: 'blocks' as const, label: 'Shifts' },
    { id: 'templates' as const, label: 'Templates' },
    { id: 'backup' as const, label: 'Backup' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="w-full max-w-lg h-full bg-cfa-surface border-l border-cfa-border flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-cfa-border">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 min-h-[44px] rounded-lg border border-cfa-border"
          >
            Close
          </button>
        </div>

        <div className="flex gap-1 p-2 border-b border-cfa-border overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 min-h-[44px] rounded-lg text-sm whitespace-nowrap ${
                tab === t.id ? 'bg-cfa-red text-white' : 'text-cfa-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === 'budget' && (
            <>
              <Field
                label="SPLH Goal ($)"
                value={settings.splhGoal}
                onChange={(v) => setSettings({ ...settings, splhGoal: Number(v) })}
              />
              <Field
                label="Weekly Hour Budget"
                value={settings.weeklyHourBudget}
                onChange={(v) => setSettings({ ...settings, weeklyHourBudget: Number(v) })}
              />
              <Field
                label="Daily Hour Target"
                value={settings.dailyHourTarget}
                onChange={(v) => setSettings({ ...settings, dailyHourTarget: Number(v) })}
              />
              <Field
                label="Min Openers @ 1:30 PM"
                value={settings.openerMinAt130}
                onChange={(v) => setSettings({ ...settings, openerMinAt130: Number(v) })}
              />
              <Field
                label="Director PIN"
                value={settings.directorPin}
                onChange={(v) => setSettings({ ...settings, directorPin: v })}
                type="text"
              />
              <div className="space-y-2">
                <p className="text-sm text-cfa-muted">Closer targets by day</p>
                {DAYS.map((day) => (
                  <div key={day} className="flex gap-2 items-center">
                    <span className="w-10 text-sm">{DAY_LABELS[day]}</span>
                    <input
                      type="number"
                      value={settings.closerTargets[day].min}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          closerTargets: {
                            ...settings.closerTargets,
                            [day]: {
                              ...settings.closerTargets[day],
                              min: Number(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-16 px-2 py-2 bg-cfa-bg border border-cfa-border rounded-lg text-sm"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      value={settings.closerTargets[day].goal}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          closerTargets: {
                            ...settings.closerTargets,
                            [day]: {
                              ...settings.closerTargets[day],
                              goal: Number(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-16 px-2 py-2 bg-cfa-bg border border-cfa-border rounded-lg text-sm"
                      placeholder="Goal"
                    />
                  </div>
                ))}
              </div>
              <SaveButton onClick={saveSettings} label="Save Budget Settings" />
            </>
          )}

          {tab === 'roster' && (
            <>
              {members.map((member, idx) => (
                <div key={member.id} className="p-3 border border-cfa-border rounded-xl space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={member.name}
                      onChange={(e) => {
                        const next = [...members];
                        next[idx] = { ...member, name: e.target.value };
                        setMembers(next);
                      }}
                      className="flex-1 px-3 py-2 bg-cfa-bg border border-cfa-border rounded-lg"
                    />
                    <select
                      value={member.role}
                      onChange={(e) => {
                        const next = [...members];
                        next[idx] = { ...member, role: e.target.value as 'SL' | 'TM' };
                        setMembers(next);
                      }}
                      className="px-2 py-2 bg-cfa-bg border border-cfa-border rounded-lg"
                    >
                      <option value="SL">SL</option>
                      <option value="TM">TM</option>
                    </select>
                  </div>
                  <Field
                    label="Weekly cap"
                    value={member.weeklyCap}
                    onChange={(v) => {
                      const next = [...members];
                      next[idx] = { ...member, weeklyCap: Number(v) };
                      setMembers(next);
                    }}
                  />
                  <p className="text-xs text-cfa-muted">
                    Off days: {member.offDays.map((d) => DAY_LABELS[d]).join(', ') || 'none'}
                  </p>
                </div>
              ))}
              <SaveButton onClick={saveMembers} label="Save Roster" />
            </>
          )}

          {tab === 'blocks' && (
            <>
              {blocks.map((block, idx) => (
                <div key={block.id} className="p-3 border border-cfa-border rounded-xl space-y-2">
                  <input
                    value={block.label}
                    onChange={(e) => {
                      const next = [...blocks];
                      next[idx] = { ...block, label: e.target.value };
                      setBlocks(next);
                    }}
                    className="w-full px-3 py-2 bg-cfa-bg border border-cfa-border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <input
                      value={block.start}
                      onChange={(e) => {
                        const next = [...blocks];
                        next[idx] = { ...block, start: e.target.value };
                        setBlocks(next);
                      }}
                      className="flex-1 px-3 py-2 bg-cfa-bg border border-cfa-border rounded-lg text-sm"
                      placeholder="Start"
                    />
                    <input
                      value={block.end}
                      onChange={(e) => {
                        const next = [...blocks];
                        next[idx] = { ...block, end: e.target.value };
                        setBlocks(next);
                      }}
                      className="flex-1 px-3 py-2 bg-cfa-bg border border-cfa-border rounded-lg text-sm"
                      placeholder="End"
                    />
                    <input
                      type="number"
                      value={block.hours}
                      onChange={(e) => {
                        const next = [...blocks];
                        next[idx] = { ...block, hours: Number(e.target.value) };
                        setBlocks(next);
                      }}
                      className="w-16 px-2 py-2 bg-cfa-bg border border-cfa-border rounded-lg text-sm"
                    />
                  </div>
                </div>
              ))}
              <SaveButton onClick={saveBlocks} label="Save Shift Blocks" />
            </>
          )}

          {tab === 'templates' && (
            <>
              <div className="flex gap-2">
                <input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name"
                  className="flex-1 px-3 py-3 bg-cfa-bg border border-cfa-border rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (templateName.trim()) {
                      onSaveTemplate(templateName.trim());
                      setTemplateName('');
                    }
                  }}
                  className="px-4 py-3 bg-cfa-red rounded-lg min-h-[44px]"
                >
                  Save
                </button>
              </div>
              <TemplateList
                templates={app.templates}
                onLoad={onLoadTemplate}
                onDelete={onDeleteTemplate}
              />
            </>
          )}

          {tab === 'backup' && (
            <>
              <button
                type="button"
                onClick={() => {
                  const json = exportJson(app);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `boh-shift-commando-backup-${app.currentWeekStart}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full py-4 bg-cfa-red rounded-xl min-h-[56px] font-semibold"
              >
                Export JSON Backup
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="w-full py-4 border border-cfa-border rounded-xl min-h-[56px]"
              >
                Import JSON Backup
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset all data to defaults?')) onReset();
                }}
                className="w-full py-4 border border-cfa-red/50 text-cfa-red rounded-xl min-h-[56px]"
              >
                Reset to Defaults
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'number',
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-cfa-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-3 bg-cfa-bg border border-cfa-border rounded-lg min-h-[44px]"
      />
    </label>
  );
}

function SaveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-4 bg-cfa-red rounded-xl min-h-[56px] font-semibold"
    >
      {label}
    </button>
  );
}

function TemplateList({
  templates,
  onLoad,
  onDelete,
}: {
  templates: ScheduleTemplate[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (templates.length === 0) {
    return <p className="text-cfa-muted text-sm">No saved templates</p>;
  }
  return (
    <div className="space-y-2">
      {templates.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between p-3 border border-cfa-border rounded-xl"
        >
          <div>
            <p className="font-medium">{t.name}</p>
            <p className="text-xs text-cfa-muted">
              {new Date(t.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onLoad(t.id)}
              className="px-3 py-2 min-h-[44px] bg-cfa-red rounded-lg text-sm"
            >
              Load
            </button>
            <button
              type="button"
              onClick={() => onDelete(t.id)}
              className="px-3 py-2 min-h-[44px] border border-cfa-border rounded-lg text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
