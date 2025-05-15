import * as THREE from "three";
import { GLTFLoader } from "gltf";
import { OrbitControls } from "orbitcontrols";
import { Water } from "water";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { GlitchPass } from "three/addons/postprocessing/GlitchPass.js";

// Initialisation de la scène
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  90,
  window.innerWidth / window.innerHeight,
  0.1,
  20000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
});

let animationStarted = false;//pour demander le début de la démo

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
//renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 0.3;
//scene.background = new THREE.Color(0x000000);
//scene.background = 0x0000ff;
//renderer.setClearColor( 0x000000, 1);
scene.background = new THREE.Color("#c7c7c7");

// Ajout du brouillard à la scène
const fogColor = new THREE.Color("#c7c7c7"); // Couleur du brouillard
//scene.fog = new THREE.Fog(fogColor, 1, 1000);

// Ajout de brouillard exponentiel
scene.fog = new THREE.FogExp2(fogColor, 0.035);

//shaders
const renderPass = new RenderPass(scene, camera);
const composer = new EffectComposer(renderer);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.3,
  1.5,
  0.0
);

let glitchPass = new GlitchPass();
glitchPass.goWild = true;
glitchPass.enabled = false;
composer.addPass(glitchPass);

//bloomPass.threshold = 0.0;
composer.addPass(bloomPass);

// Initialize multiple scenes
let currentScene = 0;
const scenes = [];
const composers = [];
function initScenes() {
  initScene0();
  initScene1();
  initScene2();
}

const startButton = document.getElementById('startButton');
const audio = new Audio("js/assets/audio/mushroom-candy.mp3"); // Assure-toi que le chemin est bon

startButton.addEventListener('click', () => {
  audio.play().then(() => {
    // Démarrage autorisé, on lance la démo
    initScenes();
    clock.start(); // Reset et start
    animationStarted = true;

    startButton.style.display = 'none';
  }).catch(err => {
    console.error('Erreur lors de la lecture audio :', err);
  });
  audio.addEventListener('error', (e) => {
    console.error('Erreur de chargement audio:', e);
  });
  
});


