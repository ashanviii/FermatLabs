'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, MapPin, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import FermatMark from '../landing/FermatMark';
import '../../../app/(marketing)/landing.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=80`;

// Each slide pairs a destination photo with a sample request and what Fermat answers.
const slides = [
  {
    image: photo('1624253321171-1be53e12f5f4'),
    alt: 'A pagoda rising above a narrow street in Kyoto at golden hour',
    place: 'Kyoto, Japan',
    prompt: 'Plan five slow days in Kyoto during cherry blossom season.',
    reply: 'Temples at sunrise, a ryokan in Gion, and your Japan eVisa checklist. All set.',
  },
  {
    image: photo('1561956021-947f09ae0101'),
    alt: 'Colourful houses on a cliffside above the sea in Positano',
    place: 'Positano, Italy',
    prompt: 'Find me a quiet cliffside stay on the Amalfi Coast under €200.',
    reply: 'Three stays shortlisted in Praiano, with ferry times from Naples.',
  },
  {
    image: photo('1648669582545-73dc52ba7748'),
    alt: 'A car on an open road in front of a mountain in Iceland',
    place: 'Ring Road, Iceland',
    prompt: 'Road trip around Iceland in June. What do I need to sort out?',
    reply: 'A 10-day route, campervan options and fuel stops, mapped out.',
  },
];

type Mode = 'login' | 'signup';

const copy = {
  login: {
    title: 'Welcome back',
    subtitle: 'Log in to pick up your trips where you left off.',
    submit: 'Log in',
    switchPrompt: "Don't have an account?",
    switchLabel: 'Sign up',
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Your AI travel assistant for visas, flights, stays and everything in between.',
    submit: 'Create account',
    switchPrompt: 'Already have an account?',
    switchLabel: 'Log in',
  },
};

const glass = 'bg-black/25 ring-1 ring-white/20 backdrop-blur-md';

const inputClass =
  'h-11 w-full rounded-xl border bg-card px-3.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[#5DBB84] focus:ring-4 focus:ring-[#5DBB84]/15';

// Concave corners that make the back-button notch look cut out of the photo.
const notchCorner: React.CSSProperties = {
  background: 'radial-gradient(circle at 100% 100%, transparent 20px, hsl(var(--background)) 20.5px)',
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function DestinationShowcase() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const go = (step: number) => setIndex((i) => (i + step + slides.length) % slides.length);

  // Restarts whenever the slide changes, so a manual click gets a full turn before auto-advancing.
  useEffect(() => {
    const id = setTimeout(() => go(1), 7000);
    return () => clearTimeout(id);
  }, [index]);

  return (
    <div className="relative hidden overflow-hidden rounded-[28px] bg-[#13392A] lg:block">
      {slides.map((s, i) => (
        <img
          key={s.image}
          src={s.image}
          alt={i === index ? s.alt : ''}
          aria-hidden={i !== index}
          className={cn(
            'absolute inset-0 size-full object-cover transition-[opacity,transform] duration-[1400ms] ease-out',
            i === index ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
          )}
        />
      ))}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-black/10" />

      {/* Back-to-home notch */}
      <div className="absolute left-0 top-0 rounded-br-[22px] bg-background pb-2.5 pr-2.5">
        <Link
          href="/"
          aria-label="Back to home"
          className="grid size-12 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:border-[#5DBB84] hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span aria-hidden className="absolute -right-5 top-0 size-5" style={notchCorner} />
        <span aria-hidden className="absolute -bottom-5 left-0 size-5" style={notchCorner} />
      </div>

      <div className={cn('absolute right-5 top-5 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white', glass)}>
        <MapPin className="size-3.5 text-[#F8E6A0]" />
        {slide.place}
      </div>

      <div className="absolute inset-x-5 bottom-5 flex items-end gap-3">
        <div key={index} className={cn('flex-1 animate-fade-up rounded-2xl p-5 text-white', glass)}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#F8E6A0]">
            <Sparkles className="size-3" />
            Ask Fermat
          </span>
          <p className="mt-3 text-lg font-medium leading-snug">“{slide.prompt}”</p>
          <p className="mt-3 flex items-start gap-2 text-sm text-white/75">
            <FermatMark className="mt-0.5 h-4 text-[#5DBB84]" />
            {slide.reply}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next destination"
            className={cn('grid size-11 cursor-pointer place-items-center rounded-full text-white transition-colors hover:bg-white/25', glass)}
          >
            <ArrowRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous destination"
            className={cn('grid size-11 cursor-pointer place-items-center rounded-full text-white transition-colors hover:bg-white/25', glass)}
          >
            <ArrowLeft className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, aside, children }: { label: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 flex items-center justify-between text-xs font-medium">
        {label}
        {aside}
      </span>
      {children}
    </label>
  );
}

