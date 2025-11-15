"""
Fichier : backend/app/main.py

Point d'entrée principal de l'application FastAPI.

Ce module :
- instancie l'application FastAPI ;
- configure les métadonnées (titre, version) ;
- enregistre les routes de l'API v1 (sites, trb, pmwo, swo) ;
- expose un endpoint racine simple pour vérifier que le service est en ligne.
"""

from fastapi import FastAPI

from app.core.config import settings
from app.api.v1 import routes_sites, routes_trb, routes_pmwo, routes_swo

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    description="API de gestion des infrastructures passives (Pegasus).",
)


@app.get("/", tags=["health"])
def read_root() -> dict:
    """
    Endpoint racine permettant de vérifier que l'API répond.

    Returns
    -------
    dict
        Message simple indiquant que le service est opérationnel.
    """
    return {"status": "ok", "message": "Pegasus Passive Infra API running"}


# Inclusion des routes v1
app.include_router(routes_sites.router, prefix="/api/v1")
app.include_router(routes_trb.router, prefix="/api/v1")
app.include_router(routes_pmwo.router, prefix="/api/v1")
app.include_router(routes_swo.router, prefix="/api/v1")
