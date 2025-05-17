import { eventSource, saveSettingsDebounced } from '../../../../script.js'; // For event handling (will use later)
// Removed the incorrect SillyTavern import

// Import button logic from separate modules
import { simpleSend } from './scripts/simpleSend.js';
import { recoverInput } from './scripts/inputRecovery.js';
import { guidedResponse } from './scripts/guidedResponse.js';
import { guidedSwipe } from './scripts/guidedSwipe.js';
import { guidedContinue } from './scripts/guidedContinue.js';
import { guidedImpersonate } from './scripts/guidedImpersonate.js';
import { guidedImpersonate2nd } from './scripts/guidedImpersonate2nd.js'; // Import 2nd
import { guidedImpersonate3rd } from './scripts/guidedImpersonate3rd.js'; // Import 3rd
// Import the new Update Character function
import { updateCharacter } from './scripts/persistentGuides/updateCharacter.js';
// Import the new Custom Auto Guide
import customAutoGuide from './scripts/persistentGuides/customAutoGuide.js';
// Import necessary functions/objects from SillyTavern
import { getContext, loadExtensionSettings, extension_settings, renderExtensionTemplateAsync } from '../../../extensions.js'; 
// Import Preset Manager
import { getPresetManager } from '../../../../scripts/preset-manager.js';
import { loadSettingsPanel } from './scripts/settingsPanel.js';

// --- Shared State for Impersonation Input Recovery ---
let previousImpersonateInput = ''; // Input before the last impersonation
let lastImpersonateResult = '';    // Input after the last impersonation

export function getPreviousImpersonateInput() {
    return previousImpersonateInput;
}
export function setPreviousImpersonateInput(value) {
    previousImpersonateInput = value;
}
export function getLastImpersonateResult() {
    return lastImpersonateResult;
}
export function setLastImpersonateResult(value) {
    lastImpersonateResult = value;
}
// --- End Shared State ---

export const extensionName = "GuidedGenerations-Extension"; // Use the simple name as the internal identifier
// const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`; // No longer needed

let isSending = false; 
// Removed storedInput as recovery now uses stscript global vars

export const defaultSettings = {
    autoTriggerClothes: false, // Default off
    autoTriggerState: false,   // Default off
    autoTriggerThinking: false, // Default off
    enableAutoCustomAutoGuide: false, // Default off for auto-triggering the new guide
    showImpersonate1stPerson: true, // Default on
    showImpersonate2ndPerson: false, // Default off
    showImpersonate3rdPerson: false, // Default off
    showGuidedContinue: false, // Default off for Guided Continue
    showGuidedResponse: true, // Default on for Guided Response
    showGuidedSwipe: true, // Default on for Guided Swipe
    showSimpleSendButton: false, // Individual tool button toggles
    showRecoverInputButton: false,
    showEditIntrosButton: false,
    showCorrectionsButton: false,
    showSpellcheckerButton: false,
    showClearInputButton: false,
    injectionEndRole: 'system', // NEW SETTING: Default role for non-chat injections
    presetClothes: 'GGSytemPrompt',
    presetState: 'GGSytemPrompt',
    presetThinking: 'GGSytemPrompt',
    presetSituational: 'GGSytemPrompt',
    presetRules: 'GGSytemPrompt',
    presetCustom: 'GGSytemPrompt',
    presetCorrections: 'GGSytemPrompt',
    presetSpellchecker: 'GGSytemPrompt',
    presetEditIntros: 'GGSytemPrompt',
    presetImpersonate1st: '',
    presetImpersonate2nd: '',
    presetImpersonate3rd: '',
    customAutoGuidePreset: '', // Default preset for Custom Auto Guide
    customAutoGuidePresetName: '', // Default preset name for Custom Auto Guide
    usePresetCustomAuto: false, // Default use preset toggle for Custom Auto Guide
    // Guide prompt overrides
    promptClothes: '[OOC: Answer me out of Character! Considering where we are currently in the story, write me a list entailing the clothes and look, what they are currently wearing of all participating characters, including {{user}}, that are present in the current scene. Don\'t mention people or clothing pieces no longer relevant to the ongoing scene.] ',
    promptState: '[OOC: Answer me out of Character! Considering the last response, write me a list entailing what state and position of all participating characters, including {{user}}, that are present in the current scene. Don\'t describe their clothes or how they are dressed. Don\'t mention people no longer relevant to the ongoing scene.] ',
    promptThinking: '[OOC: Answer me out of Character! Write what each characters in the current scene are currently thinking, pure thought only. Do NOT continue the story or include narration or dialogue. Do not include the{{user}}\'s thoughts.] ',
    promptSituational: '[Analyze the chat history and provide a concise summary of current location, present characters, relevant objects, and recent events. Keep factual and neutral. Format in clear paragraphs.] ',
    promptRules: '[Create a list of explicit rules that {{char}} has learned and follows from the story and their character description. Only include rules explicitly established in chat history or character info. Format as a numbered list.] ',
    promptCorrections: 'Without any intro or outro correct the grammar, punctuation, and improve the paragraph\'s flow of: {{input}}',
    promptSpellchecker: 'Without any intro or outro correct the grammar, punctuation, and improve the paragraph\'s flow of: {{input}}',
    promptImpersonate1st: 'Write in first Person perspective from {{user}}. {{input}}',
    promptImpersonate2nd: 'Write in second Person perspective from {{user}}, using you/yours for {{user}}. {{input}}',
    promptImpersonate3rd: 'Write in third Person perspective from {{user}} using third-person pronouns for {{user}}. {{input}}',
    promptGuidedResponse: '[Take the following into special consideration for your next message: {{input}}]',
    promptGuidedSwipe: '[Take the following into special consideration for your next message: {{input}}]',
    promptGuidedContinue: '[Continue the story based on the following input: {{input}}]', // Default prompt override for Guided Continue
    customAutoGuidePrompt: '', // Default empty prompt for Custom Auto Guide
    // Raw flags for prompt overrides
    rawPromptClothes: false,
    rawPromptState: false,
    rawPromptThinking: false,
    rawPromptSituational: false,
    rawPromptRules: false,
    rawPromptCorrections: false,
    rawPromptSpellchecker: false,
    rawPromptCustomAuto: false // Default raw prompt setting for Custom Auto Guide
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

async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};

    // Check if settings are empty and initialize with defaults
    // This simplified approach assumes defaults are complete.
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        console.log(`${extensionName}: Initializing settings with defaults.`);
        Object.assign(extension_settings[extensionName], defaultSettings);
    } else {
         console.log(`${extensionName}: Settings already loaded, ensuring all keys exist.`);
        // Ensure all default keys exist (migration / update handling)
        for (const key in defaultSettings) {
            if (extension_settings[extensionName][key] === undefined) {
                console.warn(`${extensionName}: Setting key "${key}" missing, adding default value: ${defaultSettings[key]}`);
                extension_settings[extensionName][key] = defaultSettings[key];
            }
        }
    }

    console.log(`${extensionName}: Current settings:`, extension_settings[extensionName]);

    // No need to update UI here, updateSettingsUI will be called separately after template render
}

