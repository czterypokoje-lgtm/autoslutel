'use client';

import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

import { Calendar } from '@/components/ui/calendar';

/**
 * The month around the shown date, as the shadcn calendar.
 *
 * Same contract as the old link grid it replaces: picking a day navigates to
 * `/admin/jobs?datum=…` and keeps the current Dag/Week view, and the days
 * covered by the shown period stay highlighted so a week view reads as a week.
 * Navigation is a router.push rather than seven-hundred prefetched links — the
 * old grid rendered 42 of them per month.
 */
export default function MiniMonth({
  date,
  from,
  to,
  view,
}: {
  date: string;
  from: string;
  to: string;
  view: string;
}) {
  const router = useRouter();
  const selected = parseISO(date);

  return (
    <Calendar
      className="w-full"
      mode="single"
      locale={nl}
      weekStartsOn={1}
      selected={selected}
      defaultMonth={selected}
      month={selected}
      onMonthChange={(month) =>
        router.push(`/admin/jobs?datum=${format(month, 'yyyy-MM-01')}${view === 'week' ? '&weergave=week' : ''}`)
      }
      onSelect={(day) => {
        if (!day) return;
        router.push(`/admin/jobs?datum=${format(day, 'yyyy-MM-dd')}${view === 'week' ? '&weergave=week' : ''}`);
      }}
      modifiers={{ shown: { from: parseISO(from), to: parseISO(to) } }}
      modifiersClassNames={{ shown: 'bg-accent text-accent-foreground rounded-(--cell-radius)' }}
    />
  );
}
