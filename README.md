# Guided Generations Extension for SillyTavern

This extension brings the full power of the original "Guided Generations" Quick Reply set to SillyTavern as a native extension. It provides modular, context-aware tools for shaping, refining, and guiding AI responses—ideal for roleplay, story, and character-driven chats. All features are accessible via intuitive buttons and menus integrated into the SillyTavern UI.

See [`JSDoc.md`](./JSDoc.md) for code-level documentation.

---

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Contributing](#contributing)

---

## Features

### 🐕 Guided Response
*Inject instructions before the AI replies.*
- Type instructions and press 🐕.
- Your instructions guide the next AI response.

### 👈 Guided Swipe
*Regenerate the last AI message with new guidance.*
- Enter new instructions and press 👈 to generate a new swipe.
- Only available if the last message is from the AI.

### Impersonation (1st: 👤, 2nd: 👥, 3rd: 🗣️)
*Expand outlines into rich, in-character narratives.*
- Enter a brief outline, select perspective (toggle in settings), and press the corresponding button (👤/👥/🗣️).
- Your outline is expanded into a full message from the chosen viewpoint.
- Can be hidden or displayed individually per settings. 1st Person is displayed by default.

### 📖 Persistent Guides Menu
*Manage persistent scenario context via the 📖 menu.*
- Click the 📖 button to open the persistent guides menu.
- Select a guide type (see below) to generate or manage context.

**Guide Types:**
  - 🗺️ Situational: Generate context from recent chat or user focus.
  - 🧠 Thinking: Generate character thoughts (auto-trigger optional).
  - 👕 Clothes: Describe character outfits (auto-trigger optional).
  - 🧍 State: Detail character positions/status (auto-trigger optional).
  - 📜 Rules: Define or update in-story rules.
  - ➕ Custom: Inject user-defined context.

**Management Actions:**
  - ✏️ Edit Guides: Modify existing guide injections via popup.
  - 👁️ Show Guides: Display all active guides.
  - 🗑️ Flush Guides: Remove selected or all guides.
- Auto-trigger for Thinking, Clothes, and State can be toggled in settings.

### 🔖 Tools Menu
*Access additional utilities via the ✨ (wand) menu.*
  - **🔧 Corrections:** Edit the last AI message with targeted instructions.
  - **✅ Spellchecker:** Polish your input for grammar, punctuation, and flow.
  - **✈️ Simple Send:** Send input as a user message without triggering a model response.
  - **🖋️ Edit Intros:** Rewrite or transform introductory messages on demand.
  - **↩️ Input Recovery:** Restore previously cleared input.

---

## Installation

1. **Install the Extension:**
   - In the Extensionmanager click on Install Extension and enter https://github.com/Samueras/GuidedGenerations-Extension/ as the GITHUB


---

## Usage

- All main features appear as buttons next to the send button or in the left-side gear menu.
- Hover tooltips and context menus provide guidance and quick access to advanced features.
- See in-app settings for feature toggles and auto-guide configuration.
- For full technical details, see [`JSDoc.md`](./JSDoc.md).

---

## Troubleshooting

- **Missing Buttons:** Ensure SillyTavern is up to date (v1.12.9+) and LALib is installed/enabled.
- **Context Menus Not Appearing:** Try switching chats or re-adding the extension in the Quick Replies menu.
- **Other Issues:** Restart SillyTavern, check for updates, and consult the [SillyTavern documentation](https://github.com/SillyTavern/SillyTavern).

---

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

---

## Contributing

Contributions are welcome! Submit pull requests or open issues for improvements, features, or documentation. For questions or feedback, open an issue in this repository.

---