function updateSettingsUI() {
    const settingsPanelId = `extension_settings_${extensionName}`;
    const container = document.getElementById(settingsPanelId);
    if (container) {
        console.log(`${extensionName}: Updating UI elements from settings.`);
        Object.keys(defaultSettings).forEach(key => {
            const checkbox = container.querySelector(`input[name="${key}"]`);
            if (checkbox) {
                // Check if the setting exists before trying to access it
                if (extension_settings[extensionName] && extension_settings[extensionName].hasOwnProperty(key)) {
                     checkbox.checked = extension_settings[extensionName][key];
                } else {
                    console.warn(`${extensionName}: Setting key "${key}" not found in loaded settings during UI update. Using default: ${defaultSettings[key]}`);
                    checkbox.checked = defaultSettings[key]; // Use default if missing
                }
            } else {
                 // Allow this warning during initial load before template might be ready
                 // console.warn(`${extensionName}: Could not find checkbox for setting "${key}" during updateSettingsUI.`);
            }
        });

        // Update checkboxes
        document.querySelectorAll('.gg-setting-input[type="checkbox"]').forEach(checkbox => {
            const settingName = checkbox.name;
            if (settingName in extension_settings[extensionName]) {
                checkbox.checked = extension_settings[extensionName][settingName];
            }
        });

        // Update the new dropdown
        const injectionRoleSelect = document.getElementById('gg_injectionEndRole');
        if (injectionRoleSelect && extension_settings[extensionName].injectionEndRole) {
            injectionRoleSelect.value = extension_settings[extensionName].injectionEndRole;
        }

        // Populate preset text fields
        ['presetClothes','presetState','presetThinking','presetSituational','presetRules',
         'presetCustom','presetCorrections','presetSpellchecker','presetEditIntros',
         'presetImpersonate1st','presetImpersonate2nd','presetImpersonate3rd',
         'customAutoGuidePreset', 'customAutoGuidePresetName'
        ].forEach(key => {
            const input = document.getElementById(`gg_${key}`);
            if (input) {
                input.value = extension_settings[extensionName][key] ?? defaultSettings[key] ?? '';
            }
        });

        // Populate guide prompt override textareas
        ['promptClothes','promptState','promptThinking','promptSituational','promptRules','promptCorrections','promptSpellchecker','promptImpersonate1st','promptImpersonate2nd','promptImpersonate3rd','promptGuidedResponse','promptGuidedSwipe','promptGuidedContinue','customAutoGuidePrompt'].forEach(key => {
            const textarea = document.getElementById(`gg_${key}`);
            if (textarea) {
                textarea.value = extension_settings[extensionName][key] ?? defaultSettings[key] ?? '';
            }
        });

        console.log(`${extensionName}: Settings UI updated.`);
    } else {
        console.warn(`${extensionName}: Settings container #${settingsPanelId} not found during updateSettingsUI.`);
    }
}

/**
 * Adds event listeners to the settings panel elements after they are loaded.
 * Uses event delegation on the container.
 */
const addSettingsEventListeners = () => {
    // Get the specific container for this extension's settings
    const containerId = `extension_settings_${extensionName}`;
    const settingsContainer = document.getElementById(containerId);

    if (settingsContainer) {
        console.log(`[${extensionName}] Adding delegated event listener to #${containerId}`);
        // Remove any potentially existing listener first to avoid duplicates on reload
        settingsContainer.removeEventListener('change', handleSettingsChangeDelegated);
        // Add the delegated listener
        settingsContainer.addEventListener('change', handleSettingsChangeDelegated);
    } else {
        console.error(`[${extensionName}] Could not find settings container #${containerId} to attach listeners.`);
    }
};

/**
 * Delegated event handler for settings changes within the container.
 * @param {Event} event The event object
 */
