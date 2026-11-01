import type { Metadata } from 'next';
import LandingPage from '../../src/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'Group trips, sorted',
  description:
    'Plan a group trip that fits every friend’s private budget, departure city and passport. Vote together, lock the winner and get the itinerary.',
  alternates: { canonical: '/' },
};

export default function Landing() {
  return <LandingPage />;
}
