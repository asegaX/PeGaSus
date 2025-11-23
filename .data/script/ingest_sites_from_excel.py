#!/usr/bin/env python3
"""
Ingestion de Site.xlsx -> PostgreSQL (DB: pegasus, table: public.sites)

Points clés:
- Normalisation des colonnes (snake_case ASCII) + mapping surchargeable.
- Conversions robustes (bool, int/float avec virgule, interval/Timedelta).
- Upsert idempotent (ON CONFLICT sur hts_site_id) par lots.
- Détection automatique des colonnes GENERATEES et exclusion des INSERT/UPDATE.
- Création de schéma "best effort": PostGIS; index texte trigram si pg_trgm dispo, sinon fallback.

Dépendances:
  pip install pandas openpyxl psycopg2-binary python-dotenv numpy
Variables d'env:
  PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
"""

from __future__ import annotations

import os, re, json, math, argparse, unicodedata
from typing import Any, Dict, List, Optional, Sequence, Set, cast
import numpy as np
from datetime import timedelta
from dotenv import load_dotenv

import pandas as pd
import psycopg2
import psycopg2.extras as pgx  # execute_values

load_dotenv()  # charge .env si présent

# --------- Paramètres & constantes ---------
COL_MAP_DEFAULT: Dict[str,str] = {}  # surcharge possible via --colmap

REQUIRED_NOT_NULL: List[str] = [
    "hts_site_id","site_id","site_name","class","ert","ert_sec","latitude","longitude","province",
    "is_under_maintenance","pm_frequency","pm_cluster","cm_cluster","fe_pm1","fs","zm","zone",
    "has_genset","energie","rut","teltonika","spa","is_in_rtmc","type","typologie","type_pylone",
    "tower_height","dependency_count","is_colocation","tenant_count","tenant","b2b","numero_compteur",
    "type_redresseur","nbre_module","module1","module2","has_solar","has_surge_protector","etat_parafoudre"
]

ALL_COLUMNS: List[str] = [
    "hts_site_id","site_id","site_name","class","ert","ert_sec","latitude","longitude","province",
    "is_under_maintenance","pm_frequency","pm_cluster","cm_cluster","fe_pm1","fe_pm2","fe_cm1","fe_cm2",
    "fs","zm","zone","has_genset","genset_brand","genset_serial_number","genset_capacity","genset_description",
    "engine_brand","engine_serial_number","carte_controlle","tank_capacity","genset_battery","filtre_huile",
    "filtre_carburant","filtre_air","energie","rut","teltonika","spa","is_in_rtmc","type","typologie",
    "type_pylone","tower_height","dependency_count","is_colocation","tenant_count","tenant","b2b",
    "numero_compteur","baco_porte_fusible","type_baco_porte_fusible","fuse_rating","rbs_breaker_rating",
    "type_redresseur","nbre_module","module1","module2","module3","module4","module5","module6","module9",
    "rectifier_power","type_batterie","marque_batterie","tension_batterie","capacite_indiv_batt",
    "capacite_totale_batt","battery_count","charge_current","statut_autonomie","has_solar","panel_count",
    "type_panneau","puissance_panneau","nbre_string","nbre_panneau_par_strign","puiss_total_panneau",
    "type_module_solaire","nbre_module_solaire","puiss_module_solaire","puiss_totale_module_solaire",
    "has_surge_protector","etat_parafoudre","geom","ert_interval","ert_seconds"
]

BOOL_TRUE = {"true","t","1","yes","y","oui","o","vrai"}
BOOL_FALSE = {"false","f","0","no","n","non","faux"}

# --------- Utilitaires ---------
def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", str(name))
    s = s.encode("ascii","ignore").decode("ascii").lower()
    s = re.sub(r"[^a-z0-9]+","_", s)
    s = re.sub(r"_+","_", s).strip("_")
    return s

