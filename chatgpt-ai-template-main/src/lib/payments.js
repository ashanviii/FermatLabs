// Organizer payee handles for collecting trip money, per payment app. Handles are stored without the app's prefix
// (@ for Venmo/Revolut, $ for Cash App) and links are built from public profile URLs; no payment API is called.
const PAYEE_KINDS = {
  upi: { label: 'UPI', pattern: /^[\w.-]{2,64}@[A-Za-z][\w]{1,63}$/, error: 'A valid UPI ID like name@okbank is required' },
  paypal: { label: 'PayPal', pattern: /^(?:[A-Za-z0-9]{1,20}|[^\s@/]{1,64}@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})$/, error: 'A PayPal.Me name (letters and numbers, up to 20) or PayPal email is required' },
  venmo: { label: 'Venmo', prefix: '@', pattern: /^[A-Za-z0-9_-]{5,30}$/, error: 'A Venmo username of 5–30 letters, numbers, dashes or underscores is required' },
  revolut: { label: 'Revolut', prefix: '@', pattern: /^[A-Za-z0-9._]{3,20}$/, error: 'A Revolut @revtag of 3–20 letters, numbers, dots or underscores is required' },
  monzo: { label: 'Monzo', pattern: /^[A-Za-z0-9._-]{2,40}$/, error: 'A monzo.me username of 2–40 letters, numbers, dots, dashes or underscores is required' },
  cashapp: { label: 'Cash App', prefix: '$', pattern: /^(?=[A-Za-z0-9_]*[A-Za-z])[A-Za-z0-9_]{1,20}$/, error: 'A Cash App $cashtag of up to 20 letters or numbers (at least one letter) is required' },
};

/** Validates { kind, handle } (or the legacy { upiId }) and returns the normalized { kind, handle }; throws with a user-facing message. */
function validatePayee(input) {
  const legacy = input && input.kind === undefined && input.upiId !== undefined;
  const kind = legacy ? 'upi' : input && input.kind;
  const spec = Object.prototype.hasOwnProperty.call(PAYEE_KINDS, kind) ? PAYEE_KINDS[kind] : null;
  if (!spec) throw new Error(`Payment method must be one of: ${Object.keys(PAYEE_KINDS).join(', ')}`);
  const raw = legacy ? input.upiId : input.handle;
  let handle = typeof raw === 'string' ? raw.trim() : '';
  if (spec.prefix && handle.startsWith(spec.prefix)) handle = handle.slice(spec.prefix.length);
  if (!spec.pattern.test(handle)) throw new Error(spec.error);
  return { kind, handle };
}

/** Public pay/profile link for a handle, or null. UPI links carry amount and currency; others open the profile. */
function payLink({ kind, handle }, { amount, currency, note } = {}) {
  const e = encodeURIComponent;
  switch (kind) {
    case 'upi': return `upi://pay?pa=${e(handle)}&pn=${e('Fermat trip organizer')}${amount ? `&am=${amount}` : ''}&cu=${e(currency || 'INR')}${note ? `&tn=${e(note)}` : ''}`;
    case 'paypal': return handle.includes('@') ? null : `https://paypal.me/${e(handle)}${amount && currency ? `/${amount}${e(currency)}` : ''}`;
    case 'venmo': return `https://venmo.com/u/${e(handle)}`;
    case 'revolut': return `https://revolut.me/${e(handle)}`;
    case 'monzo': return `https://monzo.me/${e(handle)}${amount ? `/${amount}` : ''}`;
    case 'cashapp': return `https://cash.app/$${e(handle)}${amount ? `/${amount}` : ''}`;
    default: return null;
  }
}

/** Display form with the app's prefix: '@diya-k', '$aarav', 'name@okaxis'. */
const displayHandle = ({ kind, handle }) => `${PAYEE_KINDS[kind]?.prefix || ''}${handle}`;

module.exports = { PAYEE_KINDS, PAYEE_KIND_IDS: Object.keys(PAYEE_KINDS), validatePayee, payLink, displayHandle };
