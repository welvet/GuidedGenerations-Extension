// scripts/guidedImpersonate.js
import { getPreviousImpersonateInput, setPreviousImpersonateInput, getLastImpersonateResult, setLastImpersonateResult } from '../index.js'; // Import shared state functions

const guidedImpersonate = async () => {
    const textarea = document.getElementById('send_textarea');
    if (!textarea) {
        console.error('[GuidedGenerations] Textarea #send_textarea not found.');
        return;
    }
    const currentInputText = textarea.value;
    const lastGeneratedText = getLastImpersonateResult(); // Use getter

    // Check if the current input matches the last generated text
    if (lastGeneratedText && currentInputText === lastGeneratedText) {
        textarea.value = getPreviousImpersonateInput(); // Use getter
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        return; // Restoration done, exit
    }

    // --- If not restoring, proceed with impersonation ---
    setPreviousImpersonateInput(currentInputText); // Use setter

    // Only the core impersonate command remains
    const stscriptCommand = `/impersonate await=true Write in first Person perspective from {{user}}. {{input}} |`;

    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            // Execute the command and wait for it to complete
            await context.executeSlashCommandsWithOptions(stscriptCommand); 
            
            // After completion, read the new input and store it using the setter
            setLastImpersonateResult(textarea.value);
            console.log('[GuidedGenerations] Guided Impersonate (1st) stscript executed, new input stored in shared state.');

        } catch (error) {
            console.error(`[GuidedGenerations] Error executing Guided Impersonate (1st) stscript: ${error}`);
            setLastImpersonateResult(''); // Use setter to clear shared state on error
        }
    } else {
        console.error('[GuidedGenerations] SillyTavern.getContext function not found.');
    }
};

// Export the function
export { guidedImpersonate };
