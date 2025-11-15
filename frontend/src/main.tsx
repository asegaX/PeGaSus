/**
 * Fichier : frontend/src/main.tsx
 *
 * Point d'entrée principal de l'application React.
 * Il monte le composant racine <App /> dans le DOM.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Styles globaux Vite par défaut (peuvent être adaptés)

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
