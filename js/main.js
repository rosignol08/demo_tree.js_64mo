import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { GlitchPass } from "three/addons/postprocessing/GlitchPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// --- CONFIGURATION ---
let maxBassDetected = 150; // On démarre avec un "plancher" (pour ignorer le bruit de fond)
let beatThreshold = 255;   // Valeur initiale
const BEATS_PER_SCENE = 32;

// --- VARIABLES POUR LE CALIBRAGE ---
let calibrationDone = false; // Pour ne le faire qu'une fois
let startTime = 0;         // Pour chronométrer les 15s

// --- UI ELEMENTS ---
const controlsContainer = document.getElementById('player-controls');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const timeDisplay = document.getElementById('time-display');

// --- GLOBALS ---
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas"), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

let animationStarted = false;
let audioContext, analyser, dataArray, source, audioElement;
let lastBeatTime = 0;
let beatCounter = 0;

// Gestion des scènes
let currentSceneIndex = 0;
const scenes = [];
// On garde une seule instance des pass pour les manipuler globalement
let composer, bloomPass, glitchPass;
let isTransitioning = false;

// --- 1. SETUP AUDIO & DRAG DROP ---
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
});

dropZone.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]));
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

function handleFile(file) {
    if (!file || !file.type.startsWith('audio/')) return alert("Audio file only!");
    const url = URL.createObjectURL(file);
    audioElement = new Audio();
    audioElement.src = url;
    dropZone.style.display = 'none';
    startExperience();
}

function startExperience() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    source = audioContext.createMediaElementSource(audioElement);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Initialisation unique du Composer (plus performant)
    initGlobalComposer();
    
    // Création des scènes
    initSceneCore();      // Index 0
    initSceneHyperspeed(); // Index 1
    initSceneMatrix();    // Index 2
    initSceneTombe();    // Index 3

    setupControls();
    // Initialisation du timer pour le calibrage
    startTime = performance.now();

    audioElement.play();
    animationStarted = true;
    animate();
}

function initGlobalComposer() {
    // On crée un composer vide pour l'instant, on changera la scene dedans
    composer = new EffectComposer(renderer);
    
    // 1. Bloom (Lueur)
    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    // 2. Glitch (Désactivé par défaut)
    glitchPass = new GlitchPass();
    glitchPass.enabled = false;
    glitchPass.goWild = true;

    // L'ordre est important : RenderPass sera ajouté dynamiquement dans animate ou switch
    composer.addPass(bloomPass);
    composer.addPass(glitchPass);
    composer.addPass(new OutputPass());
}

// la slide bar de progression et le temps
function setupControls() {
    // Rendre l'interface visible
    controlsContainer.classList.add('visible');

    // CLIC SUR LA BARRE : Navigation (Seeking)
    progressContainer.addEventListener('click', (e) => {
        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        
        // Calcul du pourcentage
        const percentage = clickX / width;
        
        // Mise à jour de l'audio
        if (audioElement && audioElement.duration) {
            audioElement.currentTime = percentage * audioElement.duration;
            
            // On reset le calibrage si on saute trop loin pour éviter les bugs de détection
            // (Optionnel, dépend de ta logique précédente)
        }
    });

    // RACCOURCIS CLAVIER (Bonus)
    window.addEventListener('keydown', (e) => {
        if (!audioElement) return;
        
        if (e.code === 'ArrowRight') {
            audioElement.currentTime += 5; // Avancer de 5s
        } else if (e.code === 'ArrowLeft') {
            audioElement.currentTime -= 5; // Reculer de 5s
        } else if (e.code === 'Space') {
            // Pause / Play
            if (audioElement.paused) audioElement.play();
            else audioElement.pause();
        }// --- DEBUG / MANUAL SWITCH ---
        // On utilise toLowerCase() pour que ça marche que le CapsLock soit activé ou non
        else if (e.key.toLowerCase() === 'm') { 
            console.log("Touche M appuyée !"); // Petit log pour être sûr
            
            if (scenes.length === 0) return;

            // Changement immédiat
            currentSceneIndex = (currentSceneIndex + 1) % scenes.length;
            
            // Reset des compteurs pour éviter une double transition immédiate
            beatCounter = 0;
            isTransitioning = false; 
            
            // Reset des effets visuels qui pourraient être bloqués
            if(glitchPass) glitchPass.enabled = false;
            if(bloomPass) bloomPass.strength = 1.5; // Remet la force par défaut
            
            console.log(`🎬 Changement manuel vers la scène : ${currentSceneIndex}`);
        }
    });
}

