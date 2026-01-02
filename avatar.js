/**
 * 3D Avatar - Low Poly Face with Lip Sync (v2 - Improved)
 * Uses Three.js for procedural geometry
 */

class Avatar3D {
    constructor(container) {
        this.container = container;
        this.targetViseme = 'X';
        this.currentWeights = {
            mouthOpen: 0,
            mouthWide: 0,
            mouthRound: 0,
            lipsClosed: 0
        };

        this.init();
        this.createFace();
        this.animate();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0f);

        // Camera - mais frontal
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 6);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Lighting melhorada
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
        mainLight.position.set(0, 2, 5);
        this.scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0x6366f1, 0.4);
        fillLight.position.set(-3, 0, 3);
        this.scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xa855f7, 0.3);
        rimLight.position.set(3, 1, -2);
        this.scene.add(rimLight);

        // Handle resize
        window.addEventListener('resize', () => this.onResize());

        // Idle animation vars
        this.time = 0;
        this.blinkTimer = 0;
        this.nextBlink = this.randomBlinkTime();
        this.isBlinking = false;
    }

    randomBlinkTime() {
        return 2 + Math.random() * 4;
    }

    createFace() {
        // Head group - centralizado
        this.head = new THREE.Group();
        this.head.position.set(0, -0.2, 0);
        this.scene.add(this.head);

        // Head - formato mais oval
        const headGeometry = new THREE.SphereGeometry(1, 12, 10);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdbcc,
            flatShading: true,
            roughness: 0.7,
            metalness: 0.0
        });
        this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
        this.headMesh.scale.set(0.85, 1.1, 0.8);
        this.head.add(this.headMesh);

        // Eyes
        this.createEyes();

        // Eyebrows
        this.createEyebrows();

        // Nose
        this.createNose();

        // Mouth - MAIOR E MAIS VISÍVEL
        this.createMouth();

        // Hair
        this.createHair();
    }

    createEyes() {
        // Eye whites - maiores
        const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 12);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.3
        });

        // Left eye
        this.leftEye = new THREE.Group();
        const leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.leftEye.add(leftEyeWhite);
        this.leftEye.position.set(-0.25, 0.15, 0.7);

        // Left pupil
        const pupilGeometry = new THREE.SphereGeometry(0.06, 12, 8);
        const pupilMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.2
        });
        this.leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        this.leftPupil.position.z = 0.08;
        this.leftEye.add(this.leftPupil);

        // Right eye
        this.rightEye = new THREE.Group();
        const rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.rightEye.add(rightEyeWhite);
        this.rightEye.position.set(0.25, 0.15, 0.7);

        // Right pupil
        this.rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        this.rightPupil.position.z = 0.08;
        this.rightEye.add(this.rightPupil);

        // Eyelids
        const eyelidGeometry = new THREE.BoxGeometry(0.28, 0.14, 0.08);
        const eyelidMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdbcc,
            flatShading: true
        });

        this.leftEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
        this.leftEyelid.position.set(-0.25, 0.28, 0.72);
        this.leftEyelid.scale.y = 0.01;

        this.rightEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
        this.rightEyelid.position.set(0.25, 0.28, 0.72);
        this.rightEyelid.scale.y = 0.01;

        this.head.add(this.leftEye, this.rightEye, this.leftEyelid, this.rightEyelid);
    }

    createEyebrows() {
        const browGeometry = new THREE.BoxGeometry(0.22, 0.04, 0.04);
        const browMaterial = new THREE.MeshStandardMaterial({
            color: 0x3d2817,
            flatShading: true
        });

        this.leftBrow = new THREE.Mesh(browGeometry, browMaterial);
        this.leftBrow.position.set(-0.25, 0.38, 0.7);
        this.leftBrow.rotation.z = 0.08;

        this.rightBrow = new THREE.Mesh(browGeometry, browMaterial);
        this.rightBrow.position.set(0.25, 0.38, 0.7);
        this.rightBrow.rotation.z = -0.08;

        this.head.add(this.leftBrow, this.rightBrow);
    }

    createNose() {
        const noseGeometry = new THREE.ConeGeometry(0.06, 0.2, 4);
        const noseMaterial = new THREE.MeshStandardMaterial({
            color: 0xf0c8b8,
            flatShading: true
        });

        this.nose = new THREE.Mesh(noseGeometry, noseMaterial);
        this.nose.position.set(0, -0.05, 0.82);
        this.nose.rotation.x = -Math.PI / 2;
        this.head.add(this.nose);
    }

    createMouth() {
        // BOCA MUITO MAIOR E MAIS VISÍVEL
        this.mouthGroup = new THREE.Group();
        this.mouthGroup.position.set(0, -0.42, 0.68);

        // Lábio superior - MAIOR
        const upperLipGeometry = new THREE.BoxGeometry(0.5, 0.08, 0.12);
        const lipMaterial = new THREE.MeshStandardMaterial({
            color: 0xd4736a,
            flatShading: true,
            roughness: 0.4
        });

        this.upperLip = new THREE.Mesh(upperLipGeometry, lipMaterial);
        this.upperLip.position.y = 0.06;
        this.upperLip.position.z = 0.02;

        // Lábio inferior - MAIOR
        const lowerLipGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.12);
        this.lowerLip = new THREE.Mesh(lowerLipGeometry, lipMaterial);
        this.lowerLip.position.y = -0.06;
        this.lowerLip.position.z = 0.02;

        // Interior da boca (escuro) - MAIOR
        const mouthInteriorGeometry = new THREE.BoxGeometry(0.4, 0.01, 0.1);
        const mouthInteriorMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d0a0a,
            flatShading: true
        });
        this.mouthInterior = new THREE.Mesh(mouthInteriorGeometry, mouthInteriorMaterial);
        this.mouthInterior.position.z = -0.02;

        // Língua (aparece quando boca abre)
        const tongueGeometry = new THREE.SphereGeometry(0.12, 8, 6);
        const tongueMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc5555,
            flatShading: true
        });
        this.tongue = new THREE.Mesh(tongueGeometry, tongueMaterial);
        this.tongue.scale.set(1.2, 0.5, 0.8);
        this.tongue.position.set(0, -0.08, -0.02);
        this.tongue.visible = false;

        this.mouthGroup.add(this.upperLip, this.lowerLip, this.mouthInterior, this.tongue);
        this.head.add(this.mouthGroup);
    }

    createHair() {
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d1f15,
            flatShading: true
        });

        // Cabelo principal
        const hairGeometry = new THREE.SphereGeometry(0.95, 8, 6);
        this.hair = new THREE.Mesh(hairGeometry, hairMaterial);
        this.hair.position.set(0, 0.55, -0.15);
        this.hair.scale.set(1.0, 0.6, 0.9);
        this.head.add(this.hair);

        // Franja
        for (let i = 0; i < 5; i++) {
            const fringeGeometry = new THREE.BoxGeometry(0.15, 0.25, 0.1);
            const fringe = new THREE.Mesh(fringeGeometry, hairMaterial);
            fringe.position.set(
                (i - 2) * 0.18,
                0.75,
                0.5
            );
            fringe.rotation.x = 0.3;
            fringe.rotation.z = (Math.random() - 0.5) * 0.2;
            this.head.add(fringe);
        }
    }

    // =========================================================================
    // Lip Sync - Sistema de Visemas MELHORADO
    // =========================================================================

    setViseme(viseme) {
        this.targetViseme = viseme;
    }

    updateMouth() {
        const targets = this.getVisemeTargets(this.targetViseme);

        // Interpolação mais rápida para lip sync mais responsivo
        const speed = 0.25;
        for (const key in this.currentWeights) {
            this.currentWeights[key] += (targets[key] - this.currentWeights[key]) * speed;
        }

        const { mouthOpen, mouthWide, mouthRound, lipsClosed } = this.currentWeights;

        // Lábio superior - movimento mais visível
        this.upperLip.position.y = 0.06 + mouthOpen * 0.12;
        this.upperLip.scale.x = 1 + mouthWide * 0.25 - mouthRound * 0.25;

        // Lábio inferior - movimento mais visível
        this.lowerLip.position.y = -0.06 - mouthOpen * 0.18;
        this.lowerLip.scale.x = 1 + mouthWide * 0.25 - mouthRound * 0.25;

        // Interior da boca - mais visível
        const openAmount = Math.max(0.1, mouthOpen);
        this.mouthInterior.scale.y = openAmount * 8;
        this.mouthInterior.position.y = 0;

        // Língua aparece quando boca abre
        this.tongue.visible = mouthOpen > 0.4;
        if (this.tongue.visible) {
            this.tongue.position.y = -0.08 - mouthOpen * 0.1;
        }

        // Boca redonda (O, U)
        if (mouthRound > 0.5) {
            this.upperLip.scale.x = 0.65;
            this.lowerLip.scale.x = 0.65;
            this.upperLip.scale.z = 1.2;
            this.lowerLip.scale.z = 1.2;
        } else {
            this.upperLip.scale.z = 1;
            this.lowerLip.scale.z = 1;
        }

        // Lábios fechados (M, B, P)
        if (lipsClosed > 0.5) {
            this.upperLip.position.y = 0.02;
            this.lowerLip.position.y = -0.02;
            this.mouthInterior.scale.y = 0.1;
            this.tongue.visible = false;
        }
    }

    getVisemeTargets(viseme) {
        const visemeMap = {
            'X': { mouthOpen: 0, mouthWide: 0, mouthRound: 0, lipsClosed: 0 },
            'A': { mouthOpen: 1.0, mouthWide: 0.6, mouthRound: 0, lipsClosed: 0 },
            'E': { mouthOpen: 0.5, mouthWide: 0.8, mouthRound: 0, lipsClosed: 0 },
            'I': { mouthOpen: 0.3, mouthWide: 0.9, mouthRound: 0, lipsClosed: 0 },
            'O': { mouthOpen: 0.7, mouthWide: 0, mouthRound: 1.0, lipsClosed: 0 },
            'U': { mouthOpen: 0.4, mouthWide: 0, mouthRound: 1.0, lipsClosed: 0 },
            'M': { mouthOpen: 0, mouthWide: 0, mouthRound: 0, lipsClosed: 1.0 },
            'F': { mouthOpen: 0.15, mouthWide: 0.4, mouthRound: 0, lipsClosed: 0.3 },
            'L': { mouthOpen: 0.4, mouthWide: 0.5, mouthRound: 0, lipsClosed: 0 },
            'S': { mouthOpen: 0.2, mouthWide: 0.7, mouthRound: 0, lipsClosed: 0 },
            'R': { mouthOpen: 0.45, mouthWide: 0.3, mouthRound: 0.4, lipsClosed: 0 }
        };

        return visemeMap[viseme] || visemeMap['X'];
    }

    // =========================================================================
    // Idle Animations
    // =========================================================================

    updateIdle(deltaTime) {
        this.time += deltaTime;

        // Movimento sutil da cabeça
        this.head.rotation.y = Math.sin(this.time * 0.4) * 0.03;
        this.head.rotation.x = Math.sin(this.time * 0.25) * 0.015;

        // Respiração
        this.head.position.y = -0.2 + Math.sin(this.time * 1.2) * 0.008;

        // Movimento dos olhos
        const eyeX = Math.sin(this.time * 0.6) * 0.015;
        const eyeY = Math.sin(this.time * 0.4) * 0.01;
        this.leftPupil.position.x = eyeX;
        this.leftPupil.position.y = eyeY;
        this.rightPupil.position.x = eyeX;
        this.rightPupil.position.y = eyeY;

        // Piscar
        this.blinkTimer += deltaTime;
        if (this.blinkTimer >= this.nextBlink && !this.isBlinking) {
            this.isBlinking = true;
            this.blinkProgress = 0;
        }

        if (this.isBlinking) {
            this.blinkProgress += deltaTime * 10;
            const blinkAmount = Math.sin(this.blinkProgress * Math.PI);

            this.leftEyelid.scale.y = blinkAmount * 7;
            this.rightEyelid.scale.y = blinkAmount * 7;
            this.leftEyelid.position.y = 0.28 - blinkAmount * 0.13;
            this.rightEyelid.position.y = 0.28 - blinkAmount * 0.13;

            if (this.blinkProgress >= 1) {
                this.isBlinking = false;
                this.blinkTimer = 0;
                this.nextBlink = this.randomBlinkTime();
                this.leftEyelid.scale.y = 0.01;
                this.rightEyelid.scale.y = 0.01;
            }
        }
    }

    // =========================================================================
    // Animation Loop
    // =========================================================================

    animate() {
        const clock = new THREE.Clock();

        const loop = () => {
            requestAnimationFrame(loop);

            const deltaTime = clock.getDelta();

            this.updateIdle(deltaTime);
            this.updateMouth();

            this.renderer.render(this.scene, this.camera);
        };

        loop();
    }

    onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

window.Avatar3D = Avatar3D;
