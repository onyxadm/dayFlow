import { Event } from '@/types/event';

/**
 * Sort all-day events alphabetically by calendarId, grouping events from the
 * same calendar together. Events without a calendarId sort before those with one.
 */
export const sortAllDayByCalendar = (a: Event, b: Event): number => {
  const aId = a.calendarId ?? '';
  const bId = b.calendarId ?? '';
  return aId < bId ? -1 : aId > bId ? 1 : 0;
};
