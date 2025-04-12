/**
 * @file Contains the logic for the Guided Response button.
 */
import { isGroupChat } from '../index.js'; // Import the group chat checker
import { extension_settings } from '../../../../extensions.js'; // Correct path to extensions.js

// Import the guide scripts for direct execution
import thinkingGuide from './persistentGuides/thinkingGuide.js'; // Correct relative path
import stateGuide from './persistentGuides/stateGuide.js'; // Correct relative path
import clothesGuide from './persistentGuides/clothesGuide.js'; // Correct relative path

const extensionName = "GuidedGenerations-Extension";

const guidedResponse = async () => {
    console.log('[GuidedGenerations] Guided Response button clicked');

    // Save the current input value
    const scriptStart = `/setglobalvar key=gg_old_input {{input}} |`;
    const scriptEnd = `// Restore original input|
/setinput {{getglobalvar::gg_old_input}}|`;

    let stscriptCommand;

    // Check if it's a group chat using the helper function
    if (isGroupChat()) {
        console.log('[GuidedGenerations] Detected Group Chat for Guided Response');
        stscriptCommand = scriptStart +
            `// Group chat logic|
/split {{group}} |
/setvar key=x {{pipe}} |
/buttons labels=x "Select members {{group}}" |
/setglobalvar key=selection {{pipe}} |
/inject id=instruct position=chat ephemeral=true depth=0 [Take the following into special concideration for your next message: {{getglobalvar::gg_old_input}}] |
/trigger await=true {{getglobalvar::selection}}|
` + scriptEnd;
    } else {
        console.log('[GuidedGenerations] Detected Single Chat for Guided Response');
        stscriptCommand = scriptStart +
            `// Single character logic|
/inject id=instruct position=chat ephemeral=true depth=0 [Take the following into special concideration for your next message: {{getglobalvar::gg_old_input}}]|
/trigger await=true|
` + scriptEnd;
    }

    // Execute the main stscript command
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            // First check for auto-trigger settings and execute relevant guides
            const settings = extension_settings[extensionName];
            console.log(`[GuidedGenerations] Checking auto-trigger settings:`, settings);
            
            // Run auto-trigger guides if enabled (only thinking, state, and clothes support auto-trigger)
            if (settings.autoTriggerThinking) {
                console.log('[GuidedGenerations] Auto-triggering Thinking Guide with isAuto=true');
                thinkingGuide(true); // Pass isAuto=true
            }
            
            if (settings.autoTriggerState) {
                console.log('[GuidedGenerations] Auto-triggering State Guide with isAuto=true');
                stateGuide(true); // Pass isAuto=true
            }
            
            if (settings.autoTriggerClothes) {
                console.log('[GuidedGenerations] Auto-triggering Clothes Guide with isAuto=true');
                clothesGuide(true); // Pass isAuto=true
            }
            
            // Now execute the main guided response command
            console.log('[GuidedGenerations] Executing main guidedResponse stscript command:', stscriptCommand);
            context.executeSlashCommandsWithOptions(stscriptCommand);
            console.log('[GuidedGenerations] Guided Response stscript executed.');
            

            
        } catch (error) {
            console.error(`[GuidedGenerations] Error executing Guided Response stscript: ${error}`);
        }
    } else {
        console.error('[GuidedGenerations] SillyTavern context is not available.');
    }
};

export { guidedResponse };
