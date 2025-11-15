"""
Fichier : backend/app/db/session.py

Ce module gère :
- la création de l'engine SQLAlchemy connecté à PostgreSQL ;
- la fabrique de sessions (SessionLocal) utilisée dans les endpoints FastAPI.

Il représente la couche d'accès à la base de données, centralisée
et réutilisable dans d'autres projets.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

# Engine SQLAlchemy :
# pool_pre_ping permet de vérifier que les connexions sont encore valides.
# NOTE IMPORTANTE :
# settings.DATABASE_URL est de type PostgresDsn (objet Pydantic).
# On le convertit explicitement en str pour le passer à SQLAlchemy.
engine = create_engine(
    str(settings.DATABASE_URL),
    pool_pre_ping=True,
)

# Fabrique de sessions. Chaque requête FastAPI utilisera
# une instance de cette SessionLocal.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """
    Dépendance FastAPI pour obtenir une session de base de données.

    Cette fonction est utilisée avec `Depends` dans les endpoints.
    Elle garantit que la session est correctement fermée
    après le traitement de la requête.

    Yields
    ------
    Session
        Instance de session SQLAlchemy liée à la requête courante.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
