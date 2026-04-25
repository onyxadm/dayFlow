import {
  CalendarApp,
  createNormalizedCalendarAppConfigGetter,
} from '@dayflow/core';
import type { CalendarAppConfig, UseCalendarAppReturn } from '@dayflow/core';
import { onDestroy } from 'svelte';
import { get, writable } from 'svelte/store';

export function useCalendarApp(
  config: CalendarAppConfig
): UseCalendarAppReturn {
  const getNormalizedConfig = createNormalizedCalendarAppConfigGetter(
    () => config
  );

  const app = new CalendarApp(getNormalizedConfig());

  // Create a store for the parts of state we want to be reactive in Svelte
  const stateStore = writable({
    currentView: app.state.currentView,
    currentDate: app.state.currentDate,
    events: app.getEvents(),
  });

  const syncState = () => {
    stateStore.set({
      currentView: app.state.currentView,
      currentDate: app.state.currentDate,
      events: app.getEvents(),
    });
  };

  const unsubscribe = app.subscribe(() => {
    syncState();
  });

  onDestroy(() => {
    unsubscribe();
  });

  // Proxy the state properties
  const result = {
    get app() {
      return app;
    },
    get currentView() {
      return get(stateStore).currentView;
    },
    get currentDate() {
      return get(stateStore).currentDate;
    },
    get events() {
      return get(stateStore).events;
    },

    applyEventsChanges: (...args: Parameters<typeof app.applyEventsChanges>) =>
      app.applyEventsChanges(...args),
    changeView: (...args: Parameters<typeof app.changeView>) =>
      app.changeView(...args),
    setCurrentDate: (...args: Parameters<typeof app.setCurrentDate>) =>
      app.setCurrentDate(...args),
    addEvent: (...args: Parameters<typeof app.addEvent>) =>
      app.addEvent(...args),
    updateEvent: (...args: Parameters<typeof app.updateEvent>) =>
      app.updateEvent(...args),
    deleteEvent: (...args: Parameters<typeof app.deleteEvent>) =>
      app.deleteEvent(...args),
    undo: () => app.undo(),
    goToToday: () => app.goToToday(),
    goToPrevious: () => app.goToPrevious(),
    goToNext: () => app.goToNext(),
    selectDate: (...args: Parameters<typeof app.selectDate>) =>
      app.selectDate(...args),
    getCalendars: () => app.getCalendars(),
    createCalendar: (...args: Parameters<typeof app.createCalendar>) =>
      app.createCalendar(...args),
    mergeCalendars: (...args: Parameters<typeof app.mergeCalendars>) =>
      app.mergeCalendars(...args),
    setCalendarVisibility: (
      ...args: Parameters<typeof app.setCalendarVisibility>
    ) => app.setCalendarVisibility(...args),
    setAllCalendarsVisibility: (
      ...args: Parameters<typeof app.setAllCalendarsVisibility>
    ) => app.setAllCalendarsVisibility(...args),
    getAllEvents: () => app.getAllEvents(),
    highlightEvent: (...args: Parameters<typeof app.highlightEvent>) =>
      app.highlightEvent(...args),
    setVisibleMonth: (...args: Parameters<typeof app.setVisibleMonth>) =>
      app.setVisibleMonth(...args),
    getVisibleMonth: () => app.getVisibleMonth(),
    emitVisibleRange: (...args: Parameters<typeof app.emitVisibleRange>) =>
      app.emitVisibleRange(...args),
    canMutateFromUI: (...args: Parameters<typeof app.canMutateFromUI>) =>
      app.canMutateFromUI(...args),
    get readOnlyConfig() {
      return app.getReadOnlyConfig();
    },
  } as unknown as UseCalendarAppReturn;

  return result;
}
