import type { AllDaySortComparator, CalendarAppConfig } from '@/types';

type CalendarAppConfigGetter = () => CalendarAppConfig;

export function createNormalizedCalendarAppConfigGetter(
  getConfig: CalendarAppConfigGetter
): () => CalendarAppConfig {
  let allDaySortComparator: AllDaySortComparator | undefined =
    getConfig().allDaySortComparator;

  const stableAllDaySortComparator: AllDaySortComparator = (a, b) =>
    allDaySortComparator?.(a, b) ?? 0;

  return () => {
    const config = getConfig();
    allDaySortComparator = config.allDaySortComparator;

    return {
      ...config,
      allDaySortComparator: config.allDaySortComparator
        ? stableAllDaySortComparator
        : undefined,
    };
  };
}
