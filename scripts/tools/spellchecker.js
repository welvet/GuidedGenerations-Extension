/**
 * @file Contains the logic for the Spellcheck tool.
 */
import { extensionName } from '../../index.js'; 
import { getContext, extension_settings } from '../../../../../extensions.js'; 

/**
 * Provides a tool to correct grammar, punctuation, and improve paragraph flow
 * 
 * @returns {Promise<void>}
 */
export default async function spellchecker() {
    // Get setting (use optional chaining and nullish coalescing for safety)
    const usePresetSwitching = extension_settings[extensionName]?.useGGSytemPreset ?? true; 
    console.log(`${extensionName}: Spellchecker tool - useGGSytemPreset setting is ${usePresetSwitching}`);

    // --- Build Preset Switching Script Parts Conditionally ---
    let presetSwitchStart = '';
    let presetSwitchEnd = '';

    if (usePresetSwitching) {
        console.log(`${extensionName}: Spellchecker tool - Preset switching ENABLED.`);
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
        console.log(`${extensionName}: Spellchecker tool - Preset switching DISABLED.`);
        presetSwitchStart = `// Preset switching disabled by setting|`;
        presetSwitchEnd = `// Preset switching disabled by setting|`;
    }

    // Execute the spellchecker workflow
    const stscript = `
        ${presetSwitchStart}

        // Store current input if not already stored
        /ifempty value={{getglobalvar::old_input}} {{input}} |
        /setglobalvar key=old_input {{pipe}} |
        
        // Generate correction
        /genraw Without any intro or outro correct the grammar, and punctuation, and improves the paragraph's flow of: {{input}} |
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
        console.log(`${extensionName}: Spellchecker ST-Script executed successfully.`);
    } catch (error) {
        console.error(`${extensionName}: Spellchecker Error executing ST-Script:`, error);
    }
}
