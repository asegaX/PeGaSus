"""
Fichier : backend/app/db/tables.py

Ce module fournit des utilitaires pour travailler avec les tables
déjà existantes dans la base Pegasus, sans définir explicitement
des modèles ORM.

On utilise la "réflexion" SQLAlchemy pour charger dynamiquement
les métadonnées des tables (colonnes, types, etc.).

Avantage :
- idéal quand le schéma existe déjà (cas d'une base legacy) ;
- permet de créer rapidement une API générique.

Limite :
- pas de typage fort avec des modèles Pydantic par table ;
- il faudra introduire des modèles explicites si l'on veut
  un contrat de données plus strict.
"""

from functools import lru_cache
from typing import Dict

from sqlalchemy import MetaData, Table

from app.db.session import engine

# MetaData global partagé pour toutes les tables.
metadata = MetaData()


@lru_cache(maxsize=32)
def get_table(table_name: str) -> Table:
    """
    Retourne un objet Table SQLAlchemy correspondant au nom fourni.

    La fonction utilise un cache (lru_cache) pour éviter de recharger
    les métadonnées à chaque appel, ce qui améliore les performances.

    Paramètres
    ----------
    table_name : str
        Nom de la table dans la base PostgreSQL (par ex. "sites").

    Returns
    -------
    Table
        Objet Table SQLAlchemy représentant la table.
    """
    # autoload_with=engine déclenche la réflexion des métadonnées.
    table = Table(table_name, metadata, autoload_with=engine)
    return table


def list_supported_tables() -> Dict[str, Table]:
    """
    Retourne un dictionnaire des tables supportées par l'API.

    Pour l'instant, on se limite aux tables suivantes :
    - sites
    - trb
    - pmwo
    - swo

    Returns
    -------
    Dict[str, Table]
        Dictionnaire {nom_table: Table}.
    """
    table_names = ["sites", "trb", "pmwo", "swo"]
    return {name: get_table(name) for name in table_names}
