import { createPortal } from 'preact/compat';
import { useMemo, useState, useEffect, useRef } from 'preact/hooks';
import { Temporal } from 'temporal-polyfill';

import RangePicker from '@/components/rangePicker';
import { getDefaultCalendarRegistry } from '@/core/calendarRegistry';
import { useLocale } from '@/locale';
import { dialogContainer } from '@/styles/classNames';
import { ICalendarApp } from '@/types';
import { EventDetailDialogProps } from '@/types/eventDetail';
import { isEventDeepEqual } from '@/utils/eventUtils';
import { isPlainDate } from '@/utils/temporal';

import { CalendarPicker, CalendarOption } from './CalendarPicker';
import { LoadingButton } from './LoadingButton';

interface DefaultEventDetailDialogProps extends EventDetailDialogProps {
  app?: ICalendarApp;
}

/**
 * Default event detail dialog component (Dialog mode)
 * Content is consistent with DefaultEventDetailPanel, but displayed using Dialog/Modal
 */
const DefaultEventDetailDialog = ({
  event,
  isOpen,
  onEventUpdate,
  onEventDelete,
  onClose,
  app,
}: DefaultEventDetailDialogProps) => {
  const [editedEvent, setEditedEvent] = useState(event);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const previousEventIdRef = useRef(event.id);
  const { t } = useLocale();

  // Sync state when event prop changes (e.g. if opened with a different event)
  useEffect(() => {
    setEditedEvent(event);

    if (previousEventIdRef.current !== event.id) {
      setIsSaving(false);
      setIsDeleting(false);
      previousEventIdRef.current = event.id;
    }
  }, [event]);

  // Get visible calendar type options
  const colorOptions: CalendarOption[] = useMemo(() => {
    const registry = app
      ? app.getCalendarRegistry()
      : getDefaultCalendarRegistry();
    return registry.getVisible().map(cal => ({
      label: cal.name,
      value: cal.id,
    }));
  }, [app, app?.getCalendars()]);

  const handleSave = async () => {
    if (isSaving || isDeleting) return;
    setIsSaving(true);
    try {
      await onEventUpdate(editedEvent);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isSaving || isDeleting) return;
    setIsDeleting(true);
    try {
      await onEventDelete(event.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const hasChanges = useMemo(
    () => !isEventDeepEqual(event, editedEvent),
    [event, editedEvent]
  );

  const convertToAllDay = () => {
    const plainDate = isPlainDate(editedEvent.start)
      ? editedEvent.start
      : editedEvent.start.toPlainDate();
    setEditedEvent({
      ...editedEvent,
      allDay: true,
      start: plainDate,
      end: plainDate,
    });
  };

  const convertToRegular = () => {
    const plainDate = isPlainDate(editedEvent.start)
      ? editedEvent.start
      : editedEvent.start.toPlainDate();
    const start = Temporal.ZonedDateTime.from({
      year: plainDate.year,
      month: plainDate.month,
      day: plainDate.day,
      hour: 9,
      minute: 0,
      timeZone: Temporal.Now.timeZoneId(),
    });
    const end = Temporal.ZonedDateTime.from({
      year: plainDate.year,
      month: plainDate.month,
      day: plainDate.day,
      hour: 10,
      minute: 0,
      timeZone: Temporal.Now.timeZoneId(),
    });
    setEditedEvent({
      ...editedEvent,
      allDay: false,
      start,
      end,
    });
  };

  const eventTimeZone = useMemo(() => {
    if (!isPlainDate(editedEvent.start)) {
      return (
        (editedEvent.start as Temporal.ZonedDateTime).timeZoneId ||
        Temporal.Now.timeZoneId()
      );
    }

    if (editedEvent.end && !isPlainDate(editedEvent.end)) {
      return (
        (editedEvent.end as Temporal.ZonedDateTime).timeZoneId ||
        Temporal.Now.timeZoneId()
      );
    }

    return Temporal.Now.timeZoneId();
  }, [editedEvent.end, editedEvent.start]);

  const handleAllDayRangeChange = (
    nextRange: [Temporal.ZonedDateTime, Temporal.ZonedDateTime]
  ) => {
    const [start, end] = nextRange;
    setEditedEvent({
      ...editedEvent,
      start: start.toPlainDate(),
      end: end.toPlainDate(),
    });
  };

  const isEditable = app?.canMutateFromUI() ?? false;
  const isViewable = app?.getReadOnlyConfig().viewable !== false;
  const isPending = isSaving || isDeleting;

  if (!isOpen || !isViewable) return null;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  // Handle backdrop click, but ignore clicks from popup components (e.g., RangePicker)
  const handleBackdropClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // Check if clicked on RangePicker or ColorPicker popup content
    if (target.closest('[data-range-picker-popup]')) {
      return;
    }

    // Only close when actually clicking the backdrop
    if (target === e.currentTarget) {
      onClose();
    }
  };

  const dialogContent = (
    <div
      className='df-portal fixed inset-0 flex items-center justify-center'
      style={{ pointerEvents: 'auto', zIndex: 9998 }}
      data-event-detail-dialog='true'
    >
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/60 dark:bg-black/80'
        onClick={handleBackdropClick}
      />

      {/* Dialog - relative positioning ensures it appears above backdrop */}
      <div className={dialogContainer}>
        {/* Close button */}
        <button
          type='button'
          onClick={onClose}
          disabled={isPending}
          className='absolute top-4 right-4 text-gray-400 transition hover:text-gray-600 disabled:opacity-50 dark:text-gray-500 dark:hover:text-gray-200'
          aria-label='Close'
        >
          <svg
            className='h-5 w-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>

        {/* Content */}
        <div>
          <span className='mb-1 block text-xs text-gray-600 dark:text-gray-300'>
            {t('eventTitle')}
          </span>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <div className='flex-1'>
              <input
                id={`event-dialog-title-${editedEvent.id}`}
                name='title'
                type='text'
                value={editedEvent.title}
                readOnly={!isEditable || isPending}
                disabled={!isEditable || isPending}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setEditedEvent({
                    ...editedEvent,
                    title: (e.target as HTMLInputElement).value,
                  });
                }}
                className='w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
              />
            </div>
            {isEditable && (
              <CalendarPicker
                options={colorOptions}
                value={editedEvent.calendarId || 'blue'}
                disabled={isPending}
                onChange={value => {
                  setEditedEvent({
                    ...editedEvent,
                    calendarId: value,
                  });
                }}
                registry={app?.getCalendarRegistry()}
              />
            )}
          </div>

          {editedEvent.allDay ? (
            <div className='mb-4'>
              <div className='mb-1 text-xs text-gray-600 dark:text-gray-300'>
                {t('dateRange')}
              </div>
              <RangePicker
                value={[editedEvent.start, editedEvent.end]}
                format='YYYY-MM-DD'
                showTime={false}
                timeZone={eventTimeZone}
                matchTriggerWidth
                disabled={!isEditable || isPending}
                onChange={handleAllDayRangeChange}
                onOk={handleAllDayRangeChange}
                locale={app?.state.locale}
              />
            </div>
          ) : (
            <div className='mb-4'>
              <div className='mb-1 text-xs text-gray-600 dark:text-gray-300'>
                {t('timeRange')}
              </div>
              <RangePicker
                value={[editedEvent.start, editedEvent.end]}
                timeZone={eventTimeZone}
                disabled={!isEditable || isPending}
                onChange={(
                  nextRange: [Temporal.ZonedDateTime, Temporal.ZonedDateTime]
                ) => {
                  const [start, end] = nextRange;
                  setEditedEvent({
                    ...editedEvent,
                    start,
                    end,
                  });
                }}
                onOk={(
                  nextRange: [Temporal.ZonedDateTime, Temporal.ZonedDateTime]
                ) => {
                  const [start, end] = nextRange;
                  setEditedEvent({
                    ...editedEvent,
                    start,
                    end,
                  });
                }}
                locale={app?.state.locale}
              />
            </div>
          )}

          <div className='mb-4'>
            <span className='mb-1 block text-xs text-gray-600 dark:text-gray-300'>
              {t('note')}
            </span>
            <textarea
              id={`event-dialog-note-${editedEvent.id}`}
              name='note'
              value={editedEvent.description ?? ''}
              readOnly={!isEditable || isPending}
              disabled={!isEditable || isPending}
              onChange={e =>
                setEditedEvent({
                  ...editedEvent,
                  description: (e.target as HTMLTextAreaElement).value,
                })
              }
              rows={4}
              className='w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
              placeholder={t('addNotePlaceholder')}
            />
          </div>

          {isEditable && (
            <div className='flex space-x-2'>
              {editedEvent.allDay ? (
                <button
                  type='button'
                  disabled={isPending}
                  className='rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50'
                  onClick={convertToRegular}
                >
                  {t('setAsTimed')}
                </button>
              ) : (
                <button
                  type='button'
                  disabled={isPending}
                  className='rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50'
                  onClick={convertToAllDay}
                >
                  {t('setAsAllDay')}
                </button>
              )}

              <LoadingButton
                type='button'
                disabled={isPending}
                className='rounded-lg border border-border bg-destructive px-3 py-2 text-xs font-medium text-destructive-foreground transition hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50'
                onClick={handleDelete}
                loading={isDeleting}
              >
                {t('delete')}
              </LoadingButton>

              <LoadingButton
                type='button'
                className={`ml-auto rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition ${
                  hasChanges
                    ? 'shadow-lg shadow-primary/20 hover:bg-primary/90'
                    : 'cursor-not-allowed opacity-50 grayscale-[0.5]'
                }`}
                onClick={handleSave}
                disabled={!hasChanges || isPending}
                loading={isSaving}
              >
                {t('save')}
              </LoadingButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const portalTarget = document.body;
  if (!portalTarget) return null;

  return createPortal(dialogContent, portalTarget);
};

export default DefaultEventDetailDialog;
