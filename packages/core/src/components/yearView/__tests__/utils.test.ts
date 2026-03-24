import { Temporal } from 'temporal-polyfill';

import { analyzeMultiDayEventsForRow } from '@/components/yearView/utils';
import { Event } from '@/types';

const createDate = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day);

describe('YearView utils - analyzeMultiDayEventsForRow', () => {
  const createAllDayEvent = (
    id: string,
    start: string,
    end: string
  ): Event => ({
    id,
    title: id,
    allDay: true,
    start: Temporal.PlainDate.from(start),
    end: Temporal.PlainDate.from(end),
  });

  const createTimedEvent = (id: string, start: string, end: string): Event => ({
    id,
    title: id,
    allDay: false,
    start: Temporal.PlainDateTime.from(start),
    end: Temporal.PlainDateTime.from(end),
  });

  it('should sort and pack multi-day and timed events correctly (MonthView consistency)', () => {
    // March 18-24, 2026 (7 days row)
    const rowDays = [
      createDate(2026, 3, 18),
      createDate(2026, 3, 19),
      createDate(2026, 3, 20),
      createDate(2026, 3, 21),
      createDate(2026, 3, 22),
      createDate(2026, 3, 23),
      createDate(2026, 3, 24),
    ];

    const events: Event[] = [
      createAllDayEvent('Event A', '2026-03-18', '2026-03-22'),
      createAllDayEvent('Event B', '2026-03-19', '2026-03-23'),
      createTimedEvent('Event C', '2026-03-21T10:00:00', '2026-03-21T11:00:00'),
      createAllDayEvent('Event D', '2026-03-23', '2026-03-23'),
      createTimedEvent('Event E', '2026-03-23T14:00:00', '2026-03-23T15:00:00'),
    ];

    const segments = analyzeMultiDayEventsForRow(events, rowDays, 7);

    const getSegment = (id: string) => segments.find(s => s.event.id === id);

    // Expected Packing Logic:
    // Row 0: Event A (18-22). 23rd is free. Event D (23) can fit in Row 0.
    // Row 1: Event B (19-23). Overlaps A (19-22) and D (23).
    // Row 2: Event C (21). Overlaps A (Row 0) and B (Row 1).
    // Row 2: Event E (23). Overlaps D (Row 0) and B (Row 1).

    const segA = getSegment('Event A');
    const segB = getSegment('Event B');
    const segC = getSegment('Event C');
    const segD = getSegment('Event D');
    const segE = getSegment('Event E');

    expect(segA?.visualRowIndex).toBe(0);
    expect(segD?.visualRowIndex).toBe(0);

    expect(segB?.visualRowIndex).toBe(1);

    expect(segC?.visualRowIndex).toBe(2);
    expect(segE?.visualRowIndex).toBe(2);
  });

  it('should prioritize all-day events over timed events regardless of input order', () => {
    const rowDays = [createDate(2026, 3, 18)];
    const events: Event[] = [
      createTimedEvent('Timed', '2026-03-18T10:00:00', '2026-03-18T11:00:00'),
      createAllDayEvent('AllDay', '2026-03-18', '2026-03-18'),
    ];

    const segments = analyzeMultiDayEventsForRow(events, rowDays, 1);

    const timedSeg = segments.find(s => s.event.id === 'Timed');
    const allDaySeg = segments.find(s => s.event.id === 'AllDay');

    // All-day should be in row 0, timed in row 1
    expect(allDaySeg?.visualRowIndex).toBe(0);
    expect(timedSeg?.visualRowIndex).toBe(1);
  });

  it('should not throw TypeError', () => {
    const rowDays = [createDate(2026, 3, 18)];
    const events: Event[] = [
      createAllDayEvent('Test', '2026-03-18', '2026-03-18'),
    ];

    expect(() => {
      analyzeMultiDayEventsForRow(events, rowDays, 1);
    }).not.toThrow();
  });
});
