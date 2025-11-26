/**
 * Utilities for working with time slots
 */
import { AvailableSlot } from '../api/types';

/**
 * Given an array of slots (with `time` like '09:30'), find the next slot after `fromDate`.
 * Returns the slot.time string (e.g., '14:30') or undefined if none found.
 */
export function findNextAvailableSlotTime(slots: AvailableSlot[], fromDate: Date = new Date()): string | undefined {
  if (!Array.isArray(slots) || slots.length === 0) return undefined;

  const today = fromDate.toISOString().split('T')[0];
  const nowMinutes = fromDate.getHours() * 60 + fromDate.getMinutes();

  // Parse slot.time into minutes from midnight and filter those >= now
  const parsed = slots
    .map(s => ({
      slot: s,
      minutes: (() => {
        if (!s.time || typeof s.time !== 'string') return NaN;
        const [hh, mm] = s.time.split(':').map(Number);
        if (Number.isNaN(hh) || Number.isNaN(mm)) return NaN;
        return hh * 60 + mm;
      })(),
    }))
    .filter(p => !Number.isNaN(p.minutes) && p.slot.available);

  // Prefer slots that are at or after current time
  const later = parsed.filter(p => p.minutes >= nowMinutes);
  if (later.length > 0) {
    later.sort((a, b) => a.minutes - b.minutes);
    return later[0].slot.time;
  }

  // If no later slots, return undefined (do not wrap to earliest slot of the day)
  return undefined;
}

/**
 * Normalizes a time string to HH:MM:SS format.
 * Returns undefined if input is empty/falsy.
 * Examples:
 * '09' -> '09:00:00'
 * '9:30' -> '09:30:00'
 * '09:30:00' -> '09:30:00'
 */
export const normalizeToHHMMSS = (t?: string): string | undefined => {
  if (!t) return undefined;
  const parts = t.split(':').map(p => p.trim()).filter(p => p !== '');
  // Keep only first 3 parts
  const p = parts.slice(0, 3);
  while (p.length < 3) p.push('00');
  return p.map(seg => seg.padStart(2, '0')).join(':');
};

export default {
  findNextAvailableSlotTime,
  normalizeToHHMMSS,
};
