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
    console.log(`[${extensionName}] Thinking Guide ` + (isAuto ? 'auto-triggered' : 'button clicked'));

    // --- Get Setting ---
    const usePresetSwitching = extension_settings[extensionName]?.useGGSytemPreset ?? true; 
    console.log(`[${extensionName}] Thinking Guide: useGGSytemPreset setting is ${usePresetSwitching}`);

    // --- Build Preset Switching Script Parts Conditionally ---
    let presetSwitchStart = '';
    let presetSwitchEnd = '';

    if (usePresetSwitching) {
        console.log(`[${extensionName}] Thinking Guide: Preset switching ENABLED.`);
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
        console.log(`[${extensionName}] Thinking Guide: Preset switching DISABLED.`);
        presetSwitchStart = `// Preset switching disabled by setting|`;
        presetSwitchEnd = `// Preset switching disabled by setting|`;
    }

    // --- Build Main Script --- 
    let mainScriptLogic = `
// Thinking |
/flushinject thinking |`;
    
    // Add different script sections based on whether it's a group chat | 
    if (await isGroupChat()) { // Await the async check
        console.log(`[${extensionName}] Detected Group Chat for Thinking Guide`);
        mainScriptLogic += `
/split {{group}} |
/setvar key=x {{pipe}} |
/buttons labels=x Select members {{group}} |
/setglobalvar key=selection {{pipe}} |
/gen [Write what {{getglobalvar::selection}} is currently thinking, do not describe their actions or dialogue, only pure thought and only {{getglobalvar::selection}}'s thoughts.]  |
/inject id=thinking position=chat depth=0 [{{getglobalvar::selection}} is currently thinking: {{pipe}}] |`;
    } else {
        console.log(`[${extensionName}] Detected Single Chat for Thinking Guide`);
        mainScriptLogic += `
/gen name={{char}} [Write what {{char}} and other characters that are in the current scene are currently thinking; do not describe their actions or dialogue, only pure thought. Do not include the {{user}}'s thoughts in this.]  |
/inject id=thinking position=chat depth=0 [{{char}} is currently thinking: {{pipe}}] |`;
    }

    // Conditionally add /listinjects
    let listInjectsCommand = '';
    if (!isAuto) {
        console.log(`[${extensionName}] Running in manual mode, adding /listinjects command`);
        listInjectsCommand = `
/listinjects |`;
    } else {
        console.log(`[${extensionName}] Running in auto mode, NOT adding /listinjects command`);
    }

    // Combine all parts
    const stscriptCommand = presetSwitchStart + mainScriptLogic + presetSwitchEnd + listInjectsCommand;

    // Print the full command for debugging
    console.log(`[${extensionName}] Thinking Guide final stscript (isAuto=${isAuto}):`);
    console.log(stscriptCommand);

    console.log(`[${extensionName}] Executing Thinking Guide stscript: ${isAuto ? 'auto mode' : 'manual mode'}`);

    // Use the context executeSlashCommandsWithOptions method
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
