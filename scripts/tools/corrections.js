/**
 * @file Contains the logic for the Corrections tool.
 */
import { extensionName, setPreviousImpersonateInput } from '../../index.js'; // Import shared state function
import { getContext, extension_settings } from '../../../../../extensions.js'; 
import { generateNewSwipe } from '../guidedSwipe.js'; // Import the new function
import { handlePresetSwitching } from '../utils/presetUtils.js';

// Helper function for delays (copied from guidedSwipe.js)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Provides a tool to modify the last message based on user's instructions
 * 
 * @returns {Promise<void>}
 */
export default async function corrections() {
    const textarea = document.getElementById('send_textarea');
    if (!textarea) {
        console.error('[GuidedGenerations][Corrections] Textarea #send_textarea not found.');
        return;
    }
    const originalInput = textarea.value; // Get current input

    // Save the input state using the shared function
    setPreviousImpersonateInput(originalInput);
    console.log(`[GuidedGenerations][Corrections] Original input saved: "${originalInput}"`);

    // Use user-defined corrections prompt override
    const isRaw = extension_settings[extensionName]?.rawPromptCorrections ?? false;
    const promptTemplate = extension_settings[extensionName]?.promptCorrections ?? '';
    const filledPrompt = promptTemplate.replace('{{input}}', originalInput);

    // Determine target preset from settings
    const presetKey = 'presetCorrections';
    const targetPreset = extension_settings[extensionName]?.[presetKey];

    // Handle preset switching using PresetManager
    const presetValue = extension_settings[extensionName]?.presetCorrections ?? '';
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
            console.error(`${extensionName}: Error switching preset for corrections:`, error);
        }
    }

    // --- Part 1: Execute STscript for Presets and Injections --- 
    const instructionInjection = isRaw ? filledPrompt : `[${filledPrompt}]`;
    const depth = extension_settings[extensionName]?.depthPromptCorrections ?? 0;
    const stscriptPart1 = `
        ${presetSwitchStartScript}

        // Inject assistant message to rework and instructions|
        /inject id=msgtorework position=chat ephemeral=true scan=true depth=${depth} role=assistant {{lastMessage}}|
        // Inject instructions using user override prompt|
        /inject id=instruct position=chat ephemeral=true scan=true depth=${depth} ${instructionInjection}|
    `;
    
    try {
        await executeSTScript(stscriptPart1); // Use the helper for STscript

        // --- Part 2: Execute JS Swipe Logic --- 
        const jQueryRef = (typeof $ !== 'undefined') ? $ : jQuery;
        if (!jQueryRef) {
            console.error("[GuidedGenerations][Corrections] jQuery not found.");
            alert("Corrections Tool Error: jQuery not available.");
            // Attempt to run preset end script even if swipe fails
             await executeSTScript(presetSwitchEndScript);
            return; 
        }

        const swipeSuccess = await generateNewSwipe(); // Call the imported function

        if (swipeSuccess) {
        } else {
            console.error("[GuidedGenerations][Corrections] generateNewSwipe() reported failure or an issue occurred. Attempting to run preset end script.");
            // generateNewSwipe() itself often alerts on failure. If it throws, the main catch block will also alert.
            // We run the end script here for cases where it returns false without throwing, to ensure cleanup.
            if (presetSwitchEndScript && typeof executeSTScript === 'function') { // Ensure dependencies are available
                try {
                    await executeSTScript(presetSwitchEndScript);
                } catch (scriptError) {
                    console.error("[GuidedGenerations][Corrections] Error executing presetSwitchEndScript after generateNewSwipe failure:", scriptError);
                    // Optionally alert here too, or rely on main catch if this rethrows.
                }
            }
            // Note: The function will continue to the final log and exit the try block.
            // The outer catch in correctionsTool handles broader errors.
        }


    } catch (error) {
        console.error("[GuidedGenerations][Corrections] Error during Corrections tool execution:", error);
        alert(`Corrections Tool Error: ${error.message || 'An unexpected error occurred.'}`);
    } finally {
        // Restore original preset if we switched
        if (originalPresetId !== null && targetPresetId) {
            try {
                const presetManager = getContext()?.getPresetManager?.();
                if (presetManager) {
                    const currentPreset = presetManager.getSelectedPreset();
                    if (currentPreset === targetPresetId) {
                        presetManager.selectPreset(originalPresetId);
                    }
                }
            } catch (restoreError) {
                console.error(`${extensionName}: Error restoring original preset:`, restoreError);
            }
        }
    }
}

/**
 * Helper function to execute ST-Script commands
 * @param {string} stscript - The ST-Script command to execute
 */
async function executeSTScript(stscript) { // Make helper async
    if (!stscript || stscript.trim() === '') {
        console.log('[GuidedGenerations][Corrections] executeSTScript: No script provided, skipping.');
        return;
    }
    try {
        // Use the context executeSlashCommandsWithOptions method
        const context = getContext(); // Get context via imported function
        // Send the combined script via context
        await context.executeSlashCommandsWithOptions(stscript);
    } catch (error) {
        console.error(`${extensionName}: Corrections Error executing ST-Script:`, error);
         // Optional: Re-throw or handle differently if needed
    }
}
