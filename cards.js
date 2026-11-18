/* ==========================================================================
   CARDS.JS — TARJETAS DE MENÚ CON TILT 3D, FLIP 180° AL CLIC/TOQUE Y REVEAL
   ========================================================================== */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initMenuCards() {
    const cards = Array.from(document.querySelectorAll('.menu-card-3d'));
    if (!cards.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;

    // 1. Reveal escalonado al entrar en pantalla (salvo prefers-reduced-motion)
    if (!prefersReducedMotion) {
        gsap.from(cards, {
            y: 48,
            autoAlpha: 0,
            duration: 0.8,
            stagger: 0.14,
            ease: 'power3.out',
            clearProps: 'transform,opacity,visibility',
            scrollTrigger: {
                trigger: '#menu-section',
                start: 'top 76%',
                toggleActions: 'play none none none',
                once: true
            }
        });
    }

    // 2. Giro 3D (Flip 180°: Frente <-> Dorso) al hacer clic, tocar o presionar Enter/Espacio
    cards.forEach((card) => {
        const toggleFlip = (e) => {
            // Si el clic fue sobre un enlace directo de pedido en el dorso, permitir la navegación
            if (e.target.closest('.card-order-link')) return;

            const isFlipped = card.classList.toggle('is-flipped');
            card.setAttribute('aria-pressed', String(isFlipped));
        };

        card.addEventListener('click', toggleFlip);

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (e.target.closest('.card-order-link')) return;
                e.preventDefault();
                toggleFlip(e);
            }
        });

        // 3. Inclinación 3D (Tilt) siguiendo al mouse (solo en escritorio con puntero fino)
        if (isFinePointer && !prefersReducedMotion) {
            const tiltShell = card.querySelector('.card-tilt-shell');
            if (!tiltShell) return;

            gsap.set(tiltShell, { transformPerspective: 1100, transformStyle: 'preserve-3d' });

            const rotXTo = gsap.quickTo(tiltShell, 'rotationX', {
                duration: 0.35,
                ease: 'power2.out'
            });
            const rotYTo = gsap.quickTo(tiltShell, 'rotationY', {
                duration: 0.35,
                ease: 'power2.out'
            });

            card.addEventListener(
                'pointermove',
                (e) => {
                    const rect = card.getBoundingClientRect();
                    if (!rect.width || !rect.height) return;

                    const px = (e.clientX - rect.left) / rect.width;
                    const py = (e.clientY - rect.top) / rect.height;
                    const relX = px - 0.5;
                    const relY = py - 0.5;
                    const maxTilt = 10;

                    rotXTo(-relY * maxTilt * 2);
                    rotYTo(relX * maxTilt * 2);

                    card.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`);
                    card.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
                },
                { passive: true }
            );

            card.addEventListener(
                'pointerleave',
                () => {
                    rotXTo(0);
                    rotYTo(0);
                },
                { passive: true }
            );
        }
    });
}
