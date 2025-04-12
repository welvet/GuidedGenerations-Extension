// scripts/guidedimpersonate3rd.js
import { getContext } from '../../../../extensions.js';
// Import shared state functions
import { getPreviousImpersonateInput, setPreviousImpersonateInput, getLastImpersonateResult, setLastImpersonateResult } from '../index.js'; 

const guidedImpersonate3rd = async () => {
    console.log('[GuidedGenerations] Guided Impersonate (3rd Person) button clicked');
    const textarea = document.getElementById('send_textarea');
    if (!textarea) {
        console.error('[GuidedGenerations] Textarea #send_textarea not found.');
        return;
    }
    const currentInputText = textarea.value;
    const lastGeneratedText = getLastImpersonateResult(); // Use shared getter

    // Check if the current input matches the last generated text (from any impersonation)
    if (lastGeneratedText && currentInputText === lastGeneratedText) {
        console.log('[GuidedGenerations] Input matches last impersonation, restoring previous input.');
        textarea.value = getPreviousImpersonateInput(); // Use shared getter
        textarea.dispatchEvent(new Event('input', { bubbles: true })); 
        return; // Restoration done, exit
    }

    // --- If not restoring, proceed with impersonation ---
    console.log('[GuidedGenerations] Performing new 3rd person impersonation.');
    setPreviousImpersonateInput(currentInputText); // Use shared setter

    // Only the core impersonate command remains (specific 3rd person prompt)
    const stscriptCommand = `/impersonate await=true Write in third Person perspective from {{user}}. {{input}} |`;

    console.log(`[GuidedGenerations] Executing 3rd person stscript: ${stscriptCommand}`);

    try {
        const context = getContext(); 
        if (typeof context.executeSlashCommandsWithOptions === 'function') {
            await context.executeSlashCommandsWithOptions(stscriptCommand);
            
            // After completion, read the new input and store it in shared state
            setLastImpersonateResult(textarea.value); // Use shared setter
            console.log('[GuidedGenerations] Guided Impersonate (3rd) stscript executed, new input stored in shared state.');
        } else {
            console.error('[GuidedGenerations] context.executeSlashCommandsWithOptions not found!');
        }
    } catch (error) {
        console.error(`[GuidedGenerations] Error executing Guided Impersonate (3rd) stscript: ${error}`);
        setLastImpersonateResult(''); // Clear shared state on error
    } 
};

// Export the function
export { guidedImpersonate3rd };