// Fonction utilitaire pour formater le temps (ex: 125s -> 2:05)
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}


// --- 2. SYSTÈME DE TRANSITIONS ALÉATOIRES ---

function triggerRandomTransition() {
    if (isTransitioning) return;
    isTransitioning = true;
    
    const nextIndex = (currentSceneIndex + 1) % scenes.length;
    const transitionType = Math.floor(Math.random() * 3); // 0, 1 ou 2

    console.log(`Transitioning to scene ${nextIndex} via type ${transitionType}`);

    if (transitionType === 0) {
        // TYPE: GLITCH STORM
        glitchPass.enabled = true;
        setTimeout(() => {
            currentSceneIndex = nextIndex;
            // Reset caméra si besoin
        }, 300); // Changer au milieu du glitch
        setTimeout(() => {
            glitchPass.enabled = false;
            isTransitioning = false;
        }, 800);
    } 
    else if (transitionType === 1) {
        // TYPE: FLASH BLANC (BLOOM EXPLOSION)
        const originalStrength = bloomPass.strength;
        bloomPass.strength = 50.0; // Aveuglant
        bloomPass.radius = 2.0;
        
        setTimeout(() => {
            currentSceneIndex = nextIndex;
            // Animation de retour à la normale
            let fadeInterval = setInterval(() => {
                bloomPass.strength *= 0.8;
                if(bloomPass.strength <= originalStrength) {
                    bloomPass.strength = originalStrength;
                    bloomPass.radius = 0.4;
                    clearInterval(fadeInterval);
                    isTransitioning = false;
                }
            }, 50);
        }, 100);
    } 
    else {
        // TYPE: HARD CUT (Simple mais efficace sur un beat)
        currentSceneIndex = nextIndex;
        isTransitioning = false;
    }
}

// --- 3. LES SCÈNES ---

// SCÈNE 1 : THE CORE (Sphère organique)
function initSceneCore() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050505");
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.z = 4;

    // Création d'une sphère composée de plein de petits icosaèdres
    const geometry = new THREE.IcosahedronGeometry(1, 40); // High poly pour déformation
    const material = new THREE.MeshStandardMaterial({
        color: 0xff0055, 
        wireframe: true,
        emissive: 0x550022
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const light = new THREE.PointLight(0xffffff, 2, 50);
    light.position.set(2, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    scene.userData = {
        camera: camera,
        update: (bassLevel, isBeat) => {
            sphere.rotation.y += 0.005;
            sphere.rotation.z += 0.002;
            
            // Pulsation
            const scale = 1 + (bassLevel / 255) * 0.8;
            sphere.scale.setScalar(scale);

            if(isBeat) {
                sphere.material.color.setHSL(Math.random(), 1, 0.5);
                sphere.material.wireframe = !sphere.material.wireframe;
            }
        }
    };
    scenes.push(scene);
}

// SCÈNE 2 : HYPERSPEED (Tunnel)
function initSceneHyperspeed() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#000000");
    const camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight, 0.1, 2000);
    camera.position.z = 0;

    const tunnelObjects = [];
    const colors = [0x00ffff, 0xff00ff, 0xffff00];

    // Créer des anneaux
    for(let i=0; i<30; i++) {
        const geo = new THREE.TorusGeometry(3, 0.1, 16, 50);
        const mat = new THREE.MeshBasicMaterial({ color: colors[i%3] });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = -i * 5;
        scene.add(mesh);
        tunnelObjects.push(mesh);
    }

    scene.userData = {
        camera: camera,
        update: (bassLevel, isBeat) => {
            // Vitesse dépend de la basse
            const speed = 0.5 + (bassLevel / 255) * 2.0;

            tunnelObjects.forEach(obj => {
                obj.position.z += speed;
                obj.rotation.z += 0.01;
                
                // Reset au fond quand ça passe derrière la caméra
                if(obj.position.z > 5) {
                    obj.position.z = -145;
                    obj.material.color.setHex(colors[Math.floor(Math.random()*3)]);
                }
            });

            if(isBeat) {
                camera.rotation.z += Math.PI / 4; // Rotation brutale caméra
            } else {
                camera.rotation.z *= 0.95; // Retour progressif
            }
        }
    };
    scenes.push(scene);
}