export default function LoginScreen({ onGoogleSignIn }: { onGoogleSignIn: () => Promise<void> }) {
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<'email' | 'google' | 'reset' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const t = copy[mode];

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setNotice('');
  };

  const run = async (kind: 'email' | 'google' | 'reset', action: () => Promise<void>) => {
    setPending(kind);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (e: any) {
      // Google errors are already shown as a toast by the page.
      if (kind !== 'google') setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setPending(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run('email', () =>
      mode === 'signup' ? signUpWithEmail(name.trim(), email.trim(), password) : signInWithEmail(email.trim(), password),
    );
  };

  const handleReset = () => {
    if (!email.trim()) {
      setError('Enter your email above and we will send you a reset link.');
      return;
    }
    run('reset', async () => {
      await resetPassword(email.trim());
      setNotice(`Reset link sent to ${email.trim()}. Check your inbox.`);
    });
  };

  return (
    // Fixed overlay so the dashboard shell (sidebar, navbar) stays hidden until the user is signed in.
    <div className={cn('landing fixed inset-0 z-[1500] overflow-y-auto', inter.variable)}>
      <div className="grid min-h-full gap-3 p-3 lg:grid-cols-[1fr_1.15fr]">
        <div className="flex flex-col px-3 py-4 sm:px-6">
          <header>
            <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight text-foreground no-underline">
              <FermatMark className="h-6" />
              Fermat
            </Link>
          </header>

          <main className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center py-12 text-center">
            <span className="mx-auto grid size-12 animate-fade-up place-items-center rounded-2xl bg-foreground text-[#5DBB84] shadow-[0_12px_30px_-14px_hsl(160_40%_15%/0.6)]">
              <FermatMark className="h-6" />
            </span>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight">{t.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>

            <div
              role="tablist"
              aria-label="Log in or sign up"
              className="mt-7 grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-medium"
            >
              {(['login', 'signup'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={cn(
                    'h-9 cursor-pointer rounded-lg transition-all duration-200',
                    mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m === 'login' ? 'Log in' : 'Sign up'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <Field label="Name">
                  <input
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="What should we call you?"
                    autoComplete="name"
                    required
                  />
                </Field>
              )}

              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </Field>

              <Field
                label="Password"
                aside={
                  mode === 'login' && (
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={pending !== null}
                      className="cursor-pointer text-xs font-medium text-[#3D9163] hover:underline disabled:opacity-60"
                    >
                      {pending === 'reset' ? 'Sending…' : 'Forgot password?'}
                    </button>
                  )
                }
              >
                <span className="relative block">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={cn(inputClass, 'pr-11')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    minLength={mode === 'signup' ? 6 : undefined}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </span>
              </Field>

              {error && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-left text-xs text-red-700">
                  {error}
                </p>
              )}
              {notice && (
                <p role="status" className="rounded-lg bg-[#E4F4EA] px-3 py-2 text-left text-xs text-[#1F5A3F]">
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={pending !== null}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-white shadow-[0_10px_24px_-14px_hsl(160_40%_10%/0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70"
              >
                {pending === 'email' && <Loader2 className="size-4 animate-spin" />}
                {t.submit}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              onClick={() => run('google', onGoogleSignIn)}
              disabled={pending !== null}
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border bg-card text-sm font-medium text-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5DBB84] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70"
            >
              {pending === 'google' ? (
                <Loader2 className="size-4 animate-spin text-[#3D9163]" />
              ) : (
                <GoogleIcon className="size-4" />
              )}
              {pending === 'google' ? 'Opening Google…' : 'Continue with Google'}
            </button>

            <p className="mt-6 text-xs text-muted-foreground">
              {t.switchPrompt}{' '}
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                className="cursor-pointer font-semibold text-foreground hover:underline"
              >
                {t.switchLabel}
              </button>
            </p>
          </main>

          <footer className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Fermat</span>
            <Link href="/" className="text-muted-foreground no-underline transition-colors hover:text-foreground">
              Back to home
            </Link>
          </footer>
        </div>

        <DestinationShowcase />
      </div>
    </div>
  );
}
