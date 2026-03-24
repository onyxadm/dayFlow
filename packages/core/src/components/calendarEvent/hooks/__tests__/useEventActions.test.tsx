import { render, fireEvent, act } from '@testing-library/preact';
import { useRef } from 'preact/hooks';
import { Temporal } from 'temporal-polyfill';

import { useEventActions } from '@/components/calendarEvent/hooks/useEventActions';
import { Event, ViewType } from '@/types';

const baseEvent: Event = {
  id: 'event-1',
  title: 'Year event',
  allDay: true,
  calendarId: 'default',
  start: Temporal.PlainDate.from('2026-03-24'),
  end: Temporal.PlainDate.from('2026-03-24'),
};

interface HarnessProps {
  onEventSelect?: (eventId: string | null) => void;
  onDetailPanelToggle?: (key: string | null) => void;
}

const Harness = ({ onEventSelect, onDetailPanelToggle }: HarnessProps) => {
  const selectedEventElementRef = useRef<HTMLElement | null>(null);
  const handlers = useEventActions({
    event: baseEvent,
    viewType: ViewType.YEAR,
    isAllDay: true,
    isMultiDay: false,
    calendarRef: { current: document.createElement('div') },
    firstHour: 0,
    hourHeight: 56,
    isMobile: false,
    canOpenDetail: true,
    detailPanelKey: 'event-1::year-segment',
    onEventSelect,
    onDetailPanelToggle,
    setIsSelected: jest.fn(),
    setDetailPanelPosition: jest.fn(),
    setContextMenuPosition: jest.fn(),
    setActiveDayIndex: jest.fn(),
    getClickedDayIdx: jest.fn(),
    updatePanelPosition: jest.fn(),
    selectedEventElementRef,
  });

  return (
    <button
      type='button'
      data-testid='event'
      onClick={handlers.handleClick}
      onDblClick={handlers.handleDoubleClick}
    >
      Event
    </button>
  );
};

describe('useEventActions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('delays year-view single click selection until the double-click window passes', () => {
    const onEventSelect = jest.fn();
    const onDetailPanelToggle = jest.fn();
    const { getByTestId } = render(
      <Harness
        onEventSelect={onEventSelect}
        onDetailPanelToggle={onDetailPanelToggle}
      />
    );

    fireEvent.click(getByTestId('event'), { clientX: 24 });

    expect(onEventSelect).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(179);
    });
    expect(onEventSelect).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onEventSelect).toHaveBeenCalledWith('event-1');
    expect(onDetailPanelToggle).toHaveBeenCalledWith(null);
  });

  it('cancels the pending year-view single click when the event is double-clicked', async () => {
    const onEventSelect = jest.fn();
    const onDetailPanelToggle = jest.fn();
    const { getByTestId } = render(
      <Harness
        onEventSelect={onEventSelect}
        onDetailPanelToggle={onDetailPanelToggle}
      />
    );

    const eventButton = getByTestId('event');

    fireEvent.click(eventButton, { clientX: 24 });

    await act(async () => {
      fireEvent.dblClick(eventButton, { clientX: 24 });
      await Promise.resolve();
    });

    act(() => {
      jest.advanceTimersByTime(180);
    });

    expect(onEventSelect).toHaveBeenCalledWith('event-1');
    expect(onEventSelect).toHaveBeenCalledTimes(1);
    expect(onDetailPanelToggle).toHaveBeenCalledWith('event-1::year-segment');
    expect(onDetailPanelToggle).not.toHaveBeenCalledWith(null);
  });
});
