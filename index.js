import { eventSource, saveSettingsDebounced } from '../../../../script.js'; // For event handling (will use later)
// Removed the incorrect SillyTavern import

// Import button logic from separate modules
import { simpleSend } from './scripts/simpleSend.js';
import { recoverInput } from './scripts/inputRecovery.js';
import { guidedResponse } from './scripts/guidedResponse.js';
import { guidedSwipe } from './scripts/guidedSwipe.js';
import { guidedImpersonate } from './scripts/guidedImpersonate.js'; // Import new function
// Try importing extension_settings directly
import { getContext, loadExtensionSettings, extension_settings } from '../../../extensions.js'; // Adjusted path

// Constants
const extensionName = "Silly Tavern-GuidedGenerations"; // Use kebab-case, matching manifest / folder
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`; // Added folder path

let isSending = false; 
// Removed storedInput as recovery now uses stscript global vars

const defaultSettings = {
    autoTriggerClothes: false, // Default off
    autoTriggerState: false,   // Default off
    autoTriggerThinking: false, // Default off
    showImpersonate1stPerson: true, // Default on
    showImpersonate2ndPerson: false, // Default on
    showImpersonate3rdPerson: false, // Default off
};

/**
 * Checks if the current chat context is a group chat.
 * @returns {boolean} True if it is a group chat, false otherwise.
 */
export function isGroupChat() {
    try {
        const context = getContext(); // Use imported getContext
        return !!context.groupId; // groupId will be a string ID if group, otherwise null/undefined
    } catch (error) {
        console.error(`${extensionName}: Error checking group chat status:`, error);
        return false; // Assume not a group chat on error
    }
}

function loadSettings() {
    // Ensure the settings object exists
    extension_settings[extensionName] = extension_settings[extensionName] || {};

    // Check if settings are already loaded and have keys, otherwise initialize with defaults
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        console.log(`${extensionName}: Initializing settings with defaults.`);
        Object.assign(extension_settings[extensionName], defaultSettings);
    } else {
        console.log(`${extensionName}: Settings already loaded.`);
    }

    // Ensure all default keys exist (migration / update handling)
    for (const key in defaultSettings) {
        if (extension_settings[extensionName][key] === undefined) {
            console.warn(`${extensionName}: Setting key "${key}" missing, adding default value: ${defaultSettings[key]}`);
            extension_settings[extensionName][key] = defaultSettings[key];
        }
    }
    console.log(`${extensionName}: Current settings:`, extension_settings[extensionName]);

    // Update UI elements based on loaded settings
    const container = document.getElementById('extension_settings_guided-generations');
    if (container) {
         console.log(`${extensionName}: Updating UI elements from settings.`);
        Object.keys(defaultSettings).forEach(key => {
            const checkbox = container.querySelector(`input[name="${key}"]`);
            if (checkbox) {
                checkbox.checked = extension_settings[extensionName][key];
            } else {
                // This might happen before template is rendered, it's ok.
                // console.warn(`${extensionName}: Could not find checkbox for setting "${key}" during loadSettings.`);
            }
        });
    } else {
         // This might happen before template is rendered, it's ok.
         // console.warn(`${extensionName}: Settings container not found during loadSettings.`);
    }
}

function updateSettingsUI() {
    const settings = extension_settings[extensionName];
    const container = document.getElementById(`extension_settings_${extensionName}`);
    if (!container) {
        console.error(`${extensionName}: Settings container not found during UI update.`);
        return;
    }

    console.log(`${extensionName}: Updating settings UI...`, settings);
    for (const key in settings) {
        const value = settings[key];
        // Find checkbox by name attribute, which matches the settings key
        const checkbox = container.querySelector(`input[type="checkbox"][name="${key}"]`);
        if (checkbox) {
            checkbox.checked = Boolean(value); // Ensure value is treated as boolean
            console.log(`${extensionName}: Set checkbox ${key} to ${checkbox.checked}`);
        } else {
            console.warn(`${extensionName}: Checkbox for setting ${key} not found in UI.`);
        }
    }
}

function addSettingsEventListeners() {
    const container = document.getElementById(`extension_settings_${extensionName}`);
    if (!container) {
        console.error(`${extensionName}: Settings container not found for adding listeners.`);
        return;
    }

    Object.keys(extension_settings[extensionName]).forEach(key => {
        // Find checkbox by name attribute
        const checkbox = container.querySelector(`input[type="checkbox"][name="${key}"]`);
        if (checkbox) {
            checkbox.addEventListener('change', (event) => {
                extension_settings[extensionName][key] = event.target.checked;
                console.log(`${extensionName}: Setting ${key} changed to ${event.target.checked}`);
                saveSettingsDebounced();
            });
        } else {
             console.warn(`${extensionName}: Checkbox for setting ${key} not found for adding listener.`);
        }
    });

    console.log(`${extensionName}: Settings event listeners added.`);
}

function addExtensionButtons() {
    console.log(`${extensionName}: Attempting to add GG buttons...`); // Use extensionName

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
            console.log(`${extensionName}: ggMenuButton clicked.`);
            ggToolsMenu.classList.toggle('shown'); // Toggle the .shown class
            event.stopPropagation(); // Prevent this click from immediately closing the menu
        });

        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
            // Check if the menu has the 'shown' class and the click target is not the menu or button itself
            if (ggToolsMenu.classList.contains('shown') && !ggMenuButton.contains(event.target)) {
                console.log(`${extensionName}: Click outside detected, hiding menu.`);
                ggToolsMenu.classList.remove('shown');
            }
        });

        // Simple Send Action
        simpleSendMenuItem.addEventListener('click', (event) => {
            console.log(`${extensionName}: Simple Send action clicked.`);
            simpleSend();
            ggToolsMenu.classList.remove('shown'); // Hide menu after action
            event.stopPropagation();
        });

        // Recover Input Action
        recoverInputMenuItem.addEventListener('click', (event) => {
            console.log(`${extensionName}: Recover Input action clicked.`);
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
    console.log(`${extensionName}: Finished adding buttons.`);
}

// Wait for the document to be fully loaded before initializing
// Mimic regex extension pattern: assume container exists and populate on ready
$(document).ready(async function () { 
    console.log(`${extensionName}: Document ready, initializing...`);

    // ***** Load settings FIRST *****
    // loadSettings(); // Ensure settings are loaded before UI is built -- MOVED

    // --- Settings Panel Initialization ---
    // Use a small delay wrapped in a function to ensure the DOM is ready
    // Also use the correct extensionName variable
    const loadSettingsPanel = () => {
        const containerId = `extension_settings_${extensionName}`;
        let container = document.getElementById(containerId);

        // Check if container exists, create if not (robustness)
        if (!container) {
            console.warn(`${extensionName}: Settings container #${containerId} not found. Creating...`);
            // Find the main settings area in SillyTavern (adjust selector if needed)
            const settingsArea = document.getElementById('extensions_settings'); 
            if (settingsArea) {
                container = document.createElement('div');
                container.id = containerId;
                settingsArea.appendChild(container);
            } else {
                console.error(`${extensionName}: Could not find main settings area to create container.`);
                return; // Stop if we can't create the container
            }
        } else {
            console.log(`${extensionName}: Settings container #${containerId} found.`);
            // Clear previous content if any (important for reloads)
            container.innerHTML = ''; 
        }

        const settingsHtmlUrl = `${extensionFolderPath}/settings.html`;
        console.log(`${extensionName}: Fetching settings template from: ${settingsHtmlUrl}`);

        // Use $.get to fetch the HTML content
        $.get(settingsHtmlUrl)
            .done(function(settingsHtml) {
                console.log(`${extensionName}: Successfully fetched settings template.`);
                // Append the fetched HTML to the container
                container.innerHTML = settingsHtml; // Use innerHTML to replace content
                
                // ***** Load settings HERE, right before updating UI *****
                loadSettings(); // Ensure settings are loaded/initialized

                // Update the UI elements to reflect loaded settings
                updateSettingsUI(); 

                // Add event listeners AFTER the HTML is loaded AND UI is updated
                addSettingsEventListeners();
                console.log(`${extensionName}: Settings panel added and listeners attached.`);
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                // Log detailed error
                console.error(`${extensionName}: Error fetching or rendering settings template:`, jqXHR);
                container.innerHTML = '<p>Error: Could not load settings.html. Check browser console (F12) for details.</p>';
            });
    };

    // Use setTimeout to slightly delay the settings panel loading
    // This helps ensure the main extensions_settings container is ready
    setTimeout(loadSettingsPanel, 200); // Increased delay slightly

    // --- Button Creation ---
    // Call createButtons AFTER settings are potentially loaded 
    // (though button creation doesn't strictly depend on settings yet)
    addExtensionButtons(); // Create the GG buttons

    console.log(`${extensionName}: Initialization complete.`);
});