function initSceneTombe() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#000000");
    const camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight, 0.1, 2000);
    camera.lookAt(0, -1, 0);
    camera.position.z = 0;

    const tunnelObjects = [];
    //gen des cubes aléatoires
    let couleur;
    let emission_intensitee = 0.0;
    for(let i=0; i<100; i++) {
        const geo = new THREE.BoxGeometry(1,5,1);
        couleur = Math.random() * 0xffffff;
        emission_intensitee = Math.random() < 0.3 ? (0.5 + Math.random() * 2.0) : 0.0;
        const mat = new THREE.MeshStandardMaterial({ 
            color: couleur,//colors[i%3],
            // Forcer l'émission pour un bloom uniforme sur toutes les couleurs
            emissive: couleur, 
            emissiveIntensity: emission_intensitee });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = -i * 5;
        mesh.position.x = (Math.random()) * 100 - 50;
        mesh.position.z = (Math.random()) * 100 - 50;
        // Stocker l'intensité initiale pour le toggle
        mesh.userData.initialEmissiveIntensity = emission_intensitee;
        scene.add(mesh);
        tunnelObjects.push(mesh);
    }

    scene.userData = {
        camera: camera,
        update: (bassLevel, isBeat) => {
            // Vitesse dépend de la basse
            const speed = 0.5 + (bassLevel / 255) * 2.0;

            tunnelObjects.forEach(obj => {
                obj.position.y += speed;
                //obj.rotation.z += 0.01;
                
                // Reset au fond quand ça passe derrière la caméra avec position aléatoire
                if(obj.position.y > 5) {
                    couleur = Math.random() * 0xffffff;
                    obj.position.y = -400;
                    obj.position.x = (Math.random()) * 100 - 50;
                    obj.position.z = (Math.random()) * 100 - 50;
                    obj.material.color.setHex(couleur);
                    obj.material.emissive.setHex(couleur);
                    obj.material.emissiveIntensity = Math.random() < 0.3 ? (0.5 + Math.random() * 2.0) : 0.0;
                }
                if (isBeat) {
                  // Toggle : si éteint (0) → allumer, si allumé → éteindre
                    if (obj.material.emissiveIntensity === 0) {
                        obj.material.emissiveIntensity = obj.userData.initialEmissiveIntensity;
                    } else {
                        obj.material.emissiveIntensity = 0;
                    }
                }
            });

            if(isBeat) {
                camera.rotation.z += Math.PI / 4; // Rotation brutale caméra
            } else {
                camera.rotation.z *= 0.95; // Retour progressif
            }
        }
    };
    scenes.push(scene);
}

// SCÈNE 3 : MATRIX PARTICLES
function initSceneMatrix() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#001100");
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 1000);
    camera.position.set(0, 20, 50);
    camera.lookAt(0,0,0);

    const geometry = new THREE.BufferGeometry();
    const count = 2000;
    const positions = new Float32Array(count * 3);
    
    for(let i=0; i<count*3; i++) {
        positions[i] = (Math.random() - 0.5) * 100;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0x00ff00,
        size: 0.5,
        sizeAttenuation: true
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    scene.userData = {
        camera: camera,
        update: (bassLevel, isBeat) => {
            particles.rotation.y = Date.now() * 0.0005;
            
            // Les particules montent
            const positions = particles.geometry.attributes.position.array;
            for(let i=1; i<count*3; i+=3) {
                positions[i] += 0.2 + (bassLevel/255); // montent plus vite avec la basse
                if(positions[i] > 50) positions[i] = -50;
            }
            particles.geometry.attributes.position.needsUpdate = true;

            if(isBeat) {
                particles.material.size = 2.0;
                particles.material.color.setHex(0xffffff);
            } else {
                particles.material.size = 0.5;
                particles.material.color.setHex(0x00ff00);
            }
        }
    };
    scenes.push(scene);
}


