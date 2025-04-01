// scripts/guidedImpersonate.js

const guidedImpersonate = async () => {
    console.log('[GuidedGenerations] Guided Impersonate button clicked');

    // Stscript: Saves current input, triggers impersonation, restores input.
    const stscriptCommand = 
        `/setglobalvar key=gg_old_input {{input}} | ` +
        `/impersonate | ` +
        `/setinput {{getglobalvar::gg_old_input}}`; 

    console.log(`[GuidedGenerations] Executing stscript: ${stscriptCommand}`);

    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            await context.executeSlashCommandsWithOptions(stscriptCommand);
            console.log('[GuidedGenerations] Guided Impersonate stscript executed.');
        } catch (error) {
            console.error(`[GuidedGenerations] Error executing Guided Impersonate stscript: ${error}`);
        } 
    } else {
        console.error('[GuidedGenerations] SillyTavern.getContext function not found.');
    }
};

// Export the function
export { guidedImpersonate };
