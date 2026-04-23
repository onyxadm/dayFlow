import { EventLayoutCalculator } from '@/components/eventLayout';
import {
  analyzeMultiDayRegularEvent,
  analyzeMultiDayEventsForWeek,
  MultiDayEventSegment,
} from '@/components/monthView/util';
import { Event, EventLayout } from '@/types';
import { createDateWithHour, getDateByDayIndex } from '@/utils';
import { createAllDayDisplayComparator } from '@/utils/allDaySort';
import { extractHourFromDate, getEventEndHour } from '@/utils/helpers';
import {
  dateToZonedDateTime,
  temporalToDate,
  temporalToVisualDate,
} from '@/utils/temporalTypeGuards';

// ... existing code ...

// Calculate event layouts for the entire week
export const calculateEventLayouts = (
  currentWeekEvents: Event[],
  currentWeekStart: Date,
  daysToShow: number = 7,
  appTimeZone?: string
): Map<number, Map<string, EventLayout>> => {
  const allLayouts = new Map<number, Map<string, EventLayout>>();

  for (let day = 0; day < daysToShow; day++) {
    const dayEventsForLayout: Event[] = [];

    currentWeekEvents.forEach(event => {
      if (event.allDay) return;

      const segments = analyzeMultiDayRegularEvent(
        event,
        currentWeekStart,
        daysToShow,
        appTimeZone
      );

      if (segments.length > 0) {
        const segment = segments.find(s => s.dayIndex === day);
        if (segment) {
          const segmentEndHour =
            segment.endHour >= 24 ? 23.99 : segment.endHour;

          const virtualEvent: Event = {
            ...event,
            start: dateToZonedDateTime(
              createDateWithHour(
                getDateByDayIndex(currentWeekStart, day),
                segment.startHour
              ) as Date
            ),
            end: dateToZonedDateTime(
              createDateWithHour(
                getDateByDayIndex(currentWeekStart, day),
                segmentEndHour
              ) as Date
            ),
            day: day,
            _originalStartHour: extractHourFromDate(event.start),
            _originalEndHour: getEventEndHour(event),
          };
          dayEventsForLayout.push(virtualEvent);
        }
      } else if (event.day === day) {
        const toVisual = (t: Event['start']) =>
          appTimeZone
            ? temporalToVisualDate(t, appTimeZone)
            : temporalToDate(t);
        dayEventsForLayout.push({
          ...event,
          start: dateToZonedDateTime(toVisual(event.start), appTimeZone),
          end: dateToZonedDateTime(
            toVisual(event.end ?? event.start),
            appTimeZone
          ),
          day,
          _originalStartHour: extractHourFromDate(event.start),
          _originalEndHour: getEventEndHour(event),
        });
      }
    });

    const dayLayouts = EventLayoutCalculator.calculateDayEventLayouts(
      dayEventsForLayout,
      { viewType: 'week' }
    );
    allLayouts.set(day, dayLayouts);
  }

  return allLayouts;
};

