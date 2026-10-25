/**
 * One icon per concept. Screens import from here, never pick their own lucide icon for these concepts,
 * so "budget" or "private" looks the same everywhere.
 *
 *   import { icons } from '@/components/ui/icons';
 *   const BudgetIcon = icons.budget;
 *   <BudgetIcon className="size-4" strokeWidth={1.75} aria-hidden />
 *
 * Default rendering: size-4 (16px) inline with text, size-5 (20px) in card headers, strokeWidth 1.75.
 */
import {
  Banknote,
  BedDouble,
  Bell,
  CalendarDays,
  CarFront,
  Check,
  CircleCheck,
  CircleX,
  Clock,
  Compass,
  Copy,
  Crown,
  Handshake,
  IdCard,
  Info,
  ListChecks,
  Lock,
  MapPin,
  Map as MapIcon,
  PlaneLanding,
  PlaneTakeoff,
  Plane,
  Route,
  Share2,
  Stamp,
  Sun,
  TriangleAlert,
  UserPlus,
  Users,
  Utensils,
  Vote,
  Wallet,
  Hourglass,
  Link2,
  type LucideIcon,
} from 'lucide-react';
import { WhatsAppIcon } from './whatsapp-icon';

export type IconComponent = LucideIcon | typeof WhatsAppIcon;

export const icons = {
  // Privacy + personal inputs
  private: Lock, // anything only the viewer can see
  budget: Wallet, // a person's budget / affordability
  passport: IdCard,
  visa: Stamp,
  departure: PlaneTakeoff, // departure city, outbound leg
  arrival: PlaneLanding, // arrival, return leg

  // Group + flow
  invite: UserPlus,
  members: Users,
  organizer: Crown,
  vote: Vote,
  plan: MapIcon, // the generated day-by-day plan
  destination: MapPin,
  route: Route, // multi-stop routes
  calendar: CalendarDays, // trip dates
  duration: Clock, // nights / trip length
  pending: Hourglass, // waiting on someone

  // Itinerary item kinds
  flight: Plane,
  roadTransfer: CarFront, // cab, bus, train between places
  stay: BedDouble,
  activity: Compass,
  meal: Utensils,
  freeTime: Sun,

  // Money + commitments
  money: Banknote, // costs, payments, settle up
  pledge: Handshake, // "I'm in if..."

  // Sharing + coordination
  share: Share2,
  whatsapp: WhatsAppIcon,
  copy: Copy,
  link: Link2,
  tasks: ListChecks, // "Who's doing what"
  nudge: Bell,

  // Status
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleX, // blocked / can't go
  info: Info,
  check: Check, // inline tick (selected, done step)
} satisfies Record<string, IconComponent>;

export type IconName = keyof typeof icons;
