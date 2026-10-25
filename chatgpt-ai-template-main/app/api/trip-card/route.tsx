import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Public share image. Renders only what the client passes from the shared plan; never budgets or private data.
const MAX = 60;
const GREEN = '#153524';
const ACCENT = '#3D9163';

// Keep to the glyphs of the bundled Noto Sans Latin font (Latin-1 plus €, dashes, quotes and a few more) so nothing is
// fetched at render time. $, €, £ and ¥ render as themselves; other currency symbols become their ISO code.
const NOT_IN_FONT = /[^\x20-\x7E\u00A0-\u00FF\u0152\u0153\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC\u2122]/gu;
const SYMBOL_CODES: Record<string, string> = {
  '₹': 'INR', '₩': 'KRW', '₱': 'PHP', '₫': 'VND', '₺': 'TRY', '₪': 'ILS', '฿': 'THB', '₦': 'NGN', '₴': 'UAH', '₽': 'RUB',
  '₸': 'KZT', '₼': 'AZN', '₾': 'GEL', '₡': 'CRC', '₲': 'PYG', '₵': 'GHS', '₭': 'LAK', '₮': 'MNT', '৳': 'BDT', '៛': 'KHR',
};
const CURRENCY_SYMBOL = /\p{Sc}/u;

function text(params: URLSearchParams, key: string) {
  const code = (params.get('currency') || '').toUpperCase();
  const fallback = /^[A-Z]{3}$/.test(code) ? code : '';
  const raw = (params.get(key) || '').replace(/\s*(→|->)\s*/g, ' > ');
  const safe = raw.replace(NOT_IN_FONT, (ch) => {
    const iso = SYMBOL_CODES[ch] || (CURRENCY_SYMBOL.test(ch) ? fallback : '');
    return iso ? ` ${iso} ` : '';
  });
  return safe.replace(/\s+/g, ' ').trim().slice(0, MAX);
}

function count(params: URLSearchParams, key: string, max = 100000) {
  const value = Number.parseInt(text(params, key), 10);
  return Number.isFinite(value) && value >= 0 && value <= max ? value : null;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function supportLine(params: URLSearchParams, kind: string) {
  const people = count(params, 'people', 100);
  const parts: string[] = people ? [`${people} friends`] : [];
  if (kind === 'wrapped') {
    const days = count(params, 'decisionDays', 3650); const perPerson = text(params, 'perPerson');
    if (days) parts.push(`decided in ${plural(days, 'day')}`);
    if (perPerson) parts.push(`${perPerson} each on average`);
  } else {
    const daysToGo = count(params, 'daysToGo', 3650); const start = text(params, 'start'); const end = text(params, 'end');
    if (daysToGo !== null) parts.push(daysToGo === 0 ? 'leaving today' : `${plural(daysToGo, 'day')} to go`);
    if (start) parts.push(end && end !== start ? `${start} - ${end}` : start);
  }
  return parts.join('  ·  ');
}

function Arrow() {
  return <svg width="34" height="34" viewBox="0 0 24 24" style={{ margin: '0 14px' }}><path d="M4 12h14M13 6l6 6-6 6" stroke={ACCENT} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const kind = text(params, 'kind') === 'wrapped' ? 'wrapped' : 'countdown';
  const dest = text(params, 'dest') || 'Our next trip';
  const stops = text(params, 'route').split(' > ').map((s) => s.trim()).filter(Boolean).slice(0, 5);
  const line = supportLine(params, kind);
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: GREEN, color: 'white', padding: '64px 72px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 28, letterSpacing: 4, color: '#B9DCC6', textTransform: 'uppercase' }}>
        <div style={{ width: 18, height: 18, borderRadius: 9, background: ACCENT, marginRight: 16 }} />
        {kind === 'wrapped' ? 'Fermat Wrapped' : 'Trip countdown'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: dest.length > 36 ? 64 : dest.length > 22 ? 84 : 112, fontWeight: 700, lineHeight: 1.05, wordBreak: 'break-word' }}>{dest}</div>
        {line && <div style={{ display: 'flex', marginTop: 28, fontSize: 38, color: '#E3F1E8' }}>{line}</div>}
        {stops.length > 1 && <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginTop: 24, fontSize: 32, color: '#B9DCC6' }}>{stops.map((stop, i) => <div key={i} style={{ display: 'flex', alignItems: 'center' }}>{i > 0 && <Arrow />}{stop}</div>)}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '2px solid rgba(255,255,255,0.18)', paddingTop: 28, fontSize: 30 }}>
        <div style={{ display: 'flex', fontWeight: 700 }}>Plan yours free on Fermat</div>
        <div style={{ display: 'flex', color: '#B9DCC6' }}>Budgets stay private</div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=3600' } },
  );
}
