// scripts/guidedimpersonate3rd.js
import { getContext } from '../../../../extensions.js';

const guidedImpersonate3rd = async () => {
    console.log('[GuidedGenerations] Guided Impersonate 3rd Person button clicked');

    // Stscript: Checks if current input matches last impersonation result.
    // If yes, reverts to pre-impersonation input.
    // If no, saves current input, impersonates (3rd person), saves new result.
    const stscriptCommand = `
/ifempty value={{getglobalvar::gg_old_input_3rd}} {{input}} |
/setglobalvar key=gg_old_input_3rd {{pipe}} |
/ifempty value={{getglobalvar::gg_new_input_3rd}} a |
/setglobalvar key=gg_new_input_3rd {{pipe}} |

/if left={{input}} rule=eq right={{getglobalvar::gg_new_input_3rd}} 
else={:
    /setglobalvar key=gg_old_input_3rd {{input}} |
    /impersonate await=true Write in third Person perspective from {{user}}. {{input}} |
    /setglobalvar key=gg_new_input_3rd {{input}} |
:}
{:
    /setinput {{getglobalvar::gg_old_input_3rd}} |
:} |
    `;

    console.log(`[GuidedGenerations] Executing stscript for Guided Impersonate 3rd Person`);

    try {
        const context = getContext(); 
        if (typeof context.executeSlashCommandsWithOptions === 'function') {
            await context.executeSlashCommandsWithOptions(stscriptCommand);
            console.log('[GuidedGenerations] Guided Impersonate 3rd Person stscript executed.');
        } else {
            console.error('[GuidedGenerations] context.executeSlashCommandsWithOptions not found!');
        }
    } catch (error) {
        console.error(`[GuidedGenerations] Error executing Guided Impersonate 3rd Person stscript: ${error}`);
    } 
};

// Export the function
export { guidedImpersonate3rd };
