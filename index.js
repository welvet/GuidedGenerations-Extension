import { eventSource } from '../../../../script.js'; // For event handling (will use later)
import { extension_settings } from '../../../extensions.js'; // Access to extension settings

// Import button logic from separate modules
import { simpleSend } from './scripts/simpleSend.js';
import { recoverInput } from './scripts/inputRecovery.js';
import { guidedResponse } from './scripts/guidedResponse.js';
import { guidedSwipe } from './scripts/guidedSwipe.js';
import { guidedImpersonate } from './scripts/guidedImpersonate.js'; // Import new function

// Constants
const EXTENSION_NAME = "Guided Generations";

let isSending = false; 
// Removed storedInput as recovery now uses stscript global vars

const defaultSettings = {
    isEnabled: true,
};

let settings = { ...defaultSettings };

function loadSettings() {
    // In the future, load settings from extension_settings['Guided Generations']
    // For now, just use defaults
    settings = { ...defaultSettings };
    console.log(`${EXTENSION_NAME}: Settings loaded (using defaults).`);
}

function init() {
    console.log(`${EXTENSION_NAME}: Initializing...`);
    loadSettings();

    // Add the UI elements if enabled
    if (settings.isEnabled) {
        // Use a MutationObserver to wait for the necessary UI elements to be ready
        const targetNode = document.body; // Watch the whole body
        const config = { childList: true, subtree: true };

        const callback = function(mutationsList, observer) {
            // Add logging
            // console.log(`${EXTENSION_NAME}: MutationObserver callback fired.`);
            const rightSendForm = document.getElementById('rightSendForm');
            const extensionsMenu = document.getElementById('extensionsMenuButton');
            // Also check for send_but needed by addExtensionButtons
            const sendButton = document.getElementById('send_but');

            if (rightSendForm && extensionsMenu && sendButton) {
                console.log(`${EXTENSION_NAME}: Target UI elements found (rightSendForm, extensionsMenuButton, send_but). Adding buttons.`);
                // Prevent adding buttons multiple times - check inside addExtensionButtons
                addExtensionButtons();
                observer.disconnect(); // Stop observing once elements are found AND buttons added
                console.log(`${EXTENSION_NAME}: MutationObserver disconnected.`);
            } else {
                 // Debounce logging to avoid flooding console if elements take time to appear
                 // Use a simple timeout or check if already logged recently
                 if (!window.ggObserverLoggedWait) {
                    console.log(`${EXTENSION_NAME}: Still waiting for UI elements... (rightSendForm: ${!!rightSendForm}, extensionsMenuButton: ${!!extensionsMenu}, send_but: ${!!sendButton})`);
                    window.ggObserverLoggedWait = true;
                    setTimeout(() => { window.ggObserverLoggedWait = false; }, 2000); // Log wait message at most every 2s
                 }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);

        // Remove initial check here - rely solely on the observer
        // checkElementAndSetup();
        console.log(`${EXTENSION_NAME}: MutationObserver started.`);
    }
}

function addExtensionButtons() {
    // --- Check if ANY GG button exists to prevent re-adding --- 
    // Check for the gear menu button OR one of the action buttons
    if (document.getElementById('gg-menu-button') || document.getElementById('gg_guided_response_button')) {
        console.log(`${EXTENSION_NAME}: Buttons seem to be already added. Skipping add.`);
        return;
    }
    console.log(`${EXTENSION_NAME}: Adding extension buttons...`);

    // --- Left Side: Collapsible Menu (Simple Send / Recover Input) ---
    const leftSendForm = document.getElementById('leftSendForm');
    const extensionsButton = document.getElementById('extensionsMenuButton');

    if (leftSendForm && extensionsButton) {
        // GG Tools Menu Button (Trigger - Gear Icon)
        const ggMenuButton = document.createElement('div');
        ggMenuButton.id = 'gg-menu-button';
        ggMenuButton.className = 'gg-menu-button fa-solid fa-gear interactable'; // Add interactable
        ggMenuButton.title = 'Guided Generations Tools';
        ggMenuButton.tabIndex = 0; // Make focusable

        // GG Tools Pop-up Menu (Initially hidden)
        const ggToolsMenu = document.createElement('div');
        ggToolsMenu.id = 'gg-tools-menu';
        // ggToolsMenu.className = 'gg-options-popup'; // Use custom class from style.css

        // Simple Send Button (inside menu)
        const simpleSendMenuItem = document.createElement('div');
        simpleSendMenuItem.id = 'gg-simple-send-action';
        simpleSendMenuItem.className = 'gg-menu-item menu_button interactable'; // Style as menu item
        simpleSendMenuItem.innerHTML = '<i class="fa-lg fa-solid fa-plus"></i><span> Simple Send</span>';
        simpleSendMenuItem.tabIndex = 0;

        // Recover Input Button (inside menu)
        const recoverInputMenuItem = document.createElement('div');
        recoverInputMenuItem.id = 'gg-recover-action';
        recoverInputMenuItem.className = 'gg-menu-item menu_button interactable'; // Style as menu item
        recoverInputMenuItem.innerHTML = '<i class="fa-lg fa-solid fa-recycle"></i><span> Recover Input</span>'; // Use recycle icon
        recoverInputMenuItem.tabIndex = 0;

        // Append items to the menu
        ggToolsMenu.appendChild(simpleSendMenuItem);
        ggToolsMenu.appendChild(recoverInputMenuItem);

        // Append the menu TO the button (for relative positioning)
        ggMenuButton.appendChild(ggToolsMenu);

        // Insert the gear button AFTER the extensions wand button
        extensionsButton.parentNode.insertBefore(ggMenuButton, extensionsButton.nextSibling);

        // --- Event Handlers for Menu ---

        // Toggle GG Tools Menu
        ggMenuButton.addEventListener('click', (event) => {
            console.log(`${EXTENSION_NAME}: ggMenuButton clicked.`);
            ggToolsMenu.classList.toggle('shown'); // Toggle the .shown class
            event.stopPropagation(); // Prevent this click from immediately closing the menu
        });

        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
            // Check if the menu has the 'shown' class and the click target is not the menu or button itself
            if (ggToolsMenu.classList.contains('shown') && !ggMenuButton.contains(event.target)) {
                console.log(`${EXTENSION_NAME}: Click outside detected, hiding menu.`);
                ggToolsMenu.classList.remove('shown');
            }
        });

        // Simple Send Action
        simpleSendMenuItem.addEventListener('click', (event) => {
            console.log(`${EXTENSION_NAME}: Simple Send action clicked.`);
            simpleSend();
            ggToolsMenu.classList.remove('shown'); // Hide menu after action
            event.stopPropagation();
        });

        // Recover Input Action
        recoverInputMenuItem.addEventListener('click', (event) => {
            console.log(`${EXTENSION_NAME}: Recover Input action clicked.`);
            recoverInput();
            ggToolsMenu.classList.remove('shown'); // Hide menu after action
            event.stopPropagation();
        });

    } else {
        console.error('Could not find #leftSendForm or #extensionsMenuButton element to add GG menu.');
    }


    // --- Right Side: Action Buttons (Impersonate / Swipe / Response) ---
    // Check if elements exist before adding buttons
    const rightSendForm = document.getElementById('rightSendForm');
    const sendButton = document.getElementById('send_but'); // Assuming this is the correct ID for the send button

    if (rightSendForm && sendButton) {
        // Guided Impersonate Button (👤)
        const guidedImpersonateButton = document.createElement('div');
        guidedImpersonateButton.id = 'gg_guided_impersonate_button';
        guidedImpersonateButton.className = 'fa-solid fa-user interactable gg-button'; // Using fa-user
        guidedImpersonateButton.title = 'Guided Impersonate (👤): Impersonate character and restore input.';
        guidedImpersonateButton.addEventListener('click', guidedImpersonate); // Use imported function

        // Guided Swipe Button (👈)
        const guidedSwipeButton = document.createElement('div');
        guidedSwipeButton.id = 'gg_guided_swipe_button';
        guidedSwipeButton.className = 'fa-solid fa-hand-point-left interactable gg-button'; // Using fa-hand-point-left
        guidedSwipeButton.title = 'Guided Swipe (👈): Swipe generation and restore input.';
        guidedSwipeButton.addEventListener('click', guidedSwipe); // Use imported function

        // Guided Response Button (🦮)
        const guidedResponseButton = document.createElement('div');
        guidedResponseButton.id = 'gg_guided_response_button';
        guidedResponseButton.className = 'fa-solid fa-dog interactable gg-button';
        guidedResponseButton.title = 'Guided Response (🦮): Send input with instruct context and generate.';
        guidedResponseButton.addEventListener('click', guidedResponse); // Use imported function

        // Insert buttons BEFORE the main send button in the correct order
        // Order: Impersonate -> Swipe -> Response -> Send Button
        rightSendForm.insertBefore(guidedImpersonateButton, sendButton); 
        rightSendForm.insertBefore(guidedSwipeButton, guidedImpersonateButton);
        rightSendForm.insertBefore(guidedResponseButton, guidedSwipeButton); 

    } else {
        console.error('Could not find #rightSendForm or #send_but element to add action buttons.');
        if (!rightSendForm) console.error('#rightSendForm not found.');
        if (!sendButton) console.error('#send_but not found.');
    }
    console.log(`${EXTENSION_NAME}: Finished adding buttons.`);
}

// Wait for the document to be fully loaded before initializing
$(document).ready(function () {
    console.log(`${EXTENSION_NAME}: Document ready. Starting initialization.`);
    init(); // Start the initialization process
});
