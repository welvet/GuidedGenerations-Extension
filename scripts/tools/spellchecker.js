/**
 * @file Contains the logic for the Spellcheck tool.
 */
import { extensionName, setPreviousImpersonateInput } from '../../index.js'; // Import shared state function
import { getContext, extension_settings } from '../../../../../extensions.js'; 

/**
 * Provides a tool to correct grammar, punctuation, and improve paragraph flow
 * 
 * @returns {Promise<void>}
 */
export default async function spellchecker() {
    const textarea = document.getElementById('send_textarea');
    if (!textarea) {
        console.error('[GuidedGenerations][Spellchecker] Textarea #send_textarea not found.');
        return;
    }
    const originalInput = textarea.value; // Get current input

    // Save the input state using the shared function (even though we overwrite it later)
    setPreviousImpersonateInput(originalInput);
    console.log(`[GuidedGenerations][Spellchecker] Original input saved (for potential recovery elsewhere): "${originalInput}"`);

    // Determine target preset from settings
    const presetKey = 'presetSpellchecker';
    const targetPreset = extension_settings[extensionName]?.[presetKey];

    // Handle preset switching using PresetManager
    const presetValue = extension_settings[extensionName]?.presetSpellchecker ?? '';
    let originalPresetId = null;
    let targetPresetId = null;
    
    if (presetValue) {
        try {
            const presetManager = getContext()?.getPresetManager?.();
            if (presetManager) {
                const availablePresets = presetManager.getPresetList();
                
                // Check if it's a valid ID
                const validPresetIds = availablePresets.map(p => p.id);
                if (validPresetIds.includes(presetValue)) {
                    targetPresetId = presetValue;
                } else {
                    // Check if it's a legacy name that matches a preset
                    const matchingPreset = availablePresets.find(p => p.name === presetValue);
                    if (matchingPreset) {
                        targetPresetId = matchingPreset.id;
                    } else {
                        console.warn(`${extensionName}: Preset '${presetValue}' not found in available presets. Skipping preset switch.`);
                    }
                }
                
                if (targetPresetId) {
                    originalPresetId = presetManager.getSelectedPreset();
                    if (targetPresetId !== originalPresetId) {
                        presetManager.selectPreset(targetPresetId);
                    }
                }
            }
        } catch (error) {
            console.error(`${extensionName}: Error switching preset for spellchecker:`, error);
        }
    }

    // Use user-defined spellchecker prompt override
    const isRaw = extension_settings[extensionName]?.rawPromptSpellchecker ?? false;
    const promptTemplate = extension_settings[extensionName]?.promptSpellchecker ?? '';
    const filledPrompt = promptTemplate.replace('{{input}}', originalInput);

    // Execute the spellchecker workflow
    const stscript = `
        ${presetSwitchStart}

        // Generate correction using the current input|
        ${isRaw ? filledPrompt : `/genraw ${filledPrompt}`} |
        // Replace the input field with the generated correction|
        /setinput {{pipe}}|

        ${presetSwitchEnd}
    `;
    
    executeSTScript(stscript); // Use the existing helper
}

/**
 * Helper function to execute ST-Script commands
 * @param {string} stscript - The ST-Script command to execute
 */
async function executeSTScript(stscript) { // Make helper async if it needs context
    try {
        // Use the context executeSlashCommandsWithOptions method
        const context = getContext(); // Get context via imported function
        // Send the combined script via context
        await context.executeSlashCommandsWithOptions(stscript);
    } catch (error) {
        console.error(`${extensionName}: Spellchecker Error executing ST-Script:`, error);
    }
}
