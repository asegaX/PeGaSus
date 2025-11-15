# 🚀 Pegasus – Plateforme de Gestion des Infrastructures Passives

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Status](https://img.shields.io/badge/status-beta-orange.svg)
![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)
![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)
![License](https://img.shields.io/badge/license-Internal-red.svg)

**Socle technique pour la gestion unifiée des infrastructures passives des sites télécoms**

[Documentation](#documentation) • [Installation](#installation-rapide) • [Architecture](#architecture) • [Roadmap](#roadmap)

</div>

---

## 📋 Table des matières

- [Vision du projet](#-vision-du-projet)
- [Fonctionnalités principales](#-fonctionnalités-principales)
- [Architecture](#-architecture-générale)
- [Prérequis](#-prérequis)
- [Installation rapide](#-installation-rapide)
- [Backend - FastAPI](#-backend--fastapi--postgresql)
- [Frontend - React](#-frontend--react--vite--typescript)
- [Configuration](#-configuration)
- [Développement](#-développement)
- [Bonnes pratiques](#-bonnes-pratiques)
- [Roadmap](#-roadmap)
- [Contribution](#-contribution)
- [Support](#-support)

---

## 🎯 Vision du projet

Pegasus est une **plateforme unifiée** conçue pour centraliser la consultation et le pilotage des infrastructures passives des sites télécoms. Elle s'appuie sur une architecture moderne et modulaire permettant :

### Objectifs stratégiques

- ✅ **Exposition unifiée** des données métier (sites, TRB, PMWO, SWO)
- ✅ **API REST moderne** avec versioning et documentation automatique (OpenAPI)
- ✅ **Interface premium** avec design soigné et expérience utilisateur optimale
- ✅ **Architecture réutilisable** adaptée à d'autres projets d'infrastructure
- 🔄 **Évolutivité** pour intégrer de nouvelles fonctionnalités métier

### Cas d'usage

- Consultation en temps réel des infrastructures passives
- Visualisation géographique des sites télécoms
- Suivi des ordres de travail (PMWO, SWO)
- Gestion des équipements TRB (Technical Room Building)
- Reporting et tableaux de bord analytiques

---

## ✨ Fonctionnalités principales

### Version actuelle (v0.1.0 - Beta)

| Fonctionnalité | Status | Description |
|----------------|--------|-------------|
| **API REST versionnée** | ✅ | Endpoints sous `/api/v1` avec documentation Swagger |
| **Tables métier exposées** | ✅ | Sites, TRB, PMWO, SWO en lecture seule |
| **Interface moderne** | ✅ | React + TypeScript avec design premium |
| **Navigation intuitive** | ✅ | Navbar + Sidebar responsive avec mode compact |
| **Favicon personnalisé** | ✅ | Logo Pegasus avec dégradé bleu |
| **Configuration centralisée** | ✅ | Gestion via variables d'environnement |
| **Connexion PostgreSQL** | ✅ | Accès sécurisé à la base Pegasus existante |

### À venir (roadmap)

| Fonctionnalité | Priorité | Description |
|----------------|----------|-------------|
| **CRUD complet** | 🔴 Haute | Création, modification, suppression d'enregistrements |
| **Pagination & filtres** | 🔴 Haute | Gestion optimisée des grandes volumétries |
| **Authentification** | 🟡 Moyenne | JWT + gestion des rôles utilisateur |
| **Visualisation cartographique** | 🟡 Moyenne | Intégration Leaflet/Mapbox pour géolocalisation |
| **Export de données** | 🟢 Basse | CSV, Excel, PDF |
| **Notifications temps réel** | 🟢 Basse | WebSocket pour alertes métier |

---

## 🏗️ Architecture générale

### Structure du dépôt

```
pegasus/
│
├── 📁 backend/                    # API FastAPI + PostgreSQL
│   ├── 📁 app/
│   │   ├── 📁 api/               # Routes API versionnées
│   │   │   ├── deps.py           # Dépendances FastAPI (get_db, etc.)
│   │   │   └── 📁 v1/            # API version 1
│   │   │       ├── api.py        # Router principal v1
│   │   │       ├── routes_sites.py
│   │   │       ├── routes_trb.py
│   │   │       ├── routes_pmwo.py
│   │   │       └── routes_swo.py
│   │   │
│   │   ├── 📁 core/              # Configuration & utilitaires
│   │   │   ├── config.py         # Settings (pydantic-settings)
│   │   │   ├── errors.py         # Gestionnaires d'exceptions
│   │   │   └── logging.py        # Configuration logging
│   │   │
│   │   ├── 📁 db/                # Base de données
│   │   │   ├── base.py           # Base SQLAlchemy
│   │   │   ├── session.py        # Engine & SessionLocal
│   │   │   └── tables.py         # Modèles ORM (sites, trb, etc.)
│   │   │
│   │   └── main.py               # Point d'entrée FastAPI
│   │
│   ├── .env                      # Variables d'environnement (non commité)
│   ├── requirements.txt          # Dépendances Python
│   └── pytest.ini                # Configuration tests
│
├── 📁 frontend/                   # Interface React + Vite
│   ├── 📁 public/
│   │   ├── favicon.svg           # Favicon vectoriel Pegasus
│   │   ├── favicon-32x32.png     # Fallback PNG 32x32
│   │   └── favicon-16x16.png     # Fallback PNG 16x16
│   │
│   ├── 📁 src/
│   │   ├── App.tsx               # Composant racine
│   │   ├── main.tsx              # Point d'entrée React
│   │   │
│   │   ├── 📁 layouts/           # Layouts réutilisables
│   │   │   └── MainLayout.tsx    # Layout principal (navbar + sidebar + content)
│   │   │
│   │   ├── 📁 components/        # Composants UI
│   │   │   ├── 📁 navbar/
│   │   │   │   └── Navbar.tsx    # Barre de navigation supérieure
│   │   │   └── 📁 sidebar/
│   │   │       └── Sidebar.tsx   # Menu latéral avec mode compact
│   │   │
│   │   ├── 📁 pages/             # Pages de l'application
│   │   │   ├── Home.tsx
│   │   │   ├── Sites.tsx
│   │   │   └── ...
│   │   │
│   │   └── 📁 assets/            # Ressources statiques
│   │       └── logo_blanc.svg    # Logo Pegasus blanc
│   │
│   ├── index.html                # Template HTML
│   ├── package.json              # Dépendances npm
│   ├── tsconfig.json             # Configuration TypeScript
│   └── vite.config.ts            # Configuration Vite
│
├── .gitignore                    # Fichiers ignorés par Git
├── README.md                     # Ce fichier
└── LICENSE                       # Licence (à définir)
```

### Diagramme d'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UTILISATEUR                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │    Frontend React + Vite      │
         │  (TypeScript, Tailwind CSS)   │
         │                               │
         │  • Navbar premium             │
         │  • Sidebar responsive         │
         │  • Tables interactives        │
         └───────────────┬───────────────┘
                         │
                         │ HTTP/REST
                         ▼
         ┌───────────────────────────────┐
         │    Backend FastAPI + Uvicorn  │
         │                               │
         │  • API REST versionnée (v1)   │
         │  • Documentation OpenAPI      │
         │  • Gestion des erreurs        │
         │  • Validation Pydantic        │
         └───────────────┬───────────────┘
                         │
                         │ SQLAlchemy ORM
                         ▼
         ┌───────────────────────────────┐
         │   PostgreSQL - Base Pegasus   │
         │                               │
         │  Tables métier:               │
         │  • sites                      │
         │  • trb                        │
         │  • pmwo                       │
         │  • swo                        │
         └───────────────────────────────┘
```

### Stack technique

#### Backend
- **Framework**: FastAPI 0.100+ (Python 3.9+)
- **ORM**: SQLAlchemy 2.0+
- **Base de données**: PostgreSQL 13+ avec extension PostGIS
- **Validation**: Pydantic 2.0+
- **Serveur ASGI**: Uvicorn
- **Tests**: pytest, httpx

#### Frontend
- **Framework**: React 18.2+
- **Build tool**: Vite 4.0+
- **Langage**: TypeScript 5.0+
- **Styling**: Tailwind CSS 3.3+
- **Icons**: Lucide React
- **État**: React Hooks (useState, useEffect)

---

## 📦 Prérequis

### Système

- **OS**: Linux, macOS, Windows (WSL2 recommandé)
- **RAM**: 4 GB minimum (8 GB recommandé)
- **Espace disque**: 2 GB minimum

### Logiciels requis

| Logiciel | Version minimale | Installation |
|----------|------------------|--------------|
| **Python** | 3.9+ | [python.org](https://python.org) |
| **Node.js** | 18.0+ | [nodejs.org](https://nodejs.org) |
| **PostgreSQL** | 13.0+ | [postgresql.org](https://postgresql.org) |
| **Git** | 2.30+ | [git-scm.com](https://git-scm.com) |

### Extensions PostgreSQL

```sql
-- Extension géospatiale (si géométries utilisées)
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

## 🚀 Installation rapide

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-org/pegasus.git
cd pegasus
```

### 2. Configuration du Backend

```bash
# Accéder au dossier backend
cd backend

# Créer un environnement virtuel Python
python3 -m venv .venv

# Activer l'environnement virtuel
# Sur Linux/macOS:
source .venv/bin/activate
# Sur Windows:
.venv\Scripts\activate

# Installer les dépendances
pip install --upgrade pip
pip install -r requirements.txt

# Créer le fichier .env
cp .env.example .env
# Puis éditer .env avec vos paramètres
```

### 3. Configuration du Frontend

```bash
# Accéder au dossier frontend (depuis la racine)
cd ../frontend

# Installer les dépendances npm
npm install

# Optionnel : créer un fichier .env.local pour le frontend
echo "VITE_API_URL=http://localhost:8000" > .env.local
```

### 4. Lancer l'application

**Terminal 1 - Backend:**
```bash
cd backend
source .venv/bin/activate  # ou .venv\Scripts\activate sur Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Accéder à l'application

- **Frontend**: http://localhost:5173
- **API Backend**: http://localhost:8000
- **Documentation API**: http://localhost:8000/docs (Swagger UI)
- **Documentation alternative**: http://localhost:8000/redoc (ReDoc)

---

## 🔧 Backend – FastAPI & PostgreSQL

### Architecture du backend

Le backend suit une architecture en **couches** (layered architecture) pour assurer maintenabilité et testabilité :

```
app/
├── api/          # Couche présentation (routes HTTP)
├── core/         # Configuration & utilitaires transverses
├── db/           # Couche accès données (ORM)
├── models/       # Modèles métier (à venir)
├── schemas/      # Schémas Pydantic (à venir)
└── services/     # Logique métier (à venir)
```

### Configuration (`core/config.py`)

Le module de configuration utilise **Pydantic Settings** pour charger et valider les variables d'environnement :

```python
from pydantic import BaseSettings, PostgresDsn

class Settings(BaseSettings):
    """Configuration de l'application chargée depuis l'environnement."""
    
    # Identité application
    app_name: str = "Pegasus API"
    app_version: str = "0.1.0"
    
    # Base de données
    database_url: PostgresDsn
    
    # Configuration
    debug: bool = False
    
    class Config:
        env_prefix = "PEGASUS_"
        env_file = ".env"
        env_file_encoding = "utf-8"
```

#### Exemple de fichier `.env`

```env
# backend/.env

# Base de données PostgreSQL
PEGASUS_DATABASE_URL=postgresql://user:password@localhost:5432/pegasus

# Mode debug (désactiver en production)
PEGASUS_DEBUG=false

# Nom de l'application
PEGASUS_APP_NAME=Pegasus API
```

> ⚠️ **Sécurité**: Le fichier `.env` ne doit **jamais** être commité. Il est déjà présent dans `.gitignore`.

### Connexion à la base (`db/session.py`)

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

settings = get_settings()

# Moteur SQLAlchemy
engine = create_engine(
    str(settings.database_url),
    pool_pre_ping=True,  # Vérification santé connexions
    echo=settings.debug   # Log SQL en mode debug
)

# Factory de sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dépendance FastAPI
def get_db():
    """Fournit une session DB pour les routes FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Modèles ORM (`db/tables.py`)

Les modèles SQLAlchemy reflètent les tables **existantes** dans PostgreSQL :

```python
from sqlalchemy import Column, Integer, String, DateTime, Float
from app.db.base import Base

class Site(Base):
    """Modèle ORM pour la table 'sites'."""
    __tablename__ = "sites"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(255), nullable=False)
    code_site = Column(String(50), unique=True, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    statut = Column(String(50))
    date_creation = Column(DateTime)
    
    def __repr__(self):
        return f"<Site(id={self.id}, code={self.code_site})>"
```

### Routes API (`api/v1/routes_sites.py`)

Exemple d'endpoint REST pour lister les sites :

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.db.tables import Site

router = APIRouter(prefix="/sites", tags=["Sites"])

@router.get("/", summary="Liste tous les sites")
async def list_sites(
    skip: int = Query(0, ge=0, description="Nombre d'enregistrements à ignorer"),
    limit: int = Query(100, ge=1, le=1000, description="Nombre max de résultats"),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste paginée des sites.
    
    - **skip**: offset pour la pagination
    - **limit**: nombre max de résultats (max 1000)
    """
    sites = db.query(Site).offset(skip).limit(limit).all()
    total = db.query(Site).count()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": sites
    }
```

### Gestion des erreurs (`core/errors.py`)

Gestionnaires d'exceptions globaux pour des réponses d'erreur cohérentes :

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

class AppError(Exception):
    """Exception métier personnalisée."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code

def init_exception_handlers(app: FastAPI):
    """Enregistre les gestionnaires d'erreurs."""
    
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )
    
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        # Logger l'erreur ici
        return JSONResponse(
            status_code=500,
            content={"detail": "Erreur interne du serveur"}
        )
```

### Point d'entrée (`main.py`)

```python
from fastapi import FastAPI
from app.core.errors import init_exception_handlers
from app.api.v1.api import api_router

app = FastAPI(
    title="Pegasus API",
    version="0.1.0",
    description="API pour la gestion des infrastructures passives",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enregistrer les gestionnaires d'erreurs
init_exception_handlers(app)

# Monter l'API v1
app.include_router(api_router, prefix="/api/v1")

@app.get("/", tags=["Health"])
async def health_check():
    """Endpoint de santé de l'API."""
    return {
        "status": "ok",
        "message": "Pegasus API running",
        "version": "0.1.0"
    }
```

### Commandes utiles

```bash
# Lancer le serveur de développement
uvicorn app.main:app --reload

# Lancer avec logs détaillés
uvicorn app.main:app --reload --log-level debug

# Lancer sur un port spécifique
uvicorn app.main:app --reload --port 8080

# Lancer accessible depuis le réseau
uvicorn app.main:app --reload --host 0.0.0.0

# Lancer avec plusieurs workers (production)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

---

## 🎨 Frontend – React + Vite + TypeScript

### Architecture du frontend

Le frontend adopte une architecture **component-based** avec séparation claire des responsabilités :

```
src/
├── layouts/         # Layouts de page (structure générale)
├── components/      # Composants réutilisables
├── pages/           # Pages de l'application
├── hooks/           # Custom React hooks
├── services/        # Appels API
├── types/           # Types TypeScript
├── utils/           # Fonctions utilitaires
└── assets/          # Ressources statiques
```

### Layout principal (`layouts/MainLayout.tsx`)

```typescript
interface MainLayoutProps {
  navbar: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  isSidebarCollapsed?: boolean;
}

export default function MainLayout({
  navbar,
  sidebar,
  children,
  isSidebarCollapsed = false
}: MainLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      {/* Navbar en haut */}
      <header className="fixed top-0 left-0 right-0 z-50">
        {navbar}
      </header>
      
      {/* Conteneur principal avec sidebar + contenu */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <aside className={`
          fixed left-0 top-16 bottom-0 z-40
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'w-16' : 'w-64'}
        `}>
          {sidebar}
        </aside>
        
        {/* Zone de contenu principale */}
        <main className={`
          flex-1 overflow-y-auto
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}
        `}>
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

### Navbar premium (`components/navbar/Navbar.tsx`)

```typescript
import { useNavigate } from 'react-router-dom';
import LogoBlanc from '../../assets/logo_blanc.svg';

export default function Navbar() {
  const navigate = useNavigate();
  
  return (
    <nav className="
      h-16 px-6
      bg-gradient-to-r from-blue-600 to-blue-800
      shadow-lg
      flex items-center justify-between
    ">
      {/* Logo cliquable */}
      <div
        onClick={() => navigate('/')}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <img
          src={LogoBlanc}
          alt="Pegasus"
          className="h-10 w-auto transition-transform group-hover:scale-105"
        />
        <span className="text-white text-xl font-semibold">
          Pegasus
        </span>
      </div>
      
      {/* Actions utilisateur (à venir) */}
      <div className="flex items-center gap-4">
        {/* Avatar, notifications, etc. */}
      </div>
    </nav>
  );
}
```

### Sidebar avec mode compact (`components/sidebar/Sidebar.tsx`)

```typescript
import { Building, Wrench, ClipboardList, FileText } from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function Sidebar({
  collapsed,
  onToggle,
  selectedId,
  onSelect
}: SidebarProps) {
  const items: SidebarItem[] = [
    { id: 'sites', label: 'Sites', icon: <Building size={20} /> },
    { id: 'trb', label: 'TRB', icon: <Wrench size={20} /> },
    { id: 'pmwo', label: 'PMWO', icon: <ClipboardList size={20} /> },
    { id: 'swo', label: 'SWO', icon: <FileText size={20} /> }
  ];
  
  return (
    <div className="h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* En-tête avec bouton collapse */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        {!collapsed && (
          <span className="text-sm font-medium text-gray-600">
            Tables exposées
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          {/* Icône chevron */}
        </button>
      </div>
      
      {/* Liste des items */}
      <nav className="flex-1 p-2 space-y-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-all duration-200
              ${selectedId === item.id
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-200'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </button>
        ))}
      </nav>
      
      {/* Footer avec version */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <div className="flex items-center gap-2 mb-2">
              <span>Version 0.1.0</span>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                Beta
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Backend connecté</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Favicon personnalisé

Le projet utilise un favicon SVG avec fallback PNG pour compatibilité maximale :

**`public/favicon.svg`:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="45" fill="url(#grad)" />
  <text x="50" y="65" font-size="48" font-weight="bold" 
        text-anchor="middle" fill="white">P</text>
</svg>
```

**`index.html` (configuration):**
```html
<head>
  <!-- Favicon SVG (navigateurs modernes) -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
  
  <!-- Fallback PNG -->
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2" />
  
  <title>Pegasus - Infrastructure Management</title>
</head>
```

### Commandes utiles

```bash
# Développement avec hot-reload
npm run dev

# Build pour production
npm run build

# Prévisualisation du build
npm run preview

# Linter TypeScript
npm run lint

# Formattage du code (Prettier)
npm run format

# Tests unitaires
npm run test
```

---

## ⚙️ Configuration

### Variables d'environnement Backend

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|--------|
| `PEGASUS_DATABASE_URL` | URL connexion PostgreSQL | `postgresql://user:pass@host:5432/db` | ✅ |
| `PEGASUS_APP_NAME` | Nom de l'application | `Pegasus API` | ❌ |
| `PEGASUS_DEBUG` | Mode debug (logs SQL) | `false` | ❌ |
| `PEGASUS_LOG_LEVEL` | Niveau de logging | `INFO` | ❌ |

### Variables d'environnement Frontend

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|--------|
| `VITE_API_URL` | URL de l'API backend | `http://localhost:8000` | ✅ |
| `VITE_APP_NAME` | Nom de l'app frontend | `Pegasus` | ❌ |

---

## 💻 Développement

### Workflow de développement

1. **Créer une branche de feature**
   ```bash
   git checkout -b feature/nouvelle-fonctionnalite
   ```

2. **Développer et tester localement**
   ```bash
   # Backend
   cd backend && uvicorn app.main:app --reload
   
   # Frontend
   cd frontend && npm run dev
   ```

3. **Valider le code**
   ```bash
   # Backend - Linter & tests
   cd backend
   flake8 app/
   black app/
   pytest
   
   # Frontend - Linter & build
   cd frontend
   npm run lint
   npm run build
   ```

4. **Commit et push**
   ```bash
   git add .
   git commit -m "feat: description de la fonctionnalité"
   git push origin feature/nouvelle-fonctionnalite
   ```

5. **Créer une Pull Request**
   - Décrire les changements apportés
   - Lier les issues concernées
   - Attendre la review et les validations CI/CD

### Standards de code

#### Backend (Python)

- **Style**: PEP 8 avec Black (line length: 88)
- **Docstrings**: Google style
- **Type hints**: Obligatoires pour les fonctions publiques
- **Imports**: Triés avec isort
- **Tests**: pytest avec couverture > 80%

```python
# Exemple de fonction bien documentée
def get_site_by_code(db: Session, code: str) -> Optional[Site]:
    """
    Récupère un site par son code unique.
    
    Args:
        db: Session de base de données SQLAlchemy
        code: Code unique du site (ex: "SITE-001")
    
    Returns:
        L'objet Site si trouvé, None sinon
    
    Raises:
        ValidationError: Si le code est invalide
    
    Example:
        >>> site = get_site_by_code(db, "SITE-001")
        >>> print(site.nom)
        'Site de Paris'
    """
    return db.query(Site).filter(Site.code_site == code).first()
```

#### Frontend (TypeScript)

- **Style**: Prettier avec configuration projet
- **Composants**: Functional components avec hooks
- **Types**: Interfaces pour les props, types pour les données
- **Naming**: PascalCase pour composants, camelCase pour fonctions
- **Tests**: React Testing Library + Jest

```typescript
// Exemple de composant bien typé
interface SiteCardProps {
  site: {
    id: number;
    nom: string;
    code_site: string;
    statut: 'actif' | 'inactif' | 'maintenance';
  };
  onSelect?: (id: number) => void;
}

export const SiteCard: React.FC<SiteCardProps> = ({ site, onSelect }) => {
  return (
    <div
      onClick={() => onSelect?.(site.id)}
      className="p-4 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
    >
      <h3 className="font-semibold text-lg">{site.nom}</h3>
      <p className="text-sm text-gray-600">{site.code_site}</p>
      <span className={`inline-block px-2 py-1 rounded text-xs ${
        site.statut === 'actif' ? 'bg-green-100 text-green-800' :
        site.statut === 'inactif' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {site.statut}
      </span>
    </div>
  );
};
```

### Structure des commits

Utiliser les **Conventional Commits** :

```
<type>(<scope>): <description>

[body optionnel]

[footer optionnel]
```

**Types disponibles:**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation uniquement
- `style`: Formatage, point-virgules manquants, etc.
- `refactor`: Refactoring sans changement de fonctionnalité
- `perf`: Amélioration des performances
- `test`: Ajout ou correction de tests
- `chore`: Tâches de maintenance (build, config, etc.)

**Exemples:**
```bash
feat(api): ajout endpoint de recherche de sites par région
fix(sidebar): correction du bug d'affichage en mode compact
docs(readme): mise à jour de la section installation
refactor(db): simplification des requêtes ORM
```

### Tests

#### Backend - pytest

```bash
# Lancer tous les tests
pytest

# Avec couverture
pytest --cov=app --cov-report=html

# Tests spécifiques
pytest tests/test_routes_sites.py

# Mode verbose
pytest -v

# Avec logs
pytest -s
```

**Exemple de test:**
```python
# tests/api/v1/test_routes_sites.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_sites_success():
    """Test de la récupération de la liste des sites."""
    response = client.get("/api/v1/sites/")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "data" in data
    assert isinstance(data["data"], list)

def test_list_sites_pagination():
    """Test de la pagination."""
    response = client.get("/api/v1/sites/?skip=10&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["skip"] == 10
    assert data["limit"] == 5
    assert len(data["data"]) <= 5
```

#### Frontend - Jest & React Testing Library

```bash
# Lancer les tests
npm run test

# Mode watch
npm run test:watch

# Avec couverture
npm run test:coverage
```

**Exemple de test:**
```typescript
// src/components/sidebar/__tests__/Sidebar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../Sidebar';

describe('Sidebar', () => {
  const mockOnSelect = jest.fn();
  const mockOnToggle = jest.fn();

  it('affiche tous les items du menu', () => {
    render(
      <Sidebar
        collapsed={false}
        selectedId="sites"
        onSelect={mockOnSelect}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('Sites')).toBeInTheDocument();
    expect(screen.getByText('TRB')).toBeInTheDocument();
    expect(screen.getByText('PMWO')).toBeInTheDocument();
    expect(screen.getByText('SWO')).toBeInTheDocument();
  });

  it('appelle onSelect lors du clic sur un item', () => {
    render(
      <Sidebar
        collapsed={false}
        selectedId="sites"
        onSelect={mockOnSelect}
        onToggle={mockOnToggle}
      />
    );

    fireEvent.click(screen.getByText('TRB'));
    expect(mockOnSelect).toHaveBeenCalledWith('trb');
  });

  it('masque les labels en mode collapsed', () => {
    render(
      <Sidebar
        collapsed={true}
        selectedId="sites"
        onSelect={mockOnSelect}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.queryByText('Sites')).not.toBeInTheDocument();
  });
});
```

### Debugging

#### Backend

```python
# Utiliser le debugger Python
import pdb; pdb.set_trace()

# Ou avec ipdb (plus riche)
import ipdb; ipdb.set_trace()

# Logs détaillés
import logging
logger = logging.getLogger(__name__)
logger.debug(f"Valeur de la variable: {variable}")
```

#### Frontend

```typescript
// Console logs avec contexte
console.log('[SidebarComponent]', 'État actuel:', { collapsed, selectedId });

// Debugger JavaScript
debugger;

// React DevTools
// Installer l'extension navigateur React Developer Tools
```

---

## ✅ Bonnes pratiques

### Sécurité

#### Backend

- ✅ **Variables d'environnement**: Jamais de secrets en dur dans le code
- ✅ **Validation des entrées**: Pydantic pour toutes les requêtes
- ✅ **SQL Injection**: Utiliser exclusivement l'ORM SQLAlchemy
- ✅ **CORS**: Configuration stricte des origines autorisées
- ✅ **Rate limiting**: À implémenter avec slowapi
- ✅ **HTTPS**: Obligatoire en production
- ✅ **Headers de sécurité**: Helmet.js équivalent pour FastAPI

```python
# Exemple de configuration CORS sécurisée
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://pegasus.example.com"],  # Pas de "*" en prod
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

#### Frontend

- ✅ **XSS**: React échappe automatiquement, éviter dangerouslySetInnerHTML
- ✅ **Secrets**: Jamais de clés API côté client
- ✅ **HTTPS**: Forcer HTTPS en production
- ✅ **Validation**: Toujours valider côté serveur, pas uniquement client
- ✅ **Dependencies**: Audit régulier avec `npm audit`

### Performance

#### Backend

- ✅ **Connection pooling**: Configuré dans SQLAlchemy
- ✅ **Indexes DB**: Sur les colonnes fréquemment requêtées
- ✅ **Pagination**: Obligatoire pour toutes les listes
- ✅ **Caching**: Redis pour données fréquemment lues (à venir)
- ✅ **Async/await**: Utiliser pour opérations I/O
- ✅ **Select N+1**: Éviter avec `joinedload()` SQLAlchemy

```python
# Exemple de requête optimisée avec joinedload
from sqlalchemy.orm import joinedload

sites = db.query(Site)\
    .options(joinedload(Site.equipements))\
    .filter(Site.statut == "actif")\
    .limit(100)\
    .all()
```

#### Frontend

- ✅ **Code splitting**: Vite le fait automatiquement
- ✅ **Lazy loading**: Images et composants lourds
- ✅ **Memoization**: React.memo, useMemo, useCallback
- ✅ **Virtual scrolling**: Pour longues listes (react-window)
- ✅ **Debounce**: Pour recherche et autocomplétion
- ✅ **Bundle size**: Monitorer avec `npm run build -- --report`

```typescript
// Exemple de debounce pour recherche
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

const SearchInput = () => {
  const [query, setQuery] = useState('');
  
  const debouncedSearch = debounce((value: string) => {
    // Appel API uniquement après 300ms sans frappe
    fetch(`/api/v1/sites/search?q=${value}`);
  }, 300);
  
  useEffect(() => {
    if (query.length > 2) {
      debouncedSearch(query);
    }
  }, [query]);
  
  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Rechercher un site..."
    />
  );
};
```

### Maintenabilité

- ✅ **DRY**: Don't Repeat Yourself - factoriser le code dupliqué
- ✅ **SOLID**: Principes de conception orientée objet
- ✅ **Commentaires**: Expliquer le "pourquoi", pas le "quoi"
- ✅ **Documentation**: Docstrings à jour et exemples
- ✅ **Versioning**: Semantic versioning (semver.org)
- ✅ **Changelog**: Tenir à jour CHANGELOG.md
- ✅ **Dependencies**: Mettre à jour régulièrement
- ✅ **Refactoring**: Budget temps pour améliorer le code existant

### Qualité de code

#### Outils Backend

```bash
# Formatter
black app/

# Linter
flake8 app/
pylint app/

# Type checker
mypy app/

# Security audit
bandit -r app/

# Complexity
radon cc app/ -a
```

#### Outils Frontend

```bash
# Formatter
npm run format

# Linter
npm run lint

# Type checker
npm run type-check

# Security audit
npm audit

# Bundle analyzer
npm run build -- --report
```

---

## 🗺️ Roadmap

### Version 0.2.0 (Q1 2026) - CRUD complet

**Backend:**
- [ ] Schémas Pydantic pour validation entrées/sorties
- [ ] Endpoints POST, PUT, DELETE pour toutes les tables
- [ ] Gestion des transactions et rollback
- [ ] Validation métier avancée
- [ ] Logging structuré (JSON)
- [ ] Tests unitaires > 80% couverture

**Frontend:**
- [ ] Formulaires de création/édition
- [ ] Modales de confirmation suppression
- [ ] Gestion des états de chargement (skeleton screens)
- [ ] Gestion des erreurs utilisateur-friendly
- [ ] Toasts de notification (succès/erreur)

### Version 0.3.0 (Q2 2026) - Recherche & Filtres

**Backend:**
- [ ] Endpoint de recherche full-text
- [ ] Filtres avancés (multi-critères)
- [ ] Tri dynamique sur colonnes
- [ ] Export CSV/Excel
- [ ] Cache Redis pour requêtes fréquentes

**Frontend:**
- [ ] Barre de recherche globale
- [ ] Filtres par colonnes
- [ ] Tri multi-colonnes
- [ ] Pagination avancée (infinie ou numérotée)
- [ ] Boutons d'export
- [ ] Sauvegarde des filtres utilisateur

### Version 0.4.0 (Q3 2026) - Authentification & Autorisations

**Backend:**
- [ ] JWT authentication
- [ ] Gestion des rôles (admin, user, readonly)
- [ ] Endpoints /auth (login, logout, refresh)
- [ ] Permissions par endpoint
- [ ] Audit logs des actions utilisateur

**Frontend:**
- [ ] Page de login
- [ ] Gestion du token (localStorage sécurisé)
- [ ] Refresh automatique du token
- [ ] Menu utilisateur (profil, déconnexion)
- [ ] Protection des routes (guards)
- [ ] Affichage conditionnel selon rôle

### Version 0.5.0 (Q4 2026) - Cartographie

**Backend:**
- [ ] Endpoints geospatiaux (PostGIS)
- [ ] Recherche par rayon (within distance)
- [ ] Clustering de points
- [ ] Export GeoJSON

**Frontend:**
- [ ] Intégration Leaflet ou Mapbox
- [ ] Affichage des sites sur carte
- [ ] Clusters interactifs
- [ ] Popups avec infos site
- [ ] Dessin de polygones (zones)
- [ ] Géolocalisation utilisateur

### Version 0.6.0 (2027+) - Analytics & Dashboards

**Backend:**
- [ ] Endpoints de statistiques
- [ ] Agrégations complexes
- [ ] Métriques temps réel
- [ ] Webhooks pour événements

**Frontend:**
- [ ] Tableaux de bord personnalisables
- [ ] Graphiques (Chart.js / Recharts)
- [ ] KPIs en temps réel
- [ ] Export de rapports PDF
- [ ] Widgets drag & drop

### Version 1.0.0 (TBD) - Production Ready

**Infrastructure:**
- [ ] Docker & Docker Compose
- [ ] CI/CD (GitHub Actions)
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Alerting (PagerDuty / Opsgenie)
- [ ] Backups automatiques
- [ ] Documentation OpenAPI complète
- [ ] Guide de déploiement production

**Qualité:**
- [ ] Tests E2E (Playwright)
- [ ] Tests de charge (Locust)
- [ ] Couverture tests > 90%
- [ ] Documentation utilisateur
- [ ] Guide d'administration

---

## 🤝 Contribution

### Comment contribuer ?

Nous accueillons les contributions ! Voici comment participer :

1. **Fork** le dépôt
2. **Créer** une branche de feature (`git checkout -b feature/amazing-feature`)
3. **Commit** vos changements (`git commit -m 'feat: add amazing feature'`)
4. **Push** vers la branche (`git push origin feature/amazing-feature`)
5. **Ouvrir** une Pull Request

### Guidelines

- Suivre les standards de code (voir section [Standards de code](#standards-de-code))
- Ajouter des tests pour toute nouvelle fonctionnalité
- Mettre à jour la documentation si nécessaire
- S'assurer que tous les tests passent
- Décrire clairement les changements dans la PR

### Code de conduite

Ce projet adhère au [Contributor Covenant](https://www.contributor-covenant.org/) v2.1.

Comportements attendus :
- ✅ Utiliser un langage accueillant et inclusif
- ✅ Respecter les points de vue et expériences différents
- ✅ Accepter les critiques constructives avec grâce
- ✅ Se concentrer sur ce qui est meilleur pour la communauté

Comportements inacceptables :
- ❌ Langage ou imagerie sexualisés
- ❌ Trolling, commentaires insultants/désobligeants
- ❌ Harcèlement public ou privé
- ❌ Publication d'informations privées sans permission

### Reporting de bugs

Utiliser les **GitHub Issues** avec le template :

```markdown
**Description du bug**
Description claire et concise du problème.

**Reproduction**
Étapes pour reproduire :
1. Aller à '...'
2. Cliquer sur '...'
3. Voir l'erreur

**Comportement attendu**
Ce qui devrait se passer.

**Screenshots**
Si applicable, ajouter des captures d'écran.

**Environnement**
- OS: [e.g. macOS 13.0]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 0.1.0]

**Contexte additionnel**
Toute autre information pertinente.
```

### Demandes de fonctionnalités

Utiliser les **GitHub Issues** avec le label `enhancement` :

```markdown
**Problème à résoudre**
Description claire du besoin métier.

**Solution proposée**
Description de la fonctionnalité souhaitée.

**Alternatives considérées**
Autres approches envisagées.

**Contexte additionnel**
Screenshots, mockups, références...
```

---

## 📞 Support

### Ressources

- **Documentation API**: http://localhost:8000/docs (Swagger UI)
- **Documentation alternative**: http://localhost:8000/redoc (ReDoc)
- **Issues GitHub**: [github.com/votre-org/pegasus/issues](https://github.com)
- **Wiki**: [github.com/votre-org/pegasus/wiki](https://github.com)

### Contact

Pour toute question ou assistance :

- **Email**: support-pegasus@example.com
- **Slack**: #pegasus-support (workspace interne)
- **Documentation**: Consulter le wiki du projet

### FAQ

**Q: Comment réinitialiser la base de données ?**
```bash
# Attention : supprime toutes les données !
cd backend
alembic downgrade base
alembic upgrade head
```

**Q: Le frontend ne se connecte pas au backend**
- Vérifier que le backend est lancé sur le bon port (8000)
- Vérifier `VITE_API_URL` dans `.env.local`
- Vérifier la configuration CORS du backend

**Q: Erreur de connexion PostgreSQL**
- Vérifier que PostgreSQL est lancé
- Vérifier `DATABASE_URL` dans `backend/.env`
- Tester la connexion : `psql $DATABASE_URL`

**Q: Comment ajouter une nouvelle table ?**
1. Créer le modèle ORM dans `backend/app/db/tables.py`
2. Créer le router dans `backend/app/api/v1/routes_<table>.py`
3. Enregistrer le router dans `backend/app/api/v1/api.py`
4. Créer la migration Alembic (si besoin)

**Q: Comment personnaliser le thème ?**
- Modifier les couleurs dans `tailwind.config.js`
- Adapter les composants dans `src/components/`

---

## 📄 Licence

Ce projet est actuellement en phase **Beta interne**.

La licence, les conditions d'utilisation et le mode de contribution seront précisés ultérieurement selon le contexte de déploiement :
- **Usage interne** : Propriétaire
- **Client** : Licence commerciale sur-mesure
- **Open source** : À définir (MIT, Apache 2.0, GPL, etc.)

Pour toute question concernant la licence, contacter : legal@example.com

---

## 🙏 Remerciements

- **FastAPI** : Pour le framework backend moderne et performant
- **React** : Pour l'écosystème frontend robuste
- **SQLAlchemy** : Pour l'ORM puissant et flexible
- **Tailwind CSS** : Pour le système de design utility-first
- **Vite** : Pour le build tool ultra-rapide

---

## 📊 Statistiques du projet

![GitHub stars](https://img.shields.io/github/stars/votre-org/pegasus?style=social)
![GitHub forks](https://img.shields.io/github/forks/votre-org/pegasus?style=social)
![GitHub issues](https://img.shields.io/github/issues/votre-org/pegasus)
![GitHub pull requests](https://img.shields.io/github/issues-pr/votre-org/pegasus)
![GitHub last commit](https://img.shields.io/github/last-commit/votre-org/pegasus)
![GitHub contributors](https://img.shields.io/github/contributors/votre-org/pegasus)

---

<div align="center">

**Fait avec ❤️ par l'équipe Pegasus**

[⬆ Retour en haut](#-pegasus--plateforme-de-gestion-des-infrastructures-passives)

</div>