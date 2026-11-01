import type { Metadata } from 'next';
import LegalPage, { Section } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'The terms for using the Fermat group-trip planner.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return <LegalPage title="Terms of Use" intro={`These terms are an agreement between you and ${LEGAL.company} ("Fermat", "we") for using the Fermat website and planner. By creating an account, joining a trip or continuing as a guest, you agree to them. If you don't agree, please don't use Fermat.`}>
    <Section title="Who can use Fermat">
      <p>You must be at least 18 years old and able to enter a binding agreement. Please give accurate information and keep your sign-in details safe.</p>
    </Section>
    <Section title="What Fermat is, and isn't">
      <p>Fermat is a planning tool. Prices, fares, costs, itineraries, holiday dates, tax notes and visa or passport information are <b>illustrative estimates</b> and may be wrong or out of date. Fermat is <b>not</b> a travel agent or booking service, and nothing in Fermat is legal, immigration, tax or financial advice.</p>
      <p>Always check entry, visa and passport rules with official government sources, and check prices and availability with the provider before you book or pay. You are responsible for your own travel decisions, documents and bookings.</p>
    </Section>
    <Section title="Payments between group members">
      <p>Payment links (such as UPI links) open your own payment app and send money directly to another person. Fermat is not a party to these payments, never holds funds, and is not responsible for amounts, refunds or disputes between members. "Paid" markers are self-reported.</p>
    </Section>
    <Section title="Acceptable use">
      <p>Don't use Fermat to break the law, harass anyone, post harmful or misleading content, try to access other people's private inputs or accounts, overload or disrupt the service, or copy it in bulk with automated tools.</p>
    </Section>
    <Section title="Your content">
      <p>You own what you enter. You give us permission to store and process it only to run Fermat for you and your group, as described in our Privacy Policy.</p>
    </Section>
    <Section title="Third-party services">
      <p>Fermat links to services we don't control, such as WhatsApp, payment apps and official government websites. Their own terms and privacy policies apply.</p>
    </Section>
    <Section title="Early-stage service">
      <p>Fermat is an early product. Features may change, pause or stop, and data could be lost. We may suspend accounts that break these terms.</p>
    </Section>
    <Section title="Disclaimers and limits of liability">
      <p>Fermat is provided "as is" and "as available", without warranties of any kind, to the fullest extent the law allows. To the fullest extent the law allows, we are not liable for indirect or consequential losses, or for losses from travel decisions, bookings, visa outcomes, payments between users, or reliance on estimates. Our total liability for any claim is limited to the amount you paid us in the 12 months before the claim (currently nothing, as Fermat is free). Nothing in these terms limits rights you have under consumer law that cannot be excluded.</p>
    </Section>
    <Section title="Changes and ending">
      <p>We may update these terms; we will change the date above and ask you to agree again for significant changes. You can stop using Fermat at any time and ask us to delete your data.</p>
    </Section>
    <Section title="Governing law">
      <p>These terms are governed by the laws of {LEGAL.jurisdiction}, without affecting mandatory consumer protections where you live.</p>
    </Section>
  </LegalPage>;
}
