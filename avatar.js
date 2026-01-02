/**
 * 3D Avatar - VRM Model with Lip Sync (v6)
 * Suporta modelos VRoid/VRM com expressões faciais
 */

class Avatar3D {
    constructor(container) {
        this.container = container;
        this.targetViseme = 'X';
        this.currentVisemeWeight = 0;
        this.vrm = null;
        this.currentExpression = null;

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
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);

        // Iluminação otimizada pra anime
        const ambient = new THREE.AmbientLight(0xffffff, 0.9);
        this.scene.add(ambient);

        const main = new THREE.DirectionalLight(0xffffff, 0.8);
        main.position.set(1, 2, 3);
        this.scene.add(main);

        const fill = new THREE.DirectionalLight(0x8b5cf6, 0.3);
        fill.position.set(-2, 1, 2);
        this.scene.add(fill);

        const rim = new THREE.DirectionalLight(0xffffff, 0.4);
        rim.position.set(0, 1, -2);
        this.scene.add(rim);

        window.addEventListener('resize', () => this.onResize());

        this.clock = new THREE.Clock();
        this.time = 0;

        // Loading indicator
        this.createLoadingIndicator();
    }

    createLoadingIndicator() {
        const geo = new THREE.RingGeometry(0.1, 0.12, 32);
        const mat = new THREE.MeshBasicMaterial({ color: 0x6366f1, side: THREE.DoubleSide });
        this.loadingRing = new THREE.Mesh(geo, mat);
        this.loadingRing.position.set(0, 1.4, 0);
        this.scene.add(this.loadingRing);
    }

    async loadVRM() {
        // Carregar scripts necessários
        await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.137.0/examples/js/loaders/GLTFLoader.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@1.0.0/lib/three-vrm.min.js');

        const loader = new THREE.GLTFLoader();

        // Tentar carregar o modelo local
        const modelPath = './avatar.vrm';

        loader.load(
            modelPath,
            async (gltf) => {
                // Remover loading indicator
                this.scene.remove(this.loadingRing);

                // Converter pra VRM
                const vrm = await THREE.VRM.from(gltf);
                this.vrm = vrm;

                this.scene.add(vrm.scene);

                // Rotacionar pra frente
                vrm.scene.rotation.y = Math.PI;

                console.log('VRM carregado!', vrm);
                console.log('Expressões disponíveis:', vrm.expressionManager?.expressionMap);
            },
            (progress) => {
                const percent = (progress.loaded / progress.total) * 100;
                console.log(`Carregando: ${percent.toFixed(0)}%`);
                if (this.loadingRing) {
                    this.loadingRing.rotation.z = (percent / 100) * Math.PI * 2;
                }
            },
            (error) => {
                console.error('Erro ao carregar VRM:', error);
                this.showError('Coloque o arquivo avatar.vrm na pasta frontend/');
            }
        );
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    showError(message) {
        if (this.loadingRing) {
            this.loadingRing.material.color.setHex(0xff4444);
        }
        console.error(message);
    }

    // =========================================================================
    // Lip Sync com VRM Expressions
    // =========================================================================

    setViseme(viseme) {
        this.targetViseme = viseme;
    }

    updateMouth() {
        if (!this.vrm || !this.vrm.expressionManager) return;

        const em = this.vrm.expressionManager;

        // Mapear visemas para expressões VRM
        // VRM usa: aa, ih, ou, ee, oh para vogais
        const visemeMap = {
            'X': null,
            'A': 'aa',
            'E': 'ee',
            'I': 'ih',
            'O': 'oh',
            'U': 'ou',
            'M': null,  // boca fechada
            'F': 'ih',
            'L': 'aa',
            'S': 'ih',
            'R': 'oh'
        };

        // Reset todas as expressões de boca
        const mouthExpressions = ['aa', 'ih', 'ou', 'ee', 'oh'];
        for (const expr of mouthExpressions) {
            if (em.getValue(expr) !== undefined) {
                const current = em.getValue(expr) || 0;
                em.setValue(expr, current * 0.7); // Fade out
            }
        }

        // Aplicar viseme atual
        const targetExpr = visemeMap[this.targetViseme];
        if (targetExpr && em.getValue(targetExpr) !== undefined) {
            em.setValue(targetExpr, 0.8);
        }

        // Atualizar expressões
        em.update();
    }

    // =========================================================================
    // Idle Animations
    // =========================================================================

    updateIdle(dt) {
        this.time += dt;

        if (this.vrm) {
            // Movimento suave da cabeça
            const head = this.vrm.humanoid?.getRawBoneNode('head');
            if (head) {
                head.rotation.y = Math.sin(this.time * 0.3) * 0.05;
                head.rotation.x = Math.sin(this.time * 0.2) * 0.03;
            }

            // Piscar automático
            if (this.vrm.expressionManager) {
                const blinkCycle = Math.sin(this.time * 0.5);
                if (blinkCycle > 0.98) {
                    this.vrm.expressionManager.setValue('blink', 1);
                } else {
                    const current = this.vrm.expressionManager.getValue('blink') || 0;
                    this.vrm.expressionManager.setValue('blink', current * 0.8);
                }
            }

            // Atualizar VRM
            this.vrm.update(dt);
        }

        // Loading animation
        if (this.loadingRing) {
            this.loadingRing.rotation.z += dt * 2;
        }
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

window.Avatar3D = Avatar3D;
