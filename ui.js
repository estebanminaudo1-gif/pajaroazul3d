/* ==========================================================================
   UI.JS — LENIS, BARRA DE PROGRESO, TÍTULOS MAGNÉTICOS, BOTÓN Y CURSOR
   ========================================================================== */

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initUI() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktopPointer =
        window.matchMedia('(pointer: fine)').matches &&
        window.matchMedia('(min-width: 769px)').matches;

    if (prefersReducedMotion) {
        document.documentElement.classList.add('reduced-motion');
    }

    // 1. SCROLL SUAVE CON LENIS SINCRONIZADO CON SCROLLTRIGGER
    let lenis = null;
    if (!prefersReducedMotion) {
        lenis = new Lenis({
            duration: 1.15,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true
        });

        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    }

    // Navegación suave por anclas
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const targetEl = document.querySelector(targetId);
            if (!targetEl) return;

            e.preventDefault();
            if (lenis) {
                lenis.scrollTo(targetEl, { offset: -60 });
            } else {
                targetEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            }
        });
    });

    // 2. BARRA DE PROGRESO FINA SUPERIOR
    const progressBar = document.getElementById('scroll-progress-bar');
    if (progressBar && !prefersReducedMotion) {
        gsap.set(progressBar, { scaleX: 0, transformOrigin: 'left center' });
        gsap.to(progressBar, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
                trigger: document.documentElement,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.15
            }
        });
    }

    // 3. TÍTULOS DE SECCIÓN DIVIDIDOS EN LETRAS CON EFECTO MAGNÉTICO
    const magneticTitles = document.querySelectorAll('[data-magnetic-title]');
    magneticTitles.forEach((heading) => {
        const originalText = heading.textContent.trim();
        heading.setAttribute('aria-label', originalText);
        heading.innerHTML = '';

        const words = originalText.split(/\s+/);
        words.forEach((word, wIdx) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'mag-word';
            wordSpan.setAttribute('aria-hidden', 'true');

            for (const ch of word) {
                const charSpan = document.createElement('span');
                charSpan.className = 'mag-char';
                charSpan.textContent = ch;
                wordSpan.appendChild(charSpan);
            }

            heading.appendChild(wordSpan);
            if (wIdx < words.length - 1) {
                heading.appendChild(document.createTextNode(' '));
            }
        });

        if (isDesktopPointer && !prefersReducedMotion) {
            const chars = Array.from(heading.querySelectorAll('.mag-char'));

            heading.addEventListener(
                'pointermove',
                (e) => {
                    chars.forEach((chEl) => {
                        const rect = chEl.getBoundingClientRect();
                        const cx = rect.left + rect.width * 0.5;
                        const cy = rect.top + rect.height * 0.5;
                        const dx = e.clientX - cx;
                        const dy = e.clientY - cy;
                        const dist = Math.hypot(dx, dy);
                        const radius = 95;

                        if (dist < radius) {
                            const pull = (1 - dist / radius) * 0.38;
                            gsap.to(chEl, {
                                x: dx * pull,
                                y: dy * pull - 4 * (1 - dist / radius),
                                color: '#f4efe3',
                                duration: 0.25,
                                ease: 'power2.out',
                                overwrite: 'auto'
                            });
                        } else {
                            gsap.to(chEl, {
                                x: 0,
                                y: 0,
                                clearProps: 'color',
                                duration: 0.55,
                                ease: 'elastic.out(1, 0.45)',
                                overwrite: 'auto'
                            });
                        }
                    });
                },
                { passive: true }
            );

            heading.addEventListener(
                'pointerleave',
                () => {
                    gsap.to(chars, {
                        x: 0,
                        y: 0,
                        clearProps: 'color',
                        duration: 0.65,
                        ease: 'elastic.out(1, 0.4)',
                        overwrite: 'auto'
                    });
                },
                { passive: true }
            );
        }
    });

    // 4. BOTÓN GRANDE "HACÉ TU PEDIDO" CON HOVER MAGNÉTICO
    const magneticBtn = document.getElementById('magnetic-order-btn');
    if (magneticBtn && isDesktopPointer && !prefersReducedMotion) {
        const btnLabel = magneticBtn.querySelector('.magnetic-btn-text');

        const btnX = gsap.quickTo(magneticBtn, 'x', { duration: 0.35, ease: 'power3.out' });
        const btnY = gsap.quickTo(magneticBtn, 'y', { duration: 0.35, ease: 'power3.out' });
        const txtX = btnLabel
            ? gsap.quickTo(btnLabel, 'x', { duration: 0.35, ease: 'power3.out' })
            : null;
        const txtY = btnLabel
            ? gsap.quickTo(btnLabel, 'y', { duration: 0.35, ease: 'power3.out' })
            : null;

        magneticBtn.addEventListener(
            'pointermove',
            (e) => {
                const rect = magneticBtn.getBoundingClientRect();
                const dx = e.clientX - (rect.left + rect.width * 0.5);
                const dy = e.clientY - (rect.top + rect.height * 0.5);
                btnX(dx * 0.32);
                btnY(dy * 0.32);
                if (txtX && txtY) {
                    txtX(dx * 0.14);
                    txtY(dy * 0.14);
                }
            },
            { passive: true }
        );

        magneticBtn.addEventListener(
            'pointerleave',
            () => {
                btnX(0);
                btnY(0);
                if (txtX && txtY) {
                    txtX(0);
                    txtY(0);
                }
            },
            { passive: true }
        );
    }

    // 5. CURSOR PERSONALIZADO (CÍRCULO QUE CRECE SOBRE INTERACTIVOS — SOLO ESCRITORIO)
    const cursor = document.getElementById('custom-cursor');
    if (cursor && isDesktopPointer && !prefersReducedMotion) {
        document.body.classList.add('has-custom-cursor');

        const moveX = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3.out' });
        const moveY = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3.out' });

        window.addEventListener(
            'pointermove',
            (e) => {
                cursor.classList.add('is-active');
                moveX(e.clientX);
                moveY(e.clientY);
            },
            { passive: true }
        );

        const interactiveSelectors =
            'a, button, .menu-card-3d, #tabla-canvas-container, [role="button"]';
        document.querySelectorAll(interactiveSelectors).forEach((el) => {
            el.addEventListener('pointerenter', () => cursor.classList.add('is-expanded'));
            el.addEventListener('pointerleave', () => cursor.classList.remove('is-expanded'));
        });
    }
}
