# ADR 001: Adoption of "The Focus Stepper" Cooking Interaction Model

- **Status:** Accepted
- **Date:** 2026-10-11
- **Decider:** Product Owner & Core Team
- **Technical Context:** Fogons Web Application

---

## 1. Context & Problem Statement

Traditional recipe websites and apps fail cooks in active kitchen environments. They are typically structured as long-form blog articles optimized for SEO and advertisement impressions rather than task execution. 

Key user failure points identified in traditional recipe apps:
1. **Loss of Position:** While stirring, searing, or whisking, the cook must constantly scroll up and down to find where they left off.
2. **Disconnected Ingredient Quantities:** Instructions say *"Add the cream and garlic,"* forcing the cook to scroll back to the top ingredient list to recall *"Was it 240ml or 120ml?"*, breaking kitchen flow.
3. **Static Measurements:** Scaling a recipe from 4 servings to 6 servings requires mental math under time pressure.
4. **Poor Physical Ergonomics:** Mobile screens dim or lock, small buttons require clean fingertips, and dense typography cannot be read from a counter distance of 2 to 3 feet.

---

## 2. Decision: Focus Stepper Experience (Expert 1)

Following an evaluation of three functional Proof of Concept paradigms (The Focus Stepper, The Flow Timeline, and The Dual-Deck Cockpit), **The Focus Stepper** was selected as the foundational user experience for Fogons.

```
┌────────────────────────────────────────────────────────┐
│  KITCHEN TOP BAR:  [✕ Close]   Recipe Title   [👥 4]   │
│  PROGRESS BAR:    [■■■■■■■■■■□□□□□□□□□□] Step 2 of 5   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  02  COOK PHASE                           ⏱️ 6m Timer   │
│  Sear the Chicken                                      │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ INGREDIENTS NEEDED NOW:                          │  │
│  │ [ 600g Chicken ]  [ 2 tbsp Olive Oil ]  [ 20g Butter ]│
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  "Heat olive oil and butter in a large skillet over    │
│   medium-high heat. Add chicken and sear undisturbed   │
│   until deep golden on both sides."                    │
│                                                        │
│  ┌─ CHEF'S TIP ──────────────────────────────────────┐ │
│  │ Don't overcrowd the pan. Internal temp: 74°C.     │ │
│  └───────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ TIMER WIDGET ────────────────────────────────────┐ │
│  │  ⏱️  06:00               [Reset]  [ START TIMER ]  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                        │
├────────────────────────────────────────────────────────┤
│  [ ← Previous Step ]       [ Next Step: Sauté Garlic → ]│
└────────────────────────────────────────────────────────┘
```

### Key Pillars of the Decision

1. **Strict Cognitive Isolation (One Step at a Time):**
   The user interface isolates a single atomic step on the screen. Extraneous future steps and past steps are tucked away to minimize distractions.

2. **Contextual Inline Scaled Ingredients:**
   Instead of forcing the user to consult an ingredient master list, each step explicitly surfaces the exact ingredients and scaled quantities required for that specific action.

3. **High-Contrast 3-Foot Glanceability:**
   Typography is tuned for legibility from a typical kitchen counter distance (2–3 feet), utilizing generous type sizing, distinct numerals (`01`, `02`), and high contrast color pairings.

4. **Integrated One-Tap Hardware Timers:**
   Whenever a step requires timed execution, a native countdown timer is embedded directly inside the step card, eliminating the need to leave the app for the phone's clock.

5. **Messy-Hand Touch Ergonomics:**
   Primary navigation relies on oversized bottom thumb targets (`Previous` / `Next Step`) that can easily be triggered with a knuckle or thumb without precise screen contact.

---

## 3. Approved Hybrid Enhancements

To address the known trade-offs of a strict stepper model, two enhancements from the other proposals are adopted into the standard Stepper specification:

1. **"Up Next" Preview Pill:**
   Above the primary "Next Step" button, a discreet teaser badge displays what is coming next (e.g., *"Up next: Sauté Aromatics (1.5 min)"*). This eliminates the "blind driving" sensation and allows the cook to anticipate subsequent tasks while waiting on a timer.

2. **Optional Pre-Cook "Mise en Place" Gate:**
   Prior to Step 1, the user is offered a quick 60-second prep screen to review and chop/measure all scaled ingredients before heat is introduced.

---

## 4. Consequences & Requirements

### Frontend Requirements
* Dynamic mathematical scaling engine with intelligent cooking fraction and unit rounding.
* State persistence for ongoing cook sessions (preserving current step and running timers on page refresh).
* Screen Wake Lock API integration to prevent display sleep during cook mode.
* Large hit target design system with accessible contrast ratios (WCAG AAA for active cooking elements).

### Backend / Data Contract Requirements
* Recipes must store both a **Master Ingredient List** (pegged to `base_servings`) and **Step-Level Ingredient References** with relative quantities, so the frontend can project exact amounts per step.
* Steps must support structured metadata: `step_number`, `title`, `phase`, `instruction`, `tip`, `timer_seconds`, and `ingredients_used`.
