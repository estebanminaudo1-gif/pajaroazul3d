/* ==========================================================================
   FRAMES.JS — INTRO CINEMATOGRÁFICA CON SECUENCIA WEBP Y SCROLLTRIGGER PIN
   ========================================================================== */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 150;

function getFramePath(index, isMobile) {
    const folder = isMobile ? 'mobile' : 'desktop';
    const padded = String(index).padStart(3, '0');
    return `/frames/${folder}/frame_${padded}.webp`;
}

/**
 * Dibuja el cuadro en el canvas asegurando que en pantallas verticales (móvil)
 * el nombre "Pájaro Azul" del cuadro final entre completo sin recortarse.
 */
function drawCoverImage(ctx, canvas, img) {
    if (!img || !img.complete || !img.naturalWidth) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const coverScale = Math.max(cw / iw, ch / ih);
    const containWidthScale = (cw / iw) * 1.28;

    ctx.clearRect(0, 0, cw, ch);

    // En pantallas más angostas que el video (móvil), rellenar atmósfera de fondo y centrar el encuadre principal
    if (coverScale > containWidthScale) {
        const bgW = iw * coverScale;
        const bgH = ih * coverScale;
        ctx.save();
        ctx.filter = 'blur(18px) brightness(0.55)';
        ctx.drawImage(img, (cw - bgW) * 0.5, (ch - bgH) * 0.5, bgW, bgH);
        ctx.restore();

        const fgW = iw * containWidthScale;
        const fgH = ih * containWidthScale;
        const fgX = (cw - fgW) * 0.5;
        const fgY = (ch - fgH) * 0.38;
        ctx.drawImage(img, fgX, fgY, fgW, fgH);

        // Suavizar bordes superior e inferior del encuadre en pantallas verticales
        const topGrad = ctx.createLinearGradient(0, fgY, 0, fgY + fgH * 0.18);
        topGrad.addColorStop(0, 'rgba(20, 22, 28, 0.88)');
        topGrad.addColorStop(1, 'rgba(20, 22, 28, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, cw, fgY + fgH * 0.18);

        const botGrad = ctx.createLinearGradient(0, fgY + fgH * 0.82, 0, fgY + fgH);
        botGrad.addColorStop(0, 'rgba(20, 22, 28, 0)');
        botGrad.addColorStop(1, 'rgba(20, 22, 28, 0.92)');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, fgY + fgH * 0.82, cw, ch - (fgY + fgH * 0.82));
    } else {
        const dw = iw * coverScale;
        const dh = ih * coverScale;
        ctx.drawImage(img, (cw - dw) * 0.5, (ch - dh) * 0.5, dw, dh);
    }
}

export function initFramesIntro() {
    const canvas = document.getElementById('intro-canvas');
    const heroSection = document.getElementById('hero-intro');
    const loaderOverlay = document.getElementById('loader-overlay');
    const loaderBar = document.getElementById('loader-bar-fill');
    const loaderPercent = document.getElementById('loader-percent');
    const heroSubtitleBox = document.getElementById('hero-subtitle-overlay');
    const scrollCue = document.querySelector('.hero-scroll-cue');

    if (!canvas || !heroSection) return;

    const ctx = canvas.getContext('2d');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    function updateProgressUI(pct) {
        const clamped = Math.min(100, Math.max(0, Math.round(pct)));
        if (loaderPercent) loaderPercent.textContent = `${clamped}%`;
        if (loaderBar) loaderBar.style.transform = `scaleX(${clamped / 100})`;
    }

    function hideLoader() {
        if (!loaderOverlay) return;
        loaderOverlay.classList.add('is-hidden');
        setTimeout(() => {
            loaderOverlay.style.display = 'none';
        }, 650);
    }

    const frames = new Array(TOTAL_FRAMES);
    const state = { frameIndex: 0 };

    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        const currentImg = frames[state.frameIndex] || frames[TOTAL_FRAMES - 1];
        if (currentImg) {
            drawCoverImage(ctx, canvas, currentImg);
        }
    }

    window.addEventListener('resize', resizeCanvas);

    // MODO REDUCED MOTION: mostrar directamente el último cuadro (con "Pájaro Azul" formado) sin secuencia ni pin
    if (prefersReducedMotion) {
        state.frameIndex = TOTAL_FRAMES - 1;
        const finalImg = new Image();
        finalImg.src = getFramePath(TOTAL_FRAMES, isMobile);
        finalImg.onload = () => {
            frames[TOTAL_FRAMES - 1] = finalImg;
            resizeCanvas();
            updateProgressUI(100);
            hideLoader();
            if (heroSubtitleBox) {
                heroSubtitleBox.classList.add('is-visible');
            }
            if (scrollCue) {
                scrollCue.style.display = 'none';
            }
        };
        finalImg.onerror = () => {
            updateProgressUI(100);
            hideLoader();
            if (heroSubtitleBox) {
                heroSubtitleBox.classList.add('is-visible');
            }
            if (scrollCue) {
                scrollCue.style.display = 'none';
            }
        };
        return;
    }

    // PRECARGA DE LOS 150 CUADROS WEBP CON PORCENTAJE REAL
    let loadedCount = 0;
    let sequenceInitialized = false;

    function onFrameSettled() {
        loadedCount++;
        const pct = (loadedCount / TOTAL_FRAMES) * 100;
        updateProgressUI(pct);

        // Dibujar el primer cuadro apenas esté disponible
        if (loadedCount === 1 && frames[0]) {
            resizeCanvas();
        }

        if (loadedCount >= TOTAL_FRAMES && !sequenceInitialized) {
            sequenceInitialized = true;
            resizeCanvas();
            hideLoader();
            setupScrollSequence();
        }
    }

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const img = new Image();
        img.decoding = 'async';
        img.src = getFramePath(i, isMobile);
        img.onload = onFrameSettled;
        img.onerror = onFrameSettled;
        frames[i - 1] = img;
    }

    function setupScrollSequence() {
        if (heroSubtitleBox) {
            gsap.set(heroSubtitleBox, { autoAlpha: 0, y: 26 });
        }

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: heroSection,
                start: 'top top',
                end: '+=280%',
                pin: true,
                scrub: 0.45,
                anticipatePin: 1
            }
        });

        // 1. Recorrido por los 150 cuadros donde las rodajas forman "Pájaro Azul"
        tl.to(
            state,
            {
                frameIndex: TOTAL_FRAMES - 1,
                snap: 'frameIndex',
                ease: 'none',
                duration: 0.82,
                onUpdate: () => {
                    const img = frames[state.frameIndex];
                    if (img) {
                        drawCoverImage(ctx, canvas, img);
                    }
                }
            },
            0
        );

        // 2. En el tramo final, cuando ya quedó formado "Pájaro Azul", aparece el subtítulo con fade
        if (scrollCue) {
            tl.to(scrollCue, { autoAlpha: 0, duration: 0.12 }, 0.08);
        }
        if (heroSubtitleBox) {
            tl.to(
                heroSubtitleBox,
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.18,
                    ease: 'power2.out'
                },
                0.78
            );
        }
    }
}