const handleSettingsChangeDelegated = (event) => {
    // Check if the changed element has the correct class
    if (event.target.classList.contains('gg-setting-input')) {
        console.log(`[${extensionName}] Delegated change event detected on:`, event.target);
        handleSettingChange(event); // Call the original handler

        // Special handling for button visibility settings after change
        if (event.target.name === 'showImpersonateButton') {
            updateImpersonateButtonVisibility();
        }
        if (event.target.name === 'showPersistentGuidesMenu') {
            const menu = document.getElementById('persistent_guides_menu');
            if (menu) menu.style.display = event.target.checked ? '' : 'none';
        }
        if (event.target.name === 'showSwipeButton') {
            const button = document.getElementById('guided_swipe_button');
            if (button) button.style.display = event.target.checked ? '' : 'none';
        }
        if (event.target.name === 'showResponseButton') {
            const button = document.getElementById('guided_response_button');
            if (button) button.style.display = event.target.checked ? '' : 'none';
        }
        if (event.target.name === 'showGuidedContinue') {
            const button = document.getElementById('gg_continue_button');
            if (button) button.style.display = event.target.checked ? '' : 'none';
        }
    }
};

// Separate handler function for clarity
function handleSettingChange(event) {
    const target = event.target;
    const settingName = target.name;
    let settingValue;

    if (target.type === 'checkbox') {
        settingValue = target.checked;
    } else if (target.tagName === 'SELECT') { // Handle dropdowns
        settingValue = target.value;
    } else if (target.tagName === 'INPUT' && target.type === 'text') {
        settingValue = target.value;
    } else if (target.tagName === 'TEXTAREA') {
        settingValue = target.value;
    } else {
        console.warn(`${extensionName}: Unhandled setting type: ${target.type}`);
        return; // Don't save if it's not a recognized type
    }

    console.log(`[${extensionName}] Setting Changed: ${settingName} = ${settingValue} (Type: ${typeof settingValue})`);

    if (extension_settings[extensionName]) {
        extension_settings[extensionName][settingName] = settingValue;
        console.log(`[${extensionName}] > Updated setting: Key='${settingName}', New Value='${settingValue}'`);
        console.log(`[${extensionName}] > Current extension_settings[${extensionName}]:`, JSON.stringify(extension_settings[extensionName]));
        saveSettingsDebounced(); // Save after updating the specific key

        // *** ADDED: Refresh buttons after setting change ***
        updateExtensionButtons();
    } else {
        console.error(`[${extensionName}] Error: extension_settings[${extensionName}] is undefined.`);
    }
}

