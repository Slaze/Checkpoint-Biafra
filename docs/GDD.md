# Checkpoint Biafra — Game / Product Design Document

| Field | Value |
|-------|-------|
| Product | **Checkpoint Biafra** |
| Document version | 0.1 |
| Last updated | 2026-10-06 |
| Owner | Iconia Global / Ugoo |
| Status | Living (wave 2 draft) |
| Live URL | https://cpb.iconiaglobal.com/ (also Vercel production alias) |
| Stem | slug `checkpoint-biafra` (featured) |
| Related | Stem discovery · historical fiction (not a documentary simulator for schools without framing) |

### Cover blurb

Checkpoint Biafra puts you behind an immigration desk at a contested eastern crossing in the season of Biafran secession. Travellers arrive with papers, stories, and pressure. You Deny, Detain, or let through — while hunger, naira, gossip, and side decisions chew the posting. It is a tense booth game about judgment under incomplete truth, not a shooter and not a lecture with a quiz at the end.

---

## 1. Identity

### In one sentence
A first-person border-booth judgment game set around the 1967 Biafra moment — papers, people, and consequences.

### Plain English
**Genre:** Narrative · judgment · historical fiction · single-player booth.  
**Platforms:** Installable web PWA; Stem listing; phone and desktop.  
**Feel:** Wood desk, your hands in frame, papers stacked, window pressure, naira till, day/night posting rhythm.  
**Not:** A war shooter. Not a meme clicker. Not “pick the obvious villain every time.”

### What people feel / do
Responsibility, suspicion, pity, fatigue. The fantasy is *power with incomplete information*.

### Examples
A traveller’s tax ticket has a one-letter typo. A decoy school ID sits beside a baptism card. Gossip from the window contradicts the passport. You choose — and the ledger remembers.

### Copy snippets
- “Read the papers. Hold the window.”  
- “The posting ends when the pot runs out.”

### Open questions
- **(OPEN)** Content warning strength on first launch for younger teens.

---

## 2. Promise / fantasy

### In one sentence
You are the officer whose stamp changes a life today — and whose mistakes change your posting tomorrow.

### Plain English
Fantasy:

> “I am not watching history. I am staffing it — badly paid, badly slept, still deciding.”

The game sells moral tension and craft (spotting mismatches, resisting telegraph hints) more than high scores alone.

### What people feel / do
Pride after a clean day; dread after three unpaid food nights; curiosity about the next traveller’s deck.

### In scope / out of scope
**In:** Booth craft, ledger, hunger/economy pressure, unique travellers.  
**Out:** Real-time PvP; recruiting players into real political militancy.

---

## 3. Core loop

### In one sentence
Traveller arrives → inspect papers / listen → decide (admit / deny / detain / handle side event) → ledger & till update → endure the posting day/night → repeat until ending.

### Plain English
1. **Report for duty** — character / posting setup without a blinding overlay.  
2. **Window beat** — a person, papers, flags, rumours, possible decoys.  
3. **Decision** — including “Decision Required” side-events that still count as play.  
4. **Aftermath** — naira, errors, axes, window rows in end-of-day.  
5. **Night / hunger** — unpaid food nights stack; three consecutive can end the posting (“THE POT RAN OUT”).  
6. **Try again** with sharper reading.

**Session:** one intense posting chunk 15–40 minutes; shorter “one more traveller” snacks possible.

### Copy snippets
- “Deny and Detain should feel different — read the full warning.”  
- “Typos matter more than theatrical fake names.”

---

## 4. Roles & surfaces

### In one sentence
You are always the officer; NPCs are travellers, window voices, and the till.

| Surface | Job |
|---------|-----|
| Booth / desk POV | Main stage (hands, papers, wood) |
| Papers / IDs | Evidence |
| Flags / warnings | Full text, not cryptic colour cheats |
| Till / HUD | Naira honesty |
| Side-event cards | Interruptions that still write the ledger |
| Endings | Starvation / posting outcomes |

No separate “god mode” for players. Admin/LLM tools are off-stage.

