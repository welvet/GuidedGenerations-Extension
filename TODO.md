# SillyTavern Guided Generations Extension - TODO List

This list outlines the steps to develop the Guided Generations extension based on the `SCOPE.md`.

**Phase 1: Project Setup & Foundation**

1.  [ ] **Understand SillyTavern Extension Structure:**
    *   [ ] Analyze existing extensions in `References/SillyTavern` (look for patterns: `public/extensions/`, `script.js`, `style.css`, manifests).
    *   [ ] Identify extension registration, UI element addition, and core API interaction methods.
2.  [ ] **Create Basic Extension Files:**
    *   [ ] `script.js` (Main logic)
    *   [ ] `style.css` (Styling)
    *   [ ] `config.json` / `manifest.json` (If needed)
    *   [ ] `README.md` (Initial description)
3.  [ ] **Basic UI Integration:**
    *   [ ] Register the extension with SillyTavern.
    *   [ ] Add a primary UI entry point (e.g., button/menu).

**Phase 2: Core Feature Implementation (Simpler Features)**

4.  [ ] **Input Recovery (🛟):**
    *   [ ] Implement temporary `old_input` storage.
    *   [ ] Add UI element to restore `old_input`.
5.  [ ] **Simple Send (➕):**
    *   [ ] Add UI element.
    *   [ ] Use SillyTavern API to send message without AI reply.
6.  [ ] **Guided Response (🦮):**
    *   [ ] Add UI element.
    *   [ ] Store `old_input`.
    *   [ ] Use API to inject context (`instruct` ID).
    *   [ ] Use API to trigger AI response.
    *   [ ] Restore `old_input`.
    *   [ ] *Later:* Add group chat selection logic.
7.  [ ] **Guided Swipe (➡️):**
    *   [ ] Add UI element.
    *   [ ] Check last message author.
    *   [ ] Store `old_input`.
    *   [ ] Use API to inject context.
    *   [ ] Use API to trigger swipe.
    *   [ ] Restore `old_input`.
8.  [ ] **Guided Impersonation (✍️, ✍️2, ✍️3):**
    *   [ ] Add UI elements (consider initial visibility).
    *   [ ] Use API for impersonation with correct perspective instructions.
    *   [ ] Implement `old_input`/`new_input` check logic.

**Phase 3: Persistent Guides Implementation (Complex)**

9.  [ ] **Persistent State Management:**
    *   [ ] Choose storage mechanism for active guides.
    *   [ ] Map SillyTavern APIs for `inject`, `listinjects`, `flushinjects` to required IDs (`situation`, `thinking`, `clothes`, `state`, `rule_guide`, `Custom`).
10. [ ] **Persistent Guides UI - Main Menu (🤔):**
    *   [ ] Create main UI panel/modal.
    *   [ ] Add buttons for guide types & actions.
11. [ ] **Show/Flush Guides:**
    *   [ ] Implement "Show Guides" (list API -> HTML popup).
    *   [ ] Implement "Flush Guides" (list API -> select -> remove API).
12. [ ] **Edit/Custom Guides:**
    *   [ ] Implement "Edit Guides" (list -> select -> display in textarea -> save with inject API).
    *   [ ] Implement "Custom Guide" (textarea -> check existing -> save/update with inject API).
13. [ ] **Guide Generation (using `/gen` equivalent):**
    *   [ ] Identify SillyTavern API for prompted generation.
    *   [ ] Implement generation for: Situational, Rules, Thinking, Clothes, State guides.
    *   [ ] Handle preset switching if needed.
    *   [ ] Inject generated content with correct IDs.

**Phase 4: Settings & Finalization**

14. [ ] **Settings UI (⚙️):**
    *   [ ] Create settings UI section/modal.
    *   [ ] Add toggles for auto-triggers and impersonation visibility.
15. [ ] **Settings Logic & Storage:**
    *   [ ] Store settings preferences.
    *   [ ] Apply settings (show/hide UI, implement auto-trigger logic).
16. [ ] **Styling & Polish:**
    *   [ ] Refine UI with `style.css`.
    *   [ ] Ensure consistency.
17. [ ] **Testing & Debugging:**
    *   [ ] Test all features thoroughly.
    *   [ ] Debug issues.
18. [ ] **Documentation:**
    *   [ ] Update `README.md` with final instructions and usage.

**Phase 5: Character Description Management (New Feature)**

19. [ ] **Storage Design:**
    *   [ ] Determine storage for: Original (reference), Current Updated, Previous Updated descriptions (e.g., `localStorage` keyed by character ID).
20. [ ] **API Identification:**
    *   [ ] Find API to get original description.
    *   [ ] Find API to get relevant chat history.
    *   [ ] Find API/method to override description used by AI (context injection? direct data mod?).
    *   [ ] Find API for LLM generation (`/gen`).
21. [ ] **Update Logic Implementation:**
    *   [ ] Develop LLM prompt for description update.
    *   [ ] Implement logic: Trigger LLM -> Store New (Current Updated) -> Move Old (Current Updated) to Previous Updated.
22. [ ] **Context Override Implementation:**
    *   [ ] Ensure the Current Updated description is prioritized by the AI.
23. [ ] **Revert Logic Implementation:**
    *   [ ] Implement function to swap Current Updated and Previous Updated descriptions.
    *   [ ] Ensure AI context uses the reverted description.
24. [ ] **UI Elements:**
    *   [ ] Add UI button to trigger description update.
    *   [ ] Add UI button to revert to previous updated description (enable only if previous exists).
