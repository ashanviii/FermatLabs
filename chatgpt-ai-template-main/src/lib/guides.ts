export type GuideSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type GuideFaq = {
  question: string;
  answer: string;
};

export type Guide = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  searchIntent: string;
  readingTime: string;
  publishedAt: string;
  updatedAt: string;
  takeaways: string[];
  sections: GuideSection[];
  faqs: GuideFaq[];
};

const sharedDates = {
  publishedAt: '2026-11-08',
  updatedAt: '2026-11-12',
};

export const guides: Guide[] = [
  {
    slug: 'plan-a-group-trip-with-friends',
    title: 'How to plan a group trip with friends',
    eyebrow: 'Group trip planning guide',
    description:
      'A practical group-trip planning workflow for agreeing on dates, budgets and destinations without making one friend do all the work.',
    searchIntent: 'Plan a trip with friends',
    readingTime: '10 min read',
    ...sharedDates,
    takeaways: [
      'Collect constraints privately before suggesting destinations.',
      'Shortlist only options that work for the whole group.',
      'Vote on comparable choices, then assign owners and deadlines.',
    ],
    sections: [
      {
        heading: 'Why group trips stall before anyone books',
        paragraphs: [
          'Most group trips begin with enthusiasm and a vague destination. Then dates arrive in different formats, budgets stay unspoken and suggestions pile up faster than anyone can compare them. The problem is not a lack of ideas; it is a lack of shared constraints.',
          'A better process separates private inputs from group decisions. Each traveller can state what works for them without negotiating in public, while the group sees only the options that survive everyone’s constraints.',
        ],
      },
      {
        heading: 'Step 1: collect the non-negotiables',
        paragraphs: [
          'Ask every traveller for the same information: departure city, passport or home country, available dates, total comfort budget and trip preferences. Give everyone a deadline so the plan does not wait indefinitely for one response.',
        ],
        bullets: [
          'Treat the budget as a total trip budget, not just flights or accommodation.',
          'Use date ranges instead of a single preferred weekend.',
          'Record accessibility, food and pace preferences early.',
          'Keep personal limits private unless someone chooses to share them.',
        ],
      },
      {
        heading: 'Step 2: compare feasible trips, not dream destinations',
        paragraphs: [
          'A destination belongs on the shortlist only if the dates, estimated cost and travel constraints work for every confirmed traveller. This prevents the group from becoming attached to an option that later excludes someone.',
          'Keep the shortlist small—three to five choices is usually enough. Show the same fields for every option so people can compare trade-offs instead of reacting to whichever photo looks best.',
        ],
      },
      {
        heading: 'Step 3: vote and lock the winner',
        paragraphs: [
          'Private voting reduces social pressure and gives quieter travellers an equal voice. Once the group has a winner, freeze the decision unless a material constraint changes.',
          'Publish the decision rule before voting starts: most votes among the options that work for everyone, followed by a clear tie-break if needed. When the vote closes, record the winning dates, current estimate and assumptions in one place.',
        ],
      },
      {
        heading: 'Step 4: turn the vote into commitment',
        paragraphs: [
          'A vote means “I prefer this.” A commitment means “I am ready to proceed at these dates and this estimated cost.” Ask every traveller to confirm again before anyone takes on a non-refundable expense.',
          'Set a commitment deadline and agree what happens when someone withdraws. If the group uses a deposit, decide who collects it, whether it is refundable and how it will be recorded. Fermat does not collect deposits or hold the group’s money.',
        ],
      },
      {
        heading: 'Step 5: give every booking a named owner',
        paragraphs: [
          'Turn the winning trip into concrete tasks for transport, accommodation, documents, insurance and activities. Every task needs one owner, one deadline and a link or note showing the latest status.',
          '“Someone should check hotels” is not a task; “Aman compares three refundable hotels by Thursday” is. Travellers should verify live prices, names, baggage and cancellation terms directly with the provider before paying.',
        ],
      },
      {
        heading: 'Step 6: build a shared itinerary with breathing room',
        paragraphs: [
          'Create a day-by-day plan that shows arrival times, the group’s anchor activity, expected shared cost and any booking deadline. Leave deliberate free time so different energy levels do not turn the itinerary into an obligation.',
          'Keep one shared version of the plan. If a booking or timing changes, update that version instead of relying on scattered group-chat messages.',
        ],
      },
      {
        heading: 'Step 7: run the final handoff before departure',
        paragraphs: [
          'A few days before the trip, confirm transport times, accommodation details, required documents, emergency contacts and who holds each booking reference. Make essential information available offline.',
          'Agree how shared expenses will be logged and settled, then confirm the meeting point and first-day plan. The organiser should be able to step away without becoming the only person who knows what happens next.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How early should friends start planning a group trip?',
        answer:
          'For an international trip, start collecting constraints several months ahead. Short domestic trips can need less lead time, but the group should still agree on a response deadline and a booking date.',
      },
      {
        question: 'What if one person has a much lower budget?',
        answer:
          'Use the lowest workable comfort budget as a hard constraint and keep individual amounts private. The shortlist should contain trips that do not pressure anyone to overspend.',
      },
      {
        question: 'Who should organise a group trip?',
        answer:
          'One organiser can keep the process moving, but research and booking tasks should be distributed. The organiser should coordinate decisions rather than become the group’s unpaid travel agent.',
      },
    ],
  },
  {
    slug: 'group-trip-budget-planner',
    title: 'Group trip budget planner for friends',
    eyebrow: 'Budget planning guide',
    description:
      'Plan a fair group travel budget across flights, stays, food, local transport and shared activities—without forcing friends to reveal personal finances.',
    searchIntent: 'Group travel budget planner',
    readingTime: '8 min read',
    ...sharedDates,
    takeaways: [
      'Plan against a total per-person budget with a contingency buffer.',
      'Separate shared costs from individual choices.',
      'Use private budget inputs and show only group-safe ranges.',
    ],
    sections: [
      {
        heading: 'Start with the full cost, not the flight price',
        paragraphs: [
          'Cheap flights can make an expensive trip look affordable. A useful group-trip budget includes every major cost from the traveller’s front door to the return home.',
        ],
        bullets: [
          'Transport to and from the destination',
          'Accommodation, taxes and deposits',
          'Food and everyday local transport',
          'Visas, insurance and connectivity',
          'Activities plus a contingency buffer',
        ],
      },
      {
        heading: 'Use a comfort budget instead of a maximum spend',
        paragraphs: [
          'A maximum often becomes a target. Ask what each person can comfortably spend while preserving a buffer for price movement and unexpected costs. This produces a safer shortlist and fewer awkward conversations later.',
          'The group does not need to see each person’s number. A planning tool can use private inputs to calculate which options work for everyone and disclose only the feasible result.',
        ],
      },
      {
        heading: 'Split costs by benefit, not blindly by headcount',
        paragraphs: [
          'Equal splitting is simple, but it is not always fair. Shared taxis and a common villa may divide evenly; a private room, premium activity or extra night should stay with the person receiving that benefit.',
          'Agree on the rule before money moves. Record the currency, payer, beneficiaries and conversion rate so settlement does not depend on memory.',
        ],
      },
      {
        heading: 'Recheck the budget before each commitment',
        paragraphs: [
          'Estimates become stale. Refresh transport and accommodation prices before the group votes, before travellers commit and again before booking. If the total moves beyond the agreed buffer, reopen the affected choice rather than silently increasing everyone’s spend.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What should a group trip budget include?',
        answer:
          'Include door-to-door transport, accommodation, food, local travel, entry requirements, insurance, activities and a contingency allowance. Clearly mark optional personal spending separately.',
      },
      {
        question: 'Should friends share their exact budgets?',
        answer:
          'They do not need to. Exact amounts can remain private while the planning process identifies destinations and plans that fit every participant.',
      },
      {
        question: 'How large should the contingency be?',
        answer:
          'It depends on price volatility and how early you are estimating. Use a meaningful buffer rather than presenting an estimate as a guaranteed final price.',
      },
    ],
  },
  {
    slug: 'trip-voting-app-for-friends',
    title: 'Trip voting app for friends',
    eyebrow: 'Group decision guide',
    description:
      'Use a fair destination-voting process that accounts for real dates, budgets and travel constraints—not just the loudest opinion in the group chat.',
    searchIntent: 'Trip voting app for friends',
    readingTime: '6 min read',
    ...sharedDates,
    takeaways: [
      'Filter infeasible destinations before voting.',
      'Compare the same information for each candidate.',
      'Use private ballots and define the tie-break rule in advance.',
    ],
    sections: [
      {
        heading: 'A popular destination is not always a feasible destination',
        paragraphs: [
          'A poll that lists cities without costs, dates or travel constraints produces preference, not a plan. Someone can “win” the poll and still be unable to join the trip.',
          'Before voting, remove options that fall outside a confirmed traveller’s dates or comfortable budget. Verify current entry requirements through official sources before anyone books.',
        ],
      },
      {
        heading: 'Give each option the same decision card',
        paragraphs: [
          'Every candidate should show a comparable estimate, suggested dates, travel time, likely pace and the assumptions behind the recommendation. Consistent information reduces anchoring and helps people vote on the experience rather than the destination’s reputation.',
        ],
      },
      {
        heading: 'Make voting private and time-boxed',
        paragraphs: [
          'Private voting prevents early votes from pulling the group toward a consensus that does not really exist. Give everyone a deadline, then reveal the result together.',
          'Choose the method before opening the ballot: one vote, ranked choices or approval voting. Ranked choices work well when several destinations are acceptable and you want the option with broad support.',
        ],
      },
      {
        heading: 'Decide how ties and changed circumstances work',
        paragraphs: [
          'Set a tie-break rule in advance—lowest estimated cost, widest date overlap or a quick runoff. After the winner is selected, reopen the decision only when a material fact changes, such as availability or price moving beyond the agreed buffer.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the fairest way to vote on a group trip?',
        answer:
          'Filter out infeasible choices, show comparable information, collect votes privately and use a method agreed in advance. Ranked-choice voting is useful when the group has several acceptable options.',
      },
      {
        question: 'Should the organiser get an extra vote?',
        answer:
          'Usually no. The organiser can set deadlines and maintain the shortlist, but every traveller should have equal influence unless the group explicitly agrees otherwise.',
      },
      {
        question: 'Can the group change the winning destination?',
        answer:
          'Yes when a material assumption changes. Avoid reopening the choice simply because someone has a new preference; that restarts the same indecision the vote was meant to resolve.',
      },
    ],
  },
  {
    slug: 'private-budget-group-trip-planning',
    title: 'Private-budget group trip planning',
    eyebrow: 'Privacy-first planning guide',
    description:
      'Coordinate a trip across different budgets while keeping each traveller’s financial limit private and showing the group only feasible choices.',
    searchIntent: 'Private group travel budget tool',
    readingTime: '6 min read',
    ...sharedDates,
    takeaways: [
      'Collect personal constraints privately.',
      'Reveal feasibility—not the person who created the limit.',
      'Keep optional upgrades outside the shared baseline.',
    ],
    sections: [
      {
        heading: 'Budget conversations change group dynamics',
        paragraphs: [
          'Friends can have different incomes, savings goals and definitions of “affordable.” Asking everyone to announce a number in a group chat can create pressure to match the highest spender or embarrassment around setting a lower limit.',
          'Privacy-first planning treats the individual budget as an input to the calculation, not information the group is entitled to see.',
        ],
      },
      {
        heading: 'Share the outcome, not each person’s constraint',
        paragraphs: [
          'The group needs to know whether an option works for everyone. It does not need to know whose budget, passport or schedule ruled another option out. This distinction makes honest inputs more likely and produces a more reliable plan.',
        ],
      },
      {
        heading: 'Build a shared baseline with personal add-ons',
        paragraphs: [
          'Choose accommodation, transport and core activities that fit the whole group. Travellers who want upgrades can add them individually without moving the shared baseline or obligating others to spend more.',
          'Make optional costs visible before voting. A cheap base plan with unavoidable paid extras is not genuinely budget-friendly.',
        ],
      },
      {
        heading: 'Use respectful language throughout the plan',
        paragraphs: [
          'Describe choices as “works for everyone” or “outside the current group constraints.” Avoid labels such as cheap, difficult or blocking. The goal is to find the intersection—not identify the person setting the boundary.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can a group plan a trip without sharing individual budgets?',
        answer:
          'Yes. A planner can compare private limits and return only the destinations and plans that work for every participant.',
      },
      {
        question: 'What should the organiser be able to see?',
        answer:
          'The organiser needs completion status and group-level feasibility, not necessarily each traveller’s exact financial or personal constraints.',
      },
      {
        question: 'How should upgrades be handled?',
        answer:
          'Keep the shared trip within the common budget. Personal room, flight or activity upgrades should be optional and paid by the travellers choosing them.',
      },
    ],
  },
  {
    slug: 'group-trip-planning-checklist',
    title: 'The complete group trip planning checklist',
    eyebrow: 'Planning checklist',
    description:
      'A start-to-finish checklist for organising a group holiday: constraints, destination, voting, commitments, bookings, tasks and final checks.',
    searchIntent: 'Group trip planning checklist',
    readingTime: '9 min read',
    ...sharedDates,
    takeaways: [
      'Move through constraints, decision, commitment and booking in order.',
      'Give every important task an owner and a deadline.',
      'Reconfirm documents, prices and cancellation terms before payment.',
    ],
    sections: [
      {
        heading: 'Phase 1: define the group and collect inputs',
        paragraphs: [
          'Finish this phase before researching detailed itineraries.',
        ],
        bullets: [
          'Name one organiser and confirm the invited travellers.',
          'Collect departure cities, travel documents, date ranges and budgets privately.',
          'Record pace, accessibility, dietary and accommodation preferences.',
          'Set a response deadline and mark non-responses clearly.',
        ],
      },
      {
        heading: 'Phase 2: shortlist and decide',
        paragraphs: [
          'Present only realistic choices and keep the decision window short.',
        ],
        bullets: [
          'Estimate full per-person costs using current prices.',
          'Check date overlap and travel time for every departure city.',
          'Verify entry requirements with official government sources.',
          'Collect private votes, apply the agreed tie-break and lock the winner.',
        ],
      },
      {
        heading: 'Phase 3: collect commitments and book',
        paragraphs: [
          'A vote shows preference; a commitment shows readiness to proceed. Confirm who is in before anyone takes on a non-refundable obligation.',
        ],
        bullets: [
          'Record each traveller’s commitment status.',
          'Agree on cancellation and reimbursement rules.',
          'Recheck names, dates, baggage, refund terms and total prices.',
          'Store booking references somewhere the group can access.',
        ],
      },
      {
        heading: 'Phase 4: turn the itinerary into assigned tasks',
        paragraphs: [
          'Create a lightweight day-by-day plan, then assign visas, insurance, transfers, bookings and shared purchases to named people. Add deadlines early enough to recover if a task slips.',
        ],
      },
      {
        heading: 'Phase 5: run the final check',
        paragraphs: [
          'Before departure, reconfirm documents, transport times, accommodation details, emergency contacts, payment methods and the plan for meeting. Download essential information for offline access.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What should be decided first for a group trip?',
        answer:
          'Start with who is travelling, overlapping dates, comfortable budgets and departure locations. Destination research becomes useful only after those constraints are known.',
      },
      {
        question: 'When should a group make bookings?',
        answer:
          'Book after the destination wins, current prices and terms are rechecked, and each traveller explicitly commits to the plan.',
      },
      {
        question: 'How do we stop one person doing everything?',
        answer:
          'Break the plan into concrete tasks, assign each task to a named owner and set deadlines visible to the group.',
      },
    ],
  },
  {
    slug: 'choose-a-group-trip-destination',
    title: 'How to choose a group trip destination',
    eyebrow: 'Destination selection guide',
    description:
      'Choose a destination using date overlap, total cost, departure cities, travel requirements and group preferences instead of endless suggestions.',
    searchIntent: 'Choose a group trip destination',
    readingTime: '7 min read',
    ...sharedDates,
    takeaways: [
      'Treat destination choice as a constraint-matching problem.',
      'Compare door-to-door effort and total cost.',
      'Shortlist a few feasible options, then let the group vote.',
    ],
    sections: [
      {
        heading: 'Begin with the intersection',
        paragraphs: [
          'The best group destination is not the place receiving the most enthusiastic message. It is the place that fits the dates, budgets, departure points and essential needs of the confirmed travellers.',
          'Start with hard constraints. Preferences—beach, nightlife, food, nature or pace—help rank the options that remain.',
        ],
      },
      {
        heading: 'Compare door-to-door travel, not map distance',
        paragraphs: [
          'A nearby destination with difficult connections can consume more time and money than a farther city with direct routes. Compare realistic departure-to-arrival time for every origin, including airport transfers and inconvenient schedules.',
        ],
      },
      {
        heading: 'Use a total trip estimate',
        paragraphs: [
          'Include accommodation, food, local movement, activities, documentation and a buffer alongside transport. State what the estimate includes so a low headline number does not hide unavoidable expenses.',
        ],
      },
      {
        heading: 'Check travel requirements carefully',
        paragraphs: [
          'Entry rules depend on the traveller, route and date, and they can change. Use planner recommendations only to create a shortlist; confirm the current requirements through official government or consular sources before booking.',
        ],
      },
      {
        heading: 'Rank preferences only after feasibility',
        paragraphs: [
          'Score the remaining options against the experience the group wants, then vote. This order preserves excitement without allowing an attractive but unworkable destination to dominate the conversation.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What factors matter most when choosing a group destination?',
        answer:
          'Date overlap, total per-person cost, travel time from each departure city, current entry requirements and the group’s essential needs should come before softer preferences.',
      },
      {
        question: 'How many destinations should a group shortlist?',
        answer:
          'Three to five well-researched options usually provide enough choice without recreating the original decision overload.',
      },
      {
        question: 'Can an app confirm visa eligibility?',
        answer:
          'A planner can help identify constraints and point toward plausible options, but travellers should verify current requirements using official government or consular sources before paying.',
      },
    ],
  },
  {
    slug: 'group-trip-planner-for-indian-friends',
    title: 'International group trips from India',
    eyebrow: 'India departure guide',
    description:
      'A planning framework for Indian friend groups coordinating different cities, passports, budgets, calendars and international travel requirements.',
    searchIntent: 'Group trip planner for Indian friends',
    readingTime: '8 min read',
    ...sharedDates,
    takeaways: [
      'Compare routes separately for each Indian departure city.',
      'Plan around personal leave calendars and document lead times.',
      'Verify all entry and transit rules through official sources.',
    ],
    sections: [
      {
        heading: 'One group can have several starting points',
        paragraphs: [
          'Friends may depart from Pune, Bengaluru, Delhi, Mumbai or another city, so the same destination can have very different prices and travel times. Compare each origin separately and include the cost of reaching the international departure airport.',
        ],
      },
      {
        heading: 'Collect calendars as ranges, not perfect dates',
        paragraphs: [
          'Work schedules, public holidays and personal commitments rarely align immediately. Ask for acceptable date ranges and trip lengths, then calculate overlap. This finds workable windows that a single “preferred weekend” question misses.',
        ],
      },
      {
        heading: 'Treat documents and transit as individual constraints',
        paragraphs: [
          'Passport details, previous travel and routing can affect what each traveller needs. Requirements also change. Never assume one friend’s experience applies to the whole group; verify current entry and transit rules through the relevant official authorities before booking.',
        ],
      },
      {
        heading: 'Estimate in the currency people actually budget in',
        paragraphs: [
          'Show a per-person estimate in rupees while preserving the original booking currency and a dated conversion assumption. Include card or conversion costs and leave room for exchange-rate movement.',
        ],
      },
      {
        heading: 'Make commitment explicit before payment',
        paragraphs: [
          'After the group votes, ask each traveller to confirm the latest estimate and dates. Record cancellation expectations before any friend pays on behalf of the rest.',
        ],
      },
    ],
    faqs: [
      {
        question:
          'How should friends from different Indian cities compare trips?',
        answer:
          'Compare realistic door-to-door routes and costs for every departure city, including positioning travel and transfers—not only the cheapest headline flight.',
      },
      {
        question: 'How should foreign-currency costs be estimated?',
        answer:
          'Keep the source currency, record the conversion rate and date, show an approximate rupee total and include a buffer for rate movement and payment fees.',
      },
      {
        question: 'Where should travellers verify visa or entry rules?',
        answer:
          'Use the destination government, embassy or consulate and the relevant transit authority. Treat blogs and planning tools as discovery aids, not the final authority.',
      },
    ],
  },
  {
    slug: 'group-trip-planning-app-comparison',
    title: 'What to look for in a group trip planning app',
    eyebrow: 'Planner comparison guide',
    description:
      'Compare group trip planning apps by the work they remove: private inputs, constraint matching, voting, commitments, shared plans and task ownership.',
    searchIntent: 'Best group trip planner',
    readingTime: '7 min read',
    ...sharedDates,
    takeaways: [
      'Look beyond itinerary storage to how the app helps the group decide.',
      'Prioritise privacy, comparable options and clear ownership.',
      'Check whether estimates and travel constraints are explained honestly.',
    ],
    sections: [
      {
        heading: 'Most trip tools start after the hardest decision',
        paragraphs: [
          'Shared documents and itinerary apps are useful once a destination and dates exist. Group planning usually breaks earlier: friends have different budgets, origins, calendars and travel constraints, but no consistent way to combine them.',
          'Choose a tool based on the stage where your group is stuck.',
        ],
      },
      {
        heading: '1. Private, structured inputs',
        paragraphs: [
          'The planner should collect the same essential details from every traveller and allow sensitive limits to remain private. Completion status should be visible without exposing personal answers.',
        ],
      },
      {
        heading: '2. Explainable destination matching',
        paragraphs: [
          'Useful recommendations explain why an option fits, what the estimate includes and which assumptions still need verification. Be cautious of tools presenting travel prices or entry requirements as guaranteed facts.',
        ],
      },
      {
        heading: '3. Fair group decisions',
        paragraphs: [
          'Look for comparable destination cards, private voting, deadlines and a clear result. A reaction poll attached to an unfiltered list is not enough when some choices exclude group members.',
        ],
      },
      {
        heading: '4. A handoff from decision to execution',
        paragraphs: [
          'After voting, the winning option should become a shared plan with commitments, tasks, owners and cost tracking. Otherwise the group still has to rebuild the result in another tool.',
        ],
      },
      {
        heading: 'Where Fermat fits',
        paragraphs: [
          'Fermat is designed for the decision stage: friends privately add dates, budgets, origins and preferences; the group sees options intended to work for everyone, votes and turns the winner into a shared plan. Fermat does not book travel or hold group money.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the best group trip planning app?',
        answer:
          'The best choice depends on where the group is stuck. For early-stage decisions, prioritise private constraint collection, feasibility matching and fair voting. For an already-decided trip, itinerary and booking organisation may matter more.',
      },
      {
        question: 'Is Fermat a travel booking site?',
        answer:
          'No. Fermat helps groups choose and coordinate a realistic trip. It does not sell bookings or hold travellers’ money.',
      },
      {
        question: 'Should a planner guarantee prices or visa outcomes?',
        answer:
          'No. Prices and entry requirements can change. A responsible planner identifies assumptions and directs travellers to current booking and official government sources before commitment.',
      },
    ],
  },
];

export const guideMap = new Map(guides.map((guide) => [guide.slug, guide]));

export function getGuide(slug: string) {
  return guideMap.get(slug);
}
