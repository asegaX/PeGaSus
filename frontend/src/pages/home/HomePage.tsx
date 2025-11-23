/**
 * Fichier : frontend/src/pages/home/HomePage.tsx
 *
 * Page d'accueil (landing page) de l'application Pegasus.
 *
 * Rôle :
 * ------
 * - offrir une introduction métier à la maintenance préventive
 *   des infrastructures passives télécom ;
 * - rappeler l'importance du suivi des SLA et de la performance opérationnelle ;
 * - proposer des raccourcis clairs et élégants vers :
 *   - les dashboards (SLA, Daily, Weekly, Monthly, Pending SWO) ;
 *   - les tables opérationnelles (Sites, TRB, PMWO, SWO).
 *
 * Design & implémentation :
 * -------------------------
 * - toute la mise en forme visuelle est gérée dans `HomePage.css`
 *   (hero encadré par un gradient, cartes, KPI, micro-animations, etc.) ;
 * - ce composant TSX se concentre sur :
 *   - la structure sémantique,
 *   - le contenu métier,
 *   - les liens de navigation (react-router-dom / <Link>).
 */

import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

/**
 * Composant HomePage
 *
 * Présente :
 * - un bloc "hero" avec titre, badges SLA et message métier
 *   sur la maintenance préventive de l'infrastructure passive ;
 * - un panneau latéral mettant en avant quelques indicateurs SLA clés ;
 * - des cartes de navigation vers les dashboards et les tables Pegasus.
 */
