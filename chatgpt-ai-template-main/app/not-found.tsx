import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        alignItems: 'center',
        background: '#fafaf8',
        color: '#13251d',
        display: 'flex',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 520 }}>
        <p style={{ color: '#287753', fontSize: 13, fontWeight: 800, letterSpacing: 2, margin: 0 }}>
          404 · WRONG TURN
        </p>
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.75rem)', letterSpacing: '-0.05em', lineHeight: 1, margin: '18px 0' }}>
          This route isn’t on the itinerary.
        </h1>
        <p style={{ color: '#4b554f', fontSize: 18, lineHeight: 1.6, margin: '0 auto 28px' }}>
          The page may have moved, or the link may be incomplete. Your saved trips are still safe.
        </p>
        <Link
          href="/"
          style={{
            background: '#0f5132',
            borderRadius: 999,
            color: 'white',
            display: 'inline-block',
            fontWeight: 700,
            padding: '13px 22px',
            textDecoration: 'none',
          }}
        >
          Back to Fermat
        </Link>
      </div>
    </main>
  );
}
