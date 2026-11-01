import type { Metadata } from 'next';
import TripPlannerExperience from '@/components/group-trip/TripPlannerExperience';

export const metadata: Metadata = {
  title: 'Plan a group trip',
  description:
    'Start a private trip room, invite your friends, compare feasible destinations and plan the winning trip together.',
  alternates: { canonical: '/plan' },
};

export default function PlanPage() {
  return <TripPlannerExperience />;
}
