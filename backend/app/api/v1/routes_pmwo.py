"""
Fichier : backend/app/api/v1/routes_pmwo.py

Endpoints pour la table "pmwo".
"""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.tables import get_table

router = APIRouter(prefix="/pmwo", tags=["pmwo"])


@router.get("/", response_model=List[Dict[str, Any]])
def list_pmwo(
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=10000),
    offset: int = Query(0, ge=0),
) -> List[Dict[str, Any]]:
    """
    Liste les lignes de la table "pmwo" avec pagination simple.
    """
    table = get_table("pmwo")
    stmt = select(table).offset(offset).limit(limit)
    rows = db.execute(stmt).all()
    return [dict(row._mapping) for row in rows]