def load_mapping(path: Optional[str]) -> Dict[str,str]:
    if path:
        with open(path, "r", encoding="utf-8") as f:
            return cast(Dict[str,str], json.load(f))
    return COL_MAP_DEFAULT

def to_bool(x: Any) -> Optional[bool]:
    if x is None or (isinstance(x, float) and math.isnan(x)): return None
    s = str(x).strip().lower()
    if s in BOOL_TRUE: return True
    if s in BOOL_FALSE: return False
    raise ValueError(f"Valeur booléenne invalide: {x!r}")

def to_int(x: Any) -> Optional[int]:
    if x is None or (isinstance(x, float) and math.isnan(x)): return None
    if isinstance(x, bool): return 1 if x else 0
    s = str(x).strip().lower()
    if s in BOOL_TRUE: return 1
    if s in BOOL_FALSE: return 0
    return int(float(s.replace(",", ".")))

def to_float(x: Any) -> Optional[float]:
    if x is None or (isinstance(x, float) and math.isnan(x)): return None
    if isinstance(x, bool): return 1.0 if x else 0.0
    s = str(x).strip().lower().replace(",", ".")
    if s in BOOL_TRUE: return 1.0
    if s in BOOL_FALSE: return 0.0
    return float(s)

def to_interval(s: Any) -> Optional[str]:
    """Retourne un 'interval' PostgreSQL robuste (ex: '01:30:00' ou '3600 seconds')."""
    if s is None or (isinstance(s, float) and math.isnan(s)): return None
    if hasattr(pd, "Timedelta") and isinstance(s, pd.Timedelta):
        return f"{int(s.total_seconds())} seconds"
    if isinstance(s, timedelta):
        return f"{int(s.total_seconds())} seconds"
    if isinstance(s, np.timedelta64):
        td = pd.to_timedelta(s); return f"{int(td.total_seconds())} seconds"
    t_raw = str(s).strip(); t = t_raw.lower()
    m_td = re.fullmatch(r"Timedelta\('(.+)'\)", t_raw)
    if m_td:
        td = pd.to_timedelta(m_td.group(1)); return f"{int(td.total_seconds())} seconds"
    if t.startswith("pt"):
        hours = minutes = seconds = 0.0
        for val, unit in re.findall(r"(\d+(?:[.,]\d+)?)([hms])", t[2:]):
            v = float(val.replace(",", "."))
            if unit == "h": hours += v
            elif unit == "m": minutes += v
            else: seconds += v
        return f"{int(hours*3600 + minutes*60 + seconds)} seconds"
    if re.fullmatch(r"\d+(?:[.,]\d+)?h", t):
        return f"{int(float(t[:-1].replace(',','.'))*3600)} seconds"
    if re.fullmatch(r"\d+(?:[.,]\d+)?m", t):
        return f"{int(float(t[:-1].replace(',','.'))*60)} seconds"
    if re.fullmatch(r"\d+(?:[.,]\d+)?s", t):
        return f"{int(float(t[:-1].replace(',','.')))} seconds"
    if re.fullmatch(r"\d{1,2}:\d{2}:\d{2}", t): return t
    if re.fullmatch(r"\d{1,2}:\d{2}", t):
        mm, ss = t.split(":"); return f"00:{int(mm):02d}:{int(ss):02d}"
    if re.fullmatch(r"\d+(?:[.,]\d+)?", t):
        return f"{int(float(t.replace(',','.')))} seconds"
    raise ValueError(f"Intervalle invalide: {s!r}")

def compute_ert_seconds(row: pd.Series) -> Optional[int]:
    ert = row.get("ert")
    if ert is None or (isinstance(ert,float) and math.isnan(ert)): return None
    s = str(ert).lower()
    m = re.fullmatch(r"(\d+) seconds", s)
    if m: return int(m.group(1))
    if re.fullmatch(r"\d{1,2}:\d{2}:\d{2}", s):
        h, m_, sec = [int(x) for x in s.split(":")]
        return h*3600 + m_*60 + sec
    return None

