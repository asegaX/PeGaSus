"""
Fichier : backend/app/api/deps.py

Ce module regroupe les dépendances partagées des routes FastAPI.

Pour l'instant, il ré-exporte simplement get_db, mais il est déjà prêt
à accueillir d'autres dépendances (authentification, permissions, etc.).
"""

from app.db.session import get_db

__all__ = ["get_db"]
