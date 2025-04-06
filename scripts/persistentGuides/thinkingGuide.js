/**
 * @file Contains the logic for the Thinking option in the Persistent Guides menu.
 */
import { isGroupChat } from '../../index.js'; // Import from two levels up

/**
 * Executes the Thinking Guide script to create an insight into what characters are thinking.
 * This helps authors understand character motivations and inner thoughts without changing the chat.
 */
const thinkingGuide = () => {
    console.log('[GuidedGenerations] Thinking Guide button clicked');

    // Common part of the script with preset handling |
    let stscriptCommand = `// Get the currently active preset|
/preset|
/setvar key=currentPreset {{pipe}} |

// If current preset is already GGSytemPrompt, do NOT overwrite oldPreset|
/if left={{getvar::currentPreset}} rule=neq right="GGSytemPrompt" {:
   // Store the current preset in oldPreset|
   /setvar key=oldPreset {{getvar::currentPreset}} |
   // Now switch to GGSytemPrompt|
   /preset GGSytemPrompt |
:}|

// Thinking |
/flushinject thinking |`;
    
    // Add different script sections based on whether it's a group chat |
    if (isGroupChat()) {
        console.log('[GuidedGenerations] Detected Group Chat for Thinking Guide');
        stscriptCommand += `
/split {{group}} |
/setvar key=x {{pipe}} |
/buttons labels=x Select members {{group}} |
/setglobalvar key=selection {{pipe}} |
/gen [Write what {{getglobalvar::selection}} is currently thinking, do not describe their actions or dialogue, only pure thought and only {{getglobalvar::selection}}'s thoughts.]  |
/inject id=thinking position=chat depth=0 [{{getglobalvar::selection}} is currently thinking: {{pipe}}] |`;
    } else {
        console.log('[GuidedGenerations] Detected Single Chat for Thinking Guide');
        stscriptCommand += `
/gen name={{char}} [Write what {{char}} and other characters that are in the current scene are currently thinking; do not describe their actions or dialogue, only pure thought. Do not include the {{user}}'s thoughts in this.]  |
/inject id=thinking position=chat depth=0 [{{char}} is currently thinking: {{pipe}}] |`;
    }
    
    // Add ending to switch back to original preset |
    stscriptCommand += `
// Switch back to the original preset|
/preset {{getvar::oldPreset}} |
/:\"Guided Generations.SysThinking\"|
/listinjects |`;

    console.log(`[GuidedGenerations] Executing Thinking Guide stscript`);

    // Use the context executeSlashCommandsWithOptions method
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            // Send the combined script via context
            context.executeSlashCommandsWithOptions(stscriptCommand, { showOutput: false }); // Keep output hidden
            console.log('[GuidedGenerations] Thinking Guide stscript executed.');
        } catch (error) {
            console.error(`[GuidedGenerations] Error executing Thinking Guide: ${error}`);
            return false;
        }
    } else {
        // Try the older method with imported functions from extensions.js
        try {
            // Get context from imports and execute command
            const context = getContext();
            if (context && typeof context.executeSlashCommandsWithOptions === 'function') {
                context.executeSlashCommandsWithOptions(stscriptCommand, { showOutput: false });
                console.log('[GuidedGenerations] Thinking Guide stscript executed (fallback method).');
            } else {
                console.error('[GuidedGenerations] Could not execute Thinking Guide: missing context or method');
                return false;
            }
        } catch (error) {
            console.error(`[GuidedGenerations] Error executing Thinking Guide (fallback): ${error}`);
            return false;
        }
    }
    return true;
};

// Export the function for use in the main extension file
export default thinkingGuide;