const HomePage: React.FC = () => {
  return (
    <div className="home-root">
      {/* HERO : contexte métier + message central */}
      <section className="home-hero-shell">
        <div className="home-hero">
          <div className="home-hero-main">
            <p className="home-hero-kicker">
              Maintenance préventive · Infra passive
            </p>

            {/* Badges de focus métier */}
            <div className="home-hero-badges">
              <span className="home-hero-badge">SLA énergie</span>
              <span className="home-hero-badge">Disponibilité sites</span>
              <span className="home-hero-badge">Préventif vs correctif</span>
            </div>

            <h1 className="home-hero-title">
              Piloter la performance des sites{" "}
              <span className="home-hero-title-accent">télécom</span> plutôt que
              subir les pannes.
            </h1>

            <p className="home-hero-lead">
              Pegasus centralise vos tickets TRB, ordres de travail PMWO/SWO et
              inventaire sites pour suivre, en temps réel, la santé de
              l&apos;infrastructure passive. L&apos;objectif&nbsp;: anticiper
              les dérives, sécuriser les SLA et améliorer durablement la
              disponibilité réseau.
            </p>

            <div className="home-hero-pillars">
              <div className="home-hero-pillar">
                <h3>Maintenance préventive structurée</h3>
                <p>
                  Planifier les PMWO, suivre leur exécution et tracer les
                  actions réalisées sur chaque site pour réduire les TRB
                  récurrents et les pannes critiques.
                </p>
              </div>
              <div className="home-hero-pillar">
                <h3>SLA contractuels maîtrisés</h3>
                <p>
                  Visualiser l&apos;impact des incidents et des délais
                  d&apos;intervention sur les SLA énergie, accès site et
                  disponibilité globale afin de limiter les pénalités.
                </p>
              </div>
              <div className="home-hero-pillar">
                <h3>Vision globale en un clic</h3>
                <p>
                  Passer des dashboards consolidés aux enregistrements détaillés
                  (sites, tickets, ordres de travail) sans perdre le contexte
                  opérationnel.
                </p>
              </div>
            </div>

            <div className="home-hero-cta-row">
              <Link to="/sla" className="home-cta-primary">
                Accéder au Dashboard SLA
              </Link>
              <Link to="/sites" className="home-cta-secondary">
                Explorer les sites
              </Link>
            </div>
          </div>

          {/* Panneau KPI SLA */}
          <aside className="home-hero-kpis">
            <h2 className="home-kpi-title">SLA clés à surveiller</h2>
            <p className="home-kpi-caption">
              Exemple de quelques indicateurs suivis dans Pegasus. Ces valeurs
              seront prochainement alimentées par les dashboards.
            </p>

            <div className="home-kpi-list">
              <div className="home-kpi-card">
                <div className="home-kpi-card-header">
                  <span className="home-kpi-pill home-kpi-pill--energy">
                    Énergie
                  </span>
                  <span className="home-kpi-trend home-kpi-trend--up">
                    +0,3 pts vs M-2
                  </span>
                </div>
                <div className="home-kpi-label">
                  Disponibilité énergie moyenne (M-1)
                </div>
                <div className="home-kpi-value">99,4%</div>
                <div className="home-kpi-meta">
                  Objectif contrat : <span>≥ 99,0%</span>
                </div>
              </div>

              <div className="home-kpi-card">
                <div className="home-kpi-card-header">
                  <span className="home-kpi-pill home-kpi-pill--incident">
                    Incidents
                  </span>
                  <span className="home-kpi-trend home-kpi-trend--stable">
                    stable vs semaine précédente
                  </span>
                </div>
                <div className="home-kpi-label">
                  TRB résolus dans le délai SLA
                </div>
                <div className="home-kpi-value">92%</div>
                <div className="home-kpi-meta">
                  SLA typique : <span>4 h urbain / 8 h rural</span>
                </div>
              </div>

              <div className="home-kpi-card">
                <div className="home-kpi-card-header">
                  <span className="home-kpi-pill home-kpi-pill--preventive">
                    Préventif
                  </span>
                  <span className="home-kpi-trend home-kpi-trend--down">
                    -5% de backlog
                  </span>
                </div>
                <div className="home-kpi-label">
                  Taux de réalisation des PMWO planifiés
                </div>
                <div className="home-kpi-value">88%</div>
                <div className="home-kpi-meta">
                  Dérive acceptable &lt; 10% pour éviter les pannes répétitives.
                </div>
              </div>
            </div>

            <div className="home-kpi-footer">
              <span className="home-kpi-dot" />
              <span>
                Les futures versions liront ces indicateurs directement depuis
                les dashboards Daily / Weekly / Monthly.
              </span>
            </div>
          </aside>
        </div>
      </section>

      {/* NAVIGATION FONCTIONNELLE */}
      <section className="home-nav-section">
        <header className="home-nav-header">
          <h2>Par où commencer&nbsp;?</h2>
          <p>
            Choisissez une vue adaptée à votre besoin : pilotage global via
            dashboards ou analyse détaillée des enregistrements issus de
            Pegasus.
          </p>
        </header>

        <div className="home-nav-grid">
          {/* Bloc Dashboards */}
          <article className="home-nav-card">
            <h3 className="home-nav-card-title">Dashboards opérationnels</h3>
            <p className="home-nav-card-text">
              Consolidez vos SLA, suivez les volumes de tickets et la charge
              préventive sur des horizons quotidiens, hebdomadaires ou
              mensuels.
            </p>

            <div className="home-nav-chip-row">
              <Link to="/siteboard" className="home-nav-chip">
                Dashboard site
              </Link>
              <Link to="/sla" className="home-nav-chip">
                Dashboard SLA
              </Link>
              <Link to="/daily" className="home-nav-chip">
                Daily
              </Link>
              <Link to="/weekly" className="home-nav-chip">
                Weekly
              </Link>
              <Link to="/monthly" className="home-nav-chip">
                Monthly
              </Link>
              <Link to="/pendingswo" className="home-nav-chip">
                Pending SWO
              </Link>
            </div>

            <p className="home-nav-card-footnote">
              Idéal pour les comités hebdomadaires, le suivi des pénalités et
              les revues de performance avec l&apos;opérateur.
            </p>
          </article>

          {/* Bloc Tables / inventaire */}
          <article className="home-nav-card home-nav-card--secondary">
            <h3 className="home-nav-card-title">Vue détaillée des données</h3>
            <p className="home-nav-card-text">
              Plongez dans chaque enregistrement pour comprendre les causes
              racine, la chronologie des interventions et la situation de
              chaque site.
            </p>

            <div className="home-nav-links">
              <Link to="/sites" className="home-nav-link">
                <span className="home-nav-link-label">Sites</span>
                <span className="home-nav-link-desc">
                  Inventaire des sites, classes et configurations énergie.
                </span>
              </Link>

              <Link to="/trb" className="home-nav-link">
                <span className="home-nav-link-label">TRB</span>
                <span className="home-nav-link-desc">
                  Tickets d&apos;incident, pannes et rétablissements.
                </span>
              </Link>

              <Link to="/pmwo" className="home-nav-link">
                <span className="home-nav-link-label">PMWO</span>
                <span className="home-nav-link-desc">
                  Ordres de travail préventifs planifiés / réalisés.
                </span>
              </Link>

              <Link to="/swo" className="home-nav-link">
                <span className="home-nav-link-label">SWO</span>
                <span className="home-nav-link-desc">
                  Interventions spécifiques et actions ponctuelles ciblées.
                </span>
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
