/**
 * @file Contains the logic for the Spellcheck tool.
 */
import { extensionName, setPreviousImpersonateInput } from '../../index.js'; // Import shared state function
import { getContext, extension_settings } from '../../../../../extensions.js';
import { handlePresetSwitching } from '../utils/presetUtils.js'; 

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

    // Handle preset switching using unified utility
    const presetKey = 'presetSpellchecker';
    const presetValue = extension_settings[extensionName]?.[presetKey] ?? '';
    console.log(`[GuidedGenerations] Using preset for spellchecker: ${presetValue || 'none'}`);
    
    const { switch: switchPreset, restore } = handlePresetSwitching(presetValue);

    // Use user-defined spellchecker prompt override
    const isRaw = extension_settings[extensionName]?.rawPromptSpellchecker ?? false;
    const promptTemplate = extension_settings[extensionName]?.promptSpellchecker ?? '';
    const filledPrompt = promptTemplate.replace('{{input}}', originalInput);

    // Execute the spellchecker workflow
    const stscript = `
        // Generate correction using the current input|
        ${isRaw ? filledPrompt : `/genraw ${filledPrompt}`} |
        // Replace the input field with the generated correction|
        /setinput {{pipe}}|
    `;
    
    try {
        const context = getContext();
        if (typeof context.executeSlashCommandsWithOptions === 'function') {
            // Switch preset before executing
            switchPreset();
            
            // Execute the command
            await context.executeSlashCommandsWithOptions(stscript);
            
            console.log('[GuidedGenerations] Spellchecker executed successfully.');
        } else {
            console.error('[GuidedGenerations] context.executeSlashCommandsWithOptions not found!');
        }
    } catch (error) {
        console.error(`[GuidedGenerations] Error executing spellchecker: ${error}`);
    } finally {
        // Restore original preset after completion
        restore();
    }
}


