# Demo Three.js - Audio Visualizer / Demoscene

🎵 **Un visualiseur audio réactif en Three.js** - Une démo parfaite pour démarrer dans la demoscene !

## 📖 C'est quoi ?

Ce projet est une **démo audiovisuelle interactive** inspirée de la culture demoscene, construite avec Three.js. Il combine :
- 🎨 Des **scènes 3D visuellement impressionnantes**
- 🎵 Une **réactivité musicale en temps réel**
- ✨ Des **transitions automatiques dynamiques**
- 🎭 Des **effets post-processing** (bloom, glitch)

C'est une **excellente base** pour quiconque souhaite se lancer dans la création de démos audiovisuelles avec Three.js !

## ✨ Fonctionnalités

### 🎬 Quatre scènes uniques
1. **The Core** - Une sphère organique pulsante qui réagit aux basses
2. **Hyperspeed** - Un tunnel de tores colorés pour un effet de vitesse
3. **Matrix Particles** - Un système de particules inspiré de Matrix
4. **La Tombe** - Une chute infinie à travers des cubes lumineux

### 🎵 Audio-réactivité intelligente
- Détection automatique des beats
- Adaptation dynamique au niveau sonore
- Calibrage automatique du seuil de détection
- Système d'enveloppe (attack/decay) pour un suivi précis

### 🎨 Effets visuels avancés
- **UnrealBloomPass** : Effets de lueur (bloom) pour les éléments lumineux
- **GlitchPass** : Effets de glitch pour les transitions
- Transitions aléatoires entre scènes :
  - Glitch storm
  - Flash blanc (bloom explosion)
  - Hard cut

### 🎮 Interface utilisateur
- Glisser-déposer de fichiers audio (MP3, etc.)
- Barre de progression interactive
- Navigation temporelle (clic sur la barre)
- Raccourcis clavier :
  - `Espace` : Play/Pause
  - `←` / `→` : Reculer/Avancer de 5 secondes
  - `M` : Changer de scène manuellement

## 🚀 Comment l'utiliser

### Installation

Aucune installation nécessaire ! Il suffit d'avoir :
- Un navigateur web moderne (Chrome, Firefox, Edge, Safari)
- Un serveur local pour éviter les problèmes CORS

### Lancement

```bash
# Option 1 : Python 3
python -m http.server 8000

# Option 2 : Node.js (avec http-server)
npx http-server -p 8000

# Option 3 : PHP
php -S localhost:8000
```

Puis ouvrez `http://localhost:8000` dans votre navigateur.

### Utilisation

1. Glissez-déposez un fichier audio (MP3, WAV, etc.) sur la zone indiquée
2. La démo démarre automatiquement !
3. Profitez des visuels synchronisés avec votre musique 🎉

## 🛠️ Structure du projet

```
.
├── index.html           # Point d'entrée HTML
├── js/
│   ├── main.js          # Code principal de la démo
│   ├── three.module.min.js  # Bibliothèque Three.js
│   ├── OrbitControls.js
│   ├── GLTFLoader.js
│   └── Water.js
└── utils/
    └── BufferGeometryUtils.js
```

## 🎓 Pourquoi c'est une bonne base pour la demoscene ?

### ✅ Architecture claire et modulaire
- **Système de scènes** facilement extensible
- Séparation claire entre logique audio et rendu visuel
- Code bien commenté et structuré

### ✅ Techniques professionnelles
- Utilisation d'**EffectComposer** pour le post-processing
- Gestion optimisée des performances
- Système de détection de beats robuste et adaptable

### ✅ Facile à customiser
- Ajoutez vos propres scènes en suivant le pattern `initSceneXXX()`
- Modifiez les paramètres visuels sans toucher à la logique audio
- Expérimentez avec différents effets post-processing

### ✅ Concepts clés de la demoscene
- **Synchronisation audio-visuelle** : Le cœur de toute bonne démo
- **Transitions fluides** : Entre différentes "scènes" comme dans une démo classique
- **Effets visuels impressionnants** : Bloom, glitch, particules
- **Optimisation** : Utilisation efficace de Three.js et WebGL

## 🎨 Comment ajouter votre propre scène

```javascript
function initSceneMaScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#000000");
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Ajoutez vos objets 3D ici
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    scene.userData = {
        camera: camera,
        update: (bassLevel, isBeat) => {
            // Votre logique d'animation ici
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            
            // Réaction aux beats
            if(isBeat) {
                cube.scale.setScalar(2);
            } else {
                cube.scale.setScalar(1);
            }
        }
    };
    scenes.push(scene);
}
```

## 🔧 Paramètres ajustables

Dans `main.js`, vous pouvez modifier :

```javascript
// Nombre de beats avant de changer de scène
const BEATS_PER_SCENE = 32;

// Seuil de détection des beats (ajusté automatiquement)
let beatThreshold = 255;

// Délai minimum entre deux beats (en ms)
// Exemple : (now - lastBeatTime > 250) signifie 250ms minimum entre beats
```

## 📚 Ressources pour aller plus loin

- **Three.js Documentation** : https://threejs.org/docs/
- **Demoscene** : https://www.pouet.net/
- **Shader Programming** : https://thebookofshaders.com/
- **Audio API** : https://developer.mozilla.org/fr/docs/Web/API/Web_Audio_API

## 🎯 Idées d'amélioration

- [ ] Ajouter plus de scènes (fractales, raymarching, etc.)
- [ ] Implémenter des shaders personnalisés (GLSL)
- [ ] Ajouter un système de "timeline" pour des démos scriptées
- [ ] Intégrer des modèles 3D (GLTF/GLB)
- [ ] Créer un éditeur de scènes en temps réel
- [ ] Exporter en vidéo

## 📄 Licences

Voir `licences.txt` pour les détails des bibliothèques utilisées.

## 🌟 Conclusion

Ce projet est un **excellent point de départ** pour explorer :
- La programmation 3D avec Three.js
- La synchronisation audio-visuelle
- Les effets post-processing WebGL
- La culture demoscene moderne

**N'hésitez pas à expérimenter, modifier, et créer vos propres visuels !** 🚀

La demoscene, c'est avant tout la créativité et l'expérimentation. Amusez-vous bien ! 🎉
