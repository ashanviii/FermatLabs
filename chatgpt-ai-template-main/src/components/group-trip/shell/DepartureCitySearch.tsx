'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, MapPin, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';

type City = { id: string | null; name: string; label: string; countryCode: string };
type Results = { cities: City[]; source: string; fetchedAt: string; fallback: boolean; totalCities: number; attributionUrl: string };

export default function DepartureCitySearch({ value, placeId, country, disabled, onSelect }: {
  value: string; placeId?: string; country: string; disabled: boolean;
  onSelect: (city: { departureCity: string; departurePlaceId?: string }) => void;
}) {
  const { user } = useAuth();
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Results | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => { if (value) { setQuery(value); setResults(null); } }, [value, placeId]);
  useEffect(() => () => { sequence.current++; controller.current?.abort(); }, []);

  async function search() {
    if (!user || query.trim().length < 2 || busy || disabled) return;
    controller.current?.abort(); controller.current = new AbortController();
    const current = ++sequence.current; const activeController = controller.current; const signal = activeController.signal;
    const timeout = setTimeout(() => activeController.abort(), 12_000);
    setBusy(true); setError(''); setResults(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/places', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ query: query.trim(), country }), signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'City search failed.');
      if (current === sequence.current) setResults(result);
    } catch (cause) {
      if (current === sequence.current) setError(signal.aborted ? 'City search timed out. Please retry.' : cause instanceof Error ? cause.message : 'City search failed.');
    } finally { clearTimeout(timeout); if (current === sequence.current) setBusy(false); }
  }

  return <div className="min-w-0 space-y-3">
    <div className="flex min-w-0 gap-2">
      <Input value={query} maxLength={100} disabled={disabled} placeholder="Search a city or town" autoComplete="off"
        onChange={(event) => { sequence.current++; controller.current?.abort(); setBusy(false); setQuery(event.target.value); setResults(null); setError(''); onSelect({ departureCity: '', departurePlaceId: undefined }); }}
        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void search(); } }} />
      <Button type="button" variant="outline" icon={Search} aria-label="Search cities" title="Search cities" loading={busy} disabled={disabled || busy || query.trim().length < 2} onClick={search} />
    </div>
    {value && <p className="type-caption m-0 flex items-start gap-1 text-success-ink"><Check className="mt-0.5 size-3.5 shrink-0" aria-hidden /><span className="min-w-0 break-words">{value}</span></p>}
    {value && placeId?.startsWith('geonames:') && <p className="type-caption m-0 text-ink-muted"><a href="https://www.geonames.org/" target="_blank" rel="noreferrer" className="underline">GeoNames</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="underline">CC BY 4.0</a></p>}
    {error && <p role="alert" className="type-small m-0 text-danger-ink">{error}</p>}
    {results && <div aria-live="polite" className="space-y-2">
      {results.cities.length ? <ul aria-label="City search results" className="m-0 max-h-64 list-none overflow-y-auto rounded-lg border border-line p-1">
        {results.cities.map((city) => <li key={city.id || city.name}>
          <button type="button" className="type-small flex w-full items-start gap-2 rounded-md p-2.5 text-left text-ink hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
            onClick={() => { onSelect({ departureCity: city.id ? city.label : city.name, departurePlaceId: city.id || undefined }); setQuery(city.label); setResults(null); }}>
            <MapPin className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden /><span className="min-w-0 break-words">{city.label}</span>
          </button>
        </li>)}
      </ul> : <p className="type-small m-0 text-ink-muted">No matching city. Try another spelling or a nearby travel hub.</p>}
      <p className="type-caption m-0 text-ink-muted"><a href={results.attributionUrl} target="_blank" rel="noreferrer" className="underline">{results.source}</a> · {results.fallback ? 'Offline travel-hub fallback' : 'CC BY 4.0'} · Updated {results.fetchedAt.slice(0, 10)}</p>
    </div>}
  </div>;
}