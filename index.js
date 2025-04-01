// Import SillyTavern core functions and context
// Assuming placement in data/default-user/extensions/your-extension-name/
// Using paths based on provided third-party example
import { eventSource } from '../../../../script.js'; // For event handling (will use later)
import { extension_settings } from '../../../extensions.js'; // Access to extension settings

// Constants
const EXTENSION_NAME = "Guided Generations";
const EXTENSION_ID = "guided-generations"; // Used for CSS IDs etc.

// State variable for Input Recovery
let storedInput = null;
let isSending = false; // Flag to prevent double execution

// Initial settings (can be expanded later)
const defaultSettings = {
    isEnabled: true, // Default to enabled
};

// Hold the current settings
let settings = { ...defaultSettings };

// Function to send message without AI reply (Simple Send)
// ASSUMING SillyTavern is globally available
const simpleSend = () => {
    if (isSending) {
        console.log(`${EXTENSION_NAME}: simpleSend already in progress, skipping.`);
        return;
    }
    isSending = true;
    console.log(`${EXTENSION_NAME}: simpleSend function entered (isSending = true).`);
    // Check if SillyTavern and getContext exist globally
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        const messageText = String($("#send_textarea").val());

        if (!messageText.trim()) {
            console.log("GG Simple Send: Input is empty.");
            return;
        }

        const command = `/send ${messageText}|\n/setinput`;

        console.log("GG Simple Send Executing:", command);
        try {
            context.executeSlashCommandsWithOptions(command);
        } catch (error) {
            console.error("GG Simple Send Error:", error);
        }
    } else {
        console.error("GG Simple Send Error: SillyTavern.getContext is not available globally.");
        // Optionally, display an error to the user via popup or console
    }
    // Reset the flag after a short delay to allow completion but prevent rapid re-clicks
    setTimeout(() => { isSending = false; }, 100); // 100ms delay
    console.log(`${EXTENSION_NAME}: simpleSend function finished (isSending = false after delay).`);
};

// Function to create and inject UI elements
function setupUI() {
    console.log(`${EXTENSION_NAME}: setupUI called.`);
    // Ensure the target exists
    if ($('#leftSendForm').length === 0) {
        console.warn(`${EXTENSION_NAME}: setupUI - #leftSendForm not found yet.`);
        return;
    }

    // Check if BOTH button and menu already exist to prevent re-running setup logic
    if ($('#gg-menu-button').length > 0 || $('#gg-tools-menu').length > 0) {
        console.warn(`${EXTENSION_NAME}: setupUI - Button or menu already exists. Aborting setup.`);
        return; // Exit if elements are already there
    }
    console.log(`${EXTENSION_NAME}: setupUI - Proceeding with element creation and listener attachment.`);

    // Left-side container for GG Tools Button
    const ggToolsContainer = $('<div id="gg-tools-container" style="display: flex; align-items: center; height: 100%;"></div>');

    // GG Tools Menu Button (Trigger)
    const ggMenuButton = $('<div id="gg-menu-button" class="gg-menu-button" title="Guided Generations Tools"><i class="fa-solid fa-gear"></i></div>');

    // GG Tools Pop-up Menu (Initially hidden)
    const ggToolsMenu = $('<div id="gg-tools-menu" class="gg-options-popup">');
    const ggToolsMenuContent = $('<div class="options-content"></div>'); // Mimic #options structure

    // Simple Send Button (inside menu)
    const simpleSendMenuItem = $(
        '<a id="gg-simple-send-action" class="interactable" tabindex="0">' +
        '<i class="fa-lg fa-solid fa-plus"></i>' +
        '<span> Simple Send</span>' +
        '</a>'
    );

    // Recover Input Button (inside menu)
    const recoverInputMenuItem = $(
        '<a id="gg-recover-action" class="interactable" tabindex="0">' +
        '<i class="fa-lg fa-solid fa-life-ring"></i>' + // Using life-ring (life buoy) icon
        '<span> Recover Input</span>' +
        '</a>'
    );

    // Append items to the menu content
    ggToolsMenuContent.append(simpleSendMenuItem);
    ggToolsMenuContent.append(recoverInputMenuItem);
    ggToolsMenu.append(ggToolsMenuContent);

    // Find the target form where buttons reside
    const targetForm = $('#leftSendForm');

    // Insert the button specifically after the extensions button
    const extensionsButton = $('#extensionsMenuButton');
    if (extensionsButton.length > 0) {
        console.log(`${EXTENSION_NAME}: Inserting button after #extensionsMenuButton.`);
        ggMenuButton.insertAfter(extensionsButton);
    } else {
        // Fallback: append if extensions button not found (shouldn't happen ideally)
        console.warn(`${EXTENSION_NAME}: #extensionsMenuButton not found, appending instead.`);
        targetForm.append(ggMenuButton);
    }

    // Append the menu directly to the button for relative positioning
    ggMenuButton.append(ggToolsMenu);

    console.log(`${EXTENSION_NAME}: Appended button and menu.`);

    // Right-side container for future Action Buttons
    const ggActionButtonsContainer = $('<div id="gg-action-buttons-container" style="display: flex; align-items: center; height: 100%; margin-left: auto;"></div>');
    // TODO: Add GG, GS, GI buttons here later

    // Add Action Buttons container before the regenerate button
    $('#regenerate_button').before(ggActionButtonsContainer);

    // --- Event Handlers ---

    // Save input on send or regenerate
    $('#send_button, #regenerate_button').on('click', saveInput);
    // Also save when pressing Enter in the textarea
    $('#send_textarea').on('keypress', function(e) {
        if (e.which === 13 && !e.shiftKey) { // Enter key without Shift
            saveInput();
        }
    });

    // Toggle GG Tools Menu
    ggMenuButton.on('click', (event) => {
        console.log(`${EXTENSION_NAME}: ggMenuButton clicked.`);
        ggToolsMenu.toggleClass('shown'); // Toggle the .shown class
        event.stopPropagation(); // Prevent this click from immediately closing the menu via the document handler
        console.log(`${EXTENSION_NAME}: ggToolsMenu .shown toggled. Has class: ${ggToolsMenu.hasClass('shown')}`);
    });

    // Function to close menu when clicking outside
    $(document).on('click', (event) => {
        const $target = $(event.target);
        // Check if the menu is shown AND if the click is outside the button and the menu
        if (ggToolsMenu.hasClass('shown') && !$target.closest('#gg-menu-button').length && !$target.closest('#gg-tools-menu').length) {
            console.log(`${EXTENSION_NAME}: Click outside detected, hiding menu.`);
            ggToolsMenu.removeClass('shown');
        }
    });

    // Add listeners to menu items
    console.log(`${EXTENSION_NAME}: Attaching listener to #gg-simple-send-action.`);
    $('#gg-simple-send-action')
        .off('click') // Remove previous listeners first
        .on('click', (event) => {
            console.log(`${EXTENSION_NAME}: Simple Send action clicked.`);
            simpleSend();
            ggToolsMenu.removeClass('shown'); // Hide menu after action
            event.stopPropagation();
        });

    console.log(`${EXTENSION_NAME}: Attaching listener to #gg-recover-action.`);
    $('#gg-recover-action')
        .off('click') // Remove previous listeners first
        .on('click', (event) => {
            console.log(`${EXTENSION_NAME}: Recover Input action clicked.`);
            recoverInput();
            ggToolsMenu.removeClass('shown'); // Hide menu after action
            event.stopPropagation();
        });
}

