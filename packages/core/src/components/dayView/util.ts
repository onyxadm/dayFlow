import { EventLayoutCalculator } from '@/components/eventLayout';
import { Event, EventLayout } from '@/types';
import { temporalToDate, dateToZonedDateTime } from '@/utils/temporal';

// Filter events for the current day
export const filterDayEvents = (
  events: Event[],
  currentDate: Date,
  currentWeekStart: Date
): Event[] => {
  const dayStart = new Date(currentDate);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(currentDate);
  dayEnd.setHours(23, 59, 59, 999);

  const filtered = events.filter(event => {
    const eventStart = temporalToDate(event.start);
    const eventEnd = temporalToDate(event.end);

    if (event.allDay) {
      const s = new Date(eventStart);
      s.setHours(0, 0, 0, 0);
      const e = new Date(eventEnd);
      e.setHours(0, 0, 0, 0);
      return s <= dayEnd && e >= dayStart;
    }

    return eventStart < dayEnd && eventEnd > dayStart;
  });

  return filtered.map(event => {
    const eventDate = temporalToDate(event.start);
    const dayDiff = Math.floor(
      (eventDate.getTime() - currentWeekStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    const correctDay = Math.max(0, Math.min(6, dayDiff));

    return {
      ...event,
      day: correctDay,
    };
  });
};

// Normalize events for layout calculation (clamping to current day)
export const normalizeLayoutEvents = (
  currentDayEvents: Event[],
  currentDate: Date
): Event[] => {
  const dayStart = new Date(currentDate);
  dayStart.setHours(0, 0, 0, 0);
  const nextDay = new Date(dayStart);
  nextDay.setDate(nextDay.getDate() + 1);

  return currentDayEvents
    .filter(e => !e.allDay)
    .map(event => {
      const eventStart = temporalToDate(event.start);
      const eventEnd = temporalToDate(event.end);
      let newStart = event.start;
      let newEnd = event.end;
      let modified = false;

      if (eventStart < dayStart) {
        newStart = dateToZonedDateTime(dayStart);
        modified = true;
      }

      if (eventEnd > nextDay) {
        newEnd = dateToZonedDateTime(nextDay);
        modified = true;
      }

      return {
        ...event,
        start: modified ? newStart : event.start,
        end: modified ? newEnd : event.end,
        day: 0, // Force all events to same day index for collision detection
      };
    });
};

// Organize all-day events into rows
export const organizeAllDayEvents = (
  currentDayEvents: Event[],
  comparator?: (a: Event, b: Event) => number
) => {
  const allDayEvents = currentDayEvents.filter(e => e.allDay);

  if (comparator) {
    allDayEvents.sort(comparator);
  } else {
    // Default: group by calendar (first-seen order), then preserve load order
    const calendarOrder = new Map<string | undefined, number>();
    allDayEvents.forEach(e => {
      if (!calendarOrder.has(e.calendarId))
        calendarOrder.set(e.calendarId, calendarOrder.size);
    });
    allDayEvents.sort(
      (a, b) =>
        (calendarOrder.get(a.calendarId) ?? 0) -
        (calendarOrder.get(b.calendarId) ?? 0)
    );
  }

  const rows: Event[][] = [];
  const eventsWithRow: Array<Event & { row: number }> = [];

  allDayEvents.forEach(event => {
    let rowIndex = 0;
    let placed = false;

    while (!placed) {
      if (rows[rowIndex]) {
        const hasCollision = rows[rowIndex].some(existing => {
          const aStart = temporalToDate(event.start);
          const aEnd = temporalToDate(event.end);
          const bStart = temporalToDate(existing.start);
          const bEnd = temporalToDate(existing.end);
          return aStart <= bEnd && bStart <= aEnd;
        });

        if (hasCollision) {
          rowIndex++;
        } else {
          rows[rowIndex].push(event);
          eventsWithRow.push({ ...event, row: rowIndex });
          placed = true;
        }
      } else {
        rows[rowIndex] = [event];
        eventsWithRow.push({ ...event, row: rowIndex });
        placed = true;
      }
    }
  });

  return eventsWithRow;
};

// Calculate layout for newly created events
export const calculateNewEventLayout = (
  targetDay: number,
  startHour: number,
  endHour: number,
  currentDate: Date,
  layoutEvents: Event[]
): EventLayout | null => {
  const startDate = new Date(currentDate);
  const endDate = new Date(currentDate);
  startDate.setHours(Math.floor(startHour), (startHour % 1) * 60, 0, 0);
  endDate.setHours(Math.floor(endHour), (endHour % 1) * 60, 0, 0);

  const tempEvent: Event = {
    id: '-1',
    title: 'Temp',
    day: 0,
    start: dateToZonedDateTime(startDate),
    end: dateToZonedDateTime(endDate),
    calendarId: 'blue',
    allDay: false,
  };

  const dayEvents = [...layoutEvents, tempEvent];
  const tempLayouts = EventLayoutCalculator.calculateDayEventLayouts(
    dayEvents,
    { viewType: 'day' }
  );
  return tempLayouts.get('-1') || null;
};

// Calculate drag layout
export const calculateDragLayout = (
  draggedEvent: Event,
  targetDay: number,
  targetStartHour: number,
  targetEndHour: number,
  currentDate: Date,
  layoutEvents: Event[]
): EventLayout | null => {
  const otherEvents = layoutEvents.filter(e => e.id !== draggedEvent.id);

  const viewDate = new Date(currentDate);
  const startD = new Date(viewDate);
  startD.setHours(
    Math.floor(targetStartHour),
    (targetStartHour % 1) * 60,
    0,
    0
  );
  const endD = new Date(viewDate);
  endD.setHours(Math.floor(targetEndHour), (targetEndHour % 1) * 60, 0, 0);

  const modifiedDraggedEvent = {
    ...draggedEvent,
    start: dateToZonedDateTime(startD),
    end: dateToZonedDateTime(endD),
    day: 0,
  };

  const dayEvents = [...otherEvents, modifiedDraggedEvent];

  if (dayEvents.length === 0) return null;

  const tempLayouts = EventLayoutCalculator.calculateDayEventLayouts(
    dayEvents,
    { viewType: 'day' }
  );
  return tempLayouts.get(draggedEvent.id) || null;
};
