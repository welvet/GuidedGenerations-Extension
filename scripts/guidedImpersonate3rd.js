// scripts/guidedImpersonate3rd.js
import { getContext, extension_settings } from '../../../../extensions.js';
// Import shared state functions
import { extensionName, getPreviousImpersonateInput, setPreviousImpersonateInput, getLastImpersonateResult, setLastImpersonateResult } from '../index.js'; 

const guidedImpersonate3rd = async () => {
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

    // Only the core impersonate command remains (specific 3rd person prompt)
    const stscriptCommand = `/impersonate await=true Write in third Person perspective from {{user}} using third-person pronouns for {{user}}. {{input}} |`;

    // Determine target preset from settings
    const presetKey = 'presetImpersonate3rd';
    const targetPreset = extension_settings[extensionName]?.[presetKey];
    console.log(`[GuidedGenerations] Using preset for 3rd-person impersonate: ${targetPreset || 'none'}`);
    let presetSwitchStart = '';
    let presetSwitchEnd = '';
    if (targetPreset) {
        presetSwitchStart = `/preset|\n/setvar key=oldPreset {{pipe}}|\n/preset ${targetPreset}|\n`;
        presetSwitchEnd = `/preset {{getvar::oldPreset}}|\n`;
    }
    const fullScript = presetSwitchStart + stscriptCommand + presetSwitchEnd;

    try {
        const context = getContext(); 
        if (typeof context.executeSlashCommandsWithOptions === 'function') {
            await context.executeSlashCommandsWithOptions(fullScript);
            
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