export const getWeekStart = (date: Date, startOfWeek: number = 1): Date => {
  const day = date.getDay();
  const diff = (day - startOfWeek + 7) % 7;
  const start = new Date(date);
  start.setDate(date.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

// Filter events for the current week
export const filterWeekEvents = (
  events: Event[],
  currentWeekStart: Date,
  daysToShow: number = 7,
  appTimeZone?: string
): Event[] => {
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(currentWeekStart.getDate() + (daysToShow - 1));
  weekEnd.setHours(23, 59, 59, 999);

  const toDate = (temporal: Event['start']) =>
    appTimeZone
      ? temporalToVisualDate(temporal, appTimeZone)
      : temporalToDate(temporal);

  const filtered = events.filter(event => {
    const eventStart = toDate(event.start);
    eventStart.setHours(0, 0, 0, 0);
    const eventEnd = toDate(event.end ?? event.start);
    eventEnd.setHours(23, 59, 59, 999);

    return eventEnd >= currentWeekStart && eventStart <= weekEnd;
  });

  return filtered.map(event => {
    const eventDate = toDate(event.start);
    const dayDiff = Math.floor(
      (eventDate.getTime() - currentWeekStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    const correctDay = Math.max(0, Math.min(daysToShow - 1, dayDiff));

    return {
      ...event,
      day: correctDay,
    };
  });
};

// Organize all-day segments
export const organizeAllDaySegments = (
  currentWeekEvents: Event[],
  currentWeekStart: Date,
  daysToShow: number = 7,
  comparator?: (a: Event, b: Event) => number
) => {
  const multiDaySegments = analyzeMultiDayEventsForWeek(
    currentWeekEvents,
    currentWeekStart,
    daysToShow
  );
  const segments = multiDaySegments.filter(
    (seg: MultiDayEventSegment) => seg.event.allDay
  );

  if (comparator) {
    segments.sort((a: MultiDayEventSegment, b: MultiDayEventSegment) =>
      comparator(a.event, b.event)
    );
  } else {
    // Default: group by calendar (first-seen order), then preserve load order
    const calendarOrder = new Map<string | undefined, number>();
    segments.forEach((seg: MultiDayEventSegment) => {
      const id = seg.event.calendarId;
      if (!calendarOrder.has(id)) calendarOrder.set(id, calendarOrder.size);
    });
    const compareByDisplayPriority = createAllDayDisplayComparator(
      segments.map(segment => segment.event),
      (left, right) =>
        (calendarOrder.get(left.calendarId) ?? 0) -
        (calendarOrder.get(right.calendarId) ?? 0)
    );
    segments.sort((a: MultiDayEventSegment, b: MultiDayEventSegment) =>
      compareByDisplayPriority(a.event, b.event)
    );
  }

  const segmentsWithRow: Array<MultiDayEventSegment & { row: number }> = [];

  segments.forEach((segment: MultiDayEventSegment) => {
    let row = 0;
    let foundRow = false;

    while (!foundRow) {
      let hasConflict = false;
      for (const existing of segmentsWithRow) {
        if (existing.row === row) {
          const conflict = !(
            segment.endDayIndex < existing.startDayIndex ||
            segment.startDayIndex > existing.endDayIndex
          );
          if (conflict) {
            hasConflict = true;
            break;
          }
        }
      }

      if (hasConflict) {
        row++;
      } else {
        foundRow = true;
      }
    }

    segmentsWithRow.push({ ...segment, row });
  });

  return segmentsWithRow;
};

// Calculate new event layout
export const calculateNewEventLayout = (
  targetDay: number,
  startHour: number,
  endHour: number,
  currentWeekEvents: Event[],
  currentWeekStart: Date,
  daysToShow: number = 7,
  appTimeZone?: string
): EventLayout | null => {
  const startDate = getDateByDayIndex(currentWeekStart, targetDay);
  const endDate = getDateByDayIndex(currentWeekStart, targetDay);
  startDate.setHours(Math.floor(startHour), (startHour % 1) * 60, 0, 0);
  endDate.setHours(Math.floor(endHour), (endHour % 1) * 60, 0, 0);

  const tempEvent: Event = {
    id: '-1',
    title: 'Temp',
    day: targetDay,
    start: dateToZonedDateTime(startDate, appTimeZone),
    end: dateToZonedDateTime(endDate, appTimeZone),
    calendarId: 'blue',
    allDay: false,
  };

  const allLayouts = calculateEventLayouts(
    [...currentWeekEvents, tempEvent],
    currentWeekStart,
    daysToShow,
    appTimeZone
  );
  return allLayouts.get(targetDay)?.get('-1') || null;
};

// Calculate drag layout
export const calculateDragLayout = (
  draggedEvent: Event,
  targetDay: number,
  targetStartHour: number,
  targetEndHour: number,
  currentWeekEvents: Event[],
  currentWeekStart: Date,
  daysToShow: number = 7,
  appTimeZone?: string
): EventLayout | null => {
  const tempEvents = currentWeekEvents.map(e => {
    if (e.id !== draggedEvent.id) return e;

    const eventDateForCalc = getDateByDayIndex(currentWeekStart, targetDay);
    const newStartDate = createDateWithHour(
      eventDateForCalc,
      targetStartHour
    ) as Date;
    const newEndDate = createDateWithHour(
      eventDateForCalc,
      targetEndHour
    ) as Date;
    const newStart = dateToZonedDateTime(newStartDate, appTimeZone);
    const newEnd = dateToZonedDateTime(newEndDate, appTimeZone);

    return { ...e, day: targetDay, start: newStart, end: newEnd };
  });

  const dayLayouts = calculateEventLayouts(
    tempEvents,
    currentWeekStart,
    daysToShow,
    appTimeZone
  );
  return dayLayouts.get(targetDay)?.get(draggedEvent.id) || null;
};
