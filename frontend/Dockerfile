# ============================================================
# Fichier : frontend/Dockerfile
#
# Image frontend React/Vite pour l'environnement de développement.
#
# Rôle :
# ------
# - Lancer le serveur de dev Vite dans un conteneur ;
# - Permettre le hot-reload lorsque le code source change ;
# - Exposer l'app sur le port 5173.
#
# Hypothèse :
# -----------
# - Le projet React/Vite est dans le dossier frontend/ du repo,
#   avec un package.json à la racine de ce dossier.
# ============================================================

FROM node:20-alpine

WORKDIR /app

# Installation des dépendances à partir de package.json / package-lock.json
COPY package*.json ./
RUN npm install

# Copie du reste du code
COPY . /app

# Port utilisé par Vite
EXPOSE 5173

# Commande de dev : Vite avec écoute sur 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
