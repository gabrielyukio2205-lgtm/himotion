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

        // Mouse tracking
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;

        // Sistema de gestos
        this.currentGesture = null;
        this.gestureProgress = 0;
        this.gestureSpeed = 2.0;

        // Sistema de expressões faciais
        this.currentExpression = 'neutral';
        this.targetExpression = 'neutral';
        this.expressionIntensity = 0;
        this.expressionDuration = 0;
        this.expressionTimer = 0;

        this.init();
        this.loadVRM();
        this.setupMouseTracking();
        this.animate();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x12121a);

        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(22, aspect, 0.1, 1000);
        this.camera.position.set(0, 1.3, 1.0);
        this.camera.lookAt(0, 1.25, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);

        // Iluminação - menos intensa para melhor contraste
        const ambient = new THREE.AmbientLight(0xffffff, 0.35);
        this.scene.add(ambient);

        const main = new THREE.DirectionalLight(0xffffff, 0.45);
        main.position.set(1, 2, 3);
        this.scene.add(main);

        const fill = new THREE.DirectionalLight(0x8b5cf6, 0.15);
        fill.position.set(-2, 1, 2);
        this.scene.add(fill);

        const rim = new THREE.DirectionalLight(0xffffff, 0.1);
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

    setupMouseTracking() {
        // Tracking do mouse no container
        this.container.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            // Normalizar para -1 a 1
            this.targetMouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.targetMouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        });

        // Quando mouse sai, voltar ao centro gradualmente
        this.container.addEventListener('mouseleave', () => {
            this.targetMouseX = 0;
            this.targetMouseY = 0;
        });
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
    // Sistema de Gestos
    // =========================================================================

    playGesture(gesture) {
        // Iniciar novo gesto
        this.currentGesture = gesture;
        this.gestureProgress = 0;
        console.log(`Iniciando gesto: ${gesture}`);
    }

    updateGesture(dt) {
        if (!this.currentGesture || !this.vrm) return;

        const humanoid = this.vrm.humanoid;
        this.gestureProgress += dt * this.gestureSpeed;

        // Curva senoidal para movimento suave ida e volta
        const wave = Math.sin(this.gestureProgress * Math.PI);

        switch (this.currentGesture) {
            case 'wave':
                // Acenar: levantar braço direito e mover a mão
                const rightUpperArm = humanoid?.getNormalizedBoneNode('rightUpperArm');
                const rightLowerArm = humanoid?.getNormalizedBoneNode('rightLowerArm');
                const rightHand = humanoid?.getNormalizedBoneNode('rightHand');

                if (rightUpperArm) {
                    // Levantar braço
                    rightUpperArm.rotation.z = 0.6 - wave * 1.5;
                    rightUpperArm.rotation.x = wave * 0.3;
                }
                if (rightLowerArm) {
                    rightLowerArm.rotation.z = 0.2 - wave * 0.8;
                }
                if (rightHand) {
                    // Balançar a mão
                    rightHand.rotation.z = Math.sin(this.gestureProgress * 6) * 0.4;
                }
                break;

            case 'nod':
                // Acenar com a cabeça (sim)
                const headNod = humanoid?.getNormalizedBoneNode('head');
                if (headNod) {
                    headNod.rotation.x = -wave * 0.15;
                }
                break;

            case 'goodbye':
                // Despedida: acenar mais lento + expressão
                const rightArmBye = humanoid?.getNormalizedBoneNode('rightUpperArm');
                const rightHandBye = humanoid?.getNormalizedBoneNode('rightHand');

                if (rightArmBye) {
                    rightArmBye.rotation.z = 0.6 - wave * 1.2;
                }
                if (rightHandBye) {
                    rightHandBye.rotation.z = Math.sin(this.gestureProgress * 4) * 0.3;
                }

                // Expressão de felicidade
                if (this.vrm.expressionManager) {
                    try {
                        this.vrm.expressionManager.setValue('happy', wave * 0.5);
                    } catch (e) { }
                }
                break;
        }

        // Terminar gesto após 1 ciclo
        if (this.gestureProgress >= 1) {
            this.currentGesture = null;
            this.gestureProgress = 0;
        }
    }

    // =========================================================================
    // Sistema de Expressões Faciais
    // =========================================================================

    /**
     * Define uma expressão facial temporária
     * @param {string} expression - happy, sad, surprised, angry, relaxed, neutral
     * @param {number} duration - duração em segundos (0 = permanente)
     * @param {number} intensity - intensidade 0-1
     */
    setExpression(expression, duration = 2.0, intensity = 0.7) {
        this.targetExpression = expression;
        this.expressionDuration = duration;
        this.expressionTimer = 0;
        this.expressionIntensity = intensity;
        console.log(`Expressão: ${expression} (${duration}s, ${intensity})`);
    }

    updateExpression(dt) {
        if (!this.vrm?.expressionManager) return;

        const em = this.vrm.expressionManager;

        // Mapeamento de nomes para expressões VRM
        const expressionMap = {
            'happy': 'happy',
            'sad': 'sad',
            'surprised': 'surprised',
            'angry': 'angry',
            'relaxed': 'relaxed',
            'neutral': null
        };

        // Atualizar timer
        if (this.expressionDuration > 0) {
            this.expressionTimer += dt;
            if (this.expressionTimer >= this.expressionDuration) {
                this.targetExpression = 'neutral';
                this.expressionIntensity = 0;
            }
        }

        // Aplicar expressão com fade
        const allExpressions = ['happy', 'sad', 'surprised', 'angry', 'relaxed'];

        for (const expr of allExpressions) {
            try {
                const current = em.getValue(expr) || 0;
                const target = (expressionMap[this.targetExpression] === expr)
                    ? this.expressionIntensity
                    : 0;

                // Interpolação suave
                const newValue = current + (target - current) * 0.1;
                em.setValue(expr, newValue);
            } catch (e) { }
        }
    }

    /**
     * Analisa texto e detecta emoção
     */
    detectEmotion(text) {
        const lowerText = text.toLowerCase();

        // Padrões de emoção
        const emotions = {
            'happy': /😊|😄|😁|🥰|❤️|haha|kk|rsrs|legal|ótimo|maravilh|feliz|amo|adoro|obrigad|perfeito|incrível|show|massa|top|bacana|sensacional/,
            'sad': /😢|😭|😔|triste|pena|desculp|sinto muito|lamento|infelizmente|ruim|péssimo|chateado/,
            'surprised': /😮|😲|🤯|😱|nossa|uau|wow|caramba|sério\?|mesmo\?|verdade\?|não acredito|incrível/,
            'angry': /😠|😡|🤬|raiva|irritado|absurdo|ridículo|inaceitável|odeio/,
            'relaxed': /😌|🙂|tranquilo|calma|relaxa|suave|de boa|ok|tudo bem|entendi/
        };

        for (const [emotion, pattern] of Object.entries(emotions)) {
            if (pattern.test(lowerText)) {
                return emotion;
            }
        }

        return 'neutral';
    }

    // =========================================================================
    // Idle Animations
    // =========================================================================

    updateIdle(dt) {
        this.time += dt;

        // Interpolação suave do mouse
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

        if (this.vrm) {
            const humanoid = this.vrm.humanoid;

            // Cabeça segue o mouse!
            const head = humanoid?.getNormalizedBoneNode('head');
            if (head) {
                // Mouse tracking (mais intenso)
                head.rotation.y = this.mouseX * 0.4;
                head.rotation.x = -this.mouseY * 0.2;
                // Adiciona leve movimento idle
                head.rotation.y += Math.sin(this.time * 0.3) * 0.02;
                head.rotation.z = Math.sin(this.time * 0.25) * 0.02;
            }

            // Pescoço também segue um pouco
            const neck = humanoid?.getNormalizedBoneNode('neck');
            if (neck) {
                neck.rotation.y = this.mouseX * 0.15;
                neck.rotation.x = -this.mouseY * 0.1;
            }

            // Movimento do tronco (respiração)
            const spine = humanoid?.getNormalizedBoneNode('spine');
            if (spine) {
                spine.rotation.x = Math.sin(this.time * 1.2) * 0.01;
            }

            // Braço esquerdo - pose relaxada
            const leftUpperArm = humanoid?.getNormalizedBoneNode('leftUpperArm');
            const leftLowerArm = humanoid?.getNormalizedBoneNode('leftLowerArm');
            if (leftUpperArm) {
                // Braço bem mais para baixo
                leftUpperArm.rotation.z = -0.6 + Math.sin(this.time * 0.4) * 0.02;
            }
            if (leftLowerArm) {
                leftLowerArm.rotation.z = -0.4;
            }

            // Braço direito - pose relaxada
            const rightUpperArm = humanoid?.getNormalizedBoneNode('rightUpperArm');
            const rightLowerArm = humanoid?.getNormalizedBoneNode('rightLowerArm');
            if (rightUpperArm) {
                rightUpperArm.rotation.z = 0.6 + Math.sin(this.time * 0.4 + 1) * 0.02;
            }
            if (rightLowerArm) {
                rightLowerArm.rotation.z = 0.4;
            }

            // Mãos
            const leftHand = humanoid?.getNormalizedBoneNode('leftHand');
            const rightHand = humanoid?.getNormalizedBoneNode('rightHand');
            if (leftHand) {
                leftHand.rotation.z = Math.sin(this.time * 0.6) * 0.03;
            }
            if (rightHand) {
                rightHand.rotation.z = Math.sin(this.time * 0.6 + 0.5) * 0.03;
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
            this.updateGesture(dt);
            this.updateExpression(dt);
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