---

## 5. Systems

### In one sentence
Unique decks keep the booth alive; money and hunger make time hurt; decisions write a ledger you cannot shrug off.

### Plain English
- **Unique content pools** — names, gossip, rumours, conditions, window beats; recycle only when exhausted.  
- **Igbo-default naming** with foreign travellers getting matching names.  
- **Mismatch design** — subtle typo on tickets, not cartoon different-person swaps.  
- **Decoy documents** — baptism, market union, school ID, old permit, town union.  
- **Naira economy** — till in ₦; rates and garnishments spoken in money language.  
- **Hunger ending** — three unpaid food nights → posting ends.  
- **Side-events** — count as gameplay (dayResults, till, errors).  
- **Anti-telegraph** — avoid UI that screams the “right” button via colour classes alone.

### Open questions
- **(OPEN)** Optional LLM-flavoured lines vs fully authored decks for shipping stability.

---

## 6. World / content model

### In one sentence
Ogoja-area contested crossing fiction in May 1967-forward time — people, papers, rumours, offices, war noise at the edge.

### Plain English
World atoms: travellers, document sets, offices, window chatter, infractions, war/other-office cards. Tone: serious playable history-fiction. Avoid anachronistic slogans that break the year. Ethnicity and names treated with care and specificity.

---

## 7. Experience map

### In one sentence
First duty teaches reading papers; first mistake teaches the ledger; hunger teaches that the posting is a body, not only a brain.

**Stages:** Splash → duty → first clean decision → first hard mismatch → first side-event → first night pressure → ending or mastery of a week.

**Screenshot checklist:** desk hands + papers · full warning text · naira HUD · Decision Required · ending card.

---

## 8. Monetization & constraints

### In one sentence
The game itself is free-to-play as a PWA; monetization must never sell “skip conscience.”

### Plain English
Free web install via Stem/PWA. Possible later: supporter pack, director’s commentary — **not** pay-to-win judgments.  
**Constraints:** Historical sensitivity; content warnings; no hate-recruitment framing; privacy of any future accounts.

---

## 9. Success metrics

| Metric | Why |
|--------|-----|
| Duty started → first decision | Hook |
| Unique travellers seen before repeat | Content health |
| Hunger ending understood (not rage-quit confusion) | Systems clarity |
| Stem install → return | Discovery |
| “I had to re-read the papers” stories | Fantasy alive |

---

## 10. Out of scope & open questions

**Out:** Multiplayer border. Military training sim. Comic racism as joke fuel.  
**OPEN:** School edition with teacher framing; localization; audio drama pass; Cloudflare always-on for `cpb` (product already aliased).

---

## Appendix A — Glossary

| Term | Meaning |
|------|---------|
| **Booth / posting** | Your duty assignment at the checkpoint |
| **Ledger** | Record of decisions and outcomes |
| **Till** | Your naira money on duty |
| **Detain vs Deny** | Different judgments — must not be colour-cheated |
| **Decoy ID** | Extra paper meant to distract or test care |
| **Decision Required** | Side event that still counts |
| **Pot ran out** | Hunger ending after unpaid nights |

## Appendix B — Excerpt bank

**Elevator:** Staff a Biafra-season checkpoint booth. Read papers, catch typos and decoys, manage naira and hunger, live with the ledger.  
**Store short:** Border checkpoint game.  
**Store long:** Checkpoint Biafra is a first-person booth game set during the Biafran secession. Travellers bring messy papers and harder stories. Deny, detain, or pass them while your till, reputation, and hunger rewrite the posting. Install free as a web app.  
**Tweet:** The window does not care that you are tired. Read the papers anyway.  
**FAQ — history exact?** Historical fiction grounded in a real season — not a textbook replacement.  
**FAQ — shoot people?** No. Judgment and paperwork pressure.

## Appendix T — Builders (short)

PWA `cpb.iconiaglobal.com` · Stem `checkpoint-biafra` · versioning via `?cb=` / SW · see `PROJECT_RECAP.md`.
