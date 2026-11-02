'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * GSAP motion for the landing page. Wraps the page and animates whatever is tagged inside it:
 *
 *   data-hero="globe" | "item"   entrance timeline on load (items in document order); the globe also parallaxes
 *   data-reveal                  fades up when it scrolls into view
 *   data-stagger                 its children fade up one after another
 *   data-slide="left" | "right"  slides in from that side with a slight tilt
 *   data-bar                     grows from the left edge (vote bars)
 *   data-cta                     scales up into place
 *
 * Everything runs only under (prefers-reduced-motion: no-preference); otherwise the page renders as is.
 * Hero items start hidden in landing.css (with a timed fallback) so they don't flash before the timeline starts.
 */
export default function LandingMotion({ className, children }: { className?: string; children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const ease = 'power3.out';
        // Inline transforms left behind would block the cards' CSS hover lift, so clear them when done.
        const done = { clearProps: 'transform' };

        // Hero: globe rises in, then the copy follows line by line.
        gsap
          .timeline({ defaults: { ease, duration: 0.9 } })
          .fromTo('[data-hero="globe"]', { autoAlpha: 0, y: 48, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.3 })
          .fromTo('[data-hero="item"]', { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, stagger: 0.09 }, '-=0.85');

        // The globe drifts down a little slower than the page as you scroll past the hero.
        gsap.to('[data-hero="globe"]', {
          yPercent: 14,
          ease: 'none',
          scrollTrigger: { trigger: '[data-hero-section]', start: 'top top', end: 'bottom top', scrub: true },
        });

        const onEnter = (trigger: Element) => ({ trigger, start: 'top 85%', once: true });

        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.fromTo(el, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.9, ease, scrollTrigger: onEnter(el), ...done });
        });

        gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((group) => {
          gsap.fromTo(
            group.children,
            { autoAlpha: 0, y: 28 },
            { autoAlpha: 1, y: 0, duration: 0.8, ease, stagger: 0.08, scrollTrigger: onEnter(group), ...done },
          );
        });

        gsap.utils.toArray<HTMLElement>('[data-slide]').forEach((el) => {
          const dir = el.dataset.slide === 'left' ? -1 : 1;
          gsap.fromTo(
            el,
            { autoAlpha: 0, x: 56 * dir, rotate: 1.5 * dir },
            { autoAlpha: 1, x: 0, rotate: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: onEnter(el), ...done },
          );
        });

        gsap.utils.toArray<HTMLElement>('[data-bar]').forEach((bar, i) => {
          gsap.fromTo(
            bar,
            { scaleX: 0 },
            { scaleX: 1, transformOrigin: 'left center', duration: 1.2, delay: 0.35 + i * 0.12, ease: 'power2.out', scrollTrigger: onEnter(bar) },
          );
        });

        gsap.utils.toArray<HTMLElement>('[data-cta]').forEach((el) => {
          gsap.fromTo(el, { autoAlpha: 0, y: 40, scale: 0.95 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.1, ease: 'expo.out', scrollTrigger: onEnter(el), ...done });
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
