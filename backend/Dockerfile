# ============================================================
# Fichier : backend/Dockerfile
#
# Image backend FastAPI pour l'environnement de développement.
#
# Rôle :
# ------
# - Fournir un conteneur léger, basé sur Python slim ;
# - Installer les dépendances backend ;
# - Exposer l'API FastAPI via Uvicorn ;
# - Activer le --reload pour un cycle de dev fluide.
#
# Hypothèses :
# ------------
# - Le code se trouve dans le répertoire backend/ du repo ;
# - L'application FastAPI est exposée en tant que "app" dans app/main.py
#   (chemin Python : app.main:app) ;
# - Les dépendances sont décrites dans requirements.txt ;
#   (si tu utilises Poetry ou un autre outil, adapte la section "Install deps").
# ============================================================

FROM python:3.11-slim AS base

# Répertoires et options Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Dépendances système minimales (compilation de certaines libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
  && rm -rf /var/lib/apt/lists/*

# -------------------------
# Installation des dépendances
# -------------------------
# Si tu as un requirements.txt dans backend/, copie-le puis installe.
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Si tu utilises Poetry, commente le bloc ci-dessus et utilise plutôt :
# COPY pyproject.toml poetry.lock ./ 
# RUN pip install --no-cache-dir poetry \
#   && poetry config virtualenvs.create false \
#   && poetry install --no-interaction --no-ansi

# -------------------------
# Copie du code applicatif
# -------------------------
COPY . /app

# -------------------------
# Commande de lancement (dev)
# -------------------------
# En dev, on garde --reload pour auto-reload à chaque changement.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
