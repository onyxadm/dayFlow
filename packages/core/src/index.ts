// Core library entry file

// Calendar App and Registry
export { CalendarApp } from './core/CalendarApp';
export type { ICalendarApp } from './types';
export { CalendarRegistry } from './core/calendarRegistry';

// Renderer
export { CalendarRenderer } from './renderer/CalendarRenderer';
export { CustomRenderingStore } from './renderer/CustomRenderingStore';
export type { CustomRendering } from './renderer/CustomRenderingStore';

// Types
export * from './types';

// Utils
export * from './utils';
export { subscribeCalendar } from './utils/subscriptionUtils';
export type { SubscribeResult } from './utils/subscriptionUtils';

// Locale
export * from './locale';

// Factories
export * from './factories';

// Plugins
export { createEventsPlugin } from './plugins/eventsPlugin';
export {
  registerDragImplementation,
  useDragForView,
} from './plugins/dragBridge';
export {
  registerSidebarImplementation,
  useSidebarBridge,
} from './plugins/sidebarBridge';
export type { SidebarBridgeReturn } from './plugins/sidebarBridge';

// Context Menu Primitives
export {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuColorPicker,
  GridContextMenu,
  EventContextMenu,
} from './components/contextMenu';

// Calendar Registry helpers
export { getCalendarColorsForHex } from './core/calendarRegistry';

// Common Components
export { LoadingButton } from './components/common/LoadingButton';
export { BlossomColorPicker } from './components/common/BlossomColorPicker';
export { DefaultColorPicker } from './components/common/DefaultColorPicker';
export { RangePicker as DayflowRangePicker } from '@dayflow/ui-range-picker';
export type { RangePickerProps, ZonedRange } from '@dayflow/ui-range-picker';
export { MiniCalendar } from './components/common/MiniCalendar';
export { CreateCalendarDialog } from './components/common/CreateCalendarDialog';
export { default as DefaultEventDetailPanel } from './components/common/DefaultEventDetailPanel';
export { default as DefaultEventDetailDialog } from './components/common/DefaultEventDetailDialog';
export { ContentSlot } from './renderer/ContentSlot';
export { CalendarEvent } from './components/calendarEvent';
export type { CalendarEventProps } from './components/calendarEvent/types';
export { EventLayoutCalculator } from './components/eventLayout';

// Icons
export {
  PanelRightClose,
  PanelRightOpen,
  ChevronRight,
  ChevronDown,
  Check,
  ChevronsUpDown,
  Plus,
  AudioLines,
  Loader2,
  AlertCircle,
} from './components/common/Icons';

// Sidebar classNames
export {
  sidebarContainer,
  sidebarHeader,
  sidebarHeaderToggle,
  sidebarHeaderTitle,
  cancelButton,
  calendarPickerDropdown,
} from './styles/classNames';

// Year view utilities
export {
  buildFixedWeekMonthsData,
  getFixedWeekTotalColumns,
  groupDaysIntoRows,
  analyzeMultiDayEventsForRow,
} from './components/yearView/utils';
export { getEventIcon } from './components/monthView/util';
export type {
  FixedWeekMonthData,
  MonthEventSegment,
  YearMultiDaySegment,
} from './components/yearView/utils';

// Preact interop (re-export so plugins use the same preact instance as core)
export { createPortal } from 'preact/compat';
