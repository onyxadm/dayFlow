import type { Metadata } from 'next';

import { LiveDemo } from '@/components/showcase/LiveDemo';

export const metadata: Metadata = {
  title: 'DayFlow - Lightweight Calendar Component',
  description:
    'A lightweight and elegant full calendar component for React, Vue, Angular, and Svelte. Supports day, week, month, and year views with drag-and-drop, localization, and dark mode.',
  openGraph: {
    title: 'DayFlow - Lightweight Calendar Component',
    description:
      'A lightweight and elegant full calendar component for React, Vue, Angular, and Svelte. Supports day, week, month, and year views with drag-and-drop, localization, and dark mode.',
  },
};

export default function HomePage() {
  return <LiveDemo />;
}
