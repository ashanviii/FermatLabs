import type { Metadata } from 'next';
import LandingPage from '../../src/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'Group trip planner for friends',
  description:
    'A private group trip planner for friends. Compare budgets, dates, departure cities and passports, vote together and turn the winner into a shared plan.',
  alternates: { canonical: '/' },
};

export default function Landing() {
  return <LandingPage />;
}
