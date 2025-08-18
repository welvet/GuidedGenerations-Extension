// scripts/guidedImpersonate2nd.js
import { getContext, extension_settings } from '../../../../extensions.js';
import { extensionName, getPreviousImpersonateInput, setPreviousImpersonateInput, getLastImpersonateResult, setLastImpersonateResult, debugLog } from '../index.js';
import { handlePresetSwitching } from './utils/presetUtils.js'; 

const guidedImpersonate2nd = async () => {
    const textarea = document.getElementById('send_textarea');
    if (!textarea) {
        console.error('[GuidedGenerations] Textarea #send_textarea not found.');
        return;
    }
    const originalInput = textarea.value;
    const lastGeneratedText = getLastImpersonateResult(); // Use shared getter

    // Check if the current input matches the last generated text (from any impersonation)
    if (lastGeneratedText && originalInput === lastGeneratedText) {
        textarea.value = getPreviousImpersonateInput(); // Use shared getter
        textarea.dispatchEvent(new Event('input', { bubbles: true })); 
        return; // Restoration done, exit
    }

    // --- If not restoring, proceed with impersonation ---
    setPreviousImpersonateInput(originalInput); // Use shared setter

    // --- Get Settings ---
    const presetName = extension_settings[extensionName]?.presetImpersonate2nd ?? '';

    // Save the input state using the shared function
    const promptTemplate = extension_settings[extensionName]?.promptImpersonate2nd ?? '';
    const filledPrompt = promptTemplate.replace('{{input}}', originalInput);

    let stscriptCommand;
    if (presetName) {
        stscriptCommand = `/preset name="${presetName}" silent=true | /impersonate await=true persona={{charnames[1]}} ${filledPrompt} |`;
    } else {
        stscriptCommand = `/impersonate await=true persona={{charnames[1]}} ${filledPrompt} |`; // No preset
    }

    // Handle preset switching using unified utility
    const presetKey = 'presetImpersonate2nd';
    const presetValue = extension_settings[extensionName]?.[presetKey] ?? '';
    debugLog(`[Impersonate-2nd] Using preset: ${presetValue || 'none'}`);
    
    const { switch: switchPreset, restore } = handlePresetSwitching(presetValue);
    
    const fullScript = `// 2nd-person impersonate guide|\n${stscriptCommand}`;

    try {
        const context = getContext(); 
        if (typeof context.executeSlashCommandsWithOptions === 'function') {
            // Switch preset before executing
            switchPreset();
            
            await context.executeSlashCommandsWithOptions(fullScript);
            
            // After completion, read the new input and store it in shared state
            setLastImpersonateResult(textarea.value); // Use shared setter
            debugLog('[Impersonate-2nd] STScript executed, new input stored in shared state.');
        } else {
            console.error('[GuidedGenerations] context.executeSlashCommandsWithOptions not found!');
        }
    } catch (error) {
        console.error(`[GuidedGenerations] Error executing Guided Impersonate (2nd) stscript: ${error}`);
        setLastImpersonateResult(''); // Clear shared state on error
    } finally {
        // After completion, restore original preset using utility restore function
        restore();
    }
};

// Export the function
export { guidedImpersonate2nd };
