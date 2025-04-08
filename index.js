import { eventSource, saveSettingsDebounced } from '../../../../script.js'; // For event handling (will use later)
// Removed the incorrect SillyTavern import

// Import button logic from separate modules
import { simpleSend } from './scripts/simpleSend.js';
import { recoverInput } from './scripts/inputRecovery.js';
import { guidedResponse } from './scripts/guidedResponse.js';
import { guidedSwipe } from './scripts/guidedSwipe.js';
import { guidedImpersonate } from './scripts/guidedImpersonate.js';
import { guidedImpersonate2nd } from './scripts/guidedImpersonate2nd.js'; // Import 2nd
import { guidedImpersonate3rd } from './scripts/guidedImpersonate3rd.js'; // Import 3rd
// Import the new Update Character function
import { updateCharacter } from './scripts/persistentGuides/updateCharacter.js';
// Import necessary functions/objects from SillyTavern
import { getContext, loadExtensionSettings, extension_settings, renderExtensionTemplateAsync } from '../../../extensions.js'; 
// Import Preset Manager
import { getPresetManager } from '../../../../scripts/preset-manager.js';

export const extensionName = "guided-generations"; // Use the simple name as the internal identifier
// const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`; // No longer needed

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
        //console.error(`${extensionName}: Settings container not found during UI update.`);
        // It's okay if the container isn't ready yet on initial load
        return;
    }

    console.log(`${extensionName}: Updating settings UI...`, settings);
    let uiChanged = false;
    for (const key in settings) {
        const value = settings[key];
        const checkbox = container.querySelector(`input[type="checkbox"][name="${key}"]`);
        if (checkbox) {
            if (checkbox.checked !== Boolean(value)) {
                checkbox.checked = Boolean(value);
                uiChanged = true; // Track if UI actually changed
            }
            //console.log(`${extensionName}: Set checkbox ${key} to ${checkbox.checked}`);
        } else {
            //console.warn(`${extensionName}: Checkbox for setting ${key} not found in UI.`);
        }
    }

    // Only update buttons if the UI relevant to them might have changed
    if (uiChanged) {
         console.log(`${extensionName}: Settings UI changed, updating buttons.`);
         updateExtensionButtons();
    }
}

function addSettingsEventListeners() {
    const container = document.getElementById(`extension_settings_${extensionName}`);
    if (!container) {
        // console.error(`${extensionName}: Settings container not found for adding listeners.`);
        return; // Okay if not ready yet
    }

    // Clear previous listeners if any (simple approach)
    // A more robust way would be to store and remove specific listeners
    const newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);

    console.log(`${extensionName}: Adding settings event listeners...`);
    Object.keys(extension_settings[extensionName]).forEach(key => {
        const checkbox = newContainer.querySelector(`input[type="checkbox"][name="${key}"]`);
        if (checkbox) {
            checkbox.addEventListener('change', (event) => {
                console.log(`${extensionName}: Setting ${key} changed to ${event.target.checked}`);
                extension_settings[extensionName][key] = event.target.checked;
                saveSettingsDebounced();

                // Update buttons immediately if a relevant setting changed
                if (key.startsWith('showImpersonate')) {
                    updateExtensionButtons();
                }
            });
        } else {
            // console.warn(`${extensionName}: Checkbox for setting ${key} not found for adding listener.`);
        }
    });
    console.log(`${extensionName}: Settings event listeners added.`);
}

