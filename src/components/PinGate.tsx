import { useState, type FormEvent, type ReactNode } from 'react';
import type { ViewMode } from '../types/schedule';

type Props = {
  correctPin: string;
  viewMode: ViewMode;
  onUnlock: (mode: ViewMode) => void;
  children: ReactNode;
};

export function PinGate({ correctPin, viewMode, onUnlock, children }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(viewMode === 'director');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      setUnlocked(true);
      onUnlock('director');
      setError('');
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  const enterTeamView = () => {
    setUnlocked(true);
    onUnlock('team');
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 bg-cfa-bg">
      <div className="w-full max-w-md bg-cfa-surface border border-cfa-border rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-cfa-red mb-1">BOH Shift Commando</h1>
        <p className="text-cfa-muted mb-6">CFA Vestavia Hills #03339</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-cfa-muted">Director PIN</span>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="mt-1 w-full px-4 py-4 text-xl bg-cfa-bg border border-cfa-border rounded-xl focus:outline-none focus:border-cfa-red"
              placeholder="Enter PIN"
              autoFocus
            />
          </label>
          {error && <p className="text-cfa-red text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-4 bg-cfa-red hover:bg-cfa-red-dim rounded-xl font-semibold text-lg min-h-[56px]"
          >
            Unlock Director View
          </button>
        </form>

        <button
          type="button"
          onClick={enterTeamView}
          className="w-full mt-3 py-4 border border-cfa-border rounded-xl text-cfa-muted min-h-[56px]"
        >
          View Schedule (Read Only)
        </button>
      </div>
    </div>
  );
}
