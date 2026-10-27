const STORAGE_KEY = 'fermat.group-trip.v1';

const DESTINATIONS = [
  {
    id: 'bangkok',
    seedOrder: 1,
    city: 'Bangkok',
    country: 'Thailand',
    emoji: '🌴',
    estimateMin: 65000,
    estimateMax: 85000,
    preferredMonths: [11, 12, 1, 2],
    passportMonths: 6,
    visaKey: null,
    visaLabel: 'Thailand entry requirements',
    officialUrl: 'https://www.thaievisa.go.th/',
    reviewedAt: '24 Oct 2026',
    accent: '#DFF4E7',
  },
  {
    id: 'dubai',
    seedOrder: 2,
    city: 'Dubai',
    country: 'United Arab Emirates',
    emoji: '☀️',
    estimateMin: 80000,
    estimateMax: 110000,
    preferredMonths: [11, 12, 1, 2, 3],
    passportMonths: 6,
    visaKey: 'uae',
    visaLabel: 'UAE tourist visa',
    officialUrl: 'https://u.ae/en/information-and-services/visa-and-emirates-id/tourist-visas',
    reviewedAt: '24 Oct 2026',
    accent: '#FFF0C7',
  },
  {
    id: 'paris',
    seedOrder: 3,
    city: 'Paris',
    country: 'France',
    emoji: '🗼',
    estimateMin: 130000,
    estimateMax: 175000,
    preferredMonths: [4, 5, 6, 9, 10],
    passportMonths: 3,
    visaKey: 'schengen',
    visaLabel: 'Schengen visa',
    officialUrl: 'https://france-visas.gouv.fr/en/',
    reviewedAt: '24 Oct 2026',
    accent: '#E7ECFF',
  },
];

function createTraveller(index) {
  return {
    id: `traveller-${index + 1}`,
    name: index === 0 ? 'You' : `Traveller ${index + 1}`,
    departureCity: index === 0 ? 'Delhi' : '',
    passportExpiry: '',
    visas: [],
  };
}

function createDefaultDraft() {
  return {
    version: 1,
    stage: 'basics',
    tripName: '',
    travelMonth: '2026-12',
    durationDays: 6,
    budgetPerPerson: 100000,
    travellers: Array.from({ length: 2 }, (_, index) => createTraveller(index)),
    selectedDestinationId: null,
  };
}

function getDestination(id) {
  const destination = DESTINATIONS.find((item) => item.id === id);
  if (!destination) throw new Error(`Unknown destination: ${id}`);
  return destination;
}

function getTripEnd(travelMonth, durationDays) {
  const [year, month] = String(travelMonth || '').split('-').map(Number);
  if (!year || !month) return null;
  const date = new Date(Date.UTC(year, month - 1, 1));
  date.setUTCDate(date.getUTCDate() + Math.max(1, Number(durationDays) || 1) - 1);
  return date;
}

function addMonthsClamped(date, months) {
  const targetMonth = date.getUTCMonth() + months;
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const finalDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, normalizedMonth, Math.min(date.getUTCDate(), finalDay)));
}

function expiryMonthEnd(value) {
  const [year, month] = String(value || '').split('-').map(Number);
  if (!year || !month) return null;
  return new Date(Date.UTC(year, month, 0));
}

function adjustedEstimate(destination, durationDays) {
  const factor = 0.5 + (0.5 * Math.max(1, Number(durationDays) || 1)) / 6;
  return {
    min: Math.round(destination.estimateMin * factor),
    max: Math.round(destination.estimateMax * factor),
  };
}

function budgetPoints(budget, min, max) {
  const value = Math.max(0, Number(budget) || 0);
  if (value >= max) return 40;
  if (value >= min) return 25 + (15 * (value - min)) / (max - min);
  return (20 * value) / min;
}

