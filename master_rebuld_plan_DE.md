# Master-Plan zur Neuerstellung der Unicum Tech Plattform

Nach einer detaillierten Analyse des aktuellen Quellcodes (Datenbank-Migrationen, Frontend-Kontext und Edge Functions) wurde dieser Plan erstellt. Er ist darauf ausgelegt, von einem KI-Agenten Schritt für Schritt umgesetzt zu werden, wobei der Fokus auf Skalierbarkeit, Sicherheit und einer erstklassigen User Experience liegt.

## Fokus: Multi-Tenancy (Mandantenfähigkeit)
Das System ist von Grund auf so aufgebaut, dass hunderte Firmen (Organisationen) isoliert voneinander auf der Plattform arbeiten können. Dies wird durch `org_id` in fast jeder Tabelle und Row Level Security (RLS) in der Datenbank erreicht.

---

## Phasenübersicht

### Phase 1: Tech-Stack & Basis-Infrastruktur [DONE]
- **Modernes Frontend**: [x] Vite, TypeScript, Tailwind 4, React 18.
- **Mehrsprachigkeit**: [x] i18next (DE, EN, AR) mit RTL-Support.
- **Landingpage**: [x] Navbar, Hero, Services, Features, Kontakt, Footer.
- **Performance & SEO**: [x] Lighthouse-Audit 95+ (LCP/FCP optimiert).

### Phase 2: Auth-System & Organisation Management [DONE]
- **Supabase Integration**: 
  - Einrichtung der `.env` Zugangsdaten.
  - Implementierung des `Supabase`-Clients (`src/lib/supabase.ts`).
- **Authentifizierung**:
  - Login- & Registrierungs-UI (Magic Link/Email).
  - Geschützte Dashboard-Routen basierend auf Auth-Status.
- **Organization State**:
  - Datenbank-Schema für `organizations`, `profiles`, `org_members`.
  - Implementierung des `OrgContext` für dynamisches Branding und Slug-Mapping.
  - RLS (Row Level Security): Mandantentrennung auf DB-Ebene.

### Phase 3: CRM & Sales-Logik (Datenmodell) [DONE]
- **Kontakte**: `email_subscribers` mit Tags, Status und Lead-Scoring.
- **Pipeline**: Flexibles Phasen-System (`pipeline_stages`) zur Abbildung individueller Sales-Prozesse.
- **Deal-Management**: Verknüpfung von Kontakten mit Geschäftswerten.
- **Timeline**: `contact_activities` für eine lückenlose Historie (E-Mails, Notizen, Statusänderungen).

### Phase 4: Communication Hub & AI-Integration [DONE]
- **Live-Chat**: Real-time Messaging via Supabase Realtime.
- **Besucher-Widget**: Einbettbares Script für externe Webseiten.
- **Support-Ticketsystem**: Management von Anfragen mit Prioritäten und Zuweisungen.
- **AI-Features**: Integration von **Gemini Pro** (per Edge Function). Automatische Antwortvorschläge und Sentiment-Analyse, individuell konfigurierbar pro Organisation.

### Phase 5: Marketing-Automatisierung & E-Mail [DONE]
- **SMTP-Engine**: Individuelle SMTP-Einstellungen pro Organisation (`smtp_settings`) für hohe Zustellraten.
- **Kampagnen-Engine**: E-Mail-Templates (Drag & Drop), Kampagnen-Planer und Automatisierungs-Sequenzen (Drip-Kampagnen).
- **Tracking**: `email_events` zur Analyse von Öffnungen, Klicks und Bounces.

### Phase 6: Buchungssystem & Kalender [DONE]
- **Booking-Widget**: Öffentliche Landingpage für Termine (`/o/:slug/book`).
- **Kalender-Sync**: Bi-direktionaler Sync mit Google Calendar via OAuth und Webhooks.
- **Verfügbarkeit**: Intelligente Slot-Berechnung unter Berücksichtigung von Pufferzeiten und Doppelbuchungsschutz.

### Phase 7: Preisrechner-Modul (Nischen-Feature) [DONE]
- **Konfigurator**: Dynamischer Aufbau von Rechnern für Dienstleistungen, Kategorien und komplexe Rabatt-Logiken.
- **Lead-Capture**: Automatische Erstellung von Kontakten und Deals aus Rechner-Anfragen.

### Phase 8: Plattform-Management & Monetarisierung [DONE]
- **Billing**: Stripe Billing Integration für Abonnements (Free, Pro, Enterprise).
- **Super-Admin Interface**: Globales Dashboard zur Verwaltung von Organisationen, Nutzern und Systemmetriken.
- **Polish**: SEO-Optimierung (Meta-Tags, Sitemap), Image-Processing und finale Performance-Audits.
- **Auditing**: Implementierung von Audit-Logs für sicherheitskritische Aktionen.

---

## Verifizierungsplan
Der Agent sollte nach jeder Phase folgende Schritte durchführen:
1. **Schema-Validierung**: Überprüfung der Datenbank-Tabellen auf RLS-Konformität.
2. **Komponenten-Tests**: Sicherstellen, dass die UI-Komponenten responsiv und barrierefrei sind.
3. **Multi-Tenancy Check**: Verifizierung, dass Daten zwischen zwei Test-Organisationen strikt getrennt bleiben.
