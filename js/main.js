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
let currentScene = 1;
const scenes = [];
const composers = [];
function initScenes(analyser, dataArray) {
  initScene0();
  initScene1(analyser, dataArray);
  initScene2();
}

const startButton = document.getElementById('startButton');
const audio = new Audio("js/assets/audio/mushroom-candy.mp3"); // Assure-toi que le chemin est bon

startButton.addEventListener('click', () => {
  audio.play().then(() => {
    // Démarrage autorisé, on lance la démo
    initScenes(analyser, dataArray);
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

//pour le son
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const track = audioContext.createMediaElementSource(audio);
const analyser = audioContext.createAnalyser();
analyser.fftSize = 64;
const dataArray = new Uint8Array(analyser.frequencyBinCount);

track.connect(analyser);
analyser.connect(audioContext.destination);


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
  cube.visible = false; //on attend 5 secondes avant de l'afficher
  scene0.add(cube);

  const spheres = [];

  const light = new THREE.PointLight(0xffffff, 1, 100);
  light.visible = false;
  scene0.add(light);
  setTimeout(() => {
    cube.visible = true;
  }, 5000);
  
  
    // Ajout des sphères
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.2),
        new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
      );
      s.visible = false;
      spheres.push(s);
      scene0.add(s);
    }
  
  setTimeout(() => {
    spheres.forEach((s) => s.visible = true);
  }, 15000);
  

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
  }, 20000);

  setTimeout(() => {
    light.visible = true;
    light.position.set(0, 5, 5);//verifier ce truc
  }, 100);

  setTimeout(() => {
    phase = 1; // déclenche le glitch des sphères uniquement
  }, 27000);
  
  setTimeout(() => {
    phase = 2;// déclenche le glitch du cube
  }, 37000);

  setTimeout(() => {
    phase = 3;//bug champignon
  }, 46000);
  
  setTimeout(() => {
    currentScene = 1; //oa change de scène ici
  }, 54000);
  
  // Animation
  scene0.userData.animate = function () {
    const elapsed = clock.getElapsedTime();

    cube.rotation.y += 0.01;
    cube.rotation.x += 0.005;

    spheres.forEach((s, i) => {
      const angle = elapsed + (i * Math.PI * 2) / spheres.length;
      s.position.set(Math.cos(angle) * 2, 0, Math.sin(angle) * 2);
    });

    if (phase >= 1) {
      // Sphères : wireframe + échelle aléatoire
      spheres.forEach((s) => {
        s.material.wireframe = true;
        const scale = 1 + (Math.random() - 0.5) * 0.8; // variation entre 0.6 et 1.4
        s.scale.set(scale, scale, scale);
      });}
    if (phase >= 2) {
      // Cube : déformation brutale aléatoire à chaque frame
      cube.scale.set(
        1 + (Math.random() - 0.5) * 0.5, // variation x entre 0.75 et 1.25
        1 + (Math.random() - 0.5) * 0.5,
        1 + (Math.random() - 0.5) * 0.5
      );

      // Couleur du cube aléatoire
      cube.material.color.setHSL(Math.random(), 1, 0.5);
    }
    if (phase >= 3) {

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
    } else if (elapsed <= 50) {
      glitchProbability = 0.1; // 10% avant 50 secondes
    }else{
      glitchProbability = 0.5; // 50% après 50 secondes
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

//pour le resize
window.addEventListener("resize", onWindowResize);

function initScene1(analyser, dataArray) {
  const scene1 = new THREE.Scene();
  scene1.background = new THREE.Color(0x000000);

  const bloomParams = { bloom: true };
  setupComposerForScene(scene1, bloomParams);

  const forms = [];
  const maxForms = 600;
  const tunnelHeight = 100;

  const light = new THREE.AmbientLight(0xffffff, 1.5);
  scene1.add(light);

  const isNearCamera = (x, y, z) => {
    const distSq = x * x + y * y + z * z;
    return distSq < 9;
  };

  for (let i = 0; i < maxForms; i++) {
    const useCube = Math.random() > 0.5;
    const geom = useCube
      ? new THREE.BoxGeometry(
          0.5 + Math.random() * 2,
          0.5 + Math.random() * 2,
          0.5 + Math.random() * 2
        )
      : new THREE.SphereGeometry(0.5 + Math.random(), 16, 16);

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(Math.random(), Math.random(), Math.random()),
      emissive: new THREE.Color(Math.random(), Math.random(), Math.random()),
      emissiveIntensity: 1 + Math.random() * 2,
    });

    const mesh = new THREE.Mesh(geom, mat);

    let x, y, z;
    do {
      x = (Math.random() - 0.5) * 40;
      y = -Math.random() * tunnelHeight;
      z = (Math.random() - 0.5) * 40;
    } while (isNearCamera(x, y, z));

    mesh.position.set(x, y, z);

    mesh.userData = {
      isLit: false,
      lastToggleTime: 0,
      transformed: false,
      shouldBeRectangle: false,
    };

    scene1.add(mesh);
    forms.push(mesh);
  }

//chargement du modele 3D
const loader = new GLTFLoader();
loader.load("js/assets/models/fly_agaric_mushroom.glb", (gltf) => {
  const model = gltf.scene;
  // Position the model but don't make it visible
  model.position.y = 1;
  model.position.x = 0;
  model.position.z = 0;
  model.scale.set(0.015, 0.015, 0.015);
  model.visible = false; // Keep the model hidden
  scene1.add(model);
  
  // Store reference to the model
  scene1.userData.model = model;
  
  // No clones are created
});

  camera.position.set(0, 0, 0);
  camera.rotation.set(-Math.PI / 2, 0, 0);
  let lastBeatTime = 0;
  const BEAT_INTERVAL = 400;
  const LIGHT_DURATION = 800;
  const LIGHT_COUNT = 50;

  scene1.userData.animate = function () {
    analyser.getByteFrequencyData(dataArray);
    const speed = 0.6;
    const elapsedTime = clock.getElapsedTime();
    const now = performance.now();

    const shakeFrequency = 2.0;
    const shakeAmplitude = 0.06;

    const xShake = Math.sin(elapsedTime * shakeFrequency) * shakeAmplitude;
    const yShake = Math.sin(elapsedTime * shakeFrequency * 1.3) * shakeAmplitude;
    const zShake = Math.cos(elapsedTime * shakeFrequency * 0.7) * shakeAmplitude;

    camera.rotation.set(-Math.PI / 2 + xShake, yShake, zShake);

    const vibrationPulse = Math.sin(elapsedTime * 0.8) > 0.8;
    if (vibrationPulse) {
      const vibrationStrength = 0.2;
      camera.position.x += (Math.random() - 0.5) * vibrationStrength;
      camera.position.z += (Math.random() - 0.5) * vibrationStrength;
      camera.position.y += (Math.random() - 0.5) * vibrationStrength * 0.3;
    }

    if (now - lastBeatTime > BEAT_INTERVAL) {
      lastBeatTime = now;
      const shuffled = forms.sort(() => 0.5 - Math.random());
      const toLight = shuffled.slice(0, LIGHT_COUNT);

      toLight.forEach(form => {
        form.userData.isLit = true;
        form.userData.lightStart = now;
      });
    }

    forms.forEach((form) => {
      // Déplacement vertical
      form.position.y += speed;
    
      // Gestion de l'éclairage temporaire
      if (form.userData.isLit && now - form.userData.lightStart > LIGHT_DURATION) {
        form.userData.isLit = false;
      }
      form.material.emissiveIntensity = form.userData.isLit ? 3 : 0.05;
    
      // Transformation entre 66s et 70s
      if (elapsedTime > 66 && elapsedTime < 70) {
        if (!form.userData.transformed && form.geometry.type !== 'BoxGeometry') {
          const stretchedBox = new THREE.BoxGeometry(
            0.2 + Math.random() * 0.3,
            0.2 + Math.random() * 0.3,
            5 + Math.random() * 5
          );
          const angle = Math.atan2(-form.position.z, -form.position.x);
          form.rotation.y = angle;
          form.rotation.x = Math.random() * 0.2 - 0.1;
    
          form.geometry.dispose();
          form.geometry = stretchedBox;
          form.userData.transformed = true;
        }
        if (form.position.y > 1) {
          form.userData.shouldBeRectangle = true;
        }
      } 
      // Transformation entre 70s et 80s
      else if (elapsedTime >= 70 && elapsedTime < 80) {
        if (form.geometry.type === 'SphereGeometry') {
          const stretchedCube = new THREE.BoxGeometry(
            0.2 + Math.random() * 0.3,
            0.2 + Math.random() * 0.3,
            5 + Math.random() * 5
          );
          form.geometry.dispose();
          form.geometry = stretchedCube;
          form.userData.transformed = true;
        }
      }
    // Matrix effect (green wireframes) between 108s and 121s
    else if (elapsedTime >= 108 && elapsedTime < 121) {
      form.material.wireframe = true;
    form.material.color.set(0x00ff00);        // vert pur
    form.material.emissive.set(0x00ff00);     // vert lumineux aussi
    if (form.geometry.type === 'SphereGeometry') {
      // Créer un nouveau cube avec taille aléatoire
      const newBox = new THREE.BoxGeometry(
        0.5 + Math.random() * 2,  // largeur x
        0.5 + Math.random() * 2,  // hauteur y
        0.5 + Math.random() * 2   // profondeur z
      );
      // Libérer l'ancienne géométrie
      form.geometry.dispose();
      // Remplacer par la nouvelle
      form.geometry = newBox;
      // Marquer que l'objet est transformé (si tu utilises ce flag)
      form.userData.transformed = true;
    }
  } else {
    // Si tu veux remettre à l'état normal avant 95s (optionnel)
    form.material.wireframe = false;
    // Tu peux aussi remettre la couleur d'origine ici si besoin
  }
      // Recyclage dès que la forme dépasse y=1
      if (form.position.y > 1) {
        const rand = Math.random();
        let newGeom;
    
        if (rand < 0.33) {
          // Cube aléatoire
          newGeom = new THREE.BoxGeometry(
            0.5 + Math.random() * 2,
            0.5 + Math.random() * 2,
            0.5 + Math.random() * 2
          );
        } else if (rand < 0.66) {
          // Sphère aléatoire
          newGeom = new THREE.SphereGeometry(0.5 + Math.random(), 16, 16);
    
          // Changer immédiatement les couleurs
          const newColor = new THREE.Color(Math.random(), Math.random(), Math.random());
          const newEmissive = new THREE.Color(Math.random(), Math.random(), Math.random());
          form.material.color.copy(newColor);
          form.material.emissive.copy(newEmissive);
        } else {
          // Formes variées : tore, dodécaèdre, tétraèdre, octaèdre
          const shapeType = Math.random();
    
          if (shapeType < 0.25) {
            newGeom = new THREE.TorusGeometry(
              0.3 + Math.random() * 0.3,
              0.1 + Math.random() * 0.1,
              8 + Math.floor(Math.random() * 8),
              8 + Math.floor(Math.random() * 8)
            );
          } else if (shapeType < 0.5) {
            newGeom = new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.3, 0);
          } else if (shapeType < 0.75) {
            newGeom = new THREE.TetrahedronGeometry(0.5 + Math.random() * 0.4, 0);
          } else {
            newGeom = new THREE.OctahedronGeometry(0.4 + Math.random() * 0.3, 0);
          }
    
          // Effet de changement progressif des couleurs après 80s
          if (elapsedTime > 80) {
            const colorShift = 0.01;
            form.material.color.offsetHSL(Math.random() * colorShift, 0, 0);
            form.material.emissive.offsetHSL(Math.random() * colorShift, 0, 0);
          }
        }
    
        // Appliquer la nouvelle géométrie si définie
        if (newGeom) {
          form.geometry.dispose();
          form.geometry = newGeom;
        }
    
        // Réinitialiser la position hors caméra
        let x, z;
        do {
          x = (Math.random() - 0.5) * 60;
          z = (Math.random() - 0.5) * 60;
        } while (isNearCamera(x, 0, z));
    
        form.position.set(x, -tunnelHeight, z);
        form.userData.isLit = false;
        form.userData.lightStart = 0;
      }
    });
    
    // Gestion du glitch pour scene1
    const composer = scene1.userData.composer;
    let glitchProbability;
    
    if (elapsedTime < 40) {
      // 1% chance avant 40 secondes
      } else if (elapsedTime >= 40 && elapsedTime < 80) {
        // Maintenir à 1% entre 40s et 80s
        glitchProbability = 0.01;
      } else if (elapsedTime >= 80 && elapsedTime < 108) {
        // Augmentation drastique de 1% à 100% entre 80s et 108s
        glitchProbability = 0.01 + ((elapsedTime - 80) / (108 - 80)) * (1.0 - 0.01);
      } else {
        // Descend à 0 après 108 secondes
        glitchProbability = 0.0;
      }
    
    const random = Math.random();
    
    if (random < glitchProbability && !scene1.userData.glitchEnabled) {
      composer.addPass(glitchPass);
      scene1.userData.glitchEnabled = true;
      glitchPass.enabled = true;
      
      setTimeout(() => {
      const index = composer.passes.indexOf(glitchPass);
      if (index !== -1) {
        composer.passes.splice(index, 1);
      }
      scene1.userData.glitchEnabled = false;
      glitchPass.enabled = false;
      }, 10 + Math.random() * 50); // 10 à 60 ms
    } else if (scene1.userData.glitchEnabled && random >= glitchProbability) {
      const index = composer.passes.indexOf(glitchPass);
      if (index !== -1) {
      composer.passes.splice(index, 1);
      }
      scene1.userData.glitchEnabled = false;
      glitchPass.enabled = false;
    }

    scene1.userData.composer.render();
  };

  scenes.push(scene1);
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
    .5,
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
