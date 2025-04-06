/**
 * @file Contains the logic for the Thinking option in the Persistent Guides menu.
 */
import { isGroupChat } from '../../index.js'; // Import from two levels up

/**
 * Executes the Thinking Guide script to create an insight into what characters are thinking.
 * This helps authors understand character motivations and inner thoughts without changing the chat.
 * @param {boolean} isAuto - Whether this guide is being auto-triggered (true) or called directly from menu (false)
 */
const thinkingGuide = (isAuto = false) => {
    console.log('[GuidedGenerations] Thinking Guide ' + (isAuto ? 'auto-triggered' : 'button clicked'));

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
/preset {{getvar::oldPreset}} |`;

    // Only include /listinjects if not auto-triggered
    if (!isAuto) {
        console.log('[GuidedGenerations] Running in manual mode, adding /listinjects command');
        stscriptCommand += `
/listinjects |`;
    } else {
        console.log('[GuidedGenerations] Running in auto mode, NOT adding /listinjects command');
    }

    // Print the full command for debugging
    console.log(`[GuidedGenerations] Thinking Guide final stscript (isAuto=${isAuto}):`);
    console.log(stscriptCommand);

    console.log(`[GuidedGenerations] Executing Thinking Guide stscript: ${isAuto ? 'auto mode' : 'manual mode'}`);

    // Use the context executeSlashCommandsWithOptions method
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            // Send the combined script via context
            context.executeSlashCommandsWithOptions(stscriptCommand, { showOutput: false }); // Keep output hidden
            console.log('[GuidedGenerations] Thinking Guide stscript executed.');
        } catch (error) {
            console.error(`[GuidedGenerations] Error executing Thinking Guide stscript: ${error}`);
        }
    } else {
        console.error('[GuidedGenerations] SillyTavern context is not available.');
    }
    return true;
};

// Export the function for use in the main extension file
export default thinkingGuide;
