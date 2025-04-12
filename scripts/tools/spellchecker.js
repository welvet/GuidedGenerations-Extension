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
    console.log('[GuidedGenerations][Spellchecker] Tool activated.');
    const textarea = document.getElementById('send_textarea');
    if (!textarea) {
        console.error('[GuidedGenerations][Spellchecker] Textarea #send_textarea not found.');
        return;
    }
    const originalInput = textarea.value; // Get current input

    // Save the input state using the shared function (even though we overwrite it later)
    setPreviousImpersonateInput(originalInput);
    console.log(`[GuidedGenerations][Spellchecker] Original input saved (for potential recovery elsewhere): "${originalInput}"`);

    // Get setting (use optional chaining and nullish coalescing for safety)
    const usePresetSwitching = extension_settings[extensionName]?.useGGSytemPreset ?? true; 
    console.log(`[GuidedGenerations][Spellchecker] useGGSytemPreset setting is ${usePresetSwitching}`);

    // --- Build Preset Switching Script Parts Conditionally ---
    let presetSwitchStart = '';
    let presetSwitchEnd = '';

    if (usePresetSwitching) {
        console.log(`[GuidedGenerations][Spellchecker] Preset switching ENABLED.`);
        presetSwitchStart = `
// Get the currently active preset|
/preset|
/setvar key=currentPreset {{pipe}} |

// If current preset is already GGSytemPrompt, do NOT overwrite oldPreset|
/if left={{getvar::currentPreset}} rule=neq right="GGSytemPrompt" {: 
   // Store the current preset in oldPreset|
   /setvar key=oldPreset {{getvar::currentPreset}} |
   // Now switch to GGSytemPrompt|
   /preset GGSytemPrompt |
:}| 
`; // Note the closing pipe
        presetSwitchEnd = `
// Switch back to the original preset if it was stored|
/preset {{getvar::oldPreset}} |
`; // Note the closing pipe
    } else {
        console.log(`[GuidedGenerations][Spellchecker] Preset switching DISABLED.`);
        presetSwitchStart = `// Preset switching disabled by setting|`;
        presetSwitchEnd = `// Preset switching disabled by setting|`;
    }

    // Execute the spellchecker workflow
    const stscript = `
        ${presetSwitchStart}

        // Generate correction using the current input|
        /genraw Without any intro or outro correct the grammar, and punctuation, and improves the paragraph's flow of: {{input}} |
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
        console.log(`[GuidedGenerations][Spellchecker] Executing STScript: ${stscript}`);
        // Send the combined script via context
        await context.executeSlashCommandsWithOptions(stscript);
        console.log(`${extensionName}: Spellchecker ST-Script executed successfully.`);
    } catch (error) {
        console.error(`${extensionName}: Spellchecker Error executing ST-Script:`, error);
    }
}
