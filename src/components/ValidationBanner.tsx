import type { ValidationFlag } from '../types/schedule';

type Props = {
  flags: ValidationFlag[];
  onDismiss?: () => void;
};

export function ValidationBanner({ flags }: Props) {
  if (flags.length === 0) {
    return (
      <div className="bg-cfa-green/10 border border-cfa-green/30 rounded-xl px-4 py-3 text-cfa-green text-sm">
        No validation issues — ready for HotSchedules entry
      </div>
    );
  }

  const errors = flags.filter((f) => f.severity === 'error');
  const warnings = flags.filter((f) => f.severity === 'warning');

  return (
    <div className="space-y-2">
      {errors.length > 0 && (
        <div className="bg-cfa-red/10 border border-cfa-red/40 rounded-xl px-4 py-3">
          <p className="text-cfa-red font-semibold text-sm mb-2">
            {errors.length} error{errors.length !== 1 ? 's' : ''} — fix before publish
          </p>
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {errors.map((f) => (
              <li key={f.id} className="text-sm text-cfa-red/90">
                {f.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="bg-cfa-yellow/10 border border-cfa-yellow/40 rounded-xl px-4 py-3">
          <p className="text-cfa-yellow font-semibold text-sm mb-2">
            {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
          </p>
          <ul className="space-y-1 max-h-24 overflow-y-auto">
            {warnings.map((f) => (
              <li key={f.id} className="text-sm text-cfa-yellow/90">
                {f.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
