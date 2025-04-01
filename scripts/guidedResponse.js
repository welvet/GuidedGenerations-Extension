/**
 * @file Contains the logic for the Guided Response button.
 */

const guidedResponse = async () => {
    console.log('[GuidedGenerations] Guided Response button clicked');

    // The stscript command string from V8 JSON logic
    // Sets gg_old_input, injects context, triggers, and restores input
    // Updated inject message for clarity
    const stscriptCommand = 
        `/setglobalvar key=gg_old_input {{input}} | ` +
        `/inject id=gg_instruct position=chat ephemeral=true depth=0 [Take the following into special concideration for your next message: {{getglobalvar::gg_old_input}}] | ` +
        `/trigger await=true | ` +
        `/setinput {{getglobalvar::gg_old_input}}`; // Restore input after trigger

    console.log(`[GuidedGenerations] Executing stscript: ${stscriptCommand}`);

    // Use the context executeSlashCommandsWithOptions method
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            // Send the combined script via context
            await context.executeSlashCommandsWithOptions(stscriptCommand);
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
