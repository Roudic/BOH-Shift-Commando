import { useRef } from 'react';
import type { ShiftBlock } from '../types/schedule';
import { getShiftBlockColor } from '../lib/hours';

type Props = {
  label: string;
  type?: ShiftBlock['type'];
  compact?: boolean;
  isOff?: boolean;
  onClick?: () => void;
  onLongPress?: () => void;
  readOnly?: boolean;
};

export function ShiftPill({
  label,
  type,
  compact,
  isOff,
  onClick,
  onLongPress,
  readOnly,
}: Props) {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = () => {
    if (!onLongPress || readOnly) return;
    pressTimer.current = setTimeout(() => {
      onLongPress();
      pressTimer.current = null;
    }, 500);
  };

  const clearTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const colorClass = isOff
    ? 'bg-cfa-bg border-cfa-border text-cfa-muted/50'
    : type
      ? getShiftBlockColor(type)
      : 'bg-cfa-border text-cfa-text';

  return (
    <button
      type="button"
      disabled={readOnly && !onClick}
      onClick={readOnly ? undefined : onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={clearTimer}
      onTouchCancel={clearTimer}
      onContextMenu={(e) => e.preventDefault()}
      className={`
        w-full min-h-[44px] px-1 py-2 rounded-lg border text-center font-medium
        transition-colors active:scale-95 select-none
        ${compact ? 'text-[10px] leading-tight' : 'text-xs'}
        ${colorClass}
        ${readOnly ? 'cursor-default opacity-90' : 'cursor-pointer'}
      `}
    >
      {isOff ? 'OFF' : label}
    </button>
  );
}
