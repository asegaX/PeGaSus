#!/usr/bin/env python3
"""
Ingestion de SWO.xlsx -> PostgreSQL (DB: pegasus, table: public.swo)

Caractéristiques:
- Normalisation des colonnes (snake_case ASCII) + mapping surchargeable (--colmap).
- Clés: PK = swo (dérivée de '# SWO' / 'SWO' / 'SW0'), FK = hts_sn_id (depuis 'Site')
        -> REFERENCES public.sites(hts_site_id) ON UPDATE CASCADE ON DELETE RESTRICT.
- Création/complétion de la table public.swo selon les colonnes réelles du fichier.
- Conversions robustes (bool, int/float avec virgule, timestamp, timedelta). Tous les NaN/NaT -> NULL.
- Upsert idempotent par lots (ON CONFLICT (swo) DO UPDATE).

Dépendances:
  pip install pandas openpyxl psycopg2-binary python-dotenv numpy

Variables d'environnement:
  PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD

  
  python script/ingest_swo_from_excel.py files/SWO.xlsx --ensure-schema
"""

from __future__ import annotations

import os, re, json, math, argparse, unicodedata
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple, cast
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import psycopg2
import psycopg2.extras as pgx
from dotenv import load_dotenv

load_dotenv()

# ---------- Normalisation & mapping par défaut ----------
DEFAULT_COLMAP: Dict[str, str] = {
    "# SWO": "swo",
    "SWO": "swo",
    "SW0": "swo",        # zéro -> swo
    "SWO ID": "swo",
    "Site": "hts_sn_id", # homogénéise la FK avec Sites/TRB/PMWO
    "SITE": "hts_sn_id",
}

BOOL_TRUE = {"true","t","1","yes","y","oui","o","vrai"}
BOOL_FALSE = {"false","f","0","no","n","non","faux"}

def slugify(name: str) -> str:
    """Transforme un intitulé en snake_case ASCII sûr pour SQL."""
    s = unicodedata.normalize("NFKD", str(name))
    s = s.encode("ascii","ignore").decode("ascii").lower()
    s = re.sub(r"[^a-z0-9]+","_", s)
    s = re.sub(r"_+","_", s).strip("_")
    return s

def load_mapping(path: Optional[str]) -> Dict[str,str]:
    """Charge un mapping JSON optionnel (original -> normalisé) et le fusionne avec les défauts."""
    if path:
        with open(path, "r", encoding="utf-8") as f:
            user_map = cast(Dict[str,str], json.load(f))
    else:
        user_map = {}
    return {**DEFAULT_COLMAP, **user_map}

def norm_columns(df: pd.DataFrame, mapping: Dict[str,str]) -> pd.DataFrame:
    """Applique le mapping puis normalise en-têtes en snake_case ASCII, avec dédoublonnage."""
    cols: Dict[str,str] = {}
    seen: set[str] = set()
    for c in list(df.columns):
        target = mapping.get(c, slugify(c))
        base = target; i = 2
        while target in seen:
            target = f"{base}_{i}"; i += 1
        seen.add(target); cols[c] = target
    return df.rename(columns=cols)

# ---------- Conversions robustes ----------
def to_bool(x: Any) -> Optional[bool]:
    if x is None or (isinstance(x, float) and math.isnan(x)): return None
    if isinstance(x, bool): return x
    s = str(x).strip().lower()
    if s in BOOL_TRUE: return True
    if s in BOOL_FALSE: return False
    return None

def to_int(x: Any) -> Optional[int]:
    if x is None or (isinstance(x, float) and math.isnan(x)): return None
    if isinstance(x, bool): return 1 if x else 0
    s = str(x).strip().lower()
    if s in BOOL_TRUE: return 1
    if s in BOOL_FALSE: return 0
    try:
        return int(float(s.replace(",", ".")))
    except Exception:
        return None

def to_float(x: Any) -> Optional[float]:
    if x is None or (isinstance(x, float) and math.isnan(x)): return None
    if isinstance(x, bool): return 1.0 if x else 0.0
    s = str(x).strip().lower().replace(",", ".")
    if s in BOOL_TRUE: return 1.0
    if s in BOOL_FALSE: return 0.0
    try:
        return float(s)
    except Exception:
        return None

