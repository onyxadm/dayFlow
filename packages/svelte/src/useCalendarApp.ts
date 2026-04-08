import {
  CalendarApp,
  createConfigSyncSnapshot,
  createNormalizedCalendarAppConfigGetter,
  syncCalendarAppConfig,
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
  let syncSnapshot = createConfigSyncSnapshot(getNormalizedConfig());

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

  const ensureConfigSync = () => {
    syncSnapshot = syncCalendarAppConfig(
      app,
      syncSnapshot,
      getNormalizedConfig()
    );
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
      ensureConfigSync();
      return app;
    },
    get currentView() {
      ensureConfigSync();
      return get(stateStore).currentView;
    },
    get currentDate() {
      ensureConfigSync();
      return get(stateStore).currentDate;
    },
    get events() {
      ensureConfigSync();
      return get(stateStore).events;
    },

    applyEventsChanges: (
      ...args: Parameters<typeof app.applyEventsChanges>
    ) => {
      ensureConfigSync();
      return app.applyEventsChanges(...args);
    },
    changeView: (...args: Parameters<typeof app.changeView>) => {
      ensureConfigSync();
      return app.changeView(...args);
    },
    setCurrentDate: (...args: Parameters<typeof app.setCurrentDate>) => {
      ensureConfigSync();
      return app.setCurrentDate(...args);
    },
    addEvent: (...args: Parameters<typeof app.addEvent>) => {
      ensureConfigSync();
      return app.addEvent(...args);
    },
    updateEvent: (...args: Parameters<typeof app.updateEvent>) => {
      ensureConfigSync();
      return app.updateEvent(...args);
    },
    deleteEvent: (...args: Parameters<typeof app.deleteEvent>) => {
      ensureConfigSync();
      return app.deleteEvent(...args);
    },
    undo: () => {
      ensureConfigSync();
      return app.undo();
    },
    goToToday: () => {
      ensureConfigSync();
      return app.goToToday();
    },
    goToPrevious: () => {
      ensureConfigSync();
      return app.goToPrevious();
    },
    goToNext: () => {
      ensureConfigSync();
      return app.goToNext();
    },
    selectDate: (...args: Parameters<typeof app.selectDate>) => {
      ensureConfigSync();
      return app.selectDate(...args);
    },
    getCalendars: () => {
      ensureConfigSync();
      return app.getCalendars();
    },
    createCalendar: (...args: Parameters<typeof app.createCalendar>) => {
      ensureConfigSync();
      return app.createCalendar(...args);
    },
    mergeCalendars: (...args: Parameters<typeof app.mergeCalendars>) => {
      ensureConfigSync();
      return app.mergeCalendars(...args);
    },
    setCalendarVisibility: (
      ...args: Parameters<typeof app.setCalendarVisibility>
    ) => {
      ensureConfigSync();
      return app.setCalendarVisibility(...args);
    },
    setAllCalendarsVisibility: (
      ...args: Parameters<typeof app.setAllCalendarsVisibility>
    ) => {
      ensureConfigSync();
      return app.setAllCalendarsVisibility(...args);
    },
    getAllEvents: () => {
      ensureConfigSync();
      return app.getAllEvents();
    },
    highlightEvent: (...args: Parameters<typeof app.highlightEvent>) => {
      ensureConfigSync();
      return app.highlightEvent(...args);
    },
    setVisibleMonth: (...args: Parameters<typeof app.setVisibleMonth>) => {
      ensureConfigSync();
      return app.setVisibleMonth(...args);
    },
    getVisibleMonth: () => {
      ensureConfigSync();
      return app.getVisibleMonth();
    },
    emitVisibleRange: (...args: Parameters<typeof app.emitVisibleRange>) => {
      ensureConfigSync();
      return app.emitVisibleRange(...args);
    },
    canMutateFromUI: (...args: Parameters<typeof app.canMutateFromUI>) => {
      ensureConfigSync();
      return app.canMutateFromUI(...args);
    },
    get readOnlyConfig() {
      ensureConfigSync();
      return app.getReadOnlyConfig();
    },
  } as unknown as UseCalendarAppReturn;

  return result;
}
