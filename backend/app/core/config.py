"""
Fichier : backend/app/core/config.py

Ce module centralise la configuration de l'application backend.
On y définit principalement les paramètres liés à la base de données,
chargés à partir des variables d'environnement.

L'objectif est de :
- éviter de hardcoder des secrets ou URLs dans le code source ;
- faciliter le changement d'environnement (dev, staging, prod) ;
- rendre ce module réutilisable dans d'autres projets FastAPI.
"""
from pydantic_settings import BaseSettings
from pydantic import Field, PostgresDsn


class Settings(BaseSettings):
    """
    Classe de configuration de l'application.

    Hérite de BaseSettings pour permettre le chargement
    automatique des valeurs depuis les variables d'environnement
    ou un fichier .env.

    Attributs
    ---------
    PROJECT_NAME : str
        Nom du projet, utilisé par exemple dans la documentation Swagger.
    DATABASE_URL : PostgresDsn
        URL de connexion PostgreSQL au format DSN, par ex :
        postgresql://user:password@host:port/database
    """

    PROJECT_NAME: str = "Pegasus Passive Infra API"
    DATABASE_URL: PostgresDsn = Field(..., description="URL de connexion PostgreSQL")

    class Config:
        """
        Configuration interne de Pydantic.

        - env_file : nom du fichier .env à charger automatiquement.
        - env_file_encoding : encodage du fichier .env.
        """

        env_file = ".env"
        env_file_encoding = "utf-8"


# Instance unique de configuration pour l'ensemble de l'application.
settings = Settings()
