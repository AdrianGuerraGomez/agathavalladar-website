import { useEffect, useRef, type RefObject } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Parallax sutil: escribe `--parallax` (px) en el elemento según su posición
 * respecto al centro de la pantalla. El CSS decide qué mover con ese valor.
 * `strength` = desplazamiento máximo en px. Se desactiva con movimiento reducido.
 */
export function useParallax<T extends HTMLElement>(strength = 16): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < -100 || rect.top > vh + 100) return;
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh; // ≈ -1 … 1
      const value = Math.max(-1, Math.min(1, progress)) * -strength;
      el.style.setProperty('--parallax', `${value.toFixed(2)}px`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [strength]);
  return ref;
}

/**
 * Aparición al hacer scroll para cualquier elemento con `data-reveal`
 * dentro del contenedor (también los que se pintan después, al llegar datos).
 * Se revela todo lo que ya está por encima del 92 % inferior de la pantalla,
 * así nada queda oculto aunque se salte con el scroll.
 * Opcional: `style={{ '--reveal-delay': '80ms' }}` para escalonar.
 */
export function useRevealOnScroll(container: RefObject<HTMLElement | null>, resetKey: string) {
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const reduced = prefersReducedMotion();
    let frame = 0;

    const check = () => {
      frame = 0;
      const limit = window.innerHeight * 0.92;
      root.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])').forEach((el) => {
        if (reduced || el.getBoundingClientRect().top < limit) el.setAttribute('data-revealed', '');
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };

    check();
    const mo = new MutationObserver(schedule);
    mo.observe(root, { childList: true, subtree: true });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      mo.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [container, resetKey]);
}

/**
 * Desplazamiento ligado al scroll de la página (para la cabecera):
 * escribe `--scroll-shift` (px) y `--scroll-fade` (0…1) en el elemento.
 */
export function useScrollShift<T extends HTMLElement>(factor = 0.18): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.min(window.scrollY, window.innerHeight);
      el.style.setProperty('--scroll-shift', `${(y * factor).toFixed(1)}px`);
      el.style.setProperty('--scroll-fade', (1 - (y / window.innerHeight) * 0.6).toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
    };
  }, [factor]);
  return ref;
}