// --- 4. BOUCLE PRINCIPALE ---

function animate() {
    requestAnimationFrame(animate);
    if (!animationStarted) return;

    // 1. Analyse Audio
    analyser.getByteFrequencyData(dataArray);

    // 1. Calcul de la basse (Moyenne sur les 20 premières fréquences)
    let bassSum = 0;
    for (let i = 0; i < 20; i++) bassSum += dataArray[i];
    const bassLevel = bassSum / 20;

    // --- LOGIQUE "ROLLING MAX" (Suivi d'enveloppe) ---
    
    // Si le niveau actuel est plus fort que notre max mémorisé, on le met à jour TOUT DE SUITE
    // C'est la montée instantanée (Attack)
    if (bassLevel > maxBassDetected) {
        maxBassDetected = bassLevel;
    } else {
        // Sinon, on fait redescendre doucement le max (Decay)
        // Cela permet au seuil de s'adapter si la musique devient plus calme (Breakdown)
        // 0.995 = descente lente. 0.990 = descente rapide.
        maxBassDetected *= 0.9995;
    }

    // Sécurité : On empêche le max de descendre trop bas (pour ne pas capter le souffle)
    if (maxBassDetected < 150) maxBassDetected = 150;

    // Calcul du seuil dynamique : 95% du max actuel
    beatThreshold = maxBassDetected * 1.0;
    
    // Détection Beat
    const now = performance.now();
    let isBeat = false;
    
    if (bassLevel > beatThreshold && (now - lastBeatTime > 250)) {
        isBeat = true;
        console.log("🎵 Beat detected! Bass:", bassLevel.toFixed(2), "/ Threshold:", beatThreshold.toFixed(2));
        lastBeatTime = now;
        beatCounter++;

        if (beatCounter >= BEATS_PER_SCENE) {
            triggerRandomTransition();
            beatCounter = 0;
        }
    }

    // 2. Mise à jour de la scène active
    const scene = scenes[currentSceneIndex];
    
    // Important : Il faut s'assurer que le composer utilise la bonne scène/caméra
    // On recrée le RenderPass à chaque changement de scène ou on le met à jour ?
    // Le plus simple avec EffectComposer est de vider les pass et remettre, 
    // ou d'avoir un RenderPass unique qu'on met à jour.
    
    // Méthode optimisée : Mettre à jour la scène et la caméra du RenderPass existant
    // Note : RenderPass est généralement le premier pass (index 0)
    let renderPass = composer.passes.find(p => p instanceof RenderPass);
    if (!renderPass) {
        renderPass = new RenderPass(scene, scene.userData.camera);
        composer.insertPass(renderPass, 0);
    } else {
        renderPass.scene = scene;
        renderPass.camera = scene.userData.camera;
    }

    // Appel de l'animation spécifique de la scène
    if (scene.userData.update) {
        scene.userData.update(bassLevel, isBeat);
    }

    // 3. Rendu
    composer.render();

    // --- MISE À JOUR UI ---
    if (audioElement && audioElement.duration) {
        const current = audioElement.currentTime;
        const total = audioElement.duration;
        
        // Largeur de la barre
        const percent = (current / total) * 100;
        progressBar.style.width = `${percent}%`;

        // Texte
        timeDisplay.innerText = `${formatTime(current)} / ${formatTime(total)}`;
        
        // Optionnel : Si la musique est finie, on remet à zéro
        if (audioElement.ended) {
            animationStarted = false;
            // Tu peux relancer une boucle ou afficher un bouton replay ici
        }
    }
}

window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    scenes.forEach(s => {
        s.userData.camera.aspect = window.innerWidth / window.innerHeight;
        s.userData.camera.updateProjectionMatrix();
    });
});