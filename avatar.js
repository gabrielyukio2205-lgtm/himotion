/**
 * 3D Avatar - Simple but Working (v4)
 * Voltando pro modelo simples que funcionava, mas melhorado
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
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x12121a);

        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 5.5);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Iluminação
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);

        const main = new THREE.DirectionalLight(0xffffff, 0.9);
        main.position.set(1, 2, 4);
        this.scene.add(main);

        const fill = new THREE.DirectionalLight(0x6366f1, 0.3);
        fill.position.set(-2, 0, 2);
        this.scene.add(fill);

        window.addEventListener('resize', () => this.onResize());

        this.time = 0;
        this.blinkTimer = 0;
        this.nextBlink = 2 + Math.random() * 3;
        this.isBlinking = false;
    }

    createFace() {
        this.head = new THREE.Group();
        this.head.position.y = -0.1;
        this.scene.add(this.head);

        const skinColor = 0xffdbcc;
        const skinMat = new THREE.MeshStandardMaterial({
            color: skinColor,
            roughness: 0.7,
            flatShading: true
        });

        // CABEÇA - Icosaedro achatado
        const headGeo = new THREE.IcosahedronGeometry(1, 1);
        this.headMesh = new THREE.Mesh(headGeo, skinMat);
        this.headMesh.scale.set(0.85, 1.0, 0.75);
        this.head.add(this.headMesh);

        // OLHOS
        this.createEyes();

        // SOBRANCELHAS
        this.createBrows();

        // NARIZ
        const noseGeo = new THREE.ConeGeometry(0.08, 0.22, 4);
        const noseMat = new THREE.MeshStandardMaterial({ color: 0xeec8b8, flatShading: true });
        this.nose = new THREE.Mesh(noseGeo, noseMat);
        this.nose.position.set(0, -0.05, 0.72);
        this.nose.rotation.x = -Math.PI / 2 + 0.2;
        this.head.add(this.nose);

        // BOCA
        this.createMouth();

        // CABELO
        this.createHair();

        // BOCHECHAS
        this.createCheeks();
    }

    createEyes() {
        const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x2d1810 });
        const irisMat = new THREE.MeshStandardMaterial({ color: 0x5588cc });

        // Olho esquerdo
        this.leftEyeGroup = new THREE.Group();
        this.leftEyeGroup.position.set(-0.28, 0.18, 0.6);

        const leftWhite = new THREE.Mesh(
            new THREE.SphereGeometry(0.13, 16, 12),
            eyeWhiteMat
        );
        this.leftEyeGroup.add(leftWhite);

        const leftIris = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 12, 8),
            irisMat
        );
        leftIris.position.z = 0.08;
        this.leftEyeGroup.add(leftIris);

        this.leftPupil = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 8, 6),
            pupilMat
        );
        this.leftPupil.position.z = 0.12;
        this.leftEyeGroup.add(this.leftPupil);

        // Brilho
        const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const leftShine = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 6, 4),
            shineMat
        );
        leftShine.position.set(0.03, 0.03, 0.13);
        this.leftEyeGroup.add(leftShine);

        // Olho direito
        this.rightEyeGroup = new THREE.Group();
        this.rightEyeGroup.position.set(0.28, 0.18, 0.6);

        const rightWhite = new THREE.Mesh(
            new THREE.SphereGeometry(0.13, 16, 12),
            eyeWhiteMat
        );
        this.rightEyeGroup.add(rightWhite);

        const rightIris = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 12, 8),
            irisMat
        );
        rightIris.position.z = 0.08;
        this.rightEyeGroup.add(rightIris);

        this.rightPupil = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 8, 6),
            pupilMat
        );
        this.rightPupil.position.z = 0.12;
        this.rightEyeGroup.add(this.rightPupil);

        const rightShine = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 6, 4),
            shineMat
        );
        rightShine.position.set(0.03, 0.03, 0.13);
        this.rightEyeGroup.add(rightShine);

        // Pálpebras
        const lidMat = new THREE.MeshStandardMaterial({ color: 0xffdbcc, flatShading: true });

        this.leftLid = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.15, 0.08),
            lidMat
        );
        this.leftLid.position.set(-0.28, 0.32, 0.62);
        this.leftLid.scale.y = 0.01;

        this.rightLid = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.15, 0.08),
            lidMat
        );
        this.rightLid.position.set(0.28, 0.32, 0.62);
        this.rightLid.scale.y = 0.01;

        this.head.add(this.leftEyeGroup, this.rightEyeGroup, this.leftLid, this.rightLid);
    }

    createBrows() {
        const browMat = new THREE.MeshStandardMaterial({ color: 0x4a3020, flatShading: true });

        this.leftBrow = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.04, 0.04),
            browMat
        );
        this.leftBrow.position.set(-0.28, 0.4, 0.62);
        this.leftBrow.rotation.z = 0.1;

        this.rightBrow = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.04, 0.04),
            browMat
        );
        this.rightBrow.position.set(0.28, 0.4, 0.62);
        this.rightBrow.rotation.z = -0.1;

        this.head.add(this.leftBrow, this.rightBrow);
    }

    createMouth() {
        this.mouthGroup = new THREE.Group();
        this.mouthGroup.position.set(0, -0.38, 0.6);

        const lipMat = new THREE.MeshStandardMaterial({ color: 0xcc6666, flatShading: true });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x330808 });

        // Lábio superior
        this.upperLip = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.06, 0.1),
            lipMat
        );
        this.upperLip.position.y = 0.05;

        // Lábio inferior
        this.lowerLip = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.08, 0.1),
            lipMat
        );
        this.lowerLip.position.y = -0.05;

        // Interior
        this.mouthInside = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, 0.02, 0.08),
            darkMat
        );
        this.mouthInside.position.z = -0.02;

        this.mouthGroup.add(this.upperLip, this.lowerLip, this.mouthInside);
        this.head.add(this.mouthGroup);
    }

    createHair() {
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x3d2518, flatShading: true });

        // Cabelo principal
        const mainHair = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.9, 0),
            hairMat
        );
        mainHair.position.set(0, 0.5, -0.1);
        mainHair.scale.set(1.1, 0.7, 0.95);
        this.head.add(mainHair);

        // Franja
        for (let i = 0; i < 5; i++) {
            const fringe = new THREE.Mesh(
                new THREE.TetrahedronGeometry(0.18, 0),
                hairMat
            );
            fringe.position.set((i - 2) * 0.22, 0.7, 0.45);
            fringe.rotation.set(0.5, Math.random() * 0.3, (i - 2) * 0.1);
            this.head.add(fringe);
        }
    }

    createCheeks() {
        const cheekMat = new THREE.MeshBasicMaterial({
            color: 0xffaaaa,
            transparent: true,
            opacity: 0.3
        });

        const left = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 12, 8),
            cheekMat
        );
        left.position.set(-0.5, -0.1, 0.55);
        left.scale.z = 0.3;

        const right = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 12, 8),
            cheekMat
        );
        right.position.set(0.5, -0.1, 0.55);
        right.scale.z = 0.3;

        this.head.add(left, right);
    }

    // =========================================================================
    // Lip Sync
    // =========================================================================

    setViseme(v) {
        this.targetViseme = v;
    }

    updateMouth() {
        const t = this.getVisemeTargets(this.targetViseme);
        const s = 0.2;

        for (const k in this.currentWeights) {
            this.currentWeights[k] += (t[k] - this.currentWeights[k]) * s;
        }

        const { mouthOpen, mouthWide, mouthRound, lipsClosed } = this.currentWeights;

        this.upperLip.position.y = 0.05 + mouthOpen * 0.1;
        this.upperLip.scale.x = 1 + mouthWide * 0.2 - mouthRound * 0.2;

        this.lowerLip.position.y = -0.05 - mouthOpen * 0.14;
        this.lowerLip.scale.x = 1 + mouthWide * 0.2 - mouthRound * 0.2;

        this.mouthInside.scale.y = 0.5 + mouthOpen * 6;

        if (mouthRound > 0.5) {
            this.upperLip.scale.x = 0.65;
            this.lowerLip.scale.x = 0.65;
        }

        if (lipsClosed > 0.5) {
            this.upperLip.position.y = 0.02;
            this.lowerLip.position.y = -0.02;
            this.mouthInside.scale.y = 0.3;
        }
    }

    getVisemeTargets(v) {
        const map = {
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
        return map[v] || map['X'];
    }

    // =========================================================================
    // Idle
    // =========================================================================

    updateIdle(dt) {
        this.time += dt;

        // Movimento da cabeça
        this.head.rotation.y = Math.sin(this.time * 0.4) * 0.05;
        this.head.rotation.x = Math.sin(this.time * 0.25) * 0.02;

        // Olhos
        const ex = Math.sin(this.time * 0.5) * 0.02;
        const ey = Math.sin(this.time * 0.35) * 0.015;
        this.leftPupil.position.x = ex;
        this.leftPupil.position.y = ey;
        this.rightPupil.position.x = ex;
        this.rightPupil.position.y = ey;

        // Piscar
        this.blinkTimer += dt;
        if (this.blinkTimer >= this.nextBlink && !this.isBlinking) {
            this.isBlinking = true;
            this.blinkProgress = 0;
        }

        if (this.isBlinking) {
            this.blinkProgress += dt * 10;
            const b = Math.sin(this.blinkProgress * Math.PI);

            this.leftLid.scale.y = b * 5;
            this.rightLid.scale.y = b * 5;
            this.leftLid.position.y = 0.32 - b * 0.14;
            this.rightLid.position.y = 0.32 - b * 0.14;

            if (this.blinkProgress >= 1) {
                this.isBlinking = false;
                this.blinkTimer = 0;
                this.nextBlink = 2 + Math.random() * 3;
                this.leftLid.scale.y = 0.01;
                this.rightLid.scale.y = 0.01;
            }
        }
    }

    animate() {
        const clock = new THREE.Clock();
        const loop = () => {
            requestAnimationFrame(loop);
            const dt = clock.getDelta();
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
