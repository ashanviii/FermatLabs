import type { Metadata } from 'next';
import LegalPage, { Section } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Fermat collects, protects and uses account, trip and private planning information.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" intro={`${LEGAL.company} ("Fermat", "we") helps groups choose and plan a trip together while keeping each person's budget and documents private. This policy explains what we collect, why, who can see it, and the choices you have.`}>
    <Section title="What we collect">
      <p><b>Account details.</b> Your email address and name if you sign in with email or Google (and your Google profile photo if Google provides it). Guests get an anonymous ID and choose a nickname.</p>
      <p><b>Trip details.</b> Trip name, dates, group size, member nicknames, votes, plan edits and approvals.</p>
      <p><b>Your private inputs.</b> Departure city, budget ceiling, passport expiry month (or that you don't have a passport yet), visas you say you hold, travel preferences, and confirmations such as being 18 or older.</p>
      <p><b>Payment details you choose to share.</b> If an organizer adds a payment ID (for example a UPI ID), other members of that trip can see it. Fermat never processes, holds or sees the money.</p>
      <p><b>Technical data.</b> Basic device, browser and log information (such as IP address) recorded by our hosting and database providers, and small items stored in your browser so you stay signed in and return to your trip.</p>
      <p>We do <b>not</b> ask for passport numbers, identity documents, dates of birth, or card or bank details.</p>
    </Section>
    <Section title="How we use it">
      <p>To run your trip room: check which options fit everyone, generate the itinerary and budget, show anonymous group summaries, record votes and approvals, keep the service secure, and fix problems. We do not sell your data and do not use it for advertising.</p>
    </Section>
    <Section title="Who can see what">
      <p>Your budget, passport, visa and preference inputs are visible only to you. The rest of your group sees anonymous counts (for example "1 budget short"), per-person cost allocations, nicknames, votes after a destination is locked, and approval status. The organizer also sees pending join requests.</p>
      <p>Shared summaries and allocations can sometimes let others make a rough guess about someone's budget. We show this notice so you can decide what to enter.</p>
    </Section>
    <Section title="Service providers and where data is stored">
      <p>We use Google Firebase (Authentication and Cloud Firestore) to store accounts and trip data, currently in Google Cloud's Mumbai (asia-south1) region, and a hosting provider to serve the website. These providers process data on our behalf under their own security and privacy terms. Your data may be processed outside your country.</p>
    </Section>
    <Section title="How long we keep it">
      <p>We keep trip data while the trip exists and your account while you use Fermat. Ask us to delete your account or a trip at {LEGAL.contactEmail} and we will delete it within 30 days, except where the law requires us to keep something longer.</p>
    </Section>
    <Section title="Your rights">
      <p>Depending on where you live (for example under the EU/UK GDPR, India's Digital Personal Data Protection Act 2023, or California privacy law), you can ask to access, correct, export or delete your data, withdraw consent, or complain to your data protection authority. Email {LEGAL.contactEmail}; this address also serves as our grievance contact. We do not sell or share personal data for cross-context advertising.</p>
    </Section>
    <Section title="Age">
      <p>Fermat is for adults aged 18 or older. We do not knowingly collect data from children.</p>
    </Section>
    <Section title="Security">
      <p>Private inputs are only reachable through our server, which checks who you are before every read or change. No system is perfectly secure, so please don't enter anything you aren't comfortable storing online.</p>
    </Section>
    <Section title="Changes">
      <p>If we change this policy we will update the date above and, for significant changes, ask you to agree again when you next sign in.</p>
    </Section>
  </LegalPage>;
}