// Function to create and add buttons based on settings
function updateExtensionButtons() {
    const settings = extension_settings[extensionName];
    if (!settings) {
        console.error(`${extensionName}: Settings not loaded, cannot update buttons.`);
        return;
    }
    console.log(`${extensionName}: Updating extension buttons based on settings...`, settings);

    // --- Right Side: Action Buttons (Now in Container Below Input) --- 
    const sendForm = document.getElementById('send_form');
    const nonQRFormItems = document.getElementById('nonQRFormItems');

    if (!sendForm || !nonQRFormItems) {
        console.error(`${extensionName}: Could not find #send_form or #nonQRFormItems. Cannot add button container.`);
        return;
    }

    // --- Get or Create the Action Button Container --- 
    let buttonContainer = document.getElementById('gg-action-button-container');
    if (!buttonContainer) {
        buttonContainer = document.createElement('div');
        buttonContainer.id = 'gg-action-button-container';
        buttonContainer.className = 'gg-action-buttons-container'; // Add class for styling
        // Insert the container AFTER nonQRFormItems within send_form
        nonQRFormItems.parentNode.insertBefore(buttonContainer, nonQRFormItems.nextSibling);
        console.log(`${extensionName}: Created action button container below input area.`);
    }

    // Clear the container before adding/arranging buttons
    buttonContainer.innerHTML = '';

    // Create a separate container for menu buttons (left side)
    const menuButtonsContainer = document.createElement('div');
    menuButtonsContainer.id = 'gg-menu-buttons-container';
    menuButtonsContainer.className = 'gg-menu-buttons-container';
    
    // Create a separate container for action buttons (right side)
    const actionButtonsContainer = document.createElement('div');
    actionButtonsContainer.id = 'gg-regular-buttons-container';
    actionButtonsContainer.className = 'gg-regular-buttons-container';
    
    // Create a spacer/QR container that will either hold QR buttons or just provide spacing
    const qrContainer = document.createElement('div');
    qrContainer.id = 'gg-qr-container';
    qrContainer.className = 'gg-qr-container';
    
    // Add all three containers to the main button container in the correct order
    buttonContainer.appendChild(menuButtonsContainer);
    buttonContainer.appendChild(qrContainer);
    buttonContainer.appendChild(actionButtonsContainer);
    
    // Check if QR bar exists and move it immediately if possible
    const qrBar = document.getElementById('qr--bar');
    if (qrBar) {
        qrContainer.appendChild(qrBar);
        console.log(`${extensionName}: QR Bar immediately integrated.`);
    } else {
        console.log(`${extensionName}: QR Bar not found, but container is ready.`);
    }

    // --- Create GG Tools Menu Button (Wand) --- 
    let ggMenuButton = document.getElementById('gg_menu_button');
    if (!ggMenuButton) {
        // Create it for the first time
        ggMenuButton = document.createElement('div');
        ggMenuButton.id = 'gg_menu_button';
        ggMenuButton.className = 'gg-menu-button fa-solid fa-bookmark'; // Base classes
        ggMenuButton.classList.add('interactable'); // Make sure it has interactable styles
        ggMenuButton.title = 'Guided Generations Tools';

        const ggToolsMenu = document.createElement('div');
        ggToolsMenu.id = 'gg_tools_menu';
        ggToolsMenu.className = 'gg-tools-menu'; // Dropdown menu styling

        // Add menu items (Simple Send, Recover Input)
        const simpleSendMenuItem = document.createElement('a');
        simpleSendMenuItem.href = '#';
        simpleSendMenuItem.className = 'interactable'; // Use interactable class
        simpleSendMenuItem.innerHTML = '<i class="fa-solid fa-paper-plane fa-fw"></i><span data-i18n="Simple Send">Simple Send</span>'; // Add icon + span
        simpleSendMenuItem.addEventListener('click', (event) => {
            console.log(`${extensionName}: Simple Send action clicked.`);
            simpleSend();
            ggToolsMenu.classList.remove('shown');
            event.stopPropagation();
        });

        const recoverInputMenuItem = document.createElement('a');
        recoverInputMenuItem.href = '#';
        recoverInputMenuItem.className = 'interactable'; // Use interactable class
        recoverInputMenuItem.innerHTML = '<i class="fa-solid fa-arrow-rotate-left fa-fw"></i><span data-i18n="Recover Input">Recover Input</span>'; // Add icon + span
        recoverInputMenuItem.addEventListener('click', (event) => {
            console.log(`${extensionName}: Recover Input action clicked.`);
            recoverInput();
            ggToolsMenu.classList.remove('shown');
            event.stopPropagation();
        });

        // Add new menu items from the JSON file
        // 1. Edit Intros
        const editIntrosMenuItem = document.createElement('a');
        editIntrosMenuItem.href = '#';
        editIntrosMenuItem.className = 'interactable';
        editIntrosMenuItem.innerHTML = '<i class="fa-solid fa-user-edit fa-fw"></i><span data-i18n="Edit Intros">Edit Intros</span>';
        editIntrosMenuItem.addEventListener('click', async (event) => {
            console.log(`${extensionName}: Edit Intros action clicked.`);
            const { default: editIntros } = await import('./scripts/tools/editIntros.js');
            await editIntros();
            ggToolsMenu.classList.remove('shown');
            event.stopPropagation();
        });

        // 2. Corrections
        const correctionsMenuItem = document.createElement('a');
        correctionsMenuItem.href = '#';
        correctionsMenuItem.className = 'interactable';
        correctionsMenuItem.innerHTML = '<i class="fa-solid fa-file-alt fa-fw"></i><span data-i18n="Corrections">Corrections</span>';
        correctionsMenuItem.addEventListener('click', async (event) => {
            console.log(`${extensionName}: Corrections action clicked.`);
            const { default: corrections } = await import('./scripts/tools/corrections.js');
            await corrections();
            ggToolsMenu.classList.remove('shown');
            event.stopPropagation();
        });

        // 3. Spellchecker
        const spellcheckerMenuItem = document.createElement('a');
        spellcheckerMenuItem.href = '#';
        spellcheckerMenuItem.className = 'interactable';
        spellcheckerMenuItem.innerHTML = '<i class="fa-solid fa-spell-check fa-fw"></i><span data-i18n="Spellchecker">Spellchecker</span>';
        spellcheckerMenuItem.addEventListener('click', async (event) => {
            console.log(`${extensionName}: Spellchecker action clicked.`);
            const { default: spellchecker } = await import('./scripts/tools/spellchecker.js');
            await spellchecker();
            ggToolsMenu.classList.remove('shown');
            event.stopPropagation();
        });

        // 4. Clear Input
        const clearInputMenuItem = document.createElement('a');
        clearInputMenuItem.href = '#';
        clearInputMenuItem.className = 'interactable';
        clearInputMenuItem.innerHTML = '<i class="fa-solid fa-trash fa-fw"></i><span data-i18n="Clear Input">Clear Input</span>';
        clearInputMenuItem.addEventListener('click', async (event) => {
            console.log(`${extensionName}: Clear Input action clicked.`);
            const { default: clearInput } = await import('./scripts/tools/clearInput.js');
            await clearInput();
            ggToolsMenu.classList.remove('shown');
            event.stopPropagation();
        });

        // Add original items first
        ggToolsMenu.appendChild(simpleSendMenuItem);
        ggToolsMenu.appendChild(recoverInputMenuItem);
        
        // Add a separator
        const separator = document.createElement('hr');
        separator.className = 'pg-separator';
        ggToolsMenu.appendChild(separator);
        
        // Add new items after the separator
        ggToolsMenu.appendChild(editIntrosMenuItem);
        ggToolsMenu.appendChild(correctionsMenuItem);
        ggToolsMenu.appendChild(spellcheckerMenuItem);
        ggToolsMenu.appendChild(clearInputMenuItem);

        // Add Update Character item
        /*const updateCharacterMenuItem = document.createElement('a');
        updateCharacterMenuItem.href = '#';
        updateCharacterMenuItem.className = 'interactable';
        updateCharacterMenuItem.innerHTML = '<i class="fa-solid fa-user-pen fa-fw"></i><span data-i18n="Update Character">Update Character</span>';
        updateCharacterMenuItem.addEventListener('click', (event) => {
            console.log(`${extensionName}: Update Character action clicked.`);
            updateCharacter();
            ggToolsMenu.classList.remove('shown');
            event.stopPropagation();
        });
        ggToolsMenu.appendChild(updateCharacterMenuItem);*/

        // Append the menu itself to the body, not the button
        document.body.appendChild(ggToolsMenu);

        // Event Handlers for Menu Toggle and Close
        ggMenuButton.addEventListener('click', (event) => {
            console.log(`${extensionName}: ggMenuButton clicked.`);

            // --- Measure Height Correctly ---
            // Temporarily show the menu off-screen to measure its height
            ggToolsMenu.style.visibility = 'hidden'; 
            ggToolsMenu.style.display = 'block'; // Or the display type it uses when shown
            const menuHeight = ggToolsMenu.offsetHeight; 
            ggToolsMenu.style.display = ''; // Reset display before final positioning
            ggToolsMenu.style.visibility = ''; // Reset visibility
            // ---------------------------------

            // Calculate position before showing
            const buttonRect = ggMenuButton.getBoundingClientRect();
            const gap = 5; // Add a 5px gap above the button

            // Calculate Y so the *bottom* of the menu is 'gap' pixels above the button's top
            const targetMenuBottomY = buttonRect.top - gap + window.scrollY;
            const targetMenuTopY = targetMenuBottomY - menuHeight; // This is the final top coordinate
            const targetMenuLeftX = buttonRect.left + window.scrollX;

            // Apply top/left instead of transform
            ggToolsMenu.style.top = `${targetMenuTopY}px`;
            ggToolsMenu.style.left = `${targetMenuLeftX}px`;

            ggToolsMenu.classList.toggle('shown');
            event.stopPropagation();
        });

        document.addEventListener('click', (event) => {
            if (ggToolsMenu.classList.contains('shown') && !ggMenuButton.contains(event.target)) {
                console.log(`${extensionName}: Click outside detected, hiding menu.`);
                ggToolsMenu.classList.remove('shown');
            }
        });
        console.log(`${extensionName}: Created GG Tools menu button.`);
    } 
    // Add menu button to the menu buttons container
    menuButtonsContainer.appendChild(ggMenuButton);

    // --- Create Persistent Guides Menu Button --- 
    let pgMenuButton = document.getElementById('pg_menu_button');
    if (!pgMenuButton) {
        // Create it for the first time
        pgMenuButton = document.createElement('div');
        pgMenuButton.id = 'pg_menu_button';
        pgMenuButton.className = 'gg-menu-button fa-solid fa-book-open-reader'; // Thinking icon
        pgMenuButton.classList.add('interactable'); // Make sure it has interactable styles
        pgMenuButton.title = 'Persistent Guides';
        pgMenuButton.style.marginLeft = '5px'; // Add some spacing from the GG Tools button

        const pgToolsMenu = document.createElement('div');
        pgToolsMenu.id = 'pg_tools_menu';
        pgToolsMenu.className = 'gg-tools-menu'; // Use same dropdown menu styling

        // Add menu items for each persistent guide
        const createGuideItem = (name, icon, action) => {
            const item = document.createElement('a');
            item.href = '#';
            item.className = 'interactable'; // Use interactable class
            item.innerHTML = `<i class="fa-solid ${icon} fa-fw"></i><span data-i18n="${name}">${name}</span>`; // Add icon + span
            item.addEventListener('click', (event) => {
                console.log(`${extensionName}: ${name} Guide clicked.`);
                action();
                pgToolsMenu.classList.remove('shown');
                event.stopPropagation();
            });
            return item;
        };

        // Define the order and details for content guides
        const contentGuides = [
            { name: 'Situational', icon: 'fa-location-dot', path: './scripts/persistentGuides/situationalGuide.js' },
            { name: 'Thinking', icon: 'fa-brain', path: './scripts/persistentGuides/thinkingGuide.js' },
            { name: 'Clothes', icon: 'fa-shirt', path: './scripts/persistentGuides/clothesGuide.js' },
            { name: 'State', icon: 'fa-face-smile', path: './scripts/persistentGuides/stateGuide.js' },
            { name: 'Rules', icon: 'fa-list-ol', path: './scripts/persistentGuides/rulesGuide.js' },
            { name: 'Custom', icon: 'fa-pen-to-square', path: './scripts/persistentGuides/customGuide.js' },
            { name: 'Custom Auto', icon: 'fa-robot', path: './scripts/persistentGuides/customAutoGuide.js' }
        ];

        // Define the order and details for tool guides
        const toolGuides = [
            { name: 'Show Guides', icon: 'fa-eye', path: './scripts/persistentGuides/showGuides.js' },
            { name: 'Edit Guides', icon: 'fa-edit', path: './scripts/persistentGuides/editGuides.js' },
            { name: 'Flush Guides', icon: 'fa-trash', path: './scripts/persistentGuides/flushGuides.js' }
        ];

        // Load the content guides in sequence
        Promise.all(contentGuides.map(guide => {
            return import(guide.path)
                .then(module => {
                    const guideItem = createGuideItem(guide.name, guide.icon, module.default);
                    pgToolsMenu.appendChild(guideItem);
                    console.log(`${extensionName}: Added ${guide.name} guide to menu`);
                })
                .catch(error => console.error(`${extensionName}: Error importing ${guide.name} guide:`, error));
        }))
        .then(() => {
            // After all content guides, add the separator
            const separator = document.createElement('hr');
            separator.className = 'pg-separator';
            pgToolsMenu.appendChild(separator);
            console.log(`${extensionName}: Added separator to menu`);

            // Then load the tool guides
            return Promise.all(toolGuides.map(guide => {
                return import(guide.path)
                    .then(module => {
                        const guideItem = createGuideItem(guide.name, guide.icon, module.default);
                        pgToolsMenu.appendChild(guideItem);
                        console.log(`${extensionName}: Added ${guide.name} tool to menu`);
                    })
                    .catch(error => console.error(`${extensionName}: Error importing ${guide.name} tool:`, error));
            }));
        })
        .catch(error => console.error(`${extensionName}: Error setting up persistent guides menu:`, error));

        // Append the menu itself to the body
        document.body.appendChild(pgToolsMenu);

        // Event Handlers for Menu Toggle and Close
        pgMenuButton.addEventListener('click', (event) => {
            console.log(`${extensionName}: pgMenuButton clicked.`);

            // Temporarily show the menu off-screen to measure its height
            pgToolsMenu.style.visibility = 'hidden'; 
            pgToolsMenu.style.display = 'block';
            const menuHeight = pgToolsMenu.offsetHeight; 
            pgToolsMenu.style.display = ''; 
            pgToolsMenu.style.visibility = ''; 

            // Calculate position before showing
            const buttonRect = pgMenuButton.getBoundingClientRect();
            const gap = 5; // Add a 5px gap above the button

            // Calculate Y so the *bottom* of the menu is 'gap' pixels above the button's top
            const targetMenuBottomY = buttonRect.top - gap + window.scrollY;
            const targetMenuTopY = targetMenuBottomY - menuHeight; // This is the final top coordinate
            const targetMenuLeftX = buttonRect.left + window.scrollX;

            // Apply top/left instead of transform
            pgToolsMenu.style.top = `${targetMenuTopY}px`;
            pgToolsMenu.style.left = `${targetMenuLeftX}px`;

            pgToolsMenu.classList.toggle('shown');
            event.stopPropagation();
        });

        document.addEventListener('click', (event) => {
            if (pgToolsMenu.classList.contains('shown') && !pgMenuButton.contains(event.target)) {
                console.log(`${extensionName}: Click outside detected, hiding persistent guides menu.`);
                pgToolsMenu.classList.remove('shown');
            }
        });
        console.log(`${extensionName}: Created Persistent Guides menu button.`);
    } 
    // Add Persistent Guides menu button to the menu buttons container
    menuButtonsContainer.appendChild(pgMenuButton);

    // --- Create Action Buttons --- 
    // Helper function to create buttons
    const createActionButton = (id, title, iconClass, actionFunc) => {
        const button = document.createElement('div');
        button.id = id;
        button.className = 'gg-action-button'; // Base class
        
        // Split the icon class string by spaces and add each class separately
        if (iconClass) {
            const iconClasses = iconClass.split(' ');
            iconClasses.forEach(cls => {
                if (cls) button.classList.add(cls);
            });
        }
        
        button.classList.add('interactable'); // Add interactable class
        button.title = title;
        
        button.addEventListener('click', (event) => {
            actionFunc(event);
        });
        
        return button;
    };
    
    // Create an array to store all buttons that will go in the regular buttons container
    // We'll add the buttons in the desired order and then add them to the container
    const regularButtons = [];
    
    // Add individual tool buttons first (left side)
    
    // Simple Send button
    if (settings.showSimpleSendButton) {
        const simpleSendButton = createActionButton('gg_simple_send_button', 'Simple Send', 'fa-solid fa-paper-plane', simpleSend);
        regularButtons.push(simpleSendButton);
    }
    
    // Recover Input button
    if (settings.showRecoverInputButton) {
        const recoverInputButton = createActionButton('gg_recover_input_button', 'Recover Input', 'fa-solid fa-arrow-rotate-left', recoverInput);
        regularButtons.push(recoverInputButton);
    }
    
    // Edit Intros button
    if (settings.showEditIntrosButton) {
        const editIntrosButton = createActionButton('gg_edit_intros_button', 'Edit Intros', 'fa-solid fa-user-edit', async () => {
            const { default: editIntros } = await import('./scripts/tools/editIntros.js');
            await editIntros();
        });
        regularButtons.push(editIntrosButton);
    }
    
    // Corrections button
    if (settings.showCorrectionsButton) {
        const correctionsButton = createActionButton('gg_corrections_button', 'Corrections', 'fa-solid fa-file-alt', async () => {
            const { default: corrections } = await import('./scripts/tools/corrections.js');
            await corrections();
        });
        regularButtons.push(correctionsButton);
    }
    
    // Spellchecker button
    if (settings.showSpellcheckerButton) {
        const spellcheckerButton = createActionButton('gg_spellchecker_button', 'Spellchecker', 'fa-solid fa-spell-check', async () => {
            const { default: spellchecker } = await import('./scripts/tools/spellchecker.js');
            await spellchecker();
        });
        regularButtons.push(spellcheckerButton);
    }
    
    // Clear Input button
    if (settings.showClearInputButton) {
        const clearInputButton = createActionButton('gg_clear_input_button', 'Clear Input', 'fa-solid fa-trash', async () => {
            const { default: clearInput } = await import('./scripts/tools/clearInput.js');
            await clearInput();
        });
        regularButtons.push(clearInputButton);
    }
    
    // Add standard buttons after tool buttons (right side)
    
    // Add impersonate buttons
    if (settings.showImpersonate1stPerson) {
        const btn1 = createActionButton('gg_impersonate_button', 'Guided Impersonate (1st Person)', 'fa-solid fa-user', guidedImpersonate);
        regularButtons.push(btn1);
    }
    
    if (settings.showImpersonate2ndPerson) {
        const btn2 = createActionButton('gg_impersonate_button_2nd', 'Guided Impersonate (2nd Person)', 'fa-solid fa-user-group', guidedImpersonate2nd);
        regularButtons.push(btn2);
    }
    
    if (settings.showImpersonate3rdPerson) {
        const btn3 = createActionButton('gg_impersonate_button_3rd', 'Guided Impersonate (3rd Person)', 'fa-solid fa-users', guidedImpersonate3rd);
        regularButtons.push(btn3);
    }

    // Add Guided Swipe Button
    if (settings.showGuidedSwipe) {
        const guidedSwipeButton = createActionButton('gg_swipe_button', 'Guided Swipe', 'fa-solid fa-forward', guidedSwipe);
        regularButtons.push(guidedSwipeButton);
    }

    // Add Guided Response Button
    if (settings.showGuidedResponse) {
        const guidedResponseButton = createActionButton('gg_response_button', 'Guided Response', 'fa-solid fa-dog', guidedResponse);
        regularButtons.push(guidedResponseButton);
    }

    // Add Guided Continue Button
    if (settings.showGuidedContinue) {
        const guidedContinueButton = createActionButton('gg_continue_button', 'Guided Continue', 'fa-solid fa-arrow-right', guidedContinue);
        regularButtons.push(guidedContinueButton);
    }
    
    // Append all buttons to the container in the correct order
    regularButtons.forEach(button => {
        actionButtonsContainer.appendChild(button);
    });
}

