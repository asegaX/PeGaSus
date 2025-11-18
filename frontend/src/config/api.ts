/**
 * Fichier : frontend/src/config/api.ts
 *
 * Ce module centralise la configuration des URLs d'API pour le frontend Pegasus.
 *
 * Objectifs :
 * -----------
 * - éviter de dupliquer les chaînes d'URL dans plusieurs composants ;
 * - faciliter le changement d'environnement (dev, staging, prod) ;
 * - fournir une seule source de vérité pour les endpoints métier.
 */

export const API_BASE_URL = "http://localhost:8000";

/**
 * Constante API_ENDPOINTS
 *
 * Dictionnaire des endpoints disponibles côté backend FastAPI.
 * Chaque clé correspond à une ressource métier (sites, trb, pmwo, swo).
 */
export const API_ENDPOINTS = {
  sites: `${API_BASE_URL}/api/v1/sites`,
  trb: `${API_BASE_URL}/api/v1/trb`,
  pmwo: `${API_BASE_URL}/api/v1/pmwo`,
  swo: `${API_BASE_URL}/api/v1/swo`,
} as const;
