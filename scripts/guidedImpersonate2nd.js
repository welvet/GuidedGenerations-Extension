// scripts/guidedimpersonate2nd.js
import { getContext } from '../../../../extensions.js';
// Import shared state functions
import { getPreviousImpersonateInput, setPreviousImpersonateInput, getLastImpersonateResult, setLastImpersonateResult } from '../index.js'; 

const guidedImpersonate2nd = async () => {
    const textarea = document.getElementById('send_textarea');
    if (!textarea) {
        console.error('[GuidedGenerations] Textarea #send_textarea not found.');
        return;
    }
    const currentInputText = textarea.value;
    const lastGeneratedText = getLastImpersonateResult(); // Use shared getter

    // Check if the current input matches the last generated text (from any impersonation)
    if (lastGeneratedText && currentInputText === lastGeneratedText) {
        textarea.value = getPreviousImpersonateInput(); // Use shared getter
        textarea.dispatchEvent(new Event('input', { bubbles: true })); 
        return; // Restoration done, exit
    }

    // --- If not restoring, proceed with impersonation ---
    setPreviousImpersonateInput(currentInputText); // Use shared setter

    // Only the core impersonate command remains (specific 2nd person prompt)
    const stscriptCommand = `/impersonate await=true Write in second Person perspective from {{user}}, using you/yours for {{user}}. {{input}} |`;

    try {
        const context = getContext(); 
        if (typeof context.executeSlashCommandsWithOptions === 'function') {
            await context.executeSlashCommandsWithOptions(stscriptCommand);
            
            // After completion, read the new input and store it in shared state
            setLastImpersonateResult(textarea.value); // Use shared setter
            console.log('[GuidedGenerations] Guided Impersonate (2nd) stscript executed, new input stored in shared state.');
        } else {
            console.error('[GuidedGenerations] context.executeSlashCommandsWithOptions not found!');
        }
    } catch (error) {
        console.error(`[GuidedGenerations] Error executing Guided Impersonate (2nd) stscript: ${error}`);
        setLastImpersonateResult(''); // Clear shared state on error
    } 
};

// Export the function
export { guidedImpersonate2nd };
