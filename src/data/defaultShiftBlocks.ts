import type { ShiftBlock } from '../types/schedule';

export const DEFAULT_SHIFT_BLOCKS: ShiftBlock[] = [
  {
    id: 'close-full',
    label: '2p–11p Close',
    start: '14:00',
    end: '23:00',
    hours: 9,
    type: 'close',
  },
  {
    id: 'close-short',
    label: '4p–11p Close',
    start: '16:00',
    end: '23:00',
    hours: 7,
    type: 'close',
  },
  {
    id: 'open-standard',
    label: '5a–1p Open',
    start: '05:00',
    end: '13:00',
    hours: 8,
    type: 'open',
  },
  {
    id: 'open-stagger',
    label: '5a–2p Open',
    start: '05:00',
    end: '14:00',
    hours: 9,
    type: 'open',
  },
  {
    id: 'open-short',
    label: '5a–11a Open',
    start: '05:00',
    end: '11:00',
    hours: 6,
    type: 'open',
  },
  {
    id: 'breakfast-sl',
    label: '5a–1p SL',
    start: '05:00',
    end: '13:00',
    hours: 8,
    type: 'breakfast',
  },
  {
    id: 'mid-sl',
    label: '10a–6p SL',
    start: '10:00',
    end: '18:00',
    hours: 8,
    type: 'mid',
  },
  {
    id: 'breakfast-mid-sl',
    label: '5a–2p SL',
    start: '05:00',
    end: '14:00',
    hours: 9,
    type: 'breakfast',
  },
];

export function getShiftBlockMap(blocks: ShiftBlock[]): Map<string, ShiftBlock> {
  return new Map(blocks.map((b) => [b.id, b]));
}
