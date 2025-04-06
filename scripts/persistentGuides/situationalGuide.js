/**
 * @file Contains the logic for the Situational Guide option in the Persistent Guides menu.
 */
import { isGroupChat } from '../../index.js'; // Import from two levels up

/**
 * Executes the Situational Guide script to analyze the current context and extract relevant information.
 * This guide helps provide an overview of the current situation and environment for the characters.
 */
const situationalGuide = () => {
    console.log('[GuidedGenerations] Situational Guide button clicked');

    let stscriptCommand = `/setvar key=inp {{input}} |
/flushvar focus | 
/if left={{getvar::inp}} {:/buttons labels=["Yes","No"] "You have text in the Inputfield! Do you want to use it as a Focus for the Guide?:"| /if left={{pipe}} right=Yes /setvar key=focus Focus on {{getvar::inp}}. |:}|
/flushinject situation |
/gen [Analyze the chat history and provide a concise summary of: 
1. Current location and setting (indoors/outdoors, time of day, weather if relevant)
2. Present characters and their current activities
3. Relevant objects, items, or environmental details that could influence interactions
4. Recent events or topics of conversation (last 10-20 messages)
{{getvar::focus}}
Keep the overview factual and neutral without speculation. Format in clear paragraphs.] |
/inject id=situation position=chat depth=3 [Current Situation: {{pipe}}] |
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
            console.error(`[GuidedGenerations] Error executing Situational Guide: ${error}`);
        }
    } else {
        console.error('[GuidedGenerations] SillyTavern context is not available.');
    }
    return true;
};

// Export the function for use in the main extension file
export default situationalGuide;
