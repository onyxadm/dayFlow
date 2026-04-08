import type { CalendarView } from '@/types';

export type ViewConfigComparison = {
  hasChanges: boolean;
  requiresRender: boolean;
};

const unchangedViewConfig: ViewConfigComparison = {
  hasChanges: false,
  requiresRender: false,
};

const compareViewConfigValues = (
  previous: unknown,
  next: unknown
): ViewConfigComparison => {
  if (previous === next) return unchangedViewConfig;

  const previousType = typeof previous;
  const nextType = typeof next;

  if (previousType === 'function' || nextType === 'function') {
    if (previousType === 'function' && nextType === 'function') {
      return {
        hasChanges: true,
        // Function references can change because the host rerendered. Update the
        // stored config, but do not force a calendar rerender for that alone.
        requiresRender: false,
      };
    }

    return {
      hasChanges: true,
      requiresRender: true,
    };
  }

  if (previous instanceof Date && next instanceof Date) {
    const changed = previous.getTime() !== next.getTime();
    return {
      hasChanges: changed,
      requiresRender: changed,
    };
  }

  if (Array.isArray(previous) || Array.isArray(next)) {
    if (!Array.isArray(previous) || !Array.isArray(next)) {
      return {
        hasChanges: true,
        requiresRender: true,
      };
    }

    if (previous.length !== next.length) {
      return {
        hasChanges: true,
        requiresRender: true,
      };
    }

    let hasChanges = false;
    let requiresRender = false;

    previous.forEach((value, index) => {
      const diff = compareViewConfigValues(value, next[index]);
      hasChanges = hasChanges || diff.hasChanges;
      requiresRender = requiresRender || diff.requiresRender;
    });

    return { hasChanges, requiresRender };
  }

  if (
    previousType !== 'object' ||
    previous === null ||
    nextType !== 'object' ||
    next === null
  ) {
    return {
      hasChanges: true,
      requiresRender: true,
    };
  }

  if (Object.getPrototypeOf(previous) !== Object.getPrototypeOf(next)) {
    return {
      hasChanges: true,
      requiresRender: true,
    };
  }

  const previousRecord = previous as Record<string, unknown>;
  const nextRecord = next as Record<string, unknown>;
  const previousKeys = Object.keys(previousRecord);
  const nextKeys = Object.keys(nextRecord);

  if (previousKeys.length !== nextKeys.length) {
    return {
      hasChanges: true,
      requiresRender: true,
    };
  }

  let hasChanges = false;
  let requiresRender = false;

  for (const key of previousKeys) {
    if (!nextKeys.includes(key)) {
      return {
        hasChanges: true,
        requiresRender: true,
      };
    }

    const diff = compareViewConfigValues(previousRecord[key], nextRecord[key]);
    hasChanges = hasChanges || diff.hasChanges;
    requiresRender = requiresRender || diff.requiresRender;
  }

  return { hasChanges, requiresRender };
};

export const compareViews = (
  previousView: CalendarView | undefined,
  nextView: CalendarView
): ViewConfigComparison => {
  if (!previousView) {
    return {
      hasChanges: true,
      requiresRender: true,
    };
  }

  if (
    previousView.component !== nextView.component ||
    previousView.label !== nextView.label
  ) {
    return {
      hasChanges: true,
      requiresRender: true,
    };
  }

  return compareViewConfigValues(previousView.config, nextView.config);
};