def to_datetime(x: Any) -> Optional[datetime]:
    """Renvoie None pour toute valeur NaT/invalid, sinon un datetime natif (pas de Timestamp pandas)."""
    if x is None or (isinstance(x, float) and math.isnan(x)): return None
    try:
        dt = pd.to_datetime(x, errors="coerce")
    except Exception:
        return None
    if pd.isna(dt):  # NaT
        return None
    return pd.Timestamp(dt).to_pydatetime()

def to_timedelta(x: Any) -> Optional[timedelta]:
    """Renvoie None pour toute valeur NaT/invalid, sinon un timedelta natif."""
    if x is None or (isinstance(x, float) and math.isnan(x)): return None
    if hasattr(pd, "Timedelta") and isinstance(x, pd.Timedelta):
        return None if pd.isna(x) else x.to_pytimedelta()
    if isinstance(x, np.timedelta64):
        td = pd.to_timedelta(x, errors="coerce")
        return None if pd.isna(td) else td.to_pytimedelta()
    if isinstance(x, timedelta):
        return x
    td = pd.to_timedelta(x, errors="coerce")
    if pd.isna(td): return None
    return td.to_pytimedelta()

# ---------- Inférence type PG ----------
def infer_pg_type(s: pd.Series) -> Tuple[str, str]:
    """Retourne (pg_type, coercion) où coercion ∈ {'bool','int','float','timestamp','interval','text'}."""
    non_null = s.dropna()
    sample = non_null.head(50)

    if pd.api.types.is_bool_dtype(s): return ("boolean","bool")
    if pd.api.types.is_integer_dtype(s): return ("integer","int")
    if pd.api.types.is_float_dtype(s): return ("double precision","float")
    if pd.api.types.is_datetime64_any_dtype(s): return ("timestamp without time zone","timestamp")
    if pd.api.types.is_timedelta64_dtype(s): return ("interval","interval")
    if len(sample) == 0:
        return ("text","text")
    if sample.apply(lambda v: to_bool(v) is not None).mean() > 0.9:
        return ("boolean","bool")
    if sample.apply(lambda v: (to_int(v) is not None) and (to_float(v) is not None) and float(to_int(v)) == to_float(v)).mean() > 0.9:
        return ("integer","int")
    if sample.apply(lambda v: to_float(v) is not None).mean() > 0.9:
        return ("double precision","float")
    if sample.apply(lambda v: to_datetime(v) is not None).mean() > 0.8:
        return ("timestamp without time zone","timestamp")
    if sample.apply(lambda v: to_timedelta(v) is not None).mean() > 0.8:
        return ("interval","interval")
    return ("text","text")

def coerce_series(s: pd.Series, coercion: str) -> pd.Series:
    """Coerce une série Pandas vers le type cible (valeurs manquantes -> None)."""
    if coercion == "bool":
        return s.map(lambda v: to_bool(v) if pd.notna(v) else None)
    if coercion == "int":
        return s.map(lambda v: to_int(v) if pd.notna(v) else None)
    if coercion == "float":
        return s.map(lambda v: to_float(v) if pd.notna(v) else None)
    if coercion == "timestamp":
        return s.map(lambda v: to_datetime(v) if pd.notna(v) else None)
    if coercion == "interval":
        return s.map(lambda v: to_timedelta(v) if pd.notna(v) else None)
    return s.map(lambda v: None if pd.isna(v) else str(v).strip())

def quote_ident(name: str) -> str:
    """Quote SQL sûr pour identifiants (col, table, schéma)."""
    if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name or ""): return name
    return '"' + name.replace('"','""') + '"'

