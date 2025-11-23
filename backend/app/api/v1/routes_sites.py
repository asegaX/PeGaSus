"""
Fichier : backend/app/api/v1/routes_sites.py

Ce module expose les endpoints liés à la table "sites".
L'implémentation est volontairement générique et repose sur
la réflexion SQLAlchemy pour éviter de définir les colonnes à la main.

NOUVEAUTÉ (Global Filters)
--------------------------
Tous les endpoints ci-dessous acceptent désormais un même jeu de filtres
(optionnels) sur la table `sites`. Ces filtres sont "globaux" :
- ils s'appliquent à /stats (donc à toutes les cartes KPI),
- ils s'appliquent aux endpoints de détail (modals),
- ils s'appliquent aux endpoints d'agrégation de graphes,
- ils serviront tels quels pour les futurs visuels.

Filtres supportés (query params)
--------------------------------
- is_under_maintenance : bool
- class               : str (alias SQL "class")
- fs                  : str
- pm_frequency        : str
- cluster             : str
- energie             : str
- has_genset          : bool
- has_solar           : bool
- statut_autonomie    : str
- tenant              : str

Pattern :
---------
- Les champs texte peuvent être passés en valeur unique ou CSV :
  ex: ?cluster=A,B,C
- Les champs booléens sont passés en true/false :
  ex: ?has_solar=true

NOUVEAUTÉ (Graphes)
-------------------
GET /api/v1/sites/energie_breakdown
    Retourne la distribution du champ `energie` AU SEIN des sites
    en maintenance (is_under_maintenance=True), en appliquant
    tous les filtres globaux additionnels.

    Ce endpoint sert au graphe bar horizontal "Énergie (maintenance)".
    Chaque barre est cliquable côté front pour ouvrir un modal listant
    les sites correspondants.

Endpoints principaux
--------------------
GET /api/v1/sites
    Retourne une liste de lignes de la table "sites".
    + Filtres globaux

GET /api/v1/sites/stats
    Retourne des indicateurs agrégés sur la table "sites"
    calculés sur le sous-ensemble filtré.

GET /api/v1/sites/distinct
    Retourne les valeurs distinctes (options) nécessaires pour construire
    les listes déroulantes du panneau de filtres.

GET /api/v1/sites/not_under_maintenance
GET /api/v1/sites/under_maintenance_with_solar
GET /api/v1/sites/under_maintenance_autonomy_not_good
GET /api/v1/sites/under_maintenance_not_in_rtmc
GET /api/v1/sites/under_maintenance_no_rms
    Endpoints de détail (modals), filtrables globalement.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.tables import get_table

router = APIRouter(prefix="/sites", tags=["sites"])


# --------------------------------------------------------------------------- #
# Helpers filtres globaux
# --------------------------------------------------------------------------- #

def split_csv(value: Optional[str]) -> Optional[List[str]]:
    """
    Convertit une chaîne CSV potentielle en liste.
    - None / "" => None
    - "A,B , C" => ["A", "B", "C"]

    Utilisé pour autoriser des filtres multi-valeurs sans complexité front.
    """
    if value is None:
        return None
    cleaned = [v.strip() for v in value.split(",") if v.strip() != ""]
    return cleaned or None


def build_global_filters(
    table,
    *,
    is_under_maintenance: Optional[bool],
    class_: Optional[str],
    fs: Optional[str],
    pm_frequency: Optional[str],
    cluster: Optional[str],
    energie: Optional[str],
    has_genset: Optional[bool],
    has_solar: Optional[bool],
    statut_autonomie: Optional[str],
    tenant: Optional[str],
) -> List[Any]:
    """
    Construit une liste de conditions SQLAlchemy à partir des filtres fournis.

    Règles :
    - Si une colonne n'existe pas dans la table reflétée => filtre ignoré.
    - Les champs texte supportent CSV => IN(...)
    - Les booléens => égalité simple.
    """
    filters: List[Any] = []

    def add_text_filter(col_name: str, raw: Optional[str]) -> None:
        if raw is None or col_name not in table.c:
            return
        values = split_csv(raw)
        col = table.c[col_name]
        if values and len(values) > 1:
            filters.append(col.in_(values))
        else:
            filters.append(col == (values[0] if values else raw))

    def add_bool_filter(col_name: str, raw: Optional[bool]) -> None:
        if raw is None or col_name not in table.c:
            return
        filters.append(table.c[col_name] == raw)  # noqa: E712

    add_bool_filter("is_under_maintenance", is_under_maintenance)
    add_text_filter("class", class_)
    add_text_filter("fs", fs)
    add_text_filter("pm_frequency", pm_frequency)
    add_text_filter("cluster", cluster)
    add_text_filter("energie", energie)
    add_bool_filter("has_genset", has_genset)
    add_bool_filter("has_solar", has_solar)
    add_text_filter("statut_autonomie", statut_autonomie)
    add_text_filter("tenant", tenant)

    return filters


def count_with_filters(
    db: Session,
    table,
    base_filters: List[Any],
    extra_filters: Optional[List[Any]] = None,
) -> int:
    """
    Compte les lignes de `table` en appliquant :
    - base_filters (filtres globaux)
    - extra_filters (critères métier propres à un KPI)

    Retourne un int.
    """
    stmt = select(func.count()).select_from(table)
    all_filters: List[Any] = []
    all_filters.extend(base_filters)
    if extra_filters:
        all_filters.extend(extra_filters)

    if all_filters:
        stmt = stmt.where(and_(*all_filters))

    return int(db.execute(stmt).scalar_one())


# --------------------------------------------------------------------------- #
# Endpoints (list / stats / distinct)
# --------------------------------------------------------------------------- #

@router.get("/", response_model=List[Dict[str, Any]])
def list_sites(
    db: Session = Depends(get_db),
    limit: int = Query(1000, ge=1, le=5000),
    offset: int = Query(0, ge=0),

    # ------------------- filtres globaux ------------------- #
    is_under_maintenance: Optional[bool] = Query(None),
    class_: Optional[str] = Query(None, alias="class"),
    fs: Optional[str] = Query(None),
    pm_frequency: Optional[str] = Query(None),
    cluster: Optional[str] = Query(None),
    energie: Optional[str] = Query(None),
    has_genset: Optional[bool] = Query(None),
    has_solar: Optional[bool] = Query(None),
    statut_autonomie: Optional[str] = Query(None),
    tenant: Optional[str] = Query(None),
) -> List[Dict[str, Any]]:
    """
    Liste les lignes de la table "sites" avec pagination simple
    et application des filtres globaux.
    """
    table = get_table("sites")
    global_filters = build_global_filters(
        table,
        is_under_maintenance=is_under_maintenance,
        class_=class_,
        fs=fs,
        pm_frequency=pm_frequency,
        cluster=cluster,
        energie=energie,
        has_genset=has_genset,
        has_solar=has_solar,
        statut_autonomie=statut_autonomie,
        tenant=tenant,
    )

    stmt = select(table)
    if global_filters:
        stmt = stmt.where(and_(*global_filters))
    stmt = stmt.offset(offset).limit(limit)

    rows = db.execute(stmt).all()
    return [dict(row._mapping) for row in rows]


@router.get("/stats", response_model=Dict[str, Any])
def sites_stats(
    db: Session = Depends(get_db),

    # ------------------- filtres globaux ------------------- #
    is_under_maintenance: Optional[bool] = Query(None),
    class_: Optional[str] = Query(None, alias="class"),
    fs: Optional[str] = Query(None),
    pm_frequency: Optional[str] = Query(None),
    cluster: Optional[str] = Query(None),
    energie: Optional[str] = Query(None),
    has_genset: Optional[bool] = Query(None),
    has_solar: Optional[bool] = Query(None),
    statut_autonomie: Optional[str] = Query(None),
    tenant: Optional[str] = Query(None),
) -> Dict[str, Any]:
    """
    Calcule les indicateurs agrégés sur la table "sites"
    en tenant compte des filtres globaux.

    L'idée est :
    1) Total = nombre de sites après filtres globaux.
    2) Chaque KPI = sous-ensemble du total filtré.
    3) Les ratios sont calculés sur ce total filtré (ou sur les sites
       en maintenance filtrés pour les ratios "among maintenance").
    """
    table = get_table("sites")

    global_filters = build_global_filters(
        table,
        is_under_maintenance=is_under_maintenance,
        class_=class_,
        fs=fs,
        pm_frequency=pm_frequency,
        cluster=cluster,
        energie=energie,
        has_genset=has_genset,
        has_solar=has_solar,
        statut_autonomie=statut_autonomie,
        tenant=tenant,
    )

    total_sites = count_with_filters(db, table, global_filters)

    under_maintenance_count = (
        count_with_filters(
            db,
            table,
            global_filters,
            extra_filters=[table.c.is_under_maintenance == True],  # noqa: E712
        )
        if "is_under_maintenance" in table.c
        else 0
    )

    under_maintenance_with_solar_count = (
        count_with_filters(
            db,
            table,
            global_filters,
            extra_filters=[
                table.c.is_under_maintenance == True,  # noqa: E712
                table.c.has_solar == True,  # noqa: E712
            ],
        )
        if "is_under_maintenance" in table.c and "has_solar" in table.c
        else 0
    )

    under_maintenance_autonomy_not_good_count = (
        count_with_filters(
            db,
            table,
            global_filters,
            extra_filters=[
                table.c.is_under_maintenance == True,  # noqa: E712
                table.c.statut_autonomie != "Bonne",
            ],
        )
        if "is_under_maintenance" in table.c and "statut_autonomie" in table.c
        else 0
    )

    under_maintenance_in_rtmc_count = (
        count_with_filters(
            db,
            table,
            global_filters,
            extra_filters=[
                table.c.is_under_maintenance == True,  # noqa: E712
                table.c.is_in_rtmc == True,  # noqa: E712
            ],
        )
        if "is_under_maintenance" in table.c and "is_in_rtmc" in table.c
        else 0
    )

    under_maintenance_with_rms_count = (
        count_with_filters(
            db,
            table,
            global_filters,
            extra_filters=[
                table.c.is_under_maintenance == True,  # noqa: E712
                table.c.teltonika.in_(["Online", "Offline"]),
            ],
        )
        if "is_under_maintenance" in table.c and "teltonika" in table.c
        else 0
    )

    under_maintenance_ratio = (
        float(under_maintenance_count) / float(total_sites)
        if total_sites else 0.0
    )
    under_maintenance_with_solar_ratio = (
        float(under_maintenance_with_solar_count) / float(total_sites)
        if total_sites else 0.0
    )
    under_maintenance_autonomy_not_good_ratio = (
        float(under_maintenance_autonomy_not_good_count) / float(total_sites)
        if total_sites else 0.0
    )
    under_maintenance_in_rtmc_ratio_among_maintenance = (
        float(under_maintenance_in_rtmc_count) / float(under_maintenance_count)
        if under_maintenance_count else 0.0
    )
    under_maintenance_with_rms_ratio_among_maintenance = (
        float(under_maintenance_with_rms_count) / float(under_maintenance_count)
        if under_maintenance_count else 0.0
    )

    return {
        "total_sites": int(total_sites),
        "under_maintenance_count": int(under_maintenance_count),
        "under_maintenance_ratio": under_maintenance_ratio,
        "under_maintenance_with_solar_count": int(under_maintenance_with_solar_count),
        "under_maintenance_with_solar_ratio": under_maintenance_with_solar_ratio,
        "under_maintenance_autonomy_not_good_count": int(under_maintenance_autonomy_not_good_count),
        "under_maintenance_autonomy_not_good_ratio": under_maintenance_autonomy_not_good_ratio,
        "under_maintenance_in_rtmc_count": int(under_maintenance_in_rtmc_count),
        "under_maintenance_in_rtmc_ratio_among_maintenance": under_maintenance_in_rtmc_ratio_among_maintenance,
        "under_maintenance_with_rms_count": int(under_maintenance_with_rms_count),
        "under_maintenance_with_rms_ratio_among_maintenance": under_maintenance_with_rms_ratio_among_maintenance,
    }


@router.get("/distinct", response_model=Dict[str, List[Any]])
def sites_distinct(
    db: Session = Depends(get_db),
) -> Dict[str, List[Any]]:
    """
    Retourne des valeurs distinctes pour alimenter les listes déroulantes
    du panneau de filtres.

    On limite volontairement le nombre de valeurs afin de garder
    un panneau réactif.
    """
    table = get_table("sites")
    fields = [
        "class",
        "fs",
        "pm_frequency",
        "cluster",
        "energie",
        "statut_autonomie",
        "tenant",
    ]

    out: Dict[str, List[Any]] = {}
    for f in fields:
        if f not in table.c:
            out[f] = []
            continue
        stmt = (
            select(table.c[f])
            .distinct()
            .where(table.c[f].isnot(None))
            .limit(500)
        )
        values = [row[0] for row in db.execute(stmt).all()]
        out[f] = [v for v in values if v not in (None, "", "—")]

    return out


# --------------------------------------------------------------------------- #
# Endpoints d'agrégation pour graphes
# --------------------------------------------------------------------------- #

@router.get("/energie_breakdown", response_model=List[Dict[str, Any]])
def energie_breakdown(
    db: Session = Depends(get_db),

    # filtres globaux (is_under_maintenance sera forcé ici)
    is_under_maintenance: Optional[bool] = Query(None),
    class_: Optional[str] = Query(None, alias="class"),
    fs: Optional[str] = Query(None),
    pm_frequency: Optional[str] = Query(None),
    cluster: Optional[str] = Query(None),
    energie: Optional[str] = Query(None),
    has_genset: Optional[bool] = Query(None),
    has_solar: Optional[bool] = Query(None),
    statut_autonomie: Optional[str] = Query(None),
    tenant: Optional[str] = Query(None),
) -> List[Dict[str, Any]]:
    """
    Distribution des énergies pour les sites EN MAINTENANCE.

    Définitions :
    - Cet agrégat correspond au graphe bar horizontal "Énergie (maintenance)".
    - La règle métier impose is_under_maintenance=True dans ce graphe.

    Application des filtres globaux :
    - On applique tous les filtres globaux SAUF is_under_maintenance
      (qui est forcé à True pour garantir la cohérence du graphe,
       même si l'utilisateur met "Tous" ou "Non" dans le panneau).

    Retour :
    - Liste d'objets { energie: str, count: int }, triés décroissants.
    """
    table = get_table("sites")
    if "energie" not in table.c or "is_under_maintenance" not in table.c:
        return []

    # IMPORTANT: on ignore is_under_maintenance global ici
    global_filters = build_global_filters(
        table,
        is_under_maintenance=None,  # forcé à True plus bas
        class_=class_,
        fs=fs,
        pm_frequency=pm_frequency,
        cluster=cluster,
        energie=energie,
        has_genset=has_genset,
        has_solar=has_solar,
        statut_autonomie=statut_autonomie,
        tenant=tenant,
    )

    stmt = (
        select(
            table.c.energie.label("energie"),
            func.count().label("count"),
        )
        .select_from(table)
        .where(
            and_(
                table.c.is_under_maintenance == True,  # noqa: E712
                table.c.energie.isnot(None),
                *global_filters,
            )
        )
        .group_by(table.c.energie)
        .order_by(func.count().desc())
        .limit(500)
    )

    rows = db.execute(stmt).all()
    out: List[Dict[str, Any]] = []
    for r in rows:
        if r.energie in (None, "", "—"):
            continue
        out.append({"energie": r.energie, "count": int(r.count)})

    return out


# --------------------------------------------------------------------------- #
# Endpoints détail (modals)
# --------------------------------------------------------------------------- #

@router.get("/not_under_maintenance", response_model=List[Dict[str, Any]])
def list_sites_not_under_maintenance(
    db: Session = Depends(get_db),
    limit: int = Query(1000, ge=1, le=5000),
    offset: int = Query(0, ge=0),

    # filtres globaux
    is_under_maintenance: Optional[bool] = Query(None),
    class_: Optional[str] = Query(None, alias="class"),
    fs: Optional[str] = Query(None),
    pm_frequency: Optional[str] = Query(None),
    cluster: Optional[str] = Query(None),
    energie: Optional[str] = Query(None),
    has_genset: Optional[bool] = Query(None),
    has_solar: Optional[bool] = Query(None),
    statut_autonomie: Optional[str] = Query(None),
    tenant: Optional[str] = Query(None),
) -> List[Dict[str, Any]]:
    """
    Sites pour lesquels `is_under_maintenance = False`
    + filtres globaux additionnels.
    """
    table = get_table("sites")
    if "is_under_maintenance" not in table.c:
        return []

    global_filters = build_global_filters(
        table,
        is_under_maintenance=is_under_maintenance,
        class_=class_,
        fs=fs,
        pm_frequency=pm_frequency,
        cluster=cluster,
        energie=energie,
        has_genset=has_genset,
        has_solar=has_solar,
        statut_autonomie=statut_autonomie,
        tenant=tenant,
    )

    stmt = (
        select(table)
        .where(
            and_(
                table.c.is_under_maintenance == False,  # noqa: E712
                *global_filters,
            )
        )
        .offset(offset)
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    return [dict(row._mapping) for row in rows]


@router.get("/under_maintenance_with_solar", response_model=List[Dict[str, Any]])
def list_sites_under_maintenance_with_solar(
    db: Session = Depends(get_db),
    limit: int = Query(1000, ge=1, le=5000),
    offset: int = Query(0, ge=0),

    # filtres globaux
    is_under_maintenance: Optional[bool] = Query(None),
    class_: Optional[str] = Query(None, alias="class"),
    fs: Optional[str] = Query(None),
    pm_frequency: Optional[str] = Query(None),
    cluster: Optional[str] = Query(None),
    energie: Optional[str] = Query(None),
    has_genset: Optional[bool] = Query(None),
    has_solar: Optional[bool] = Query(None),
    statut_autonomie: Optional[str] = Query(None),
    tenant: Optional[str] = Query(None),
) -> List[Dict[str, Any]]:
    """
    Sites :
    - is_under_maintenance = True
    - has_solar = True
    + filtres globaux additionnels.
    """
    table = get_table("sites")
    if "is_under_maintenance" not in table.c or "has_solar" not in table.c:
        return []

    global_filters = build_global_filters(
        table,
        is_under_maintenance=is_under_maintenance,
        class_=class_,
        fs=fs,
        pm_frequency=pm_frequency,
        cluster=cluster,
        energie=energie,
        has_genset=has_genset,
        has_solar=has_solar,
        statut_autonomie=statut_autonomie,
        tenant=tenant,
    )

    stmt = (
        select(table)
        .where(
            and_(
                table.c.is_under_maintenance == True,  # noqa: E712
                table.c.has_solar == True,  # noqa: E712
                *global_filters,
            )
        )
        .offset(offset)
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    return [dict(row._mapping) for row in rows]


@router.get("/under_maintenance_autonomy_not_good", response_model=List[Dict[str, Any]])
def list_sites_under_maintenance_autonomy_not_good(
    db: Session = Depends(get_db),
    limit: int = Query(1000, ge=1, le=5000),
    offset: int = Query(0, ge=0),

    # filtres globaux
    is_under_maintenance: Optional[bool] = Query(None),
    class_: Optional[str] = Query(None, alias="class"),
    fs: Optional[str] = Query(None),
    pm_frequency: Optional[str] = Query(None),
    cluster: Optional[str] = Query(None),
    energie: Optional[str] = Query(None),
    has_genset: Optional[bool] = Query(None),
    has_solar: Optional[bool] = Query(None),
    statut_autonomie: Optional[str] = Query(None),
    tenant: Optional[str] = Query(None),
) -> List[Dict[str, Any]]:
    """
    Sites :
    - is_under_maintenance = True
    - statut_autonomie != "Bonne"
    + filtres globaux additionnels.
    """
    table = get_table("sites")
    if "is_under_maintenance" not in table.c or "statut_autonomie" not in table.c:
        return []

    global_filters = build_global_filters(
        table,
        is_under_maintenance=is_under_maintenance,
        class_=class_,
        fs=fs,
        pm_frequency=pm_frequency,
        cluster=cluster,
        energie=energie,
        has_genset=has_genset,
        has_solar=has_solar,
        statut_autonomie=statut_autonomie,
        tenant=tenant,
    )

    stmt = (
        select(table)
        .where(
            and_(
                table.c.is_under_maintenance == True,  # noqa: E712
                table.c.statut_autonomie != "Bonne",
                *global_filters,
            )
        )
        .offset(offset)
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    return [dict(row._mapping) for row in rows]


@router.get("/under_maintenance_not_in_rtmc", response_model=List[Dict[str, Any]])
def list_sites_under_maintenance_not_in_rtmc(
    db: Session = Depends(get_db),
    limit: int = Query(1000, ge=1, le=5000),
    offset: int = Query(0, ge=0),

    # filtres globaux
    is_under_maintenance: Optional[bool] = Query(None),
    class_: Optional[str] = Query(None, alias="class"),
    fs: Optional[str] = Query(None),
    pm_frequency: Optional[str] = Query(None),
    cluster: Optional[str] = Query(None),
    energie: Optional[str] = Query(None),
    has_genset: Optional[bool] = Query(None),
    has_solar: Optional[bool] = Query(None),
    statut_autonomie: Optional[str] = Query(None),
    tenant: Optional[str] = Query(None),
) -> List[Dict[str, Any]]:
    """
    Sites :
    - is_under_maintenance = True
    - is_in_rtmc = False
    + filtres globaux additionnels.
    """
    table = get_table("sites")
    if "is_under_maintenance" not in table.c or "is_in_rtmc" not in table.c:
        return []

    global_filters = build_global_filters(
        table,
        is_under_maintenance=is_under_maintenance,
        class_=class_,
        fs=fs,
        pm_frequency=pm_frequency,
        cluster=cluster,
        energie=energie,
        has_genset=has_genset,
        has_solar=has_solar,
        statut_autonomie=statut_autonomie,
        tenant=tenant,
    )

    stmt = (
        select(table)
        .where(
            and_(
                table.c.is_under_maintenance == True,  # noqa: E712
                table.c.is_in_rtmc == False,  # noqa: E712
                *global_filters,
            )
        )
        .offset(offset)
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    return [dict(row._mapping) for row in rows]


@router.get("/under_maintenance_no_rms", response_model=List[Dict[str, Any]])
def list_sites_under_maintenance_no_rms(
    db: Session = Depends(get_db),
    limit: int = Query(1000, ge=1, le=5000),
    offset: int = Query(0, ge=0),

    # filtres globaux
    is_under_maintenance: Optional[bool] = Query(None),
    class_: Optional[str] = Query(None, alias="class"),
    fs: Optional[str] = Query(None),
    pm_frequency: Optional[str] = Query(None),
    cluster: Optional[str] = Query(None),
    energie: Optional[str] = Query(None),
    has_genset: Optional[bool] = Query(None),
    has_solar: Optional[bool] = Query(None),
    statut_autonomie: Optional[str] = Query(None),
    tenant: Optional[str] = Query(None),
) -> List[Dict[str, Any]]:
    """
    Sites :
    - is_under_maintenance = True
    - teltonika = "Pas de rms"
    + filtres globaux additionnels.
    """
    table = get_table("sites")
    if "is_under_maintenance" not in table.c or "teltonika" not in table.c:
        return []

    global_filters = build_global_filters(
        table,
        is_under_maintenance=is_under_maintenance,
        class_=class_,
        fs=fs,
        pm_frequency=pm_frequency,
        cluster=cluster,
        energie=energie,
        has_genset=has_genset,
        has_solar=has_solar,
        statut_autonomie=statut_autonomie,
        tenant=tenant,
    )

    stmt = (
        select(table)
        .where(
            and_(
                table.c.is_under_maintenance == True,  # noqa: E712
                table.c.teltonika == "Pas de rms",
                *global_filters,
            )
        )
        .offset(offset)
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    return [dict(row._mapping) for row in rows]