function passportReadiness(traveller, destination, tripEnd) {
  const expiry = expiryMonthEnd(traveller.passportExpiry);
  if (!expiry || !tripEnd) {
    return { status: 'unknown', detail: 'Add passport expiry month', points: 0.4 };
  }

  const cutoff = addMonthsClamped(tripEnd, destination.passportMonths);
  const expiryMonth = expiry.getUTCFullYear() * 12 + expiry.getUTCMonth();
  const cutoffMonth = cutoff.getUTCFullYear() * 12 + cutoff.getUTCMonth();
  if (expiryMonth === cutoffMonth) {
    return { status: 'unknown', detail: `Verify the exact expiry day against ${formatMonth(cutoff)}`, points: 0.4 };
  }
  if (expiryMonth > cutoffMonth) {
    return {
      status: 'ready',
      detail: `Valid through ${traveller.passportExpiry}`,
      points: 1,
    };
  }

  return {
    status: 'action',
    detail: `Needs validity beyond ${formatMonth(cutoff)}`,
    points: 0,
  };
}

function visaReadiness(traveller, destination) {
  if (!destination.visaKey) {
    return {
      status: 'unknown',
      detail: 'Verify current official entry rules',
      points: 0.25,
    };
  }

  if (Array.isArray(traveller.visas) && traveller.visas.includes(destination.visaKey)) {
    return {
      status: 'unknown',
      detail: `${destination.visaLabel} reported — verify validity and entries`,
      points: 0.6,
    };
  }

  return {
    status: 'action',
    detail: `Plan and verify ${destination.visaLabel}`,
    points: 0.25,
  };
}