# ---------- Schéma / contraintes ----------
def get_existing_columns(cur, schema: str, table: str) -> Set[str]:
    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_schema=%s AND table_name=%s
    """, (schema, table))
    return {r[0] for r in cur.fetchall()}

def table_exists(cur, schema: str, table: str) -> bool:
    cur.execute("""
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema=%s AND table_name=%s
        )
    """, (schema, table))
    (exists,) = cur.fetchone()
    return bool(exists)

def fk_exists(cur, schema: str, table: str, fk_name: str) -> bool:
    cur.execute("""
        SELECT 1
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema=%s AND tc.table_name=%s
          AND tc.constraint_type='FOREIGN KEY' AND tc.constraint_name=%s
    """, (schema, table, fk_name))
    return cur.fetchone() is not None

def pk_exists(cur, schema: str, table: str) -> bool:
    cur.execute("""
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema=%s AND table_name=%s AND constraint_type='PRIMARY KEY'
    """, (schema, table))
    return cur.fetchone() is not None

def ensure_schema(cur, schema: str, table: str, df: pd.DataFrame) -> None:
    """
    Crée ou complète public.swo en fonction des colonnes du fichier:
    - PK sur swo (text NOT NULL)
    - FK hts_sn_id -> public.sites(hts_site_id)
    - Index sur hts_sn_id
    """
    cols = list(df.columns)
    if "swo" not in cols or "hts_sn_id" not in cols:
        raise SystemExit("Colonnes obligatoires manquantes après normalisation: 'swo' (PK) et 'hts_sn_id' (FK).")

    if not table_exists(cur, schema, table):
        col_ddls: List[str] = []
        for c in cols:
            if c == "swo":
                col_ddls.append("swo text NOT NULL")
            elif c == "hts_sn_id":
                col_ddls.append("hts_sn_id varchar(8) NOT NULL")
            else:
                pg_type, _coercion = infer_pg_type(df[c])
                col_ddls.append(f"{quote_ident(c)} {pg_type}")

        ddl = f"""
        CREATE TABLE {quote_ident(schema)}.{quote_ident(table)} (
            {', '.join(col_ddls)},
            CONSTRAINT {quote_ident(table + '_pkey')} PRIMARY KEY (swo)
        );
        """
        cur.execute(ddl)
        cur.execute(f"CREATE INDEX {quote_ident(table + '_hts_sn_id_idx')} ON {quote_ident(schema)}.{quote_ident(table)} (hts_sn_id);")
        fk_name = table + "_hts_sn_id_fkey"
        cur.execute(f"""
            ALTER TABLE {quote_ident(schema)}.{quote_ident(table)}
            ADD CONSTRAINT {quote_ident(fk_name)}
            FOREIGN KEY (hts_sn_id) REFERENCES public.sites(hts_site_id)
            ON UPDATE CASCADE ON DELETE RESTRICT;
        """)
    else:
        existing = get_existing_columns(cur, schema, table)
        for c in cols:
            if c not in existing:
                if c == "swo":
                    cur.execute(f"""ALTER TABLE {quote_ident(schema)}.{quote_ident(table)}
                                    ADD COLUMN swo text;""")
                elif c == "hts_sn_id":
                    cur.execute(f"""ALTER TABLE {quote_ident(schema)}.{quote_ident(table)}
                                    ADD COLUMN hts_sn_id varchar(8);""")
                else:
                    pg_type, _coercion = infer_pg_type(df[c])
                    cur.execute(f"""ALTER TABLE {quote_ident(schema)}.{quote_ident(table)}
                                    ADD COLUMN {quote_ident(c)} {pg_type};""")

        if not pk_exists(cur, schema, table):
            cur.execute(f"""
                ALTER TABLE {quote_ident(schema)}.{quote_ident(table)}
                ADD CONSTRAINT {quote_ident(table + '_pkey')} PRIMARY KEY (swo);
            """)
        fk_name = table + "_hts_sn_id_fkey"
        if not fk_exists(cur, schema, table, fk_name):
            cur.execute(f"CREATE INDEX IF NOT EXISTS {quote_ident(table + '_hts_sn_id_idx')} ON {quote_ident(schema)}.{quote_ident(table)} (hts_sn_id);")
            cur.execute(f"""
                ALTER TABLE {quote_ident(schema)}.{quote_ident(table)}
                ADD CONSTRAINT {quote_ident(fk_name)}
                FOREIGN KEY (hts_sn_id) REFERENCES public.sites(hts_site_id)
                ON UPDATE CASCADE ON DELETE RESTRICT;
            """)

# ---------- Préparation DataFrame ----------
def prepare_dataframe(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
    """
    Retourne (df_coerced, coercions) où coercions[col] ∈ {'bool','int','float','timestamp','interval','text'}.
    - Force 'swo' et 'hts_sn_id' en texte nettoyé
    - Convertit NaN/NaT -> None
    """
    coercions: Dict[str, str] = {}
    for c in df.columns:
        if c == "swo":
            coercions[c] = "text"
            df[c] = df[c].map(lambda v: None if pd.isna(v) else str(v).strip())
            continue
        if c == "hts_sn_id":
            coercions[c] = "text"
            df[c] = df[c].map(lambda v: None if pd.isna(v) else str(v).strip())
            continue
        pg_type, co = infer_pg_type(df[c])
        coercions[c] = co
        df[c] = coerce_series(df[c], co)
    return df, coercions

# ---------- Upsert ----------
def _is_missing(v: Any) -> bool:
    """True si valeur manquante (None/NaN/NaT/TimedeltaNaT)."""
    try:
        return v is None or (isinstance(v, float) and math.isnan(v)) or pd.isna(v)
    except Exception:
        return v is None

def upsert_rows(cur, df: pd.DataFrame, schema: str, table: str, chunksize: int = 1000) -> None:
    """Upsert par lots avec execute_values, remplaçant toutes les valeurs manquantes par NULL."""
    cols: List[str] = list(df.columns)
    conflict = "swo"
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
        for row in df.itertuples(index=False, name=None):
            yield tuple(None if _is_missing(v) else v for v in row)

    batch: List[tuple] = []
    for rec in _iter_rows():
        batch.append(rec)
        if len(batch) >= chunksize:
            pgx.execute_values(cur, sql, batch, template=f"({placeholders})")
            batch.clear()
    if batch:
        pgx.execute_values(cur, sql, batch, template=f"({placeholders})")

# ---------- Main ----------
def main(argv: Optional[Sequence[str]] = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("excel_path", help="Chemin du fichier Excel (ex: SWO.xlsx)")
    p.add_argument("--schema", default="public")
    p.add_argument("--table", default="swo")
    p.add_argument("--sheet", default="SWO", help="Nom ou index de l'onglet (par défaut 'SWO')")
    p.add_argument("--colmap", default=None, help="JSON mapping colonnes (original->normalisé)")
    p.add_argument("--ensure-schema", action="store_true", help="Créer/compléter la table si besoin")
    p.add_argument("--chunksize", type=int, default=1000, help="Taille des lots d'upsert")
    p.add_argument("--skip-missing-sites", action="store_true", help="Ignore les lignes dont hts_sn_id n'existe pas")
    args = p.parse_args(argv)

    # Lecture Excel
    df = pd.read_excel(args.excel_path, sheet_name=args.sheet)
    mapping = load_mapping(args.colmap)
    df = norm_columns(df, mapping)

    # Exigences minimales
    if "swo" not in df.columns and "# swo" in df.columns:
        df = df.rename(columns={"# swo": "swo"})
    if "swo" not in df.columns:
        raise SystemExit("Impossible de trouver la clé primaire: fournissez une colonne '# SWO'/'SWO'/'SW0' (normalisée en 'swo').")
    if "hts_sn_id" not in df.columns:
        raise SystemExit("Impossible de trouver la clé étrangère: ajoutez la colonne 'Site' (normalisée en 'hts_sn_id').")

    # Préparation des types/conversions
    df, _coercions = prepare_dataframe(df)

    # Connexion & ingestion
    with psycopg2.connect(
        host=os.getenv("PGHOST", "localhost"),
        port=os.getenv("PGPORT", "5432"),
        dbname=os.getenv("PGDATABASE", "pegasus"),
        user=os.getenv("PGUSER", "asega"),
        password=os.getenv("PGPASSWORD") or "asega@1965",
    ) as conn:
        conn.autocommit = False
        with conn.cursor() as cur:
            if args.ensure_schema:
                ensure_schema(cur, args.schema, args.table, df)

            if args.skip_missing_sites:
                cur.execute("SELECT hts_site_id FROM public.sites;")
                existing = {r[0] for r in cur.fetchall()}
                before = len(df)
                df = df.loc[df["hts_sn_id"].isin(existing)].copy()
                print(f"[INFO] {before - len(df)} ligne(s) ignorée(s) (FK manquante).")

            upsert_rows(cur, df, args.schema, args.table, chunksize=args.chunksize)
        conn.commit()

    print(f"Ingestion SWO terminée: {len(df)} ligne(s) upsert dans {args.schema}.{args.table}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
