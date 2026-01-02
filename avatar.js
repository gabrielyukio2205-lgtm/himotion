/**
 * 3D Avatar - Cute Stylized Face with Lip Sync (v3)
 * Estilo anime/cartoon mais agradável
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

        // Gradient background
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0f0f1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 2, 256);
        const texture = new THREE.CanvasTexture(canvas);
        this.scene.background = texture;

        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 1000);
        this.camera.position.set(0, 0.3, 7);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Soft lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(2, 3, 5);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0x8b5cf6, 0.3);
        fillLight.position.set(-3, 1, 3);
        this.scene.add(fillLight);

        const backLight = new THREE.DirectionalLight(0x6366f1, 0.2);
        backLight.position.set(0, 2, -3);
        this.scene.add(backLight);

        window.addEventListener('resize', () => this.onResize());

        this.time = 0;
        this.blinkTimer = 0;
        this.nextBlink = this.randomBlinkTime();
        this.isBlinking = false;
        this.talkingIntensity = 0;
    }

    randomBlinkTime() {
        return 2 + Math.random() * 3;
    }

    createFace() {
        this.head = new THREE.Group();
        this.scene.add(this.head);

        // Rosto mais suave e arredondado
        this.createHead();
        this.createEyes();
        this.createEyebrows();
        this.createNose();
        this.createMouth();
        this.createCheeks();
        this.createHair();
        this.createEars();
    }

    createHead() {
        // Cabeça principal - mais arredondada e fofa
        const headGeometry = new THREE.SphereGeometry(1.2, 32, 24);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xffe4d4,
            roughness: 0.6,
            metalness: 0.0
        });
        this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
        this.headMesh.scale.set(0.9, 1.05, 0.85);
        this.headMesh.position.y = -0.1;
        this.head.add(this.headMesh);

        // Queixo mais definido
        const chinGeometry = new THREE.SphereGeometry(0.35, 16, 12);
        const chin = new THREE.Mesh(chinGeometry, headMaterial);
        chin.position.set(0, -0.9, 0.3);
        chin.scale.set(1.2, 0.8, 1);
        this.head.add(chin);
    }

    createEyes() {
        // Olhos estilo anime - maiores e mais expressivos
        const eyeGroup = new THREE.Group();

        // Formato do olho (oval)
        const eyeShape = new THREE.Shape();
        eyeShape.ellipse(0, 0, 0.22, 0.28, 0, Math.PI * 2);

        const eyeGeometry = new THREE.ShapeGeometry(eyeShape);
        const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide
        });

        // Olho esquerdo
        this.leftEyeGroup = new THREE.Group();
        this.leftEyeGroup.position.set(-0.35, 0.15, 0.85);

        const leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
        this.leftEyeGroup.add(leftEyeWhite);

        // Iris
        const irisGeometry = new THREE.CircleGeometry(0.14, 24);
        const irisMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a90d9,
            side: THREE.DoubleSide
        });
        this.leftIris = new THREE.Mesh(irisGeometry, irisMaterial);
        this.leftIris.position.z = 0.01;
        this.leftIris.position.y = -0.02;
        this.leftEyeGroup.add(this.leftIris);

        // Pupila
        const pupilGeometry = new THREE.CircleGeometry(0.07, 16);
        const pupilMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            side: THREE.DoubleSide
        });
        this.leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        this.leftPupil.position.z = 0.02;
        this.leftPupil.position.y = -0.02;
        this.leftEyeGroup.add(this.leftPupil);

        // Brilho do olho
        const shineGeometry = new THREE.CircleGeometry(0.04, 12);
        const shineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const leftShine = new THREE.Mesh(shineGeometry, shineMaterial);
        leftShine.position.set(0.05, 0.05, 0.03);
        this.leftEyeGroup.add(leftShine);

        // Olho direito (espelhado)
        this.rightEyeGroup = new THREE.Group();
        this.rightEyeGroup.position.set(0.35, 0.15, 0.85);

        const rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
        this.rightEyeGroup.add(rightEyeWhite);

        this.rightIris = new THREE.Mesh(irisGeometry, irisMaterial);
        this.rightIris.position.z = 0.01;
        this.rightIris.position.y = -0.02;
        this.rightEyeGroup.add(this.rightIris);

        this.rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        this.rightPupil.position.z = 0.02;
        this.rightPupil.position.y = -0.02;
        this.rightEyeGroup.add(this.rightPupil);

        const rightShine = new THREE.Mesh(shineGeometry, shineMaterial);
        rightShine.position.set(0.05, 0.05, 0.03);
        this.rightEyeGroup.add(rightShine);

        // Pálpebras
        const eyelidGeometry = new THREE.PlaneGeometry(0.5, 0.35);
        const eyelidMaterial = new THREE.MeshStandardMaterial({
            color: 0xffe4d4,
            side: THREE.DoubleSide
        });

        this.leftEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
        this.leftEyelid.position.set(-0.35, 0.35, 0.86);
        this.leftEyelid.scale.y = 0.01;

        this.rightEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
        this.rightEyelid.position.set(0.35, 0.35, 0.86);
        this.rightEyelid.scale.y = 0.01;

        eyeGroup.add(this.leftEyeGroup, this.rightEyeGroup, this.leftEyelid, this.rightEyelid);
        this.head.add(eyeGroup);
    }

    createEyebrows() {
        const browMaterial = new THREE.MeshStandardMaterial({
            color: 0x5d4037,
            roughness: 0.8
        });

        // Formato de sobrancelha curvado
        const browShape = new THREE.Shape();
        browShape.moveTo(-0.15, 0);
        browShape.quadraticCurveTo(0, 0.04, 0.15, 0);
        browShape.lineTo(0.15, -0.025);
        browShape.quadraticCurveTo(0, 0.015, -0.15, -0.025);
        browShape.lineTo(-0.15, 0);

        const browGeometry = new THREE.ExtrudeGeometry(browShape, {
            depth: 0.03,
            bevelEnabled: false
        });

        this.leftBrow = new THREE.Mesh(browGeometry, browMaterial);
        this.leftBrow.position.set(-0.35, 0.5, 0.82);
        this.leftBrow.rotation.z = 0.1;

        this.rightBrow = new THREE.Mesh(browGeometry, browMaterial);
        this.rightBrow.position.set(0.35, 0.5, 0.82);
        this.rightBrow.rotation.z = -0.1;
        this.rightBrow.scale.x = -1;

        this.head.add(this.leftBrow, this.rightBrow);
    }

    createNose() {
        // Nariz pequenininho estilo anime
        const noseGeometry = new THREE.SphereGeometry(0.06, 12, 8);
        const noseMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5d0c5,
            roughness: 0.7
        });

        this.nose = new THREE.Mesh(noseGeometry, noseMaterial);
        this.nose.position.set(0, -0.15, 0.95);
        this.nose.scale.set(1, 0.8, 0.6);
        this.head.add(this.nose);
    }

    createMouth() {
        this.mouthGroup = new THREE.Group();
        this.mouthGroup.position.set(0, -0.5, 0.8);

        // Lábios mais estilizados
        const lipMaterial = new THREE.MeshStandardMaterial({
            color: 0xe88b8b,
            roughness: 0.4
        });

        // Lábio superior - formato de arco
        const upperLipShape = new THREE.Shape();
        upperLipShape.moveTo(-0.22, 0);
        upperLipShape.quadraticCurveTo(-0.1, 0.06, 0, 0.03);
        upperLipShape.quadraticCurveTo(0.1, 0.06, 0.22, 0);
        upperLipShape.lineTo(0.2, -0.02);
        upperLipShape.quadraticCurveTo(0.1, 0.02, 0, -0.01);
        upperLipShape.quadraticCurveTo(-0.1, 0.02, -0.2, -0.02);
        upperLipShape.lineTo(-0.22, 0);

        const upperLipGeometry = new THREE.ExtrudeGeometry(upperLipShape, {
            depth: 0.06,
            bevelEnabled: false
        });

        this.upperLip = new THREE.Mesh(upperLipGeometry, lipMaterial);
        this.upperLip.position.y = 0.04;
        this.upperLip.position.z = -0.03;

        // Lábio inferior - mais cheinho
        const lowerLipGeometry = new THREE.SphereGeometry(0.12, 16, 8);
        this.lowerLip = new THREE.Mesh(lowerLipGeometry, lipMaterial);
        this.lowerLip.position.y = -0.06;
        this.lowerLip.scale.set(1.8, 0.6, 0.5);

        // Interior da boca
        const mouthInteriorGeometry = new THREE.PlaneGeometry(0.35, 0.15);
        const mouthInteriorMaterial = new THREE.MeshStandardMaterial({
            color: 0x3d1a1a,
            side: THREE.DoubleSide
        });
        this.mouthInterior = new THREE.Mesh(mouthInteriorGeometry, mouthInteriorMaterial);
        this.mouthInterior.position.z = -0.01;
        this.mouthInterior.scale.y = 0.1;

        // Dentes (aparecem em algumas expressões)
        const teethGeometry = new THREE.PlaneGeometry(0.25, 0.08);
        const teethMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        this.teeth = new THREE.Mesh(teethGeometry, teethMaterial);
        this.teeth.position.set(0, 0.02, 0);
        this.teeth.visible = false;

        this.mouthGroup.add(this.upperLip, this.lowerLip, this.mouthInterior, this.teeth);
        this.head.add(this.mouthGroup);
    }

    createCheeks() {
        // Bochechas rosadas
        const cheekGeometry = new THREE.CircleGeometry(0.12, 16);
        const cheekMaterial = new THREE.MeshBasicMaterial({
            color: 0xffb3b3,
            transparent: true,
            opacity: 0.4
        });

        const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
        leftCheek.position.set(-0.55, -0.15, 0.72);
        leftCheek.rotation.y = -0.3;

        const rightCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
        rightCheek.position.set(0.55, -0.15, 0.72);
        rightCheek.rotation.y = 0.3;

        this.head.add(leftCheek, rightCheek);
    }

    createEars() {
        const earGeometry = new THREE.SphereGeometry(0.15, 12, 8);
        const earMaterial = new THREE.MeshStandardMaterial({
            color: 0xffe4d4,
            roughness: 0.6
        });

        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.95, 0.05, 0);
        leftEar.scale.set(0.5, 1, 0.6);

        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.95, 0.05, 0);
        rightEar.scale.set(0.5, 1, 0.6);

        this.head.add(leftEar, rightEar);
    }

    createHair() {
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3728,
            roughness: 0.8
        });

        // Cabelo principal - mais volume
        const mainHairGeometry = new THREE.SphereGeometry(1.25, 24, 16);
        const mainHair = new THREE.Mesh(mainHairGeometry, hairMaterial);
        mainHair.position.set(0, 0.35, -0.15);
        mainHair.scale.set(0.95, 0.75, 0.85);
        this.head.add(mainHair);

        // Franja estilizada
        for (let i = 0; i < 7; i++) {
            const fringeGeometry = new THREE.ConeGeometry(0.12, 0.4, 8);
            const fringe = new THREE.Mesh(fringeGeometry, hairMaterial);

            const angle = ((i - 3) / 6) * 1.2;
            fringe.position.set(
                Math.sin(angle) * 0.7,
                0.65,
                0.6 + Math.cos(angle) * 0.1
            );
            fringe.rotation.x = 0.5;
            fringe.rotation.z = angle * 0.3;
            this.head.add(fringe);
        }

        // Mechas laterais
        const sideLockGeometry = new THREE.CylinderGeometry(0.08, 0.05, 0.5, 8);

        const leftLock = new THREE.Mesh(sideLockGeometry, hairMaterial);
        leftLock.position.set(-0.85, -0.25, 0.25);
        leftLock.rotation.z = 0.2;
        this.head.add(leftLock);

        const rightLock = new THREE.Mesh(sideLockGeometry, hairMaterial);
        rightLock.position.set(0.85, -0.25, 0.25);
        rightLock.rotation.z = -0.2;
        this.head.add(rightLock);
    }

    // =========================================================================
    // Lip Sync
    // =========================================================================

    setViseme(viseme) {
        this.targetViseme = viseme;
    }

    updateMouth() {
        const targets = this.getVisemeTargets(this.targetViseme);

        const speed = 0.2;
        for (const key in this.currentWeights) {
            this.currentWeights[key] += (targets[key] - this.currentWeights[key]) * speed;
        }

        const { mouthOpen, mouthWide, mouthRound, lipsClosed } = this.currentWeights;

        // Lábio superior
        this.upperLip.position.y = 0.04 + mouthOpen * 0.08;
        this.upperLip.scale.x = 1 + mouthWide * 0.2 - mouthRound * 0.2;

        // Lábio inferior
        this.lowerLip.position.y = -0.06 - mouthOpen * 0.12;
        this.lowerLip.scale.x = 1 + mouthWide * 0.2 - mouthRound * 0.3;
        this.lowerLip.scale.y = 0.6 + mouthOpen * 0.3;

        // Interior da boca
        this.mouthInterior.scale.y = 0.1 + mouthOpen * 1.5;

        // Dentes aparecem quando boca abre muito
        this.teeth.visible = mouthOpen > 0.5;

        // Boca redonda
        if (mouthRound > 0.5) {
            this.upperLip.scale.x = 0.7;
            this.lowerLip.scale.x = 0.7;
        }

        // Lábios fechados
        if (lipsClosed > 0.5) {
            this.upperLip.position.y = 0.02;
            this.lowerLip.position.y = -0.02;
            this.mouthInterior.scale.y = 0.05;
            this.teeth.visible = false;
        }

        // Intensidade da fala para efeitos extras
        this.talkingIntensity = mouthOpen;
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

        // Movimento suave da cabeça
        this.head.rotation.y = Math.sin(this.time * 0.3) * 0.06;
        this.head.rotation.x = Math.sin(this.time * 0.2) * 0.03;
        this.head.rotation.z = Math.sin(this.time * 0.25) * 0.02;

        // Leve movimento quando fala
        if (this.talkingIntensity > 0.2) {
            this.head.rotation.x += Math.sin(this.time * 4) * 0.02 * this.talkingIntensity;
        }

        // Movimento dos olhos
        const eyeX = Math.sin(this.time * 0.5) * 0.03;
        const eyeY = Math.sin(this.time * 0.35) * 0.02;

        this.leftIris.position.x = eyeX;
        this.leftIris.position.y = -0.02 + eyeY;
        this.leftPupil.position.x = eyeX;
        this.leftPupil.position.y = -0.02 + eyeY;

        this.rightIris.position.x = eyeX;
        this.rightIris.position.y = -0.02 + eyeY;
        this.rightPupil.position.x = eyeX;
        this.rightPupil.position.y = -0.02 + eyeY;

        // Piscar
        this.blinkTimer += deltaTime;
        if (this.blinkTimer >= this.nextBlink && !this.isBlinking) {
            this.isBlinking = true;
            this.blinkProgress = 0;
        }

        if (this.isBlinking) {
            this.blinkProgress += deltaTime * 12;
            const blink = Math.sin(this.blinkProgress * Math.PI);

            this.leftEyelid.scale.y = blink * 1.2;
            this.rightEyelid.scale.y = blink * 1.2;
            this.leftEyelid.position.y = 0.35 - blink * 0.2;
            this.rightEyelid.position.y = 0.35 - blink * 0.2;

            if (this.blinkProgress >= 1) {
                this.isBlinking = false;
                this.blinkTimer = 0;
                this.nextBlink = this.randomBlinkTime();
                this.leftEyelid.scale.y = 0.01;
                this.rightEyelid.scale.y = 0.01;
            }
        }
    }

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
