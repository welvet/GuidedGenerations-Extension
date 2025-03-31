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

// Initial settings (can be expanded later)
const defaultSettings = {
    isEnabled: true, // Default to enabled
};

// Hold the current settings
let settings = { ...defaultSettings };

// Function to add the Input Recovery button
function addRecoveryButton() {
    // Find the actual send button and its container
    const sendButton = document.getElementById('send_but');
    const targetContainer = sendButton?.parentElement; // Should be #rightSendForm

    if (!targetContainer) {
        console.warn(`${EXTENSION_NAME}: Could not find send button (#send_but) or its parent container to add recovery button.`);
        return;
    }

    // Check if our button already exists
    const buttonId = `${EXTENSION_ID}-recover-button`;
    if (document.getElementById(buttonId)) {
        return; // Already added
    }

    // Find the main text input area
    const textInput = document.getElementById('send_textarea');
    if (!textInput) {
        console.warn(`${EXTENSION_NAME}: Could not find text input #send_textarea.`);
        // We could potentially still add the button, but it wouldn't function.
        // For now, let's prevent adding it if the input isn't found.
        return;
    }

    // Create the button
    const recoveryButton = document.createElement('button');
    recoveryButton.id = buttonId;
    recoveryButton.textContent = '🛟'; // Input Recovery icon
    recoveryButton.classList.add('fa-solid');
    recoveryButton.classList.add('stui_button');
    recoveryButton.title = 'Recover previous input'; // Tooltip

    // Add basic styling (can be moved to style.css later)
    recoveryButton.style.marginLeft = '5px'; // Space it from the element before it

    // Add click listener for recovery logic
    recoveryButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent form submission if inside a form

        if (storedInput !== null) {
            console.log(`${EXTENSION_NAME}: Recovering input...`);
            textInput.value = storedInput; // Put the stored text back
            storedInput = null; // Clear the stored value after recovery
            // Optional: Give user feedback (e.g., briefly change button style)
            recoveryButton.style.opacity = 0.5; // Dim button briefly
            setTimeout(() => { recoveryButton.style.opacity = 1; }, 500);

            // Dispatch an input event to ensure any listeners on the textarea update
            textInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

        } else {
            console.log(`${EXTENSION_NAME}: No input stored for recovery.`);
            // Optional: Feedback if nothing is stored (e.g., shake button?)
        }
    });

    // Insert the button before the send button
    targetContainer.insertBefore(recoveryButton, sendButton);

    console.log(`${EXTENSION_NAME}: Input Recovery button added.`);
}

// Function to save the current user input from the textarea
function saveInput() {
    // Read the current input directly from the textarea
    const currentInput = String($('#send_textarea').val());

    if (currentInput && currentInput.trim() !== '') { // Only store non-empty input
        storedInput = currentInput;
        console.log(`${EXTENSION_NAME}: Stored input for recovery: "${storedInput}"`);
    } else {
        // If the input area was empty, ensure storedInput is null
        // so the recovery button doesn't restore nothing.
        storedInput = null;
        console.log(`${EXTENSION_NAME}: Input area empty, nothing to store for recovery.`);
    }
}

// Expose saveInput globally for testing
window.saveInput = saveInput;

