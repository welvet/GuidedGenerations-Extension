// scripts/guidedImpersonate.js

const guidedImpersonate = async () => {
    console.log('[GuidedGenerations] Guided Impersonate button clicked');

    // Stscript: Checks if current input matches last impersonation result.
    // If yes, reverts to pre-impersonation input. 
    // If no, saves current input, impersonates, saves new result.
    const stscriptCommand = `
/ifempty value={{getglobalvar::gg_old_input}} {{input}} |
/setglobalvar key=gg_old_input {{pipe}} |
/ifempty value={{getglobalvar::gg_new_input}} a |
/setglobalvar key=gg_new_input {{pipe}} |

/if left={{input}} rule=eq right={{getglobalvar::gg_new_input}} 
else={:
    /setglobalvar key=gg_old_input {{input}} |
    /impersonate await=true Write in first Person perspective from {{user}}. {{input}} |
    /setglobalvar key=gg_new_input {{input}} |
:}
{:
    /setinput {{getglobalvar::gg_old_input}} |
:} |
    `;

    console.log(`[GuidedGenerations] Executing stscript for Guided Impersonate`);

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
