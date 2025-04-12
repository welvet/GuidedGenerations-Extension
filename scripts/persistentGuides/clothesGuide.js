/**
 * @file Contains the logic for the Clothes option in the Persistent Guides menu.
 */
import { extensionName } from '../../index.js'; // Import from two levels up
import { getContext, extension_settings } from '../../../../../extensions.js'; 

/**
 * Executes the Clothes Guide script to create a detailed description of what each character is wearing.
 * This helps maintain visual consistency throughout the chat.
 * @param {boolean} isAuto - Whether this guide is being auto-triggered (true) or called directly from menu (false)
 */
const clothesGuide = async (isAuto = false) => { // Make async
    console.log(`[${extensionName}] Clothes Guide ` + (isAuto ? 'auto-triggered' : 'button clicked'));

    // --- Get Setting ---
    const usePresetSwitching = extension_settings[extensionName]?.useGGSytemPreset ?? true; 
    console.log(`[${extensionName}] Clothes Guide: useGGSytemPreset setting is ${usePresetSwitching}`);

    // --- Build Preset Switching Script Parts Conditionally ---
    let presetSwitchStart = '';
    let presetSwitchEnd = '';

    if (usePresetSwitching) {
        console.log(`[${extensionName}] Clothes Guide: Preset switching ENABLED.`);
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
        console.log(`[${extensionName}] Clothes Guide: Preset switching DISABLED.`);
        presetSwitchStart = `// Preset switching disabled by setting|`;
        presetSwitchEnd = `// Preset switching disabled by setting|`;
    }

    // --- Build Main Script --- 
    let mainScriptLogic = `/listinjects return=object | 
/let injections {{pipe}} | 
/let x {{var::injections}} | 
/var index=clothes x | 
/let y {{pipe}} | 
/var index=value y |
/inject id=clothes position=chat depth=4 [Relevant Informations for portraying characters {{pipe}}] |

// Generate Clothes Description|
/gen as=char [OOC: Answer me out of Character! Considering where we are currently in the story, write me a list entailing the clothes and look, what they are currently wearing of all participating characters, including {{user}}, that are present in the current scene. Don't mention People or clothing pieces who are no longer relevant to the ongoing scene.]  |

// Inject the generated description|
/inject id=clothes position=chat depth=1 [Relevant Informations for portraying characters {{pipe}}] |`;

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

    console.log(`[${extensionName}] Executing Clothes Guide stscript: ${isAuto ? 'auto mode' : 'manual mode'}`);

    // Print the full command for debugging
    console.log(`[${extensionName}] Clothes Guide final stscript (isAuto=${isAuto}):`);
    console.log(stscriptCommand);

    // Use the context executeSlashCommandsWithOptions method
    try {
        const context = getContext(); // Use imported function
        // Send the combined script via context
        await context.executeSlashCommandsWithOptions(stscriptCommand, { showOutput: false }); // Keep output hidden
        console.log(`[${extensionName}] Clothes Guide stscript executed.`);
    } catch (error) {
        console.error(`[${extensionName}] Error executing Clothes Guide stscript: ${error}`);
    }
    return true;
};

// Export the function for use in the main extension file
export default clothesGuide;
