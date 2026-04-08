import { RefObject } from 'preact';
import { useEffect, useCallback } from 'preact/hooks';

import {
  getCalendarContentElement,
  getTimeColumnWidth,
} from '@/components/calendarEvent/utils';
import { Event, ViewType } from '@/types';
import { extractHourFromDate, getEventEndHour } from '@/utils';

export type EventVisibility =
  | 'visible'
  | 'sticky-top'
  | 'sticky-bottom'
  | 'sticky-left'
  | 'sticky-right';

interface UseEventVisibilityProps {
  event: Event;
  timingEvent?: Event;
  isEventSelected: boolean;
  showDetailPanel: boolean;
  eventRef: RefObject<HTMLElement>;
  calendarRef: RefObject<HTMLElement>;
  isAllDay: boolean;
  viewType: ViewType;
  isMobile?: boolean;
  multiDaySegmentInfo?: {
    startHour: number;
    endHour: number;
    isFirst: boolean;
    isLast: boolean;
    dayIndex?: number;
  };
  firstHour: number;
  hourHeight: number;
  updatePanelPosition: () => void;
  eventVisibility: EventVisibility;
  setEventVisibility: (visibility: EventVisibility) => void;
}

export const useEventVisibility = ({
  event,
  timingEvent,
  isEventSelected,
  showDetailPanel,
  eventRef,
  calendarRef,
  isAllDay,
  viewType,
  isMobile = false,
  multiDaySegmentInfo,
  firstHour,
  hourHeight,
  updatePanelPosition,
  eventVisibility,
  setEventVisibility,
}: UseEventVisibilityProps) => {
  const isMonthView = viewType === ViewType.MONTH;
  const isYearView = viewType === ViewType.YEAR;
  const isResourceView = viewType === ViewType.RESOURCE;
  const eventForTiming = timingEvent ?? event;

  const checkEventVisibility = useCallback(() => {
    if (
      !isEventSelected ||
      !showDetailPanel ||
      !eventRef.current ||
      !calendarRef.current ||
      isAllDay ||
      isMonthView ||
      isYearView
    )
      return;

    const calendarContent = getCalendarContentElement(calendarRef);
    if (!calendarContent) return;

    const segmentStartHour = multiDaySegmentInfo
      ? multiDaySegmentInfo.startHour
      : extractHourFromDate(eventForTiming.start);
    const segmentEndHour = multiDaySegmentInfo
      ? multiDaySegmentInfo.endHour
      : getEventEndHour(eventForTiming);

    const originalTop = (segmentStartHour - firstHour) * hourHeight;
    const originalHeight = Math.max(
      (segmentEndHour - segmentStartHour) * hourHeight,
      hourHeight / 4
    );
    const originalBottom = originalTop + originalHeight;

    const contentRect = calendarContent.getBoundingClientRect();
    const scrollTop = calendarContent.scrollTop;
    const viewportHeight = contentRect.height;
    const scrollBottom = scrollTop + viewportHeight;

    const isContentAboveViewport = contentRect.bottom < 0;
    const isContentBelowViewport = contentRect.top > window.innerHeight;

    const STICKY_THRESHOLD = 20;

    let nextVisibility: EventVisibility = eventVisibility;

    if (isContentAboveViewport) {
      nextVisibility = 'sticky-top';
    } else if (isContentBelowViewport) {
      nextVisibility = 'sticky-bottom';
    } else {
      // Determine vertical state, treating horizontal sticky as 'visible' for transition purposes
      const isCurrentlyHorizontallySticky =
        eventVisibility === 'sticky-left' || eventVisibility === 'sticky-right';
      const currentVerticalState: EventVisibility =
        isCurrentlyHorizontallySticky ? 'visible' : eventVisibility;

      let newVerticalState: EventVisibility;
      if (currentVerticalState === 'visible') {
        if (originalBottom < scrollTop) newVerticalState = 'sticky-top';
        else if (originalTop > scrollBottom - STICKY_THRESHOLD)
          newVerticalState = 'sticky-bottom';
        else newVerticalState = 'visible';
      } else if (currentVerticalState === 'sticky-top') {
        newVerticalState =
          originalBottom >= scrollTop ? 'visible' : 'sticky-top';
      } else {
        // sticky-bottom
        newVerticalState =
          originalTop <= scrollBottom - STICKY_THRESHOLD
            ? 'visible'
            : 'sticky-bottom';
      }

      if (newVerticalState !== 'visible') {
        nextVisibility = newVerticalState;
      } else if (isResourceView) {
        // Vertically visible — check horizontal visibility
        const parentRect =
          eventRef.current?.parentElement?.getBoundingClientRect();
        if (parentRect) {
          const timeColumnWidth = getTimeColumnWidth(calendarRef, isMobile);
          const gridLeft = contentRect.left + timeColumnWidth;
          const gridRight = contentRect.right;

          if (parentRect.right <= gridLeft) {
            nextVisibility = 'sticky-left';
          } else if (parentRect.left >= gridRight) {
            nextVisibility = 'sticky-right';
          } else {
            nextVisibility = 'visible';
          }
        } else {
          nextVisibility = 'visible';
        }
      } else {
        nextVisibility = 'visible';
      }
    }

    if (nextVisibility === eventVisibility) {
      updatePanelPosition();
    } else {
      setEventVisibility(nextVisibility);
      // Defer panel update until after the re-render commits the new sticky styles
      setTimeout(updatePanelPosition, 0);
    }
  }, [
    isEventSelected,
    showDetailPanel,
    calendarRef,
    isAllDay,
    isMonthView,
    isResourceView,
    isMobile,
    eventForTiming.start,
    eventForTiming.end,
    firstHour,
    hourHeight,
    updatePanelPosition,
    multiDaySegmentInfo,
    eventVisibility,
    setEventVisibility,
  ]);

  useEffect(() => {
    if (!isEventSelected || !showDetailPanel || isAllDay) return;

    const calendarContent = getCalendarContentElement(calendarRef);
    if (!calendarContent) return;

    const handleScroll = () => checkEventVisibility();
    const handleResize = () => {
      checkEventVisibility();
      updatePanelPosition();
    };

    const scrollContainers: Element[] = [calendarContent];
    let parent = calendarRef.current?.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (
        style.overflowY === 'auto' ||
        style.overflowY === 'scroll' ||
        style.overflowX === 'auto' ||
        style.overflowX === 'scroll'
      ) {
        scrollContainers.push(parent);
      }
      parent = parent.parentElement;
    }

    scrollContainers.forEach(container => {
      container.addEventListener('scroll', handleScroll);
    });

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (calendarRef.current) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(calendarRef.current);
    }

    checkEventVisibility();

    return () => {
      scrollContainers.forEach(container => {
        container.removeEventListener('scroll', handleScroll);
      });
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [
    isEventSelected,
    showDetailPanel,
    isAllDay,
    checkEventVisibility,
    updatePanelPosition,
    calendarRef,
  ]);
};
