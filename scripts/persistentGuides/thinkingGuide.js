/**
 * @file Contains the logic for the Thinking option in the Persistent Guides menu.
 */
import { isGroupChat, extensionName } from '../../index.js'; // Import from two levels up
import { getContext, extension_settings } from '../../../../../extensions.js'; 

/**
 * Executes the Thinking Guide script to create an insight into what characters are thinking.
 * This helps authors understand character motivations and inner thoughts without changing the chat.
 * @param {boolean} isAuto - Whether this guide is being auto-triggered (true) or called directly from menu (false)
 */
const thinkingGuide = async (isAuto = false) => { // Make async
    // --- Get Settings ---
    const usePresetSwitching = extension_settings[extensionName]?.useGGSytemPreset ?? true; 
    const injectionRole = extension_settings[extensionName]?.injectionEndRole ?? 'system'; // Get the role setting

    // --- Build Preset Switching Script Parts Conditionally ---
    let presetSwitchStart = '';
    let presetSwitchEnd = '';

    if (usePresetSwitching) {
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
        presetSwitchStart = `// Preset switching disabled by setting|`;
        presetSwitchEnd = `// Preset switching disabled by setting|`;
    }

    // --- Build Main Script --- 
    let mainScriptLogic = `
// Thinking |
/flushinject thinking |`;
    
    // Add different script sections based on whether it's a group chat | 
    if (await isGroupChat()) { // Await the async check
        mainScriptLogic += `
/split {{group}} |
/setvar key=x {{pipe}} |
/buttons labels=x Select members {{group}} |
/setglobalvar key=selection {{pipe}} |
/gen [Write what {{getglobalvar::selection}} is currently thinking, do not describe their actions or dialogue, only pure thought and only {{getglobalvar::selection}}'s thoughts.]  |
/inject id=thinking position=chat depth=0 role=${injectionRole} [{{getglobalvar::selection}} is currently thinking: {{pipe}}] |
`;
    } else {
        mainScriptLogic += `
/gen name={{char}} [Write what {{char}} and other characters that are in the current scene are currently thinking; do not describe their actions or dialogue, only pure thought. Do not include the {{user}}'s thoughts in this.]  |
/inject id=thinking position=chat depth=0 role=${injectionRole} [{{char}} is currently thinking: {{pipe}}] |
`;
    }

    // Conditionally add /listinjects
    let listInjectsCommand = '';
    if (!isAuto) {
        listInjectsCommand = `
/listinjects |`;
    }

    // Combine all parts
    const stscriptCommand = presetSwitchStart + mainScriptLogic + presetSwitchEnd + listInjectsCommand;

    // Print the full command for debugging
    console.log(`[${extensionName}] Thinking Guide final stscript (isAuto=${isAuto}):`);
    console.log(stscriptCommand);

    try {
        const context = getContext(); // Use imported function
        // Send the combined script via context
        await context.executeSlashCommandsWithOptions(stscriptCommand, { showOutput: false }); // Keep output hidden
        console.log(`[${extensionName}] Thinking Guide stscript executed.`);
    } catch (error) {
        console.error(`[${extensionName}] Error executing Thinking Guide stscript: ${error}`);
    }
    return true;
};

// Export the function for use in the main extension file
export default thinkingGuide;