// Function to create and add/remove buttons based on settings
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
    
    // Add both containers to the main button container
    buttonContainer.appendChild(menuButtonsContainer);
    buttonContainer.appendChild(actionButtonsContainer);

    // --- Create GG Tools Menu Button (Wand) --- 
    let ggMenuButton = document.getElementById('gg_menu_button');
    if (!ggMenuButton) {
        // Create it for the first time
        ggMenuButton = document.createElement('div');
        ggMenuButton.id = 'gg_menu_button';
        ggMenuButton.className = 'gg-menu-button fa-solid fa-wand-magic-sparkles'; // Base classes
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
        const updateCharacterMenuItem = document.createElement('a');
        updateCharacterMenuItem.href = '#';
        updateCharacterMenuItem.className = 'interactable';
        updateCharacterMenuItem.innerHTML = '<i class="fa-solid fa-user-pen fa-fw"></i><span data-i18n="Update Character">Update Character</span>';
        updateCharacterMenuItem.addEventListener('click', (event) => {
            console.log(`${extensionName}: Update Character action clicked.`);
            updateCharacter();
            ggToolsMenu.classList.remove('shown');
            event.stopPropagation();
        });
        ggToolsMenu.appendChild(updateCharacterMenuItem);

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
        pgMenuButton.className = 'gg-menu-button fa-solid fa-bookmark'; // Bookmark icon
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
            { name: 'Custom', icon: 'fa-pen-to-square', path: './scripts/persistentGuides/customGuide.js' }
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
        button.className = `gg-action-button ${iconClass}`;
        button.title = title;
        button.classList.add('interactable'); // Add interactable class for consistent styling/behavior
        button.addEventListener('click', actionFunc);
        return button;
    };

    // Conditionally create and add buttons
    if (settings.showImpersonate1stPerson) {
        const btn1 = createActionButton('gg_impersonate_button', 'Guided Impersonate (1st Person)', 'fa-solid fa-user', guidedImpersonate);
        actionButtonsContainer.appendChild(btn1); // Add directly to action buttons container
    }
    if (settings.showImpersonate2ndPerson) {
        const btn2 = createActionButton('gg_impersonate_button_2nd', 'Guided Impersonate (2nd Person)', 'fa-solid fa-user-group', guidedImpersonate2nd);
        actionButtonsContainer.appendChild(btn2);
    }
    if (settings.showImpersonate3rdPerson) {
        const btn3 = createActionButton('gg_impersonate_button_3rd', 'Guided Impersonate (3rd Person)', 'fa-solid fa-users', guidedImpersonate3rd);
        actionButtonsContainer.appendChild(btn3);
    }

    // Guided Swipe Button (Restore correct icon)
    const guidedSwipeButton = createActionButton('gg_swipe_button', 'Guided Swipe', 'fa-solid fa-forward', guidedSwipe); // Correct icon: fa-forward
    actionButtonsContainer.appendChild(guidedSwipeButton);

    // Guided Response Button (Restore correct icon)
    const guidedResponseButton = createActionButton('gg_response_button', 'Guided Response', 'fa-solid fa-dog', guidedResponse); // Correct icon: fa-dog
    actionButtonsContainer.appendChild(guidedResponseButton);
}

// Initial setup function
function setup() {
    // Initial call to setup buttons based on default/loaded settings
    // Make sure settings are loaded first!
    loadSettings(); // Load settings early
    updateExtensionButtons(); // Then update/create buttons

    // Add listener to update buttons when settings change
    // We need to listen for the save event or similar.
    // Let's try calling updateExtensionButtons after settings are saved.
    // Modifying the saveSettingsDebounced or finding an event might be better later.
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
    // Settings Panel Setup (runs with delay)
    loadSettingsPanel(); 
    // Attempt to install the preset
    installPreset(); 
});

// --- Settings Panel Loading --- (Keep existing loadSettingsPanel async function)
async function loadSettingsPanel() {
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

    // Use renderExtensionTemplateAsync instead of manual $.get
    try {
        console.log(`${extensionName}: Rendering settings template using renderExtensionTemplateAsync...`);
        // Assuming 'settings' maps to settings.html by convention
        // Use the explicit path identifier for third-party extensions, referencing the root folder
        const settingsHtml = await renderExtensionTemplateAsync(`third-party/${extensionName}`, 'settings'); 
        console.log(`${extensionName}: Settings template rendered successfully.`);
        
        // Append the fetched HTML to the container using jQuery
        $(container).html(settingsHtml); // Use jQuery's .html()
        
        // Defer the rest of the logic slightly to allow DOM update
        setTimeout(() => {
            console.log(`${extensionName}: DOM updated, now loading settings and adding listeners...`);
            // ***** Load settings HERE, right before updating UI *****
            loadSettings(); // Ensure settings are loaded/initialized

            // Update the UI elements to reflect loaded settings
            updateSettingsUI(); 

            // Add event listeners AFTER the HTML is loaded AND UI is updated
            addSettingsEventListeners();
            console.log(`${extensionName}: Settings panel actions complete.`);
        }, 0); // 0ms delay is usually sufficient

    } catch (error) {
        console.error(`${extensionName}: Error rendering settings template with renderExtensionTemplateAsync:`, error);
        if (container) { // Check if container exists before modifying
             container.innerHTML = '<p>Error: Could not render settings template. Check browser console (F12).</p>';
        }
    }
}
