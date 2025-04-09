/**
 * @file Contains the logic for the Corrections tool.
 */
import { extensionName } from '../../index.js'; // Import extensionName from index.js
import { getContext, extension_settings } from '../../../../../extensions.js'; 

/**
 * Provides a tool to modify the last message based on user's instructions
 * 
 * @returns {Promise<void>}
 */
export default async function corrections() {
    // Get setting (use optional chaining and nullish coalescing for safety)
    const usePresetSwitching = extension_settings[extensionName]?.useGGSytemPreset ?? true; 
    console.log(`${extensionName}: Corrections tool - useGGSytemPreset setting is ${usePresetSwitching}`);

    // --- Build Preset Switching Script Parts Conditionally ---
    let presetSwitchStart = '';
    let presetSwitchEnd = '';

    if (usePresetSwitching) {
        console.log(`${extensionName}: Corrections tool - Preset switching ENABLED.`);
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
        console.log(`${extensionName}: Corrections tool - Preset switching DISABLED.`);
        presetSwitchStart = `// Preset switching disabled by setting|`;
        presetSwitchEnd = `// Preset switching disabled by setting|`;
    }

    // Execute the corrections workflow
    const stscript = `
        ${presetSwitchStart}

        // Store current input if not already stored
        /ifempty value={{getglobalvar::old_input}} {{input}} |
        /setglobalvar key=old_input {{pipe}} |
        /setvar key=inp {{input}} |

        // Inject assistant message to rework and instructions
        /inject id=msgtorework position=chat ephemeral=true depth=0 role=assistant {{lastMessage}}|
        /inject id=instruct position=chat ephemeral=true depth=0 [OOC: Do not continue the story do not wrote in character, instead write {{char}}'s last response again but change it to reflect the following: {{getvar::inp}}. Don't make any other changes besides this.] |

        // Trigger swipe generation
        /swipes-swipe |

        // Clean up injections
        /flushinjects instruct|
        /flushinjects msgtorework|

        ${presetSwitchEnd}
    `;
    
    await executeSTScript(stscript); // Use the updated helper
}

/**
 * Helper function to execute ST-Script commands
 * @param {string} stscript - The ST-Script command to execute
 */
async function executeSTScript(stscript) { // Make helper async
    try {
        // Use the context executeSlashCommandsWithOptions method
        const context = getContext(); // Get context via imported function
        // Send the combined script via context
        await context.executeSlashCommandsWithOptions(stscript);
        console.log(`${extensionName}: Corrections ST-Script executed successfully.`);
    } catch (error) {
        console.error(`${extensionName}: Corrections Error executing ST-Script:`, error);
    }
}
