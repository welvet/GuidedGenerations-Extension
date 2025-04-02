/**
 * @file Contains the logic for the Guided Response button.
 */
import { isGroupChat } from '../index.js'; // Import the group chat checker

const guidedResponse = async () => {
    console.log('[GuidedGenerations] Guided Response button clicked');

    // Common parts of the script
    const scriptStart = `/setglobalvar key=gg_old_input {{input}} |
// Check for Autotrigger Clothes |
/qr-get set="Guided Generations" label=SysClothes |
/let qrdetails {{pipe}} |
/var index=executeOnUser qrdetails |
/if left={{pipe}} {:/:\"Guided Generations.SysClothes\"|:}|
// Check for Autotrigger State |
/qr-get set="Guided Generations" label=SysState |
/let qrdetails3 {{pipe}} |
/var index=executeOnUser qrdetails3 |
/if left={{pipe}} {:/:\"Guided Generations.SysState\"|:}|
// Check for AutoTrigger Thinking |
/qr-get set="Guided Generations" label=SysThinking |
/let qrdetails2 {{pipe}} |
/var index=executeOnUser qrdetails2 |
/if left={{pipe}} {:/:\"Guided Generations.SysThinking\"|:}|
`;

    const scriptEnd = `// Restore original input
/setinput {{getglobalvar::gg_old_input}}|`;

    let stscriptCommand;

    // Check if it's a group chat using the helper function
    if (isGroupChat()) {
        console.log('[GuidedGenerations] Detected Group Chat for Guided Response');
        stscriptCommand = scriptStart +
            `// Group chat logic
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
            `// Single character logic
/inject id=instruct position=chat ephemeral=true depth=0 [Take the following into special concideration for your next message: {{getglobalvar::gg_old_input}}]|
/trigger await=true|
` + scriptEnd;
    }

    console.log(`[GuidedGenerations] Executing stscript: ${stscriptCommand}`);

    // Use the context executeSlashCommandsWithOptions method
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            // Send the combined script via context
            await context.executeSlashCommandsWithOptions(stscriptCommand, { showOutput: false }); // Keep output hidden
            console.log('[GuidedGenerations] Guided Response stscript executed.');
        } catch (error) {
            console.error(`[GuidedGenerations] Error executing Guided Response stscript: ${error}`);
        }
    } else {
        console.error('[GuidedGenerations] SillyTavern.getContext function not found.');
    }
};

// Export the function
export { guidedResponse };