// Function to integrate QR Bar from other extensions into our container
function integrateQRBar() {
    // Since we now always create the container, just focus on moving the QR bar if it exists
    const qrBar = document.getElementById('qr--bar');
    if (!qrBar) {
        // QR Bar doesn't exist yet, will keep checking
        return false;
    }

    // Check if QR Bar is already in our container
    const qrContainer = document.getElementById('gg-qr-container');
    if (!qrContainer) {
        console.log(`${extensionName}: QR container not found, this shouldn't happen.`);
        return false;
    }
    
    // If the QR bar is already in our container, we're done
    if (qrBar.parentElement === qrContainer) {
        // Already integrated
        return true;
    }

    try {
        // Move the QR Bar to our container
        qrContainer.appendChild(qrBar);
        console.log(`${extensionName}: Successfully moved QR Bar into our container.`);
        return true;
    } catch (error) {
        console.error(`${extensionName}: Error moving QR Bar:`, error);
        return false;
    }
}

// Setup a polling mechanism to integrate QR Bar when it appears
function startQRBarIntegration() {
    console.log(`${extensionName}: Starting QR Bar integration monitor...`);
    
    // Try to integrate immediately
    let integrated = integrateQRBar();
    
    // If not successful, set up a polling mechanism
    if (!integrated) {
        const integrationInterval = setInterval(() => {
            integrated = integrateQRBar();
            if (integrated) {
                clearInterval(integrationInterval);
                console.log(`${extensionName}: QR Bar integration complete, stopping monitor.`);
            }
        }, 1000); // Check every second
        
        // Stop checking after 30 seconds if not found
        setTimeout(() => {
            if (!integrated) {
                clearInterval(integrationInterval);
                console.log(`${extensionName}: QR Bar integration timed out after 30 seconds.`);
            }
        }, 30000);
    }
}