console.log(`${EXTENSION_NAME}: setupUI finished.`);

// Function to save the current user input from the textarea
function saveInput() {
    // Ensure the input exists and get its value
    const textInput = $('#send_textarea');
    if (textInput && textInput.length > 0) {
        const currentInput = String(textInput.val());
        // Store only if it's not empty or just whitespace
        if (currentInput.trim()) {
            storedInput = currentInput;
            //console.log(`${EXTENSION_NAME}: Input saved:`, storedInput); // Optional: Log saved input
        } else {
            // If user sends empty, clear stored input too?
            // storedInput = null;
            // console.log(`${EXTENSION_NAME}: Empty input sent, cleared stored input.`);
        }
    } else {
        console.warn(`${EXTENSION_NAME}: Could not find #send_textarea to save input.`);
    }
}

// Function to recover the last input
function recoverInput() {
    if (storedInput !== null) {
        console.log(`${EXTENSION_NAME}: Recovering input...`);
        $('#send_textarea').val(storedInput); // Put the stored text back
        storedInput = null; // Clear the stored value after recovery
        // Optional: Give user feedback (e.g., briefly change button style)
        // Feedback can be done via CSS hover/active states now

        // Dispatch an input event to ensure any listeners on the textarea update
        // Need the DOM element for dispatchEvent
        const textAreaElement = $('#send_textarea')[0];
        if (textAreaElement) {
            textAreaElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        }
    } else {
        console.log(`${EXTENSION_NAME}: No input stored for recovery.`);
        // Optional: Feedback if nothing is stored (e.g., shake button?)
    }
}

// Expose functions globally if needed for debugging
window.ggSaveInput = saveInput;
window.ggRecoverInput = recoverInput; // Expose recoverInput
window.ggSimpleSend = simpleSend; // Expose simpleSend

// Function to load settings (placeholder for now)
function loadSettings() {
    // In the future, load settings from extension_settings['Guided Generations']
    console.log(`${EXTENSION_NAME}: Settings loaded (using defaults).`);
}

// Main initialization function
function init() {
    console.log(`${EXTENSION_NAME}: Initializing...`);
    loadSettings();

    // Add the UI elements if enabled
    if (settings.isEnabled) {
        setupUI();
    }

    console.log(`${EXTENSION_NAME}: Initialization complete.`);
}

let setupComplete = false;
// Function to check if primary UI elements are loaded and then setup GG UI
const checkElementAndSetup = () => {
    console.log(`${EXTENSION_NAME}: checkElementAndSetup running...`);
    // Check for a reliable element that appears when chat is ready
    // Check for either possible send button ID
    if (($('#send_button').length > 0 || $('#send_but').length > 0) && !setupComplete) {
        console.log(`${EXTENSION_NAME}: Found send button (#send_button or #send_but), attempting setup.`);
        if (settings.isEnabled) {
            setupUI();
            setupComplete = true; // Mark setup as complete
        } else {
            console.log(`${EXTENSION_NAME}: Extension is disabled in settings.`);
            setupComplete = true; // Also mark complete if disabled to stop checking
        }
    } else if (!setupComplete) {
        // If elements not found yet and setup isn't complete, try again shortly
        // console.log(`${EXTENSION_NAME}: Waiting for #send_button...`);
        setTimeout(checkElementAndSetup, 200); // Check again in 200ms
    }
};

// Wait for the document to be ready before trying to add UI elements
$(document).ready(function () {
    console.log(`${EXTENSION_NAME}: Document ready. Starting setup check.`);
    // Initial check
    checkElementAndSetup();
});