// Function to add the Simple Send button
function addSimpleSendButton() {
    // Find the actual send button and its container
    const sendButton = document.getElementById('send_but');
    const targetContainer = sendButton?.parentElement;

    if (!targetContainer) {
        console.warn(`${EXTENSION_NAME}: Could not find send button (#send_but) or its parent container to add simple send button.`);
        return;
    }

    const buttonId = `${EXTENSION_ID}-simple-send-button`;
    if (document.getElementById(buttonId)) {
        return;
    }

    const textInput = document.getElementById('send_textarea');
    if (!textInput) {
        console.warn(`${EXTENSION_NAME}: Could not find text input #send_textarea.`);
        return;
    }

    const simpleSendButton = document.createElement('button');
    simpleSendButton.id = buttonId;
    simpleSendButton.textContent = '➕';
    simpleSendButton.classList.add('fa-solid');
    simpleSendButton.classList.add('stui_button');
    simpleSendButton.title = 'Simple Send (no AI reply)';

    simpleSendButton.style.marginLeft = '5px';

    simpleSendButton.addEventListener('click', (event) => {
        event.preventDefault();
        console.log(`${EXTENSION_NAME}: Simple Send button clicked.`);
        const textToSend = textInput.value;
        if (textToSend && textToSend.trim() !== '') {
            const context = SillyTavern.getContext();
            if (context && context.executeSlashCommandsWithOptions) {
                // Corrected STscript command with space after pipe
                const correctedCommand = '/send {{input}}| /setinput';
                console.log(`${EXTENSION_NAME}: Executing STscript command: ${correctedCommand}`);
                context.executeSlashCommandsWithOptions(correctedCommand);
            } else {
                console.error(`${EXTENSION_NAME}: SillyTavern.getContext() or executeSlashCommandsWithOptions is not available.`);
                alert(`${EXTENSION_NAME}: Error sending message. See console for details.`);
            }
        } else {
            console.log(`${EXTENSION_NAME}: No text to send.`);
        }
    });

    targetContainer.insertBefore(simpleSendButton, sendButton);

    console.log(`${EXTENSION_NAME}: Simple Send button added.`);
}

// Function to add the Guided Response button
function addGuidedResponseButton() {
    // Find the actual send button and its container
    const sendButton = document.getElementById('send_but');
    const targetContainer = sendButton?.parentElement; // Should be #rightSendForm

    if (!targetContainer) {
        console.warn(`${EXTENSION_NAME}: Could not find send button (#send_but) or its parent container to add guided response button.`);
        return;
    }

    // Check if our button already exists
    const buttonId = `${EXTENSION_ID}-guided-response-button`;
    if (document.getElementById(buttonId)) {
        return; // Already added
    }

    // Find the main text input area
    const textInput = document.getElementById('send_textarea');
    if (!textInput) {
        console.warn(`${EXTENSION_NAME}: Could not find text input #send_textarea.`);
        return;
    }

    // Create the button
    const guidedResponseButton = document.createElement('button');
    guidedResponseButton.id = buttonId;
    guidedResponseButton.textContent = '🦮'; // Guided Response icon
    guidedResponseButton.classList.add('fa-solid'); // Use Font Awesome class if available in ST
    guidedResponseButton.classList.add('stui_button'); // Basic SillyTavern button styling
    guidedResponseButton.title = 'Guided Response'; // Tooltip

    // Add basic styling (can be moved to style.css later)
    guidedResponseButton.style.marginLeft = '5px'; // Space it from the element before it

    // Add click listener for guided response logic (to be implemented)
    guidedResponseButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent form submission if inside a form
        // TODO: Implement Guided Response logic here
        console.log(`${EXTENSION_NAME}: Guided Response button clicked.`);
        const guidanceText = textInput.value; // For now, guidance is the input text itself
        if (guidanceText && guidanceText.trim() !== '') {
            // Need to use context.executeSlashCommandsWithOptions() here for guided response
            console.log(`${EXTENSION_NAME}: Guidance provided: "${guidanceText}" (Guided Response not yet implemented)`);
            // Placeholder for STscript command execution
            // context.executeSlashCommandsWithOptions(...)
        } else {
            console.log(`${EXTENSION_NAME}: No guidance text provided.`);
        }
    });

    // Insert the button before the send button
    targetContainer.insertBefore(guidedResponseButton, sendButton);

    console.log(`${EXTENSION_NAME}: Guided Response button added.`);
}


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
        addRecoveryButton();
        addSimpleSendButton();
        addGuidedResponseButton();
    }

    console.log(`${EXTENSION_NAME}: Initialization complete.`);
}

// Wait for SillyTavern's UI to be ready before initializing
// We can use DOMContentLoaded or observe for a specific element
// A simple check might be to wait for the send button itself
const checkReadyState = setInterval(() => {
    // Check if the main chat UI elements are loaded
    const sendButton = document.getElementById('send_but');
    const chatLog = document.getElementById('chat'); // Example element

    if (sendButton && chatLog) {
        clearInterval(checkReadyState); // Stop checking
        init(); // Initialize the extension
    }
}, 100); // Check every 100ms
