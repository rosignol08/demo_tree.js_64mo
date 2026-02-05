# ============================================================================
# DEMO THREE.JS - Makefile
# ============================================================================
# 
# Ce projet est une DÉMO DEMOSCENE en Three.js - une excellente base pour
# débuter dans la création de démos audiovisuelles interactives !
#
# QU'EST-CE QU'UNE DÉMO DEMOSCENE ?
# ----------------------------------
# La demoscene est une sous-culture artistique de programmation créative où
# l'on crée des animations visuelles synchronisées avec de la musique, en
# temps réel. C'est l'art de combiner code, design et musique pour créer
# des expériences audiovisuelles impressionnantes.
#
# POURQUOI CE PROJET EST UNE BONNE BASE ?
# ----------------------------------------
# ✓ Utilise Three.js (bibliothèque WebGL moderne et accessible)
# ✓ Inclut des effets post-processing (bloom, glitch)
# ✓ Système de synchronisation audio (analyse FFT, détection de beats)
# ✓ Gestion de scènes multiples avec transitions
# ✓ Drag & drop de fichiers audio MP3
# ✓ Structure claire et modulaire
# ✓ Pas besoin de build complexe - juste un serveur HTTP !
#
# POUR COMMENCER :
# ----------------
# 1. Lance un serveur local : make serve
# 2. Ouvre ton navigateur sur http://localhost:8000
# 3. Glisse un fichier MP3 sur la page
# 4. Édite js/main.js pour créer tes propres effets visuels !
#
# RESSOURCES POUR APPRENDRE :
# ----------------------------
# - Three.js documentation : https://threejs.org/docs/
# - Shadertoy (pour les shaders) : https://www.shadertoy.com/
# - Demoscene : https://www.pouet.net/
# - WebGL et audio : https://web.dev/webaudio-intro/
#
# ============================================================================

# Variables de configuration
PORT ?= 8000
BROWSER ?= firefox

.PHONY: help serve open clean info check

# Cible par défaut : affiche l'aide
help:
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║     DEMO THREE.JS - Starter Kit pour la Demoscene             ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "Ce projet est une base pour créer des démos audiovisuelles"
	@echo "synchronisées avec de la musique, en utilisant Three.js et WebGL."
	@echo ""
	@echo "📋 Commandes disponibles:"
	@echo ""
	@echo "  make serve    - Lance un serveur HTTP local sur le port $(PORT)"
	@echo "  make open     - Ouvre le projet dans ton navigateur"
	@echo "  make dev      - Lance le serveur ET ouvre le navigateur"
	@echo "  make check    - Vérifie que les fichiers nécessaires existent"
	@echo "  make info     - Affiche des informations sur le projet"
	@echo "  make clean    - Nettoie les fichiers temporaires"
	@echo "  make help     - Affiche cette aide"
	@echo ""
	@echo "🚀 Pour démarrer rapidement:"
	@echo "  $$ make dev"
	@echo ""
	@echo "📝 Ensuite, glisse un fichier MP3 sur la page web pour démarrer!"
	@echo ""

# Lance un serveur HTTP simple
serve:
	@echo "🌐 Lancement du serveur HTTP sur http://localhost:$(PORT)"
	@echo "📁 Répertoire: $$(pwd)"
	@echo "⏹️  Appuie sur Ctrl+C pour arrêter"
	@echo ""
	@python3 -m http.server $(PORT) 2>/dev/null || python -m SimpleHTTPServer $(PORT)

# Ouvre le navigateur
open:
	@echo "🌐 Ouverture dans le navigateur..."
	@command -v xdg-open > /dev/null && xdg-open http://localhost:$(PORT) || \
	 command -v open > /dev/null && open http://localhost:$(PORT) || \
	 echo "⚠️  Ouvre manuellement http://localhost:$(PORT) dans ton navigateur"

# Lance le serveur en arrière-plan et ouvre le navigateur
dev:
	@echo "🚀 Lancement du mode développement..."
	@echo ""
	@make info
	@echo ""
	@(python3 -m http.server $(PORT) 2>/dev/null || python -m SimpleHTTPServer $(PORT)) & \
	sleep 2 && make open
	@echo ""
	@echo "✨ Le serveur tourne en arrière-plan. Pour l'arrêter:"
	@echo "   $$ killall python3   (ou ferme ce terminal)"

# Vérifie les fichiers requis
check:
	@echo "🔍 Vérification des fichiers du projet..."
	@echo ""
	@test -f index.html && echo "✓ index.html" || echo "✗ index.html MANQUANT"
	@test -f js/main.js && echo "✓ js/main.js" || echo "✗ js/main.js MANQUANT"
	@test -f js/three.module.min.js && echo "✓ js/three.module.min.js" || echo "✗ js/three.module.min.js MANQUANT"
	@test -f licences.txt && echo "✓ licences.txt" || echo "✗ licences.txt MANQUANT"
	@echo ""
	@echo "✅ Vérification terminée"

# Affiche des informations sur le projet
info:
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║              À PROPOS DE CE PROJET DEMOSCENE                   ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "📦 Technologies utilisées:"
	@echo "   • Three.js - Rendu 3D WebGL"
	@echo "   • EffectComposer - Post-processing (bloom, glitch)"
	@echo "   • Web Audio API - Analyse audio en temps réel"
	@echo "   • OrbitControls - Navigation 3D"
	@echo "   • GLTF Loader - Import de modèles 3D"
	@echo ""
	@echo "🎨 Caractéristiques:"
	@echo "   • Synchronisation audio-visuelle"
	@echo "   • Détection de beats automatique"
	@echo "   • Système de scènes multiples"
	@echo "   • Effets visuels (bloom, glitch)"
	@echo "   • Drag & drop de fichiers MP3"
	@echo ""
	@echo "🎯 Idéal pour apprendre:"
	@echo "   • La création de démos audiovisuelles"
	@echo "   • La programmation WebGL avec Three.js"
	@echo "   • La synchronisation audio-visuelle"
	@echo "   • Les effets de post-processing"
	@echo ""
	@echo "📚 Pour aller plus loin:"
	@echo "   • Modifie js/main.js pour créer tes propres scènes"
	@echo "   • Ajoute des shaders custom"
	@echo "   • Importe tes propres modèles 3D"
	@echo "   • Expérimente avec les paramètres d'effets"
	@echo ""

# Nettoie les fichiers temporaires
clean:
	@echo "🧹 Nettoyage des fichiers temporaires..."
	@find . -name "*.pyc" -delete 2>/dev/null || true
	@find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".DS_Store" -delete 2>/dev/null || true
	@find . -name "Thumbs.db" -delete 2>/dev/null || true
	@echo "✨ Nettoyage terminé!"
