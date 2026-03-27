import { render, screen } from '@testing-library/preact';
import { Temporal } from 'temporal-polyfill';

import EventContextMenu from '@/components/contextMenu/components/EventContextMenu';
import GridContextMenu from '@/components/contextMenu/components/GridContextMenu';
import { CalendarApp } from '@/core/CalendarApp';

const createApp = (readOnly: boolean) =>
  new CalendarApp({
    views: [],
    plugins: [],
    events: [],
    readOnly,
    calendars: [
      {
        id: 'work',
        name: 'Work',
        colors: {
          lineColor: '#2563eb',
          eventColor: '#dbeafe',
          eventSelectedColor: '#bfdbfe',
          textColor: '#1e3a8a',
        },
      },
    ],
  });

describe('read-only context menus', () => {
  it('does not render the event context menu in read-only mode', () => {
    const app = createApp(true);

    render(
      <EventContextMenu
        event={{
          id: 'event-1',
          title: 'Test Event',
          calendarId: 'work',
          start: Temporal.Now.plainDateISO(),
          end: Temporal.Now.plainDateISO(),
        }}
        x={10}
        y={10}
        onClose={jest.fn()}
        app={app}
        detailPanelKey='event-1'
      />
    );

    expect(screen.queryByText('delete')).toBeNull();
    expect(screen.queryByText('calendars')).toBeNull();
  });

  it('does not render the grid context menu in read-only mode', () => {
    const app = createApp(true);

    render(
      <GridContextMenu
        x={10}
        y={10}
        date={new Date(2026, 2, 27)}
        onClose={jest.fn()}
        app={app}
        onCreateEvent={jest.fn()}
      />
    );

    expect(screen.queryByText('newEvent')).toBeNull();
    expect(screen.queryByText('pasteHere')).toBeNull();
  });

  it('still renders mutation menus when the calendar is editable', () => {
    const app = createApp(false);

    render(
      <GridContextMenu
        x={10}
        y={10}
        date={new Date(2026, 2, 27)}
        onClose={jest.fn()}
        app={app}
        onCreateEvent={jest.fn()}
      />
    );

    expect(screen.getByText('newEvent')).toBeTruthy();
  });
});
