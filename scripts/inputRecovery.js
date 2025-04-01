// scripts/inputRecovery.js

const recoverInput = () => {
    console.log('[GuidedGenerations] Input Recovery button clicked');

    // Use stscript to get the value from the global variable and set the input field
    const command = `/setinput {{getglobalvar::gg_old_input}}`;

    console.log("GG Input Recovery Executing:", command);

    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            context.executeSlashCommandsWithOptions(command);
            console.log('GG Input Recovery stscript executed.');
        } catch (error) {
            console.error("GG Input Recovery Error:", error);
        }
    } else {
        console.error("GG Input Recovery Error: SillyTavern.getContext is not available globally.");
    }
};

// Export the function
export { recoverInput };
