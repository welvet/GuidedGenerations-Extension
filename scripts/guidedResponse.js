/**
 * @file Contains the logic for the Guided Response button.
 */
import { isGroupChat, setPreviousImpersonateInput, getPreviousImpersonateInput } from '../index.js'; // Import group chat checker and shared state functions
import { extension_settings } from '../../../../extensions.js'; // Correct path to extensions.js

// Import the guide scripts for direct execution
import thinkingGuide from './persistentGuides/thinkingGuide.js'; // Correct relative path
import stateGuide from './persistentGuides/stateGuide.js'; // Correct relative path
import clothesGuide from './persistentGuides/clothesGuide.js'; // Correct relative path

const extensionName = "GuidedGenerations-Extension";

const guidedResponse = async () => {
    console.log('[GuidedGenerations] Guided Response button clicked');
    const textarea = document.getElementById('send_textarea');
    if (!textarea) {
        console.error('[GuidedGenerations][Response] Textarea #send_textarea not found.');
        return;
    }
    const originalInput = textarea.value; // Get current input

    // --- Get Setting ---
    const injectionRole = extension_settings[extensionName]?.injectionEndRole ?? 'system'; // Get the role setting
    console.log(`[GuidedGenerations][Response] Using injectionEndRole: ${injectionRole}`);

    // Save the input state using the shared function
    setPreviousImpersonateInput(originalInput);
    console.log('[GuidedGenerations][Response] Original input saved.');

    let stscriptCommand;

    // Check if it's a group chat using the helper function
    if (isGroupChat()) {
        console.log('[GuidedGenerations] Detected Group Chat for Guided Response');
        stscriptCommand = 
            `// Group chat logic|
/split {{group}} |
/setvar key=x {{pipe}} |
/buttons labels=x "Select members {{group}}" |
/setglobalvar key=selection {{pipe}} |
/inject id=instruct position=chat ephemeral=true depth=0 role=${injectionRole} [Take the following into special concideration for your next message: ${originalInput}] |
/trigger await=true {{getglobalvar::selection}}|
`;
    } else {
        console.log('[GuidedGenerations] Detected Single Chat for Guided Response');
        stscriptCommand = 
            `// Single character logic|
/inject id=instruct position=chat ephemeral=true depth=0 role=${injectionRole} [Take the following into special concideration for your next message: ${originalInput}]|
/trigger await=true|
`;
    }

    // Execute the main stscript command
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            // First check for auto-trigger settings and execute relevant guides
            const settings = extension_settings[extensionName];
            console.log(`[GuidedGenerations][Response] Checking auto-trigger settings:`, settings);
            if (settings.autoTriggerThinking) await thinkingGuide(true); // Pass isAuto=true
            if (settings.autoTriggerState) await stateGuide(true); // Pass isAuto=true
            if (settings.autoTriggerClothes) await clothesGuide(true); // Pass isAuto=true

            // Execute the main command
            console.log(`[GuidedGenerations][Response] Executing stscript: ${stscriptCommand}`);
            await context.executeSlashCommandsWithOptions(stscriptCommand);
            console.log('[GuidedGenerations][Response] Guided Response stscript executed.');
            
        } catch (error) {
            console.error(`[GuidedGenerations][Response] Error executing Guided Response stscript: ${error}`);
        } finally {
            // Always restore the input field from the shared state
            const restoredInput = getPreviousImpersonateInput();
            console.log(`[GuidedGenerations][Response] Restoring input field to: "${restoredInput}"`);
            textarea.value = restoredInput;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } else {
        console.error('[GuidedGenerations][Response] SillyTavern context is not available.');
        // Even if context isn't available, attempt restore if textarea exists
        if (textarea) {
             const restoredInput = getPreviousImpersonateInput();
             console.log(`[GuidedGenerations][Response] Restoring input field after context error: "${restoredInput}"`);
             textarea.value = restoredInput;
             textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
};

// Export the function
export { guidedResponse };
