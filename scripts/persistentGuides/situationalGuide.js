/**
 * @file Contains the logic for the Situational Guides (CoT Light) option in the Persistent Guides menu.
 */
import { isGroupChat } from '../../index.js'; // Import from two levels up

/**
 * Executes the Situational Guides script to analyze the chat history and provide relevant character information.
 * This is a "Chain of Thought light" implementation that helps maintain character consistency.
 */
const situationalGuide = () => {
    console.log('[GuidedGenerations] Situational Guide button clicked');

    // Save the current input before executing the script
    let stscriptCommand = `/setvar key=inp {{input}} |
/flushvar focus | 
/if left={{getvar::inp}} {:/buttons labels=["Yes","No"] "You have text in the Inputfield! Do you want to use it as a Focus for the Guide?:"| /if left={{pipe}} right=Yes /setvar key=focus Focus on {{getvar::inp}}. |:}|

/flushinject situation |`;

    // Add different script sections based on whether it's a group chat |
    if (isGroupChat()) {
        console.log('[GuidedGenerations] Detected Group Chat for Situational Guide');
        stscriptCommand += `
/split {{group}} |
/setvar key=x {{pipe}} |
/buttons labels=x "Select members {{group}}" |
/setglobalvar key=selection {{pipe}} |
/gen [OOC: Answer me out of Character! Considering the next response, write me a list entailing the relevant information of {{getglobalvar::selection}}'s description and chat history that would directly influence this response. {{getvar::focus}}]  |
/inject id=situation position=chat depth=1 [Relevant Informations for portraying {{getglobalvar::selection}} {{pipe}}] |
`;
    } else {
        console.log('[GuidedGenerations] Detected Single Chat for Situational Guide');
        stscriptCommand += `
/gen [OOC: Answer me out of Character! Considering the next response, write me a list entailing the relevant information of {{char}}'s description and chat history that would directly influence this response. {{getvar::focus}}]  |
/inject id=situation position=chat depth=1 [Relevant Informations for portraying {{char}} {{pipe}}] |
`;
    }

    stscriptCommand += `/:\"Guided Generations.SysSituation\"|
/listinjects |`;

    console.log(`[GuidedGenerations] Executing Situational Guide stscript`);

    // Use the context executeSlashCommandsWithOptions method
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            // Send the combined script via context
            context.executeSlashCommandsWithOptions(stscriptCommand, { showOutput: false }); // Keep output hidden
            console.log('[GuidedGenerations] Situational Guide stscript executed.');
        } catch (error) {
            console.error('[GuidedGenerations] Error executing Situational Guide:', error);
        }
    }
};

// Export the function for use in the main extension file
export default situationalGuide;
