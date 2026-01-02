/**
 * 3D Avatar - VRM Model with Lip Sync (v7)
 * Usando módulos ES6 e versões compatíveis
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

class Avatar3D {
    constructor(container) {
        this.container = container;
        this.targetViseme = 'X';
        this.vrm = null;
        this.mixer = null;

        this.init();
        this.loadVRM();
        this.animate();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x12121a);

        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(20, aspect, 0.1, 1000);
        this.camera.position.set(0, 1.4, 1.2);
        this.camera.lookAt(0, 1.35, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);

        // Iluminação
        const ambient = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambient);

        const main = new THREE.DirectionalLight(0xffffff, 1.0);
        main.position.set(1, 2, 3);
        this.scene.add(main);

        const fill = new THREE.DirectionalLight(0x8b5cf6, 0.4);
        fill.position.set(-2, 1, 2);
        this.scene.add(fill);

        const rim = new THREE.DirectionalLight(0xffffff, 0.5);
        rim.position.set(0, 1, -2);
        this.scene.add(rim);

        window.addEventListener('resize', () => this.onResize());

        this.clock = new THREE.Clock();
        this.time = 0;
        this.blinkTimer = 0;
        this.nextBlink = 2 + Math.random() * 3;

        // Loading indicator
        this.createLoadingIndicator();
    }

    createLoadingIndicator() {
        const geo = new THREE.TorusGeometry(0.08, 0.015, 8, 32);
        const mat = new THREE.MeshBasicMaterial({ color: 0x6366f1 });
        this.loadingRing = new THREE.Mesh(geo, mat);
        this.loadingRing.position.set(0, 1.4, 0);
        this.scene.add(this.loadingRing);
    }

    async loadVRM() {
        const loader = new GLTFLoader();

        // Registrar plugin VRM
        loader.register((parser) => new VRMLoaderPlugin(parser));

        const modelPath = './avatar.vrm';

        try {
            const gltf = await loader.loadAsync(modelPath, (progress) => {
                if (progress.total > 0) {
                    const percent = (progress.loaded / progress.total) * 100;
                    console.log(`Carregando: ${percent.toFixed(0)}%`);
                }
                if (this.loadingRing) {
                    this.loadingRing.rotation.z += 0.1;
                }
            });

            // Remover loading
            if (this.loadingRing) {
                this.scene.remove(this.loadingRing);
                this.loadingRing = null;
            }

            const vrm = gltf.userData.vrm;

            if (!vrm) {
                throw new Error('Arquivo não é um VRM válido');
            }

            // Otimizar modelo
            VRMUtils.removeUnnecessaryVertices(vrm.scene);
            VRMUtils.removeUnnecessaryJoints(vrm.scene);

            // Rotacionar pra frente
            VRMUtils.rotateVRM0(vrm);

            this.vrm = vrm;
            this.scene.add(vrm.scene);

            console.log('VRM carregado!', vrm);
            console.log('Expressões:', Object.keys(vrm.expressionManager?.expressionMap || {}));

        } catch (error) {
            console.error('Erro ao carregar VRM:', error);
            this.showFallback();
        }
    }

    showFallback() {
        // Mostrar avatar simples como fallback
        if (this.loadingRing) {
            this.loadingRing.material.color.setHex(0xff4444);
        }

        // Criar cabeça simples
        const headGeo = new THREE.SphereGeometry(0.15, 16, 12);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbcc });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.4;
        this.scene.add(head);

        console.log('Usando avatar fallback. Verifique se avatar.vrm está na pasta correta.');
    }

    // =========================================================================
    // Lip Sync com VRM Expressions
    // =========================================================================

    setViseme(viseme) {
        this.targetViseme = viseme;
    }

    updateMouth() {
        if (!this.vrm?.expressionManager) return;

        const em = this.vrm.expressionManager;

        // Mapear visemas para expressões VRM
        const visemeMap = {
            'X': null,
            'A': 'aa',
            'E': 'ee',
            'I': 'ih',
            'O': 'oh',
            'U': 'ou',
            'M': null,
            'F': 'ih',
            'L': 'aa',
            'S': 'ih',
            'R': 'oh'
        };

        // Fade out todas as expressões de boca
        const mouthExpressions = ['aa', 'ih', 'ou', 'ee', 'oh'];
        for (const expr of mouthExpressions) {
            try {
                const current = em.getValue(expr) || 0;
                em.setValue(expr, current * 0.7);
            } catch (e) { }
        }

        // Aplicar viseme atual
        const targetExpr = visemeMap[this.targetViseme];
        if (targetExpr) {
            try {
                em.setValue(targetExpr, 0.8);
            } catch (e) { }
        }
    }

    // =========================================================================
    // Idle Animations
    // =========================================================================

    updateIdle(dt) {
        this.time += dt;

        if (this.vrm) {
            // Movimento suave da cabeça
            const head = this.vrm.humanoid?.getNormalizedBoneNode('head');
            if (head) {
                head.rotation.y = Math.sin(this.time * 0.3) * 0.04;
                head.rotation.x = Math.sin(this.time * 0.2) * 0.02;
            }

            // Piscar
            this.blinkTimer += dt;
            if (this.blinkTimer >= this.nextBlink) {
                this.blinkTimer = 0;
                this.nextBlink = 2 + Math.random() * 3;
                this.doBlink();
            }

            // Atualizar VRM
            this.vrm.update(dt);
        }

        // Loading animation
        if (this.loadingRing) {
            this.loadingRing.rotation.z += dt * 3;
        }
    }

    doBlink() {
        if (!this.vrm?.expressionManager) return;

        const em = this.vrm.expressionManager;

        // Animação de piscar
        let progress = 0;
        const blinkAnimation = () => {
            progress += 0.15;
            const value = Math.sin(progress * Math.PI);

            try {
                em.setValue('blink', value);
            } catch (e) {
                try {
                    em.setValue('blinkLeft', value);
                    em.setValue('blinkRight', value);
                } catch (e2) { }
            }

            if (progress < 1) {
                requestAnimationFrame(blinkAnimation);
            }
        };

        blinkAnimation();
    }

    // =========================================================================
    // Animation Loop
    // =========================================================================

    animate() {
        const loop = () => {
            requestAnimationFrame(loop);
            const dt = this.clock.getDelta();
            this.updateIdle(dt);
            this.updateMouth();
            this.renderer.render(this.scene, this.camera);
        };
        loop();
    }

    onResize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }
}

// Exportar e inicializar
window.Avatar3D = Avatar3D;

// Auto-inicializar quando DOM carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAvatar);
} else {
    initAvatar();
}

function initAvatar() {
    const container = document.getElementById('avatar-container');
    if (container) {
        window.avatar = new Avatar3D(container);
    }
}

export { Avatar3D };
