/* ==========================================================================
   APP.JS — ORQUESTADOR PRINCIPAL DE LA LANDING CINEMATOGRÁFICA PÁJARO AZUL
   ========================================================================== */

import { initUI } from './ui.js';
import { initFramesIntro } from './frames.js';
import { initTabla3D } from './tabla3d.js';
import { initMenuCards } from './cards.js';

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initFramesIntro();
    initTabla3D();
    initMenuCards();
});
