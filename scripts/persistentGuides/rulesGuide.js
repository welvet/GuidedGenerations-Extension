/**
 * @file Contains the logic for the Rules Guide option in the Persistent Guides menu.
 */
import { isGroupChat, extensionName } from '../../index.js'; // Import from two levels up
import { getContext, extension_settings } from '../../../../../extensions.js'; 

/**
 * Executes the Rules Guide script to track the explicit rules that characters have learned.
 * This helps maintain consistency in character behavior based on established rules.
 */
const rulesGuide = async () => { // Make async
    // --- Get Settings ---
    const usePresetSwitching = extension_settings[extensionName]?.useGGSytemPreset ?? true; 
    const injectionRole = extension_settings[extensionName]?.injectionEndRole ?? 'system'; // Get the role setting
    console.log(`[${extensionName}] Rules Guide: useGGSytemPreset=${usePresetSwitching}, injectionEndRole=${injectionRole}`);

    // --- Build Preset Switching Script Parts Conditionally ---
    let presetSwitchStart = '';
    let presetSwitchEnd = '';

    if (usePresetSwitching) {
        console.log(`[${extensionName}] Rules Guide: Preset switching ENABLED.`);
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
        console.log(`[${extensionName}] Rules Guide: Preset switching DISABLED.`);
        presetSwitchStart = `// Preset switching disabled by setting|`;
        presetSwitchEnd = `// Preset switching disabled by setting|`;
    }

    // --- Build Main Script --- 
    let mainScriptLogic = `
// Rules |
/flushinject rule_guide |`;
    
    // Add different script sections based on whether it's a group chat |
    if (await isGroupChat()) { // Await the async check
        console.log(`[${extensionName}] Detected Group Chat for Rules Guide`);
        mainScriptLogic += `
/split {{group}} |
/setvar key=x {{pipe}} |
/buttons labels=x "Select members {{group}}" |
/setglobalvar key=selection {{pipe}} |
/gen [Create a list of explicit rules that {{getglobalvar::selection}} has learned and follows from the story and their character description. Only include rules that have been explicitly established in the chat history or character information. Format as a numbered list.]  |
/inject id=rule_guide position=chat depth=0 role=${injectionRole} [{{getglobalvar::selection}}'s rules: {{pipe}}] |`;
    } else {
        console.log(`[${extensionName}] Detected Single Chat for Rules Guide`);
        mainScriptLogic += `
/gen [Create a list of explicit rules that {{char}} has learned and follows from the story and their character description. Only include rules that have been explicitly established in the chat history or character information. Format as a numbered list.] |
/inject id=rule_guide position=chat depth=0 role=${injectionRole} [{{char}}'s rules: {{pipe}}] |`;
    }
    
    // Combine all parts, including the original /listinjects
    const stscriptCommand = presetSwitchStart + mainScriptLogic + presetSwitchEnd + `
/:"Guided Generations.SysRules"|
/listinjects |`;

    // Use the context executeSlashCommandsWithOptions method
    try {
        const context = getContext(); // Use imported function
        // Send the combined script via context
        await context.executeSlashCommandsWithOptions(stscriptCommand, { showOutput: false }); // Keep output hidden
        console.log(`[${extensionName}] Rules Guide stscript executed.`);
    } catch (error) {
        console.error(`[${extensionName}] Error executing Rules Guide: ${error}`);
    }
    return true;
};

// Export the function for use in the main extension file
export default rulesGuide;