function initScene0() {
  camera.position.set(0, 2.5, -2);
  camera.lookAt(0, 1, 0); // le cube est à (0, 1, 0)

  const scene0 = new THREE.Scene();
  scene0.background = new THREE.Color("#407aec");
  //scene0.fog = new THREE.FogExp2(scene0.background, 0.035);
  const ambient = new THREE.AmbientLight(0xffffff, 3.5);
  scene0.add(ambient);
  setupComposerForScene(scene0, { bloom: false, glitch: false });
  //const clock = new THREE.Clock();
  let phase = 0;
  scene0.userData.glitchEnabled = false;
  // Cube principal
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  );
  cube.position.set(0, 0, 0);
  console.log("cube", cube);
  scene0.add(cube);

  const spheres = [];

  const light = new THREE.PointLight(0xffffff, 1, 100);
  light.visible = false;
  scene0.add(light);

  // Étapes temporelles
  setTimeout(() => {
    // Ajout des sphères
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.2),
        new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
      );
      spheres.push(s);
      scene0.add(s);
    }
    phase = 1;
  }, 5000);

  setTimeout(() => {
    // Chargement modèle GLTF
    const loader = new GLTFLoader();
    loader.load("js/assets/models/fly_agaric_mushroom.glb", (gltf) => {
      const model = gltf.scene;
      model.position.y = 1;
      model.position.x = 0;
      model.position.z = 0;
      model.scale.set(0.015, 0.015, 0.015);
      scene0.add(model);
      model.userData = { originalMaterial: model.children[0].material };
      scene0.userData.model = model;
      if (!scene0.userData.clones) {
        scene0.userData.clones = [];

        const parts = [
          "annulus_low_default_0",
          "hood_low_default_0",
          "stem_low_default_0",
        ];

        for (let i = 0; i < 6; i++) {
          const targetPart = parts[Math.floor(Math.random() * parts.length)];

          const source = model.getObjectByName(targetPart);
          if (!source) continue;

          const clone = source.clone();
          clone.material = source.material.clone();
          clone.material.isCloned = true;
          clone.scale.set(0.015, 0.015, 0.015);

          clone.position.set(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4
          );

          clone.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          );

          clone.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.05
          );
          clone.visible = false;

          scene0.add(clone);
          scene0.userData.clones.push(clone);
        }
      }
    });
  }, 15000);

  setTimeout(() => {
    light.visible = true;
    light.position.set(0, 5, 5);
  }, 20000);

  setTimeout(() => {
    phase = 2;
  }, 30000);

  // Animation
  scene0.userData.animate = function () {
    const elapsed = clock.getElapsedTime();

    cube.rotation.y += 0.01;
    cube.rotation.x += 0.005;

    spheres.forEach((s, i) => {
      const angle = elapsed + (i * Math.PI * 2) / spheres.length;
      s.position.set(Math.cos(angle) * 2, 0, Math.sin(angle) * 2);
    });

    if (phase === 2) {
      // Cube : déformation brutale aléatoire à chaque frame
      cube.scale.set(
        1 + (Math.random() - 0.5) * 0.5, // variation x entre 0.75 et 1.25
        1 + (Math.random() - 0.5) * 0.5,
        1 + (Math.random() - 0.5) * 0.5
      );

      // Couleur du cube aléatoire
      cube.material.color.setHSL(Math.random(), 1, 0.5);

      // Sphères : wireframe + échelle aléatoire
      spheres.forEach((s) => {
        s.material.wireframe = true;
        const scale = 1 + (Math.random() - 0.5) * 0.8; // variation entre 0.6 et 1.4
        s.scale.set(scale, scale, scale);
      });

      // Modification du modèle 3D (s'il existe)
      if (scene0.userData.model) {
        scene0.userData.model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (!(child instanceof THREE.Mesh)) return;

            if (!child.material.isCloned) {
              child.material = child.material.clone();
              child.material.isCloned = true;
            }

            switch (child.name) {
              case "annulus_low_default_0":
                // Anneau : parfois en wireframe, couleur vive
                child.scale.x = 1 + (Math.random() - 0.5) * 0.3;
                child.scale.y = 1 + (Math.random() - 0.5) * 0.3;
                child.scale.z = 1 + (Math.random() - 0.5) * 0.3;
                child.material.wireframe = Math.random() > 0.5;
                child.material.color.setHSL(Math.random(), 1, 0.5);
                child.material.emissive.setHSL(Math.random(), 1, 0.5);
                child.material.opacity = 0.3 + Math.random() * 0.7;
                child.material.transparent = true;
                break;

              case "hood_low_default_0":
                // Chapeau : pulsation et chance de wireframe
                child.scale.x = 1 + (Math.random() - 0.5) * 0.3;
                child.scale.y = 1 + (Math.random() - 0.5) * 0.3;
                child.scale.z = 1 + (Math.random() - 0.5) * 0.3;
                child.material.wireframe = Math.random() > 0.5;
                child.scale.setScalar(1 + 0.1 * (Math.random() - 0.5));
                child.material.color.setHSL(Math.random(), 0.8, 0.6);
                child.material.opacity = 0.5 + Math.random() * 0.5;
                child.material.transparent = true;
                break;

              case "stem_low_default_0":
                // Tige : scale glitch + clignotement
                child.scale.x = 1 + (Math.random() - 0.5) * 0.3;
                child.scale.y = 1 + (Math.random() - 0.5) * 0.3;
                child.scale.z = 1 + (Math.random() - 0.5) * 0.3;
                child.material.wireframe = Math.random() > 0.7;
                child.material.emissive.setHSL(Math.random(), 1, 0.6);
                break;
            }

            if (scene0.userData.clones) {
              scene0.userData.clones.forEach((clone) => {
                clone.visible = true;
                // Mouvement
                clone.position.add(clone.userData.velocity);

                // Rebonds
                ["x", "y", "z"].forEach((axis) => {
                  if (Math.abs(clone.position[axis]) > 5) {
                    clone.userData.velocity[axis] *= -1;
                  }
                });

                // Rotation continue
                clone.rotation.x += 0.01 + Math.random() * 0.01;
                clone.rotation.y += 0.01 + Math.random() * 0.01;

                // Glitch de couleur
                clone.material.color.setHSL(Math.random(), 1, 0.5);
                clone.material.emissive.setHSL(Math.random(), 1, 0.5);

                // Changement de forme
                clone.scale.set(
                  0.01 + Math.random() * 0.03,
                  0.01 + Math.random() * 0.03,
                  0.01 + Math.random() * 0.03
                );

                // Clignotement et wireframe
                clone.material.opacity = 0.3 + Math.random() * 0.7;
                clone.material.transparent = true;
                clone.material.wireframe = Math.random() > 0.7;
              });
            }
          }
        });
      }

      light.intensity = Math.abs(Math.sin(elapsed * 10)) * 2;
    }

    //const elapsed = clock.getElapsedTime();
    const composer = scene0.userData.composer;

    // Probabilité de glitch (entre 0 et 1)
    let glitchProbability;

    if (elapsed < 30) {
      glitchProbability = 0.01; // 1% avant 30 secondes
    } else if (elapsed >= 30 && elapsed <= 50) {
      // Augmentation linéaire de 1% à 5% entre 30s et 50s
      glitchProbability = 0.01 + ((elapsed - 30) / (50 - 30)) * (0.05 - 0.01);
    } else {
      glitchProbability = 0.1; // 5% au-delà de 50 secondes
    }

    // Tirage aléatoire
    const random = Math.random(); // entre 0 et 1

    if (random < glitchProbability && !scene0.userData.glitchEnabled) {
      composer.addPass(glitchPass);
      scene0.userData.glitchEnabled = true;
      glitchPass.enabled = true;

      setTimeout(() => {
        const index = composer.passes.indexOf(glitchPass);
        if (index !== -1) {
          composer.passes.splice(index, 1);
        }
        scene0.userData.glitchEnabled = false;
        glitchPass.enabled = false;
      }, 10 + Math.random() * 50); // 10 à 60 ms
    } else if (scene0.userData.glitchEnabled && random >= glitchProbability) {
      const index = composer.passes.indexOf(glitchPass);
      if (index !== -1) {
        composer.passes.splice(index, 1);
      }
      scene0.userData.glitchEnabled = false;
      glitchPass.enabled = false;
    }
    composer.render();
  };
  scenes.push(scene0);
}

