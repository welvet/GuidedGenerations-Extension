// Import SillyTavern core functions and context
// Assuming placement in data/default-user/extensions/your-extension-name/
// Using paths based on provided third-party example
import { eventSource } from '../../../../script.js'; // For event handling (will use later)
import { extension_settings } from '../../../extensions.js'; // Access to extension settings

// Constants
const EXTENSION_NAME = "Guided Generations";
const EXTENSION_ID = "guided-generations"; // Used for CSS IDs etc.

// Initial settings (can be expanded later)
const defaultSettings = {
    isEnabled: true, // Default to enabled
};

// Hold the current settings
let settings = { ...defaultSettings };

// Function to add the placeholder button
function addPlaceholderButton() {
    // Find the actual send button and its container
    const sendButton = document.getElementById('send_but');
    const targetContainer = sendButton?.parentElement; // Should be #rightSendForm

    if (!targetContainer) {
        console.warn(`${EXTENSION_NAME}: Could not find send button (#send_but) or its parent container to add placeholder button.`);
        return;
    }

    // Check if our button already exists
    if (document.getElementById(`${EXTENSION_ID}-placeholder-button`)) {
        return; // Already added
    }

    // Create the button
    const placeholderButton = document.createElement('button');
    placeholderButton.id = `${EXTENSION_ID}-placeholder-button`;
    placeholderButton.textContent = '🤔'; // Placeholder icon/text
    placeholderButton.classList.add('fa-solid'); // Use Font Awesome class if available in ST
    placeholderButton.classList.add('stui_button'); // Basic SillyTavern button styling
    placeholderButton.title = `${EXTENSION_NAME} Placeholder`; // Tooltip

    // Add basic styling (can be moved to style.css later)
    placeholderButton.style.marginLeft = '5px'; // Space it from the element before it

    // Add click listener (does nothing yet)
    placeholderButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent form submission if inside a form
        console.log(`${EXTENSION_NAME}: Placeholder button clicked!`);
        // Add actual functionality later
    });

    // Insert the button before the send button
    targetContainer.insertBefore(placeholderButton, sendButton);

    console.log(`${EXTENSION_NAME}: Placeholder button added.`);
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
        addPlaceholderButton();
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
