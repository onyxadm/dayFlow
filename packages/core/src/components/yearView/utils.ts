import { Event } from '@/types';
import { createAllDayDisplayComparator } from '@/utils/allDaySort';
import { temporalToDate } from '@/utils/temporal';

export interface YearMultiDaySegment {
  id: string;
  event: Event;
  startCellIndex: number; // 0 to columnsPerRow-1
  endCellIndex: number; // 0 to columnsPerRow-1
  isFirstSegment: boolean;
  isLastSegment: boolean;
  visualRowIndex: number; // Vertical slot index within the row to avoid overlap
}

/**
 * Groups an array of days into rows based on the number of columns per row.
 */
export function groupDaysIntoRows(
  yearDays: Date[],
  columnsPerRow: number
): Date[][] {
  const rows: Date[][] = [];
  for (let i = 0; i < yearDays.length; i += columnsPerRow) {
    rows.push(yearDays.slice(i, i + columnsPerRow));
  }
  return rows;
}

/**
 * Analyzes events for a specific row of days and returns segments for multi-day events.
 * It also calculates the vertical layout (visualRowIndex) to prevent overlaps.
 */
export function analyzeMultiDayEventsForRow(
  events: Event[],
  rowDays: Date[],
  columnsPerRow: number,
  comparator?: (a: Event, b: Event) => number
): YearMultiDaySegment[] {
  if (rowDays.length === 0) return [];

  const rowStartMs = new Date(
    rowDays[0].getFullYear(),
    rowDays[0].getMonth(),
    rowDays[0].getDate()
  ).getTime();

  const lastDay = rowDays.at(-1);
  const rowEndMs = new Date(
    lastDay.getFullYear(),
    lastDay.getMonth(),
    lastDay.getDate(),
    23,
    59,
    59,
    999
  ).getTime();

  // 1. Filter and normalize events that overlap with this row
  const eventsWithDates = events
    .map(event => {
      const start = temporalToDate(event.start);
      const end = event.end ? temporalToDate(event.end) : start;

      const startMs = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      ).getTime();
      const endMs = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate()
      ).getTime();

      return {
        event,
        startMs,
        endMs,
      };
    })
    .filter(item => item.startMs <= rowEndMs && item.endMs >= rowStartMs);

  if (eventsWithDates.length === 0) return [];

  // 2. Sort events based on the all-day display priority
  // This matches MonthView and WeekView logic.
  const allDayComparator = createAllDayDisplayComparator(
    eventsWithDates.map(d => d.event),
    comparator
  );
  eventsWithDates.sort((a, b) => {
    // Priority 1: All-day events always before timed events
    const aAllDay = !!a.event.allDay;
    const bAllDay = !!b.event.allDay;
    if (aAllDay !== bAllDay) {
      return aAllDay ? -1 : 1;
    }
    // Priority 2: Standard all-day sort logic (multi-day first, then calendar, then comparator)
    return allDayComparator(a.event, b.event);
  });

  const segments: YearMultiDaySegment[] = [];
  const occupiedSlots: boolean[][] = []; // [visualRowIndex][colIndex]

  eventsWithDates.forEach(({ event, startMs, endMs }) => {
    // Calculate start and end indices in the current row
    let startCellIndex = Math.round(
      (startMs - rowStartMs) / (1000 * 60 * 60 * 24)
    );
    let endCellIndex = Math.round((endMs - rowStartMs) / (1000 * 60 * 60 * 24));

    // Clamp indices to row boundaries
    startCellIndex = Math.max(0, Math.min(startCellIndex, columnsPerRow - 1));
    endCellIndex = Math.max(0, Math.min(endCellIndex, columnsPerRow - 1));

    // Determine if it's the very first/last segment of the entire event
    const isFirstSegment = startMs >= rowStartMs;
    const isLastSegment = endMs <= rowEndMs;

    // Determine visualRowIndex (simple packing algorithm)
    let visualRowIndex = 0;
    while (true) {
      if (!occupiedSlots[visualRowIndex]) {
        occupiedSlots[visualRowIndex] = [];
      }

      let overlap = false;
      for (let i = startCellIndex; i <= endCellIndex; i++) {
        if (occupiedSlots[visualRowIndex][i]) {
          overlap = true;
          break;
        }
      }

      if (!overlap) {
        // Found a slot, mark it occupied
        for (let i = startCellIndex; i <= endCellIndex; i++) {
          occupiedSlots[visualRowIndex][i] = true;
        }
        break;
      }
      visualRowIndex++;
    }

    segments.push({
      id: `${event.id}::year-${rowStartMs}`,
      event,
      startCellIndex,
      endCellIndex,
      isFirstSegment,
      isLastSegment,
      visualRowIndex,
    });
  });

  return segments;
}