function onWindowResize() {
  // Update camera aspect ratio
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Update renderer size
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Update all composers
  composers.forEach((composer) => {
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  // Update bloom passes in each composer
  scenes.forEach((scene) => {
    if (scene.userData.composer) {
      const bloomPass = scene.userData.composer.passes.find(
        (pass) => pass instanceof UnrealBloomPass
      );
      if (bloomPass) {
        bloomPass.resolution.set(window.innerWidth, window.innerHeight);
      }
    }
  });
}

// Add event listener for window resize
window.addEventListener("resize", onWindowResize);

function initScene1() {
  const scene1 = new THREE.Scene();
  scene1.background = new THREE.Color(0x000000);

  const cubes = [];
  const tunnelLength = 200;
  for (let i = 0; i < 1000; i++) {
    const geom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const mat = new THREE.MeshBasicMaterial({
      color: Math.random() * 0xffffff,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      -Math.random() * tunnelLength
    );
    scene1.add(mesh);
    cubes.push(mesh);
  }

  let zMove = 0;
  scene1.userData.animate = function () {
    zMove += 0.5;
    camera.position.z = zMove % tunnelLength;
  };

  scenes.push(scene1);
  setupComposerForScene(scene1);
}

function initScene2() {
  const scene2 = new THREE.Scene();
  scene2.background = new THREE.Color(0x222222);

  const geom = new THREE.PlaneGeometry(10, 5);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: new THREE.TextureLoader().load("js/assets/textures/credits.png"),
  });
  const mesh = new THREE.Mesh(geom, mat);
  scene2.add(mesh);

  scene2.userData.animate = function () {
    mesh.rotation.y = Math.sin(Date.now() * 0.001) * 0.2;
  };

  scenes.push(scene2);
  setupComposerForScene(scene2);
}

function setupComposerForScene(scene, options = {}) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3,
    1.5,
    0.0
  );
  bloomPass.enabled = options.bloom !== false;
  composer.addPass(bloomPass);

  if (options.glitch) {
    const glitchPass = new GlitchPass();
    glitchPass.goWild = true;
    composer.addPass(glitchPass);
  }

  scene.userData.composer = composer; // <=== Important
  composers.push(composer);
}

