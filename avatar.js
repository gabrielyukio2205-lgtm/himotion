/**
 * 3D Avatar - Low Poly Face with Lip Sync
 * Uses Three.js for procedural geometry
 */

class Avatar3D {
    constructor(container) {
        this.container = container;
        this.visemeWeights = {};
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
        
        // Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 5);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(2, 3, 5);
        this.scene.add(mainLight);
        
        const fillLight = new THREE.DirectionalLight(0x6366f1, 0.3);
        fillLight.position.set(-3, 0, 2);
        this.scene.add(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0xa855f7, 0.4);
        rimLight.position.set(0, 2, -3);
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
        return 2 + Math.random() * 4; // 2-6 seconds
    }
    
    createFace() {
        // Head group
        this.head = new THREE.Group();
        this.scene.add(this.head);
        
        // Head - low poly sphere
        const headGeometry = new THREE.IcosahedronGeometry(1, 1);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5d0c5,
            flatShading: true,
            roughness: 0.8,
            metalness: 0.1
        });
        this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
        this.headMesh.scale.set(1, 1.2, 0.9);
        this.head.add(this.headMesh);
        
        // Eyes
        this.createEyes();
        
        // Eyebrows
        this.createEyebrows();
        
        // Nose
        this.createNose();
        
        // Mouth
        this.createMouth();
        
        // Hair (simple low-poly)
        this.createHair();
    }
    
    createEyes() {
        const eyeGroup = new THREE.Group();
        
        // Eye whites
        const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 6);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            flatShading: true
        });
        
        // Left eye
        this.leftEye = new THREE.Group();
        const leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.leftEye.add(leftEyeWhite);
        this.leftEye.position.set(-0.3, 0.2, 0.75);
        
        // Left pupil
        const pupilGeometry = new THREE.SphereGeometry(0.08, 6, 4);
        const pupilMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d1810,
            flatShading: true
        });
        this.leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        this.leftPupil.position.z = 0.1;
        this.leftEye.add(this.leftPupil);
        
        // Right eye
        this.rightEye = new THREE.Group();
        const rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.rightEye.add(rightEyeWhite);
        this.rightEye.position.set(0.3, 0.2, 0.75);
        
        // Right pupil
        this.rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        this.rightPupil.position.z = 0.1;
        this.rightEye.add(this.rightPupil);
        
        // Eyelids for blinking
        const eyelidGeometry = new THREE.BoxGeometry(0.35, 0.18, 0.1);
        const eyelidMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5d0c5,
            flatShading: true
        });
        
        this.leftEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
        this.leftEyelid.position.set(-0.3, 0.35, 0.8);
        this.leftEyelid.scale.y = 0.01;
        
        this.rightEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
        this.rightEyelid.position.set(0.3, 0.35, 0.8);
        this.rightEyelid.scale.y = 0.01;
        
        eyeGroup.add(this.leftEye, this.rightEye, this.leftEyelid, this.rightEyelid);
        this.head.add(eyeGroup);
    }
    
    createEyebrows() {
        const browGeometry = new THREE.BoxGeometry(0.25, 0.05, 0.05);
        const browMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3728,
            flatShading: true
        });
        
        this.leftBrow = new THREE.Mesh(browGeometry, browMaterial);
        this.leftBrow.position.set(-0.3, 0.45, 0.78);
        this.leftBrow.rotation.z = 0.1;
        
        this.rightBrow = new THREE.Mesh(browGeometry, browMaterial);
        this.rightBrow.position.set(0.3, 0.45, 0.78);
        this.rightBrow.rotation.z = -0.1;
        
        this.head.add(this.leftBrow, this.rightBrow);
    }
    
    createNose() {
        const noseGeometry = new THREE.ConeGeometry(0.08, 0.25, 4);
        const noseMaterial = new THREE.MeshStandardMaterial({
            color: 0xe8c4b8,
            flatShading: true
        });
        
        this.nose = new THREE.Mesh(noseGeometry, noseMaterial);
        this.nose.position.set(0, -0.05, 0.9);
        this.nose.rotation.x = -Math.PI / 2;
        this.head.add(this.nose);
    }
    
    createMouth() {
        // Mouth is the key for lip sync - using morph targets simulation
        this.mouthGroup = new THREE.Group();
        this.mouthGroup.position.set(0, -0.4, 0.75);
        
        // Upper lip
        const upperLipGeometry = new THREE.BoxGeometry(0.35, 0.06, 0.1);
        const lipMaterial = new THREE.MeshStandardMaterial({
            color: 0xc9887a,
            flatShading: true
        });
        
        this.upperLip = new THREE.Mesh(upperLipGeometry, lipMaterial);
        this.upperLip.position.y = 0.05;
        
        // Lower lip
        const lowerLipGeometry = new THREE.BoxGeometry(0.35, 0.08, 0.1);
        this.lowerLip = new THREE.Mesh(lowerLipGeometry, lipMaterial);
        this.lowerLip.position.y = -0.05;
        
        // Mouth interior (dark)
        const mouthInteriorGeometry = new THREE.BoxGeometry(0.3, 0.02, 0.08);
        const mouthInteriorMaterial = new THREE.MeshStandardMaterial({
            color: 0x3d1f1f,
            flatShading: true
        });
        this.mouthInterior = new THREE.Mesh(mouthInteriorGeometry, mouthInteriorMaterial);
        this.mouthInterior.position.z = -0.02;
        
        this.mouthGroup.add(this.upperLip, this.lowerLip, this.mouthInterior);
        this.head.add(this.mouthGroup);
    }
    
    createHair() {
        // Simple low-poly hair
        const hairGeometry = new THREE.IcosahedronGeometry(0.9, 0);
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d1f15,
            flatShading: true
        });
        
        this.hair = new THREE.Mesh(hairGeometry, hairMaterial);
        this.hair.position.set(0, 0.6, -0.1);
        this.hair.scale.set(1.2, 0.8, 1);
        this.head.add(this.hair);
        
        // Front hair pieces
        for (let i = 0; i < 3; i++) {
            const pieceGeometry = new THREE.TetrahedronGeometry(0.2 + Math.random() * 0.1, 0);
            const piece = new THREE.Mesh(pieceGeometry, hairMaterial);
            piece.position.set(
                (i - 1) * 0.35,
                0.85,
                0.4
            );
            piece.rotation.set(
                Math.random() * 0.5,
                Math.random() * 0.5,
                Math.random() * 0.5
            );
            this.head.add(piece);
        }
    }
    
    // =========================================================================
    // Lip Sync - Viseme System
    // =========================================================================
    
    setViseme(viseme) {
        this.targetViseme = viseme;
    }
    
    updateMouth() {
        // Target weights based on viseme
        const targets = this.getVisemeTargets(this.targetViseme);
        
        // Smooth interpolation
        const speed = 0.15;
        for (const key in this.currentWeights) {
            this.currentWeights[key] += (targets[key] - this.currentWeights[key]) * speed;
        }
        
        // Apply to mouth geometry
        const { mouthOpen, mouthWide, mouthRound, lipsClosed } = this.currentWeights;
        
        // Upper lip
        this.upperLip.position.y = 0.05 + mouthOpen * 0.08;
        this.upperLip.scale.x = 1 + mouthWide * 0.3 - mouthRound * 0.2;
        
        // Lower lip
        this.lowerLip.position.y = -0.05 - mouthOpen * 0.12;
        this.lowerLip.scale.x = 1 + mouthWide * 0.3 - mouthRound * 0.2;
        
        // Mouth interior visibility
        const openAmount = mouthOpen * 0.2;
        this.mouthInterior.scale.y = Math.max(0.1, openAmount * 5);
        this.mouthInterior.position.y = 0;
        
        // Round mouth (O, U)
        if (mouthRound > 0.5) {
            this.upperLip.scale.x = 0.7;
            this.lowerLip.scale.x = 0.7;
        }
        
        // Lips closed (M, B, P)
        if (lipsClosed > 0.5) {
            this.upperLip.position.y = 0.02;
            this.lowerLip.position.y = -0.02;
            this.mouthInterior.scale.y = 0.1;
        }
    }
    
    getVisemeTargets(viseme) {
        const visemeMap = {
            'X': { mouthOpen: 0, mouthWide: 0, mouthRound: 0, lipsClosed: 0 },      // Silence/rest
            'A': { mouthOpen: 0.9, mouthWide: 0.5, mouthRound: 0, lipsClosed: 0 },   // A - open
            'E': { mouthOpen: 0.4, mouthWide: 0.7, mouthRound: 0, lipsClosed: 0 },   // E - wide
            'I': { mouthOpen: 0.2, mouthWide: 0.8, mouthRound: 0, lipsClosed: 0 },   // I - narrow wide
            'O': { mouthOpen: 0.6, mouthWide: 0, mouthRound: 0.9, lipsClosed: 0 },   // O - round
            'U': { mouthOpen: 0.3, mouthWide: 0, mouthRound: 1.0, lipsClosed: 0 },   // U - small round
            'M': { mouthOpen: 0, mouthWide: 0, mouthRound: 0, lipsClosed: 1.0 },     // M/B/P - closed
            'F': { mouthOpen: 0.1, mouthWide: 0.3, mouthRound: 0, lipsClosed: 0.3 }, // F/V
            'L': { mouthOpen: 0.3, mouthWide: 0.4, mouthRound: 0, lipsClosed: 0 },   // L/N/T/D
            'S': { mouthOpen: 0.15, mouthWide: 0.6, mouthRound: 0, lipsClosed: 0 },  // S/Z
            'R': { mouthOpen: 0.35, mouthWide: 0.2, mouthRound: 0.3, lipsClosed: 0 } // R
        };
        
        return visemeMap[viseme] || visemeMap['X'];
    }
    
    // =========================================================================
    // Idle Animations
    // =========================================================================
    
    updateIdle(deltaTime) {
        this.time += deltaTime;
        
        // Subtle head movement
        this.head.rotation.y = Math.sin(this.time * 0.5) * 0.05;
        this.head.rotation.x = Math.sin(this.time * 0.3) * 0.02;
        
        // Breathing
        this.head.position.y = Math.sin(this.time * 1.5) * 0.01;
        
        // Eye tracking (subtle random movement)
        const eyeX = Math.sin(this.time * 0.7) * 0.02;
        const eyeY = Math.sin(this.time * 0.5) * 0.01;
        this.leftPupil.position.x = eyeX;
        this.leftPupil.position.y = eyeY;
        this.rightPupil.position.x = eyeX;
        this.rightPupil.position.y = eyeY;
        
        // Blinking
        this.blinkTimer += deltaTime;
        if (this.blinkTimer >= this.nextBlink && !this.isBlinking) {
            this.isBlinking = true;
            this.blinkProgress = 0;
        }
        
        if (this.isBlinking) {
            this.blinkProgress += deltaTime * 8;
            const blinkAmount = Math.sin(this.blinkProgress * Math.PI);
            
            this.leftEyelid.scale.y = blinkAmount * 6;
            this.rightEyelid.scale.y = blinkAmount * 6;
            this.leftEyelid.position.y = 0.35 - blinkAmount * 0.15;
            this.rightEyelid.position.y = 0.35 - blinkAmount * 0.15;
            
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

// Export to global scope
window.Avatar3D = Avatar3D;
