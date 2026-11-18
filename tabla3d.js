/* ==========================================================================
   TABLA3D.JS — ESCENA THREE.JS INTERACTIVA PARA EL MODELO 3D (3d.glb)
   ========================================================================== */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import tablaModelUrl from './assets/3d.glb?url';

export function initTabla3D() {
    const container = document.getElementById('tabla-canvas-container');
    const section = document.getElementById('tabla-section');
    const statusBadge = document.getElementById('tabla-status');

    if (!container || !section) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({
            antialias: !isMobile,
            alpha: true,
            powerPreference: 'high-performance'
        });
    } catch (err) {
        console.warn('WebGL no disponible, manteniendo contenido textual:', err);
        if (statusBadge) statusBadge.textContent = 'Vista 3D no disponible en este dispositivo';
        return;
    }

    const maxDpr = isMobile ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));

    const initW = container.clientWidth || 320;
    const initH = container.clientHeight || 340;
    renderer.setSize(initW, initH);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    container.appendChild(renderer.domElement);

    // Permitir desplazamiento vertical de página en pantallas táctiles sin perder giro horizontal
    renderer.domElement.style.touchAction = 'pan-y';

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, initW / Math.max(1, initH), 0.1, 100);
    camera.position.set(0, isMobile ? 2.25 : 2.1, isMobile ? 5.1 : 4.6);

    // Iluminación cálida: luz ambiente + luz principal en tono caramelo + contra-luz suave
    const ambientLight = new THREE.AmbientLight(0xf4efe3, 1.35);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffddb0, 0x14161c, 1.0);
    scene.add(hemiLight);

    const caramelMainLight = new THREE.DirectionalLight(0xffae52, 2.8);
    caramelMainLight.position.set(4.5, 6.5, 5.0);
    scene.add(caramelMainLight);

    const warmRimLight = new THREE.DirectionalLight(0xc85a32, 1.35);
    warmRimLight.position.set(-4.5, 3.0, -3.5);
    scene.add(warmRimLight);

    // Controles de órbita sin zoom ni pan, con damping suave
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.rotateSpeed = isMobile ? 0.9 : 0.75;
    controls.minPolarAngle = Math.PI * 0.15;
    controls.maxPolarAngle = Math.PI * 0.72;

    let isUserInteracting = false;
    let resumeTimer = null;

    controls.addEventListener('start', () => {
        isUserInteracting = true;
        if (resumeTimer) clearTimeout(resumeTimer);
    });

    controls.addEventListener('end', () => {
        resumeTimer = setTimeout(() => {
            isUserInteracting = false;
        }, 1200);
    });

    // Grupo pivote para centrar, rotar y flotar el modelo
    const pivotGroup = new THREE.Group();
    scene.add(pivotGroup);

    // Ajuste responsivo del canvas 3D (con ResizeObserver para soportar cambios de layout en móvil)
    function onResize() {
        if (!container) return;
        const w = container.clientWidth || 320;
        const h = container.clientHeight || 340;
        camera.aspect = w / Math.max(1, h);
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        renderer.render(scene, camera);
    }

    window.addEventListener('resize', onResize);
    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(() => onResize());
        ro.observe(container);
    }

    // Loop de animación que se pausa cuando la sección sale de pantalla (IntersectionObserver)
    let isVisible = true;
    let rafId = null;

    function animate(now = 0) {
        if (!isVisible) {
            rafId = null;
            return;
        }

        rafId = requestAnimationFrame(animate);
        const elapsed = now * 0.001;

        if (modelLoaded && !isUserInteracting && !prefersReducedMotion) {
            pivotGroup.rotation.y += 0.0042;
            pivotGroup.position.y = Math.sin(elapsed * 1.5) * 0.07;
        }

        controls.update();
        renderer.render(scene, camera);
    }

    // Carga de 3d.glb con GLTFLoader y DRACOLoader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    dracoLoader.preload();

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    let modelLoaded = false;

    gltfLoader.load(
        tablaModelUrl,
        (gltf) => {
            const model = gltf.scene;

            // Centrar y escalar automáticamente según su BoundingBox
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);

            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const targetScale = (isMobile ? 2.85 : 3.1) / maxDim;
            model.scale.setScalar(targetScale);

            // Recalcular centro luego de escalar para dejarlo exacto en (0,0,0)
            const scaledBox = new THREE.Box3().setFromObject(model);
            scaledBox.getCenter(center);
            model.position.sub(center);

            pivotGroup.add(model);
            pivotGroup.rotation.x = 0.16;
            pivotGroup.rotation.y = -0.35;

            modelLoaded = true;
            if (statusBadge) {
                statusBadge.textContent = isMobile
                    ? 'Deslizá con el dedo sobre la tabla para girarla'
                    : 'Arrastrá con el mouse o el dedo para girar la tabla';
            }

            onResize();
            if (isVisible && !rafId) {
                rafId = requestAnimationFrame(animate);
            }
        },
        (xhr) => {
            if (xhr.total && statusBadge) {
                const pct = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
                statusBadge.textContent = `Cargando tabla 3D artesanal... ${pct}%`;
            }
        },
        (error) => {
            console.warn('No se pudo cargar el archivo 3d.glb:', error);
            if (statusBadge) {
                statusBadge.textContent = 'Pieza artesanal Pájaro Azul';
            }
        }
    );

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    isVisible = true;
                    onResize();
                    if (!rafId) rafId = requestAnimationFrame(animate);
                } else {
                    isVisible = false;
                    if (rafId) {
                        cancelAnimationFrame(rafId);
                        rafId = null;
                    }
                }
            });
        },
        { threshold: 0.01, rootMargin: '150px 0px' }
    );

    observer.observe(section);
}