//initScenes();
const clock = new THREE.Clock();
let lastFrameTime = 0;
const targetFPS = 10;

function animate() {
  requestAnimationFrame(animate);
// Ne rien faire si l'animation n'a pas encore démarré

  // Ne rien faire si l'animation n'a pas encore démarré
//  if (!animationStarted) return;
  
  // Vérifier si les scènes ont été initialisées
  if (scenes.length === 0 || composers.length === 0) return;

  const now = performance.now();
  if (scenes[currentScene] === scenes[0]) {
    if (now - lastFrameTime < 1000 / targetFPS) return;
    lastFrameTime = now;
  }

  const scene = scenes[currentScene];
  const composer = composers[currentScene];

  // Appelle l'animation personnalisée si définie
  scene.userData.animate?.(clock.getDelta());

  // Rendu avec le post-processing
  composer.render();
}

animate();
console.log("animationStarted", animationStarted);

/*  
// Set up scenes
function initScenes() {
    // Scene 0: Water portal with doors
    const scene0 = new THREE.Scene();
    scene0.background = new THREE.Color('#c7c7c7');
    scene0.fog = new THREE.FogExp2(new THREE.Color('#c7c7c7'), 0.035);
    
    // Water
    const waterGeometry = new THREE.PlaneGeometry(100, 100);
    const water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('js/assets/textures/waternormals.jpg', function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0x000000,
            waterColor: 0x000000,
            distortionScale: 0.50,
            fog: scene0.fog !== undefined,
            alpha: 0.0,
        }
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0;
    scene0.add(water);
    
    // Doors setup
    const doorGeometry = new THREE.BoxGeometry(2, 4, 0.1);
    const lanterneGeometry = new THREE.SphereGeometry(0.13);
    const radius = 6;
    const doors = [];
    
    // Orange door
    let door = new THREE.Mesh(doorGeometry, new THREE.MeshStandardMaterial({ color: 0xf39c12, emissive: 0xf39c12, emissiveIntensity: 5, toneMapped: false }));
    door.position.set(0, 1, radius);
    door.lookAt(0, 1, 0);
    door.userData.url = "page_connexion.html";
    doors.push(door);
    
    let largeur_lumiere = 2.0;
    let hauteur_lumiere = 4.0;
    let intensite = 5;
    let couleur = 0xf39c12;
    let rectangle_light = new THREE.RectAreaLight(couleur, intensite, largeur_lumiere, hauteur_lumiere);
    rectangle_light.position.set(0, 0.5, radius);
    rectangle_light.power = 100;
    rectangle_light.lookAt(0, 1, 0);
    scene0.add(rectangle_light);
    
    // Blue door
    door = new THREE.Mesh(doorGeometry, new THREE.MeshStandardMaterial({ color: 0x2192d3, emissive: 0x2192d3, emissiveIntensity: 5, toneMapped: false }));
    door.position.set(0, 1, -radius);
    door.lookAt(0, 1, 0);
    door.userData.url = "presentation_page.html";
    doors.push(door);
    
    largeur_lumiere = 2.0;
    hauteur_lumiere = 4.0;
    intensite = 5;
    couleur = 0x2192d3;
    rectangle_light = new THREE.RectAreaLight(couleur, intensite, largeur_lumiere, hauteur_lumiere);
    rectangle_light.position.set(0, 0.5, -radius);
    rectangle_light.power = 100;
    rectangle_light.lookAt(0, 1, 0);
    scene0.add(rectangle_light);
    
    // Add doors to scene
    doors.forEach(door => scene0.add(door));
    
    // Add plague doctor model
    const loader = new GLTFLoader();
    let model; 
    loader.load('js/assets/docteur/steampunk_plague_doctor.glb', function (gltf) {
        model = gltf.scene;
        model.position.set(-20, 1.45, 0);
        model.scale.set(1.5, 1.5, 1.5);
        model.rotation.y = -1;
        scene0.add(model);
    }, undefined, function (error) {
        console.error(error);
    });
    
    // Lantern
    let door_lanterne = new THREE.Mesh(lanterneGeometry, new THREE.MeshStandardMaterial({ color: 0xf39c12, emissive: 0xf39c12, emissiveIntensity: 5, toneMapped: false }));
    door_lanterne.position.set(-20, 2, 0.2);
    door_lanterne.lookAt(0, 1, 0);
    scene0.add(door_lanterne);
    
    // Set up scene animation
    scene0.userData.animate = function() {
        water.material.uniforms['time'].value += 0.1 / 60.0;
    };
    
    // Raycaster for door interactions
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredDoor = null;
    
    // Add the scene to scenes array
    scenes.push(scene0);
    
    // Scene 1: Tunnel with cubes
    const scene1 = new THREE.Scene();
    scene1.background = new THREE.Color(0x000000);
    const cubes = [];
    const tunnelLength = 200;

    for (let i = 0; i < 1000; i++) {
        const g = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const m = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
        const mesh = new THREE.Mesh(g, m);
        mesh.position.x = (Math.random() - 0.5) * 20;
        mesh.position.y = (Math.random() - 0.5) * 20;
        mesh.position.z = -Math.random() * tunnelLength;
        scene1.add(mesh);
        cubes.push(mesh);
    }

    let zMove = 0;
    scene1.userData.animate = () => {
        zMove += 0.5;
        camera.position.z = zMove % tunnelLength;
    };

    scenes.push(scene1);
    
    // Scene 2: Credits (you can customize this)
    const scene2 = new THREE.Scene();
    scene2.background = new THREE.Color(0x222222);
    
    const textGeometry = new THREE.PlaneGeometry(10, 5);
    const textMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        map: new THREE.TextureLoader().load('js/assets/textures/credits.png')
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    scene2.add(textMesh);
    
    scene2.userData.animate = () => {
        textMesh.rotation.y = Math.sin(Date.now() * 0.001) * 0.2;
    };
    
    scenes.push(scene2);
    
    // Setup composers for each scene
    scenes.forEach(scene => {
        const composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);
        
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.30, 1.5, 0.0
        );
        composer.addPass(bloomPass);
        
        composers.push(composer);
    });
}

// Initialize the main setup
function init() {
    // Camera setup
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20000);
    camera.position.set(5, 1.5, 0);
    camera.lookAt(0, 1.5, 0);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.3;
    
    // Initialize scenes
    initScenes();
    
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composers.forEach(composer => composer.setSize(window.innerWidth, window.innerHeight));
    });
}


// Function to switch between scenes
function switchScene(index) {
    if (index >= 0 && index < scenes.length) {
        currentScene = index;
        
        // Reset camera position for specific scenes
        if (index === 0) {
            camera.position.set(5, 1.5, 0);
            camera.lookAt(0, 1.5, 0);
        } else if (index === 1) {
            camera.position.set(0, 0, 5);
            camera.lookAt(0, 0, 0);
        }
    }
}

// Animation function
function animate() {
    requestAnimationFrame(animate);
    
    // Run scene-specific animation
    const currentSceneObj = scenes[currentScene];
    if (currentSceneObj && currentSceneObj.userData.animate) {
        currentSceneObj.userData.animate();
    }
    
    // Render with the current composer
    composers[currentScene].render();
}

// Initialize everything
init();
animate();
*/
