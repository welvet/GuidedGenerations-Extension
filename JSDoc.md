# Guided Generations Extension - Code Documentation

This document provides an overview of the JavaScript code structure and functions used in the Guided Generations extension.

## `index.js`

Main entry point for the Guided Generations extension. Initializes the extension, adds UI elements (buttons), and loads settings. Imports button functionality from the `/scripts/` directory.

### Constants

*   `EXTENSION_NAME`: (string) Extension name for logging.
*   `defaultSettings`: (GuidedGenerationsSettings) Default settings for the extension.

### Type Definitions

*   `GuidedGenerationsSettings`: 
    *   `isEnabled`: (boolean) Whether the extension is active and UI elements should be added.

### State Variables

*   `settings`: (GuidedGenerationsSettings) Current settings, loaded from storage or defaults.

### Functions

*   `loadSettings()`
    *   Loads extension settings.
*   `init()`
    *   Initializes the extension.
    *   Loads settings and sets up a MutationObserver to add UI elements when the DOM is ready.
*   `addExtensionButtons()`
    *   Adds the extension buttons to the SillyTavern UI.
    *   **Left Side Menu (Gear Icon):** Creates a gear icon button (`#gg-menu-button`) in `#leftSendForm` (next to the main extensions wand).
        *   This button toggles a popup menu (`#gg-tools-menu`).
        *   Items added to this menu:
            *   Simple Send (`#gg-simple-send-action`)
            *   Recover Input (`#gg-recover-action`)
    *   **Right Side Buttons:** Creates individual action buttons next to the main send button (`#send_but`) in `#rightSendForm`.
        *   Buttons added (in order before send button): Guided Response (🦮), Guided Swipe (👈), Guided Impersonate (👤)
    *   Attaches event listeners to trigger the corresponding imported functions.
    *   Ensures buttons/menus are not added multiple times.

### Initialization

*   Uses jQuery's `$(document).ready()` to ensure the DOM is loaded before calling `init()`.
*   `init()` uses a `MutationObserver` watching `document.body` to detect when `#rightSendForm`, `#extensions_menu`, and `#send_but` are present before calling `addExtensionButtons()`.

---

## `/scripts/simpleSend.js`

Contains the logic for the Simple Send button.

### Functions

*   `simpleSend()`
    *   Sends the current text in the input box as a message without generating an AI reply.
    *   Uses the stscript command: `/setglobalvar key=gg_old_input {{input}} | /send {{input}} | /setinput`

---

## `/scripts/inputRecovery.js`

Contains the logic for the Input Recovery button.

### Functions

*   `recoverInput()`
    *   Recovers the previously stored input (from `gg_old_input` global variable) and places it back into the main chat input field.
    *   Uses the stscript command: `/setinput {{getglobalvar::gg_old_input}}`

---

## `/scripts/guidedResponse.js`

Contains the logic for the Guided Response button.

### Functions

*   `guidedResponse()`
    *   Handles the Guided Response action:
        1.  Stores the current input in the `gg_old_input` global variable.
        2.  Injects the stored input as ephemeral instruction context (`gg_instruct`).
        3.  Triggers an AI generation (awaiting completion).
        4.  Restores the original input from `gg_old_input` back into the input field.
    *   Uses the stscript command: `/setglobalvar key=gg_old_input {{input}} | /inject id=gg_instruct position=chat ephemeral=true depth=0 [Context: {{getglobalvar::gg_old_input}}] | /trigger await=true | /setinput {{getglobalvar::gg_old_input}}`

---

## `/scripts/guidedSwipe.js`

Contains the logic for the Guided Swipe button.

### Functions

*   `guidedSwipe()`
    *   Handles the Guided Swipe action:
        1.  Stores the current input in the `gg_old_input` global variable.
        2.  Executes a swipe action (`/swipe`).
        3.  Restores the original input from `gg_old_input` back into the input field.
    *   Uses the stscript command: `/setglobalvar key=gg_old_input {{input}} | /swipe | /setinput {{getglobalvar::gg_old_input}}`

---

## `/scripts/guidedImpersonate.js`

Contains the logic for the Guided Impersonate button.

### Functions

*   `guidedImpersonate()`
    *   Handles the Guided Impersonate action (first person):
        1.  Stores the current input in the `gg_old_input` global variable.
        2.  Triggers an impersonation generation (`/impersonate`).
        3.  Restores the original input from `gg_old_input` back into the input field.
    *   Uses the stscript command: `/setglobalvar key=gg_old_input {{input}} | /impersonate | /setinput {{getglobalvar::gg_old_input}}`

---

## Executing STscript Commands

To interact with SillyTavern's core functionality like sending messages, swiping, setting input, managing context, or using global variables from within extension JavaScript code, you should use STscript slash commands.

The standard way to execute these commands is via the SillyTavern context object:

1.  **Get the Context:** Use `const context = SillyTavern.getContext();` or `import { getContext } from '../../../../extensions.js'; const context = getContext();`.
2.  **Execute Command:** Call the `executeSlashCommandsWithOptions(commandString)` method on the context object. This method can handle single commands (e.g., `/send Hello`) or multiple commands chained with `|` (e.g., `/setglobalvar key=x {{input}} | /send {{getglobalvar::x}}`).

**Example:**

```javascript
import { getContext } from '../../../../extensions.js';

async function setAndRestoreInput() {
    const inputElement = document.getElementById('send_textarea');
    const currentInput = inputElement ? inputElement.value : '';
    const escapedInput = currentInput.replace(/\|/g, '\\|'); // Escape pipe characters

    const commandSave = `/setglobalvar key=my_saved_input ${escapedInput}`;
    const commandRestore = `/setinput {{getglobalvar::my_saved_input}}`;

    try {
        const context = getContext(); // Or SillyTavern.getContext();

        // Check if the method exists before calling
        if (typeof context.executeSlashCommandsWithOptions === 'function') {
            // Save the input
            await context.executeSlashCommandsWithOptions(commandSave);
            console.log("Input saved.");

            // Do other stuff...

            // Restore the input
            await context.executeSlashCommandsWithOptions(commandRestore);
            console.log("Input restored.");
        } else {
            console.error("context.executeSlashCommandsWithOptions not found!");
        }
    } catch (error) {
        console.error("Error executing STScript:", error);
    }
}
```

**Important Notes:**

*   Always check if `SillyTavern.getContext` and `context.executeSlashCommandsWithOptions` exist before calling them to avoid errors if the SillyTavern version changes or the extension loads unexpectedly.
*   Escape special characters (like `|`) within user input (`{{input}}`) if inserting it directly into a command string to prevent parsing issues. Use `/setglobalvar` to store complex input first, then reference it with `{{getglobalvar::key}}`.
*   The `executeSlashCommandsWithOptions` function might be asynchronous, so using `await` is recommended if you need subsequent actions to wait for the command to complete (though the exact behavior might depend on the specific STscript command being run).

---

### `guidedResponse()`
{{ ... }}