def quote_ident(name: str) -> str:
    if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name or ""): return name
    return '"' + name.replace('"','""') + '"'

# --------- Schéma & DDL (création tolérante) ---------
def _supports_generated_columns(cur) -> bool:
    cur.execute("SHOW server_version_num;")
    ver = int(cur.fetchone()[0])  # ex: 160004
    return ver >= 120000

def ensure_schema(cur, ensure_schema: bool) -> None:
    if not ensure_schema: return

    # Extensions best-effort
    try:
        cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    except Exception as e:
        print(f"[WARN] postgis indisponible ({e}) — on continue.")

    cur.execute("""
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema=%s AND table_name=%s
        )
    """, ("public", "sites"))
    (exists,) = cur.fetchone()
    if exists: return

    use_generated = _supports_generated_columns(cur)

    ddl_table = f"""
    CREATE TABLE public.sites(
        hts_site_id varchar(8) NOT NULL,
        site_id varchar(6) NOT NULL,
        site_name varchar(64) NOT NULL,
        class varchar(32) NOT NULL,
        ert interval NOT NULL,
        ert_sec integer NOT NULL,
        latitude double precision NOT NULL,
        longitude double precision NOT NULL,
        province varchar(64) NOT NULL,
        is_under_maintenance boolean NOT NULL,
        pm_frequency varchar(16) NOT NULL,
        pm_cluster varchar(64) NOT NULL,
        cm_cluster varchar(64) NOT NULL,
        fe_pm1 varchar(64) NOT NULL,
        fe_pm2 varchar(64),
        fe_cm1 varchar(64) NOT NULL,
        fe_cm2 varchar(64),
        fs varchar(64) NOT NULL,
        zm varchar(64) NOT NULL,
        zone varchar(8) NOT NULL,
        has_genset boolean NOT NULL,
        genset_brand varchar(32),
        genset_serial_number varchar(32),
        genset_capacity varchar(8),
        genset_description varchar(32),
        engine_brand varchar(32),
        engine_serial_number varchar(32),
        carte_controlle varchar(32),
        tank_capacity double precision,
        genset_battery varchar(32),
        filtre_huile varchar(16),
        filtre_carburant varchar(16),
        filtre_air varchar(16),
        energie varchar(24) NOT NULL,
        rut varchar(16) NOT NULL,
        teltonika varchar(16) NOT NULL,
        spa integer NOT NULL,
        is_in_rtmc boolean NOT NULL,
        "type" varchar(16) NOT NULL,
        typologie varchar(16) NOT NULL,
        type_pylone varchar(32) NOT NULL,
        tower_height integer NOT NULL,
        dependency_count integer NOT NULL,
        is_colocation boolean NOT NULL,
        tenant_count integer NOT NULL,
        tenant varchar(64) NOT NULL,
        b2b integer NOT NULL,
        numero_compteur varchar(32) NOT NULL,
        baco_porte_fusible varchar(32),
        type_baco_porte_fusible varchar(32),
        fuse_rating double precision,
        rbs_breaker_rating double precision,
        type_redresseur varchar(32) NOT NULL,
        nbre_module varchar(100) NOT NULL,
        module1 varchar(32) NOT NULL,
        module2 varchar(32) NOT NULL,
        module3 varchar(32),
        module4 varchar(32),
        module5 varchar(32),
        module6 varchar(32),
        module9 varchar(32),
        rectifier_power double precision,
        type_batterie varchar(32),
        marque_batterie varchar(32),
        tension_batterie varchar(6),
        capacite_indiv_batt varchar(8),
        capacite_totale_batt varchar(8),
        battery_count double precision,
        charge_current double precision,
        statut_autonomie varchar(32),
        has_solar boolean NOT NULL,
        panel_count double precision,
        type_panneau varchar(32),
        puissance_panneau double precision,
        nbre_string double precision,
        nbre_panneau_par_strign double precision,
        puiss_total_panneau double precision,
        type_module_solaire varchar(32),
        nbre_module_solaire double precision,
        puiss_module_solaire double precision,
        puiss_totale_module_solaire double precision,
        has_surge_protector boolean NOT NULL,
        etat_parafoudre varchar(16) NOT NULL,
        geom geography,
        ert_interval interval,
        ert_seconds integer{" GENERATED ALWAYS AS (CAST(EXTRACT(epoch FROM ert) AS integer)) STORED" if use_generated else ""},
        PRIMARY KEY(hts_site_id),
        CONSTRAINT chk_lat CHECK (latitude >= -90 AND latitude <= 90),
        CONSTRAINT chk_lon CHECK (longitude >= -180 AND longitude <= 180),
        CONSTRAINT chk_ert_nonneg CHECK (EXTRACT(epoch FROM ert) >= 0)
        {"" if use_generated else ", CONSTRAINT chk_ert_seconds_nonneg CHECK (ert_seconds IS NULL OR ert_seconds >= 0)"}
    );
    """
    cur.execute(ddl_table)

    # Index géo & numériques
    cur.execute("CREATE INDEX sites_geom_gist ON public.sites USING gist (geom);")
    cur.execute("CREATE INDEX sites_site_id_idx ON public.sites(site_id);")
    cur.execute("CREATE INDEX sites_class_idx ON public.sites(class);")
    cur.execute("CREATE INDEX sites_zone_idx ON public.sites(zone);")
    cur.execute("CREATE INDEX sites_ert_seconds_idx ON public.sites(ert_seconds);")

    # Index texte trigram si possible, sinon fallback
    has_trgm = True
    try:
        cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
    except Exception as e:
        print(f"[WARN] pg_trgm indisponible ({e}) — fallback BTREE.")
        has_trgm = False

    if has_trgm:
        cur.execute("""CREATE INDEX sites_site_name_trgm_idx
                       ON public.sites USING gin (site_name gin_trgm_ops);""")
    else:
        cur.execute("""CREATE INDEX sites_site_name_lower_idx
                       ON public.sites (LOWER(site_name));""")

