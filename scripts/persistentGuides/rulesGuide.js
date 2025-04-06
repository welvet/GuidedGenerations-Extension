/**
 * @file Contains the logic for the Rules Guide option in the Persistent Guides menu.
 */
import { isGroupChat } from '../../index.js'; // Import from two levels up

/**
 * Executes the Rules Guide script to track the explicit rules that characters have learned.
 * This helps maintain consistency in character behavior based on established rules.
 */
const rulesGuide = () => {
    console.log('[GuidedGenerations] Rules Guide button clicked');

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

// Rules |
/flushinject rule_guide |`;
    
    // Add different script sections based on whether it's a group chat |
    if (isGroupChat()) {
        console.log('[GuidedGenerations] Detected Group Chat for Rules Guide');
        stscriptCommand += `
/split {{group}} |
/setvar key=x {{pipe}} |
/buttons labels=x "Select members {{group}}" |
/setglobalvar key=selection {{pipe}} |
/gen [Create a list of explicit rules that {{getglobalvar::selection}} has learned and follows from the story and their character description. Only include rules that have been explicitly established in the chat history or character information. Format as a numbered list.]  |
/inject id=rule_guide position=chat depth=0 [{{getglobalvar::selection}}'s rules: {{pipe}}] |`;
    } else {
        console.log('[GuidedGenerations] Detected Single Chat for Rules Guide');
        stscriptCommand += `
/gen [Create a list of explicit rules that {{char}} has learned and follows from the story and their character description. Only include rules that have been explicitly established in the chat history or character information. Format as a numbered list.] |
/inject id=rule_guide position=chat depth=0 [{{char}}'s rules: {{pipe}}] |`;
    }
    
    // Add ending to switch back to original preset and show list of injections |
    stscriptCommand += `
// Switch back to the original preset|
/preset {{getvar::oldPreset}} |
/:\"Guided Generations.SysRules\"|
/listinjects |`;

    console.log(`[GuidedGenerations] Executing Rules Guide stscript`);

    // Use the context executeSlashCommandsWithOptions method
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            // Send the combined script via context
            context.executeSlashCommandsWithOptions(stscriptCommand, { showOutput: false }); // Keep output hidden
            console.log('[GuidedGenerations] Rules Guide stscript executed.');
        } catch (error) {
            console.error(`[GuidedGenerations] Error executing Rules Guide: ${error}`);
        }
    } else {
        console.error('[GuidedGenerations] SillyTavern context is not available.');
    }
    return true;
};

// Export the function for use in the main extension file
export default rulesGuide;