// Set up a more aggressive and robust mutation observer to detect when the QR bar appears
function setupQRMutationObserver() {
    console.log(`${extensionName}: Setting up enhanced QR Bar integration observer...`);
    
    // Create a timer that will periodically try to integrate the QR bar
    const integrationTimer = setInterval(() => {
        const integrated = integrateQRBar();
        // Stop the timer after 30 seconds regardless to avoid ongoing polling
        setTimeout(() => {
            clearInterval(integrationTimer);
            console.log(`${extensionName}: Stopping automatic QR integration attempts.`);
        }, 30000);
    }, 1000); // Try every second
    
    // Set up a document-wide mutation observer to catch the QR bar whenever it appears
    setTimeout(() => {
        // Watch the entire document for changes
        const observer = new MutationObserver((mutations) => {
            // Check if any of the mutations involve the qr--bar being added
            const shouldTryIntegrate = mutations.some(mutation => {
                // Check added nodes
                if (mutation.addedNodes.length) {
                    return Array.from(mutation.addedNodes).some(node => {
                        if (node.id === 'qr--bar') return true;
                        if (node.querySelector && node.querySelector('#qr--bar')) return true;
                        return false;
                    });
                }
                return false;
            });
            
            if (shouldTryIntegrate) {
                integrateQRBar();
            }
        });
        
        // Observe the whole document with a focus on childList and subtree
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
        
        console.log(`${extensionName}: Set up enhanced mutation observer for QR Bar integration.`);
    }, 1000); // Start observing after a short delay to allow the page to load
}

