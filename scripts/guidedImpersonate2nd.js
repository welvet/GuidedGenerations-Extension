// scripts/guidedimpersonate2nd.js
import { getContext } from '../../../../extensions.js';

const guidedImpersonate2nd = async () => {
    console.log('[GuidedGenerations] Guided Impersonate 2nd Person button clicked');

    // Stscript: Checks if current input matches last impersonation result.
    // If yes, reverts to pre-impersonation input.
    // If no, saves current input, impersonates (2nd person), saves new result.
    const stscriptCommand = `
/ifempty value={{getglobalvar::gg_old_input_2nd}} {{input}} |
/setglobalvar key=gg_old_input_2nd {{pipe}} |
/ifempty value={{getglobalvar::gg_new_input_2nd}} a |
/setglobalvar key=gg_new_input_2nd {{pipe}} |

/if left={{input}} rule=eq right={{getglobalvar::gg_new_input_2nd}} 
else={:
    /setglobalvar key=gg_old_input_2nd {{input}} |
    /impersonate await=true Write in second person perspective towards {{user}}. {{input}} | // Changed to 2nd person
    /setglobalvar key=gg_new_input_2nd {{input}} |
:}
{:
    /setinput {{getglobalvar::gg_old_input_2nd}} |
:} |
    `;

    console.log(`[GuidedGenerations] Executing stscript for Guided Impersonate 2nd Person`);

    try {
        const context = getContext(); 
        if (typeof context.executeSlashCommandsWithOptions === 'function') {
            await context.executeSlashCommandsWithOptions(stscriptCommand);
            console.log('[GuidedGenerations] Guided Impersonate 2nd Person stscript executed.');
        } else {
            console.error('[GuidedGenerations] context.executeSlashCommandsWithOptions not found!');
        }
    } catch (error) {
        console.error(`[GuidedGenerations] Error executing Guided Impersonate 2nd Person stscript: ${error}`);
    } 
};

// Export the function
export { guidedImpersonate2nd };
