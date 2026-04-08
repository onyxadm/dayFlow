'use client';

import '@dayflow/core/dist/styles.components.css';
import {
  EventContextMenuSlotArgs,
  GridContextMenuSlotArgs,
  createDayView,
  createWeekView,
  createMonthView,
  createYearView,
} from '@dayflow/core';
import { createDragPlugin } from '@dayflow/plugin-drag';
import { useCalendarApp, DayFlowCalendar, ViewType } from '@dayflow/react';
import { useTheme } from 'next-themes';
import React, { useCallback, useMemo, useState } from 'react';

import { getWebsiteCalendars } from '@/utils/palette';
import { generateMinimalSampleEvents } from '@/utils/sampleData';

/* ── tiny reusable menu primitives ──────────────────────────── */

const MenuRoot = ({ children }: { children: React.ReactNode }) => (
  <div className='flex min-w-40 flex-col bg-white py-1 dark:bg-slate-900'>
    {children}
  </div>
);

const MenuItem = ({
  label,
  danger,
  disabled,
  onClick,
}: {
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) => (
  <button
    type='button'
    disabled={disabled}
    onClick={onClick}
    className={`flex w-full items-center rounded px-3 py-1.5 text-left text-sm transition-colors ${danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'} ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
  >
    {label}
  </button>
);

const MenuSeparator = () => (
  <div className='my-1 border-t border-slate-100 dark:border-slate-800' />
);

/* ── Showcase ───────────────────────────────────────────────── */

export const ContextMenuShowcase: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [events] = useState(() => generateMinimalSampleEvents());
  const [log, setLog] = useState<string | null>(null);

  const themeMode = useMemo(() => {
    if (resolvedTheme === 'dark') return 'dark';
    if (resolvedTheme === 'light') return 'light';
    return 'auto';
  }, [resolvedTheme]);

  const calendar = useCalendarApp({
    views: [
      createDayView(),
      createWeekView(),
      createMonthView(),
      createYearView(),
    ],
    plugins: [createDragPlugin()],
    events,
    calendars: getWebsiteCalendars(),
    defaultCalendar: 'work',
    defaultView: ViewType.WEEK,
    theme: { mode: themeMode },
  });

  /* custom event right-click menu */
  const eventContextMenu = useCallback(
    ({ event, onClose }: EventContextMenuSlotArgs) => {
      const notify = (action: string) => {
        setLog(`${action}: "${event.title}"`);
        onClose();
      };

      return (
        <MenuRoot>
          <MenuItem label='Edit' onClick={() => notify('Edit')} />
          <MenuItem label='Duplicate' onClick={() => notify('Duplicate')} />
          <MenuItem label='Copy link' onClick={() => notify('Copy link')} />
          <MenuSeparator />
          <MenuItem
            label='Delete'
            danger
            onClick={() => {
              calendar.deleteEvent(event.id);
              onClose();
            }}
          />
        </MenuRoot>
      );
    },
    [calendar]
  );

  /* custom grid/cell right-click menu */
  const gridContextMenu = useCallback(
    ({ date, onClose }: GridContextMenuSlotArgs) => {
      const notify = (action: string) => {
        setLog(
          `${action} at ${date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`
        );
        onClose();
      };

      return (
        <MenuRoot>
          <MenuItem
            label='New event here'
            onClick={() => notify('New event')}
          />
          <MenuItem label='Set reminder' onClick={() => notify('Reminder')} />
          <MenuSeparator />
          <MenuItem label='Mark as busy' onClick={() => notify('Busy')} />
        </MenuRoot>
      );
    },
    []
  );

  return (
    <div className='not-prose space-y-2 p-1'>
      {log && (
        <div className='rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'>
          Action: {log}
        </div>
      )}
      <DayFlowCalendar
        calendar={calendar}
        eventContextMenu={eventContextMenu}
        gridContextMenu={gridContextMenu}
      />
    </div>
  );
};
