# Design Document – Spendt (PWA Budget Manager)

## 1. Overview

Spendt is a mobile-first Progressive Web App (PWA) for ultra-fast personal expense tracking.

It is designed for speed, automation, and minimal interaction, allowing users to log expenses in seconds or auto-fill entries via deep links (e.g., MacroDroid triggers).

Google Sheets is used as the data store, enabling a no-backend architecture.

---

## 2. Product Philosophy

### 2.1 Instant Over Feature-Rich

Spendt prioritizes speed over complexity. Every interaction should feel immediate.

### 2.2 Capture First, Organize Later

Users should be able to log expenses instantly and refine details afterward.

### 2.3 Automation-Friendly

Designed to integrate with external triggers (SMS → MacroDroid → deep link).

### 2.4 App-Like Experience

Must feel like a native mobile app despite being a PWA.

---

## 3. Navigation Structure

* `/` → Dashboard
* `/add` → Quick Add
* `/transactions` → History
* `/stats` → Insights

---

## 4. Core Features

### 4.1 Quick Add (Primary Interaction)

* Large, auto-focused amount input
* One-tap category selection
* Minimal optional fields (note, type)
* Prominent Save CTA
* Optimized for 2–3 tap completion

Supports deep links:

* `/add?amount=500&merchant=Zomato&mode=quick&auto=true`

---

### 4.2 Dashboard

* Current balance (primary focus)
* Monthly spend summary
* Recent transactions
* Category previews
* Floating Action Button (FAB)

---

### 4.3 Transactions

* Clean, scrollable list
* Each item shows:

  * amount
  * category
  * note/merchant
  * date
* Filters:

  * category
  * date range

---

### 4.4 Insights

* Monthly spending trend
* Category breakdown
* Minimal charts (no clutter)

---

## 5. Data Model (Google Sheets)

### Transactions

* id (UUID)
* date
* amount
* type (debit | credit)
* category
* note
* source (manual | sms)
* created_at

### Categories

* id
* name
* icon
* color

---

## 6. Automation Flow

### External Trigger (MacroDroid)

* Detect SMS
* Extract amount + merchant
* Open deep link:
  `/add?amount=500&merchant=Zomato&auto=true`

### App Behavior

* Parse query params
* Prefill form
* If `auto=true`:

  * Option A: Auto-save silently
  * Option B: Show confirm UI (recommended)

---

## 7. UI/UX Guidelines

### 7.1 Visual Design

* Dark mode default
* High contrast for readability
* Accent color for actions (e.g., electric blue or neon green)
* Rounded corners, soft elevation

### 7.2 Layout Principles

* Bottom-heavy interaction zones
* Large touch targets
* Minimal text, strong visual hierarchy

### 7.3 Interaction Design

* Instant transitions
* Subtle animations
* No blocking loaders
* Optimistic UI updates

---

## 8. Quick Add UX (Critical Flow)

### Default Mode

* Open `/add`
* Focus on amount input
* Keyboard visible immediately

### Quick Mode (`mode=quick`)

* Minimal UI
* Category row visible
* Save action always accessible

### Auto Mode (`auto=true`)

* Prefill data
* Trigger:

  * Auto-save OR
  * Confirm bottom sheet

---

## 9. PWA Capabilities

* Installable on home screen
* Multiple entry points via deep links:

  * Main app
  * Quick Add shortcut
* Offline caching
* Background sync (best effort)

---

## 10. Edge Cases

* No internet:

  * Store locally (IndexedDB)
  * Sync later

* Duplicate SMS entries:

  * Deduplicate using timestamp + amount

* Invalid deep links:

  * Fallback to manual entry

---

## 11. Performance Goals

* App load < 2s on mobile
* Add transaction < 1s interaction time
* Smooth 60fps scrolling

---

## 12. Tech Stack

* Vite + React + TypeScript
* Zustand (state)
* IndexedDB (offline)
* Google Sheets API
* vite-plugin-pwa

---

## 13. Future Enhancements

* Smart category detection (AI)
* Recurring expenses
* Budget alerts
* Multi-device sync improvements
* Optional backend upgrade

---

## 14. Experience Goal

Spendt should feel like:

* A reflex, not a task
* Faster than opening your notes app
* Invisible until needed

Logging an expense should take less effort than remembering it.
