/**
 * 3D Avatar - GLB Model with Lip Sync (v5)
 * Usa modelo gratuito do Ready Player Me
 */

class Avatar3D {
    constructor(container) {
        this.container = container;
        this.targetViseme = 'X';
        this.currentWeights = {};
        this.mixer = null;
        this.model = null;
        this.morphTargets = null;

        this.init();
        this.loadModel();
        this.animate();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x12121a);

        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(25, aspect, 0.1, 1000);
        this.camera.position.set(0, 1.55, 0.8);
        this.camera.lookAt(0, 1.5, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.container.appendChild(this.renderer.domElement);

        // Iluminação
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambient);

        const main = new THREE.DirectionalLight(0xffffff, 1.0);
        main.position.set(2, 3, 4);
        this.scene.add(main);

        const fill = new THREE.DirectionalLight(0x6366f1, 0.4);
        fill.position.set(-2, 1, 2);
        this.scene.add(fill);

        const back = new THREE.DirectionalLight(0xa855f7, 0.3);
        back.position.set(0, 2, -2);
        this.scene.add(back);

        window.addEventListener('resize', () => this.onResize());

        this.time = 0;
        this.clock = new THREE.Clock();

        // Fallback se modelo não carregar
        this.createFallbackHead();
    }

    createFallbackHead() {
        // Cabeça simples como fallback enquanto carrega
        const geo = new THREE.SphereGeometry(0.25, 16, 12);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffdbcc });
        this.fallbackHead = new THREE.Mesh(geo, mat);
        this.fallbackHead.position.y = 0.5;
        this.scene.add(this.fallbackHead);

        // Loading indicator
        const textGeo = new THREE.BoxGeometry(0.3, 0.05, 0.01);
        const textMat = new THREE.MeshBasicMaterial({ color: 0x6366f1 });
        this.loadingBar = new THREE.Mesh(textGeo, textMat);
        this.loadingBar.position.set(0, 0.1, 0.3);
        this.scene.add(this.loadingBar);
    }

    async loadModel() {
        // URL do modelo Ready Player Me (avatar genérico gratuito)
        // Este é um modelo público de demonstração
        const modelUrl = 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit,Oculus Visemes';

        // Carregar GLTFLoader dinamicamente
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
        document.head.appendChild(script);

        script.onload = () => {
            const loader = new THREE.GLTFLoader();

            loader.load(
                modelUrl,
                (gltf) => {
                    console.log('Modelo carregado!', gltf);

                    // Remover fallback
                    if (this.fallbackHead) {
                        this.scene.remove(this.fallbackHead);
                        this.scene.remove(this.loadingBar);
                    }

                    this.model = gltf.scene;
                    this.model.position.y = 0;
                    this.model.rotation.y = 0;
                    this.scene.add(this.model);

                    // Encontrar mesh com morph targets
                    this.model.traverse((child) => {
                        if (child.isMesh && child.morphTargetInfluences) {
                            console.log('Morph targets encontrados:', child.morphTargetDictionary);
                            this.morphMesh = child;
                            this.morphDict = child.morphTargetDictionary;
                        }
                    });

                    // Setup animações se houver
                    if (gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.model);
                    }
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    console.log(`Carregando: ${percent.toFixed(0)}%`);
                    if (this.loadingBar) {
                        this.loadingBar.scale.x = percent / 100;
                    }
                },
                (error) => {
                    console.error('Erro ao carregar modelo:', error);
                    // Manter fallback
                    if (this.loadingBar) {
                        this.loadingBar.material.color.setHex(0xff0000);
                    }
                }
            );
        };
    }

    // =========================================================================
    // Lip Sync com Morph Targets
    // =========================================================================

    setViseme(viseme) {
        this.targetViseme = viseme;
    }

    updateMouth() {
        if (!this.morphMesh || !this.morphDict) {
            // Fallback para modelo procedural
            return;
        }

        const influences = this.morphMesh.morphTargetInfluences;

        // Mapear visemas para morph targets do Ready Player Me
        // O modelo usa Oculus Visemes ou ARKit
        const visemeMap = {
            'X': { viseme_sil: 1 },
            'A': { viseme_aa: 1 },
            'E': { viseme_E: 1 },
            'I': { viseme_I: 1 },
            'O': { viseme_O: 1 },
            'U': { viseme_U: 1 },
            'M': { viseme_PP: 1 },
            'F': { viseme_FF: 1 },
            'L': { viseme_nn: 1 },
            'S': { viseme_SS: 1 },
            'R': { viseme_RR: 1 }
        };

        // Reset todos os visemas
        const visemeKeys = ['viseme_sil', 'viseme_aa', 'viseme_E', 'viseme_I',
            'viseme_O', 'viseme_U', 'viseme_PP', 'viseme_FF',
            'viseme_nn', 'viseme_SS', 'viseme_RR', 'viseme_CH',
            'viseme_TH', 'viseme_kk', 'viseme_DD'];

        for (const key of visemeKeys) {
            if (this.morphDict[key] !== undefined) {
                const idx = this.morphDict[key];
                const target = visemeMap[this.targetViseme]?.[key] || 0;
                influences[idx] += (target - influences[idx]) * 0.3;
            }
        }
    }

    // =========================================================================
    // Idle Animations
    // =========================================================================

    updateIdle(dt) {
        this.time += dt;

        if (this.model) {
            // Movimento suave da cabeça
            this.model.rotation.y = Math.sin(this.time * 0.3) * 0.05;
            this.model.rotation.x = Math.sin(this.time * 0.2) * 0.02;
        }

        if (this.fallbackHead) {
            this.fallbackHead.rotation.y = Math.sin(this.time * 0.5) * 0.1;
        }

        // Atualizar mixer de animações
        if (this.mixer) {
            this.mixer.update(dt);
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
