'use client';

import FamousPersonCard from '@/components/FamousPersonCard';
import { FAMOUS_PERSONS } from '@/lib/ziwei/famous';

export default function FamousCharts(_props: { colors?: unknown; theme?: unknown }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {FAMOUS_PERSONS.slice(0, 3).map(person => (
        <FamousPersonCard key={person.name} person={person} />
      ))}
    </div>
  );
}
