"""
Fichier : backend/app/api/v1/routes_sites.py

Ce module expose les endpoints liés à la table "sites".
L'implémentation est volontairement générique et repose sur
la réflexion SQLAlchemy pour éviter de définir les colonnes à la main.

Endpoint principal
------------------
GET /api/v1/sites
    Retourne une liste de lignes de la table "sites"
    sous forme de dictionnaires {colonne: valeur}.
"""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.tables import get_table

router = APIRouter(prefix="/sites", tags=["sites"])


@router.get("/", response_model=List[Dict[str, Any]])
def list_sites(
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=1000, description="Nombre maximum de lignes à retourner"),
    offset: int = Query(0, ge=0, description="Décalage pour la pagination"),
) -> List[Dict[str, Any]]:
    """
    Liste les lignes de la table "sites" avec pagination simple.

    Paramètres
    ----------
    db : Session
        Session SQLAlchemy injectée par FastAPI.
    limit : int
        Nombre de lignes maximum à retourner.
    offset : int
        Décalage (nombre de lignes à ignorer) pour la pagination.

    Returns
    -------
    List[Dict[str, Any]]
        Liste de lignes, chacune représentée par un dictionnaire
        {nom_colonne: valeur}.
    """
    table = get_table("sites")
    stmt = select(table).offset(offset).limit(limit)
    rows = db.execute(stmt).all()
    # row._mapping permet d'accéder à un mapping nom_colonne -> valeur.
    return [dict(row._mapping) for row in rows]