def get_generated_columns(cur, schema: str, table: str) -> Set[str]:
    """Retourne l'ensemble des colonnes GENERATEES (is_generated='ALWAYS')."""
    try:
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema=%s AND table_name=%s AND is_generated='ALWAYS'
        """, (schema, table))
        return {r[0] for r in cur.fetchall()}
    except Exception:
        # Anciennes versions: pas de colonne is_generated -> rien
        return set()

# --------- Préparation DataFrame ---------
def norm_columns(df: pd.DataFrame, mapping: Dict[str,str]) -> pd.DataFrame:
    cols: Dict[str,str] = {}
    seen: set[str] = set()
    for c in list(df.columns):
        target = mapping.get(c, slugify(c))
        base = target; i = 2
        while target in seen:
            target = f"{base}_{i}"; i += 1
        seen.add(target); cols[c] = target
    return df.rename(columns=cols)

def prepare_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    converters = {
        "is_under_maintenance": to_bool,
        "has_genset": to_bool,
        "is_in_rtmc": to_bool,
        "is_colocation": to_bool,
        "has_solar": to_bool,
        "has_surge_protector": to_bool,
        "spa": to_int,
        "tower_height": to_int,
        "dependency_count": to_int,
        "tenant_count": to_int,
        "b2b": to_int,
        "latitude": to_float,
        "longitude": to_float,
        "tank_capacity": to_float,
        "fuse_rating": to_float,
        "rbs_breaker_rating": to_float,
        "rectifier_power": to_float,
        "battery_count": to_float,
        "charge_current": to_float,
        "panel_count": to_float,
        "puissance_panneau": to_float,
        "nbre_string": to_float,
        "nbre_panneau_par_strign": to_float,
        "puiss_total_panneau": to_float,
        "nbre_module_solaire": to_float,
        "puiss_module_solaire": to_float,
        "puiss_totale_module_solaire": to_float,
        "ert": to_interval,
        "ert_sec": to_int,
    }
    for col, fn in converters.items():
        if col in df.columns:
            df[col] = df[col].map(lambda x: fn(x) if pd.notna(x) else None)

    if "ert_seconds" not in df.columns and "ert" in df.columns:
        df["ert_seconds"] = df.apply(compute_ert_seconds, axis=1)

    missing_cols = [c for c in REQUIRED_NOT_NULL if c not in df.columns]
    if missing_cols:
        raise SystemExit(f"Colonnes NOT NULL manquantes: {missing_cols}")

    cols_intersection: List[str] = [c for c in ALL_COLUMNS if c in df.columns]
    return cast(pd.DataFrame, df.loc[:, cols_intersection])

# --------- Upsert (exclut les colonnes générées) ---------
def upsert_rows(cur, df: pd.DataFrame, schema: str, table: str, chunksize: int = 1000,
                exclude_cols: Optional[Set[str]] = None) -> None:
    exclude_cols = exclude_cols or set()
    conflict = "hts_site_id"

    cols: List[str] = [c for c in df.columns if c not in exclude_cols]
    placeholders = ",".join(["%s"] * len(cols))
    collist = ", ".join(quote_ident(c) for c in cols)
    setlist = ", ".join(f"{quote_ident(c)}=EXCLUDED.{quote_ident(c)}" for c in cols if c != conflict)

    sql = f"""
    INSERT INTO {quote_ident(schema)}.{quote_ident(table)} ({collist})
    VALUES %s
    ON CONFLICT ({quote_ident(conflict)}) DO UPDATE
    SET {setlist};
    """

    def _iter_rows():
        for row in df[cols].itertuples(index=False, name=None):
            yield tuple(None if (isinstance(v, float) and math.isnan(v)) else v for v in row)

    batch: List[tuple] = []
    for rec in _iter_rows():
        batch.append(rec)
        if len(batch) >= chunksize:
            pgx.execute_values(cur, sql, batch, template=f"({placeholders})")
            batch.clear()
    if batch:
        pgx.execute_values(cur, sql, batch, template=f"({placeholders})")

# --------- Main ---------
def main(argv: Optional[Sequence[str]] = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("excel_path", help="Chemin du fichier Excel (ex: Site.xlsx)")
    p.add_argument("--schema", default="public")
    p.add_argument("--table", default="sites")
    p.add_argument("--sheet", default=0, help="Nom ou index de l'onglet Excel (par défaut 0)")
    p.add_argument("--colmap", default=None, help="JSON mapping colonnes (original->normalisé)")
    p.add_argument("--ensure-schema", action="store_true", help="Créer DDL si la table n'existe pas")
    p.add_argument("--chunksize", type=int, default=1000, help="Taille des lots d'upsert")
    args = p.parse_args(argv)

    df = pd.read_excel(args.excel_path, sheet_name=args.sheet)
    mapping = load_mapping(args.colmap)
    df = norm_columns(df, mapping)
    df = prepare_dataframe(df)

    with psycopg2.connect(
        host=os.getenv("PGHOST", "localhost"),
        port=os.getenv("PGPORT", "5432"),
        dbname=os.getenv("PGDATABASE", "pegasus"),
        user=os.getenv("PGUSER", "asega"),
        password=os.getenv("PGPASSWORD") or "asega@1965",
    ) as conn:
        conn.autocommit = False
        with conn.cursor() as cur:
            ensure_schema(cur, ensure_schema=args.ensure_schema)
            generated = get_generated_columns(cur, args.schema, args.table)
            # Exclure toute colonne générée (ex: ert_seconds) de l'insert/update
            upsert_rows(cur, df, args.schema, args.table,
                        chunksize=args.chunksize, exclude_cols=generated)
        conn.commit()
    print(f"Ingestion terminée: {len(df)} lignes insérées/mises à jour dans {args.schema}.{args.table}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