function formatMonth(date) {
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function formatInr(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function recommendDestinations(group, destinationIds) {
  const requested = destinationIds
    ? destinationIds.map(getDestination)
    : DESTINATIONS;
  const travellers = Array.isArray(group.travellers) ? group.travellers : [];
  const tripEnd = getTripEnd(group.travelMonth, group.durationDays);
  const travelMonth = Number(String(group.travelMonth || '').split('-')[1]);

  return requested
    .map((destination) => {
      const estimate = adjustedEstimate(destination, group.durationDays);
      const blockers = [];
      const actions = [];
      const passportStates = travellers.map((traveller) => {
        const state = passportReadiness(traveller, destination, tripEnd);
        if (state.status === 'action') {
          blockers.push({
            kind: 'passport',
            travellerId: traveller.id,
            message: `${traveller.name || 'Traveller'}: ${state.detail}`,
          });
        } else if (state.status === 'unknown') {
          actions.push({
            kind: 'passport',
            travellerId: traveller.id,
            message: `${traveller.name || 'Traveller'}: ${state.detail}`,
          });
        }
        return state;
      });
      const visaStates = travellers.map((traveller) => {
        const state = visaReadiness(traveller, destination);
        if (state.status !== 'ready') {
          actions.push({
            kind: 'visa',
            travellerId: traveller.id,
            message: `${traveller.name || 'Traveller'}: ${state.detail}`,
          });
        }
        return state;
      });

      if ((Number(group.budgetPerPerson) || 0) < estimate.min) {
        blockers.push({
          kind: 'budget',
          message: `Shared budget is below the ${formatInr(estimate.min)} demo minimum`,
        });
      }

      const divisor = Math.max(1, travellers.length);
      const passportScore = (passportStates.reduce((sum, state) => sum + state.points, 0) / divisor) * 20;
      const visaScore = (visaStates.reduce((sum, state) => sum + state.points, 0) / divisor) * 20;
      const seasonScore = destination.preferredMonths.includes(travelMonth) ? 20 : 10;
      const costScore = budgetPoints(group.budgetPerPerson, estimate.min, estimate.max);
      const fitScore = Math.round(costScore + passportScore + visaScore + seasonScore);
      const passportReady = passportStates.filter((state) => state.status === 'ready').length;

      return {
        ...destination,
        estimate,
        fitScore,
        blockers,
        actions,
        summary: blockers.length
          ? `${blockers.length} ${blockers.length === 1 ? 'blocker' : 'blockers'} · ${actions.length} actions`
          : `No hard blockers · ${actions.length} actions to verify`,
        reasons: [
          group.budgetPerPerson >= estimate.min
            ? `Fits the ${formatInr(group.budgetPerPerson)} per-person budget`
            : `Needs about ${formatInr(estimate.min - group.budgetPerPerson)} more per person`,
          `${passportReady}/${travellers.length} passports ready`,
          destination.preferredMonths.includes(travelMonth)
            ? 'Good seasonal fit for your month'
            : 'Possible, but outside the preferred demo months',
        ],
      };
    })
    .sort((a, b) =>
      a.blockers.length - b.blockers.length ||
      b.fitScore - a.fitScore ||
      a.seedOrder - b.seedOrder,
    );
}

function buildReadinessRows(group, destinationId) {
  const destination = getDestination(destinationId);
  const tripEnd = getTripEnd(group.travelMonth, group.durationDays);
  const estimate = adjustedEstimate(destination, group.durationDays);
  const budgetReady = (Number(group.budgetPerPerson) || 0) >= estimate.min;

  return (group.travellers || []).map((traveller) => ({
    travellerId: traveller.id,
    travellerName: traveller.name || 'Traveller',
    departureCity: traveller.departureCity || 'Not added',
    cost: {
      status: budgetReady ? 'ready' : 'action',
      detail: budgetReady ? 'Within the shared demo budget' : 'Shared budget is below the demo minimum',
    },
    passport: passportReadiness(traveller, destination, tripEnd),
    visa: visaReadiness(traveller, destination),
  }));
}

function isValidDraft(value) {
  return Boolean(
    value &&
      value.version === 1 &&
      typeof value.tripName === 'string' &&
      typeof value.travelMonth === 'string' &&
      Number.isFinite(value.durationDays) &&
      Number.isFinite(value.budgetPerPerson) &&
      Array.isArray(value.travellers),
  );
}

/**
 * @param {{ getItem: (key: string) => string | null }} storage
 * @param {(message: string) => void} onError
 */
function loadTripDraft(storage, onError = () => {}) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultDraft();
    const parsed = JSON.parse(raw);
    if (!isValidDraft(parsed)) {
      onError('Saved group trip is from an unsupported version. Starting with a clean in-memory draft.');
      return createDefaultDraft();
    }
    return parsed;
  } catch (_error) {
    onError('This browser could not read the saved group trip. Your current draft will stay in this tab.');
    return createDefaultDraft();
  }
}

/**
 * @param {{ setItem: (key: string, value: string) => void }} storage
 * @param {ReturnType<typeof createDefaultDraft>} draft
 * @param {(message: string) => void} onError
 */
function saveTripDraft(storage, draft, onError = () => {}) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch (_error) {
    onError('This browser could not save the group trip. Keep this tab open to avoid losing the draft.');
    return false;
  }
}

/**
 * @param {{ removeItem: (key: string) => void }} storage
 * @param {(message: string) => void} onError
 */
function clearTripDraft(storage, onError = () => {}) {
  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch (_error) {
    onError('This browser could not delete the saved group trip.');
    return false;
  }
}

/**
 * @param {{ removeItem: (key: string) => void }} storage
 * @param {boolean} confirmed
 * @param {(message: string) => void} onError
 */
function resetTripDraft(storage, confirmed, onError = () => {}) {
  if (!confirmed) return false;
  return clearTripDraft(storage, onError);
}

module.exports = {
  DESTINATIONS,
  STORAGE_KEY,
  adjustedEstimate,
  buildReadinessRows,
  clearTripDraft,
  createDefaultDraft,
  getDestination,
  loadTripDraft,
  recommendDestinations,
  resetTripDraft,
  saveTripDraft,
};
