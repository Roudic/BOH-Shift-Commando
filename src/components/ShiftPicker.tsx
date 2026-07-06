import type { DayOfWeek, ShiftBlock, TeamMember } from '../types/schedule';
import { DAY_LABELS } from '../types/schedule';
import { canAssignShift } from '../lib/hours';

type Props = {
  member: TeamMember;
  day: DayOfWeek;
  shiftBlocks: ShiftBlock[];
  current: string;
  onSelect: (blockId: string) => void;
  onClose: () => void;
};

export function ShiftPicker({
  member,
  day,
  shiftBlocks,
  current,
  onSelect,
  onClose,
}: Props) {
  const options = [
    { id: 'OFF', label: 'OFF', type: undefined as ShiftBlock['type'] | undefined },
    ...shiftBlocks
      .filter((b) => member.allowedShiftBlockIds.includes(b.id))
      .map((b) => ({ id: b.id, label: `${b.label} (${b.hours}h)`, type: b.type })),
  ].filter((o) => o.id === 'OFF' || canAssignShift(member, day, o.id));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-cfa-surface border border-cfa-border rounded-t-2xl sm:rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold">{member.name}</p>
            <p className="text-sm text-cfa-muted">{DAY_LABELS[day]}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 min-h-[44px] rounded-lg border border-cfa-border"
          >
            Cancel
          </button>
        </div>
        <div className="grid gap-2 max-h-[50vh] overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={`w-full py-4 px-4 min-h-[56px] rounded-xl border text-left font-medium ${
                current === opt.id
                  ? 'bg-cfa-red/20 border-cfa-red text-cfa-red'
                  : 'border-cfa-border hover:border-cfa-red/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