// Initial setup function
function setup() {
    // Load extension settings
    loadSettings();
    // Initial UI update - executes after settings are verified loaded
    updateExtensionButtons(); // Initial button creation/update
    // Start the QR Bar integration
    startQRBarIntegration();
    // Setup mutation observer
    setupQRMutationObserver();
}

// --- Preset Installation ---
// Installs the text completion preset defined within GGSytemPrompt.json if it doesn't exist.
// This file should be a full preset object exported from SillyTavern.
async function installPreset() {
    const presetFileName = 'GGSytemPrompt.json';
    // Derive the preset name from the filename (matching manual import behavior)
    const presetName = presetFileName.replace(/\.json$/i, ''); // Remove .json extension case-insensitively
    // Preset type for Chat Completion parameters (OpenAI/ChatGPT style models)
    const presetApiId = 'openai'; 
    // Construct the path relative to the SillyTavern root
    const presetPath = `scripts/extensions/third-party/${extensionName}/${presetFileName}`;
    console.log(`${extensionName}: Attempting to install ${presetApiId} preset "${presetName}" from ${presetPath}`);

    try {
        const response = await fetch(presetPath);

        if (!response.ok) {
            console.error(`${extensionName}: Failed to fetch ${presetFileName}. Status: ${response.status}`);
            if (response.status === 404) {
                 console.error(`${extensionName}: Make sure '${presetFileName}' exists in the '${extensionName}' extension folder.`);
            }
            return;
        }

        // Read the full preset data from the JSON file
        const presetData = await response.json(); 

        // Validate internal structure: Must have a prompts array with at least one entry containing name and content.
        // Keep this validation even for chat completion presets to ensure the file has the right structure
        if (!presetData || typeof presetData !== 'object' || 
            !Array.isArray(presetData.prompts) || presetData.prompts.length === 0 || 
            !presetData.prompts[0].name || typeof presetData.prompts[0].content !== 'string') {
            console.error(`${extensionName}: Invalid internal structure in ${presetFileName}. It must be an object containing a 'prompts' array, where the first element has 'name' and 'content' properties. Received structure:`, presetData);
            return;
        }

        // Use the filename-derived name for checking and saving.
        console.log(`${extensionName}: Validated internal structure of ${presetFileName} for preset "${presetName}"`);

        const presetManager = getPresetManager(presetApiId);

        if (!presetManager) {
            console.error(`${extensionName}: Could not get Preset Manager for apiId '${presetApiId}'.`);
            return;
        }

        // Store the currently selected preset name/value before we install ours
        let currentPresetName = null;
        try {
            // Get the currently selected option
            const $select = $(presetManager.select);
            const currentValue = $select.val();
            
            if (presetManager.isKeyedApi()) {
                // For keyed APIs (like 'openai'), the value is the name
                currentPresetName = currentValue;
            } else {
                // For indexed APIs, we need to get the text of the selected option
                currentPresetName = $select.find('option:selected').text();
            }
            
            console.log(`${extensionName}: Current ${presetApiId} preset: "${currentPresetName}"`);
        } catch(err) {
            console.warn(`${extensionName}: Could not determine current preset: ${err}`);
        }

        // Check if preset already exists using the filename-derived name
        const existingPreset = presetManager.findPreset(presetName);

        if (existingPreset !== undefined && existingPreset !== null) {
            console.log(`${extensionName}: Preset "${presetName}" (${presetApiId}) already exists. Skipping installation.`);
        } else {
            console.log(`${extensionName}: Preset "${presetName}" (${presetApiId}) not found. Attempting to save...`);
            // Save the entire original presetData object, using the filename-derived name.
            // This matches how performMasterImport handles chat completion presets.
            await presetManager.savePreset(presetName, presetData);
            console.log(`${extensionName}: Preset "${presetName}" (${presetApiId}) successfully saved (using full data structure and filename).`);
            
            // If we had a previously selected preset, switch back to it
            if (currentPresetName && currentPresetName !== presetName) {
                try {
                    // This uses jQuery to select the option and trigger the change event
                    // This is the same way PresetManager does it internally
                    setTimeout(() => {
                        const $select = $(presetManager.select);
                        if (presetManager.isKeyedApi()) {
                            $select.val(currentPresetName).trigger('change');
                        } else {
                            // For indexed APIs, find the option with the matching text
                            const $option = $select.find(`option:contains("${currentPresetName}")`);
                            if ($option.length > 0) {
                                $select.val($option.val()).trigger('change');
                            }
                        }
                        console.log(`${extensionName}: Restored previous ${presetApiId} preset: "${currentPresetName}"`);
                    }, 100); // Small delay to ensure the DOM has updated
                } catch(err) {
                    console.warn(`${extensionName}: Could not restore previous preset: ${err}`);
                }
            }
        }

    } catch (error) {
        console.error(`${extensionName}: Error during preset installation:`, error);
        if (error instanceof SyntaxError) {
             console.error(`${extensionName}: Check if ${presetFileName} contains valid JSON.`);
        }
    }
}

// Run setup after page load
$(document).ready(function() {
    setup();
    // Settings Panel Setup (runs with delay to allow main UI to render)
    setTimeout(() => {
        console.log(`[${extensionName}] Delay finished, initiating settings panel load...`);
        loadSettingsPanel();
    }, 1000);
    // Attempt to install the preset (can run relatively early)
    installPreset();
    
    // Also set up a mutation observer to detect when the QR bar might be added/removed
    const observer = new MutationObserver(() => {
        integrateQRBar();
    });
    
    // Start observing after a delay to ensure main UI is loaded
    setTimeout(() => {
        const sendForm = document.getElementById('send_form');
        if (sendForm) {
            observer.observe(sendForm, { childList: true, subtree: true });
            console.log(`${extensionName}: Set up mutation observer for QR Bar integration.`);
        }
    }, 2000);
});

// Export settings helpers for settingsPanel.js import
export { loadSettings, updateSettingsUI, addSettingsEventListeners };
