// scripts/guidedImpersonate.js
import { getPreviousImpersonateInput, setPreviousImpersonateInput, getLastImpersonateResult, setLastImpersonateResult, debugLog } from '../index.js'; // Import shared state functions
import { getContext, extension_settings } from '../../../../extensions.js';
import { extensionName } from '../index.js';
import { handlePresetSwitching } from './utils/presetUtils.js';

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

    // Handle preset switching using unified utility
    const presetKey = 'presetImpersonate1st';
    const presetValue = extension_settings[extensionName]?.[presetKey] ?? '';
    debugLog(`[Impersonate-1st] Using preset: ${presetValue || 'none'}`);
    
    const { switch: switchPreset, restore } = handlePresetSwitching(presetValue);

    // Use user-defined impersonate prompt override
    const promptTemplate = extension_settings[extensionName]?.promptImpersonate1st ?? '';
    const filledPrompt = promptTemplate.replace('{{input}}', currentInputText);

    // Build STScript without preset switching
    const stscriptCommand = `/impersonate await=true ${filledPrompt} |`;
    const fullScript = `// Impersonate guide|\n${stscriptCommand}`;

    try {
        const context = getContext();
        if (typeof context.executeSlashCommandsWithOptions === 'function') {
            // Switch preset before executing
            switchPreset();
            
            // Execute the command and wait for it to complete
            await context.executeSlashCommandsWithOptions(fullScript); 
            
            // After completion, read the new input and store it using the setter
            setLastImpersonateResult(textarea.value);
            debugLog('[Impersonate-1st] STScript executed, new input stored in shared state.');

            // After completion, restore original preset using utility restore function
            restore();

        } else {
            console.error('[GuidedGenerations] context.executeSlashCommandsWithOptions not found!');
        }
    } catch (error) {
        console.error(`[GuidedGenerations] Error executing Guided Impersonate (1st) stscript: ${error}`);
        setLastImpersonateResult(''); // Use setter to clear shared state on error
        
        // Restore original preset on error
        restore();
    }
};

// Export the function
export { guidedImpersonate };
