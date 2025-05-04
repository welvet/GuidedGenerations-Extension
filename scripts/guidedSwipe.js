// scripts/guidedSwipe.js

import { getContext, extension_settings } from '../../../../extensions.js'; // Import getContext and extension_settings
import { setPreviousImpersonateInput, getPreviousImpersonateInput } from '../index.js'; // Import shared state functions

// Helper function for delays
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const extensionName = "GuidedGenerations-Extension";
// Helper function to execute STScripts using the context method
// NOTE: This version assumes executeSlashCommandsWithOptions exists and handles errors locally.
// It might need adjustments based on the exact SillyTavern API if it changes.
async function executeSTScriptCommand(command) {
    try {
        // Check if SillyTavern context is available
        if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
            const context = SillyTavern.getContext();
            // Check if the method exists on the context
            if (typeof context.executeSlashCommandsWithOptions === 'function') {
                // Execute the command via the context
                await context.executeSlashCommandsWithOptions(command, { /* options if needed, e.g., showOutput: false */ });
            } else {
                console.error('[GuidedGenerations] context.executeSlashCommandsWithOptions function not found.');
                alert("Guided Swipe Error: Cannot find the function to execute STScript commands on the context.");
                throw new Error("STScript execution method executeSlashCommandsWithOptions not found on context.");
            }
        } else {
            console.error('[GuidedGenerations] SillyTavern.getContext function not found.');
            alert("Guided Swipe Error: Cannot access SillyTavern context.");
            throw new Error("SillyTavern.getContext not found.");
        }
    } catch (error) {
        console.error(`[GuidedGenerations] Error executing STScript command "${command}":`, error);
        // Re-throw the error to be caught by the calling function's try/catch block
        throw error;
    }
}

/**
 * Finds the last swipe for the last message, swipes to it, and triggers one more swipe (generation).
 * Handles button finding, retries, and potential forcing.
 * Uses local helper functions and correct imports.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
async function generateNewSwipe() {
    const jQueryRef = (typeof $ !== 'undefined') ? $ : jQuery;
    if (!jQueryRef) {
        console.error("[GuidedGenerations][Swipe] jQuery not found for generateNewSwipe.");
        alert("Guided Swipe Error: jQuery not available.");
        return false;
    }

    try {
        // --- Get Initial Swipe State --- (Uses imported getContext)
        let context = getContext();
        if (!context || !context.chat || context.chat.length === 0) {
            console.error("[GuidedGenerations][Swipe] Could not get initial chat context for swiping.");
            alert("Guided Swipe Error: Cannot access chat context.");
            return false;
        }
        let lastMessageIndex = context.chat.length - 1;
        let messageData = context.chat[lastMessageIndex];
        if (!messageData || typeof messageData.swipe_id === 'undefined' || !Array.isArray(messageData.swipes)) {
            console.error("[GuidedGenerations][Swipe] Invalid initial message data for swiping.", messageData);
            alert("Guided Swipe Error: Cannot read initial swipe data.");
            return false;
        }
        let initialSwipeId = messageData.swipe_id;
        let initialTotalSwipes = messageData.swipes.length;

        // --- 2. Swipe to Last Existing Swipe --- (Uses local delay)
        const targetSwipeIndex = Math.max(0, initialTotalSwipes - 1);
        let clicksToReachLast = Math.max(0, targetSwipeIndex - initialSwipeId);
        const selector1 = '#chat .mes:last-child .swipe_right:not(.stus--btn)';
        const selector2 = '#chat .mes:last-child .mes_img_swipe_right';
        let $button = jQueryRef(selector1);
        if ($button.length === 0) $button = jQueryRef(selector2);
        if ($button.length === 0) {
            console.error(`[GuidedGenerations][Swipe] Could not find swipe button.`);
            alert("Guided Swipe Error: Could not find the swipe button.");
            return false;
        }
        if (clicksToReachLast > 0) {
            console.log(`[GuidedGenerations][Swipe] Performing ${clicksToReachLast} clicks to reach the last swipe...`);
            for (let i = 0; i < clicksToReachLast; i++) {
                $button.first().trigger('click');
                await delay(50); // Use local delay
            }
            await delay(150); // Use local delay
        } else {
            console.log("[GuidedGenerations][Swipe] Already at or beyond the target swipe index. No initial swiping needed.");
        }

        // --- 3. Verify & Retry --- (Uses imported getContext and local delay)
        let verificationAttempts = 0;
        const MAX_VERIFICATION_ATTEMPTS = 3;
        let finalSwipeIndex = -1;
        let finalTotalSwipes = -1;
        while (verificationAttempts < MAX_VERIFICATION_ATTEMPTS) {
            verificationAttempts++;
            context = getContext(); // Get fresh context
            lastMessageIndex = context.chat.length - 1;
            messageData = context.chat[lastMessageIndex];
            if (!messageData || typeof messageData.swipe_id === 'undefined' || !Array.isArray(messageData.swipes)) {
                console.error(`[GuidedGenerations][Swipe] Verification attempt ${verificationAttempts}: Invalid message data. Aborting.`);
                alert(`Guided Swipe Error: Cannot read swipe data during verification attempt ${verificationAttempts}.`);
                return false;
            }
            finalSwipeIndex = messageData.swipe_id;
            finalTotalSwipes = messageData.swipes.length;
            const currentTargetIndex = Math.max(0, finalTotalSwipes - 1);
            if (finalSwipeIndex >= currentTargetIndex) {
                console.log(`[GuidedGenerations][Swipe] Successfully on the last swipe.`);
                break;
            }
            if (verificationAttempts < MAX_VERIFICATION_ATTEMPTS) {
                await delay(100); // Use local delay
            } else {
                console.warn(`[GuidedGenerations][Swipe] Still not on last swipe after retries. Forcing...`);
                const forceClicks = Math.max(0, currentTargetIndex - finalSwipeIndex);
                console.log(`[GuidedGenerations][Swipe] Force clicks needed: ${forceClicks}`);
                if (forceClicks > 0) {
                    for (let i = 0; i < forceClicks; i++) {
                        $button.first().trigger('click');
                        await delay(50); // Use local delay
                    }
                    await delay(150); // Use local delay
                    // Re-fetch context one last time after forcing
                    context = getContext();
                    lastMessageIndex = context.chat.length - 1;
                    messageData = context.chat[lastMessageIndex];
                    finalSwipeIndex = messageData ? messageData.swipe_id : -1;
                    finalTotalSwipes = messageData && messageData.swipes ? messageData.swipes.length : -1;
                    console.log(`[GuidedGenerations][Swipe] State after force clicks: Swipe ID: ${finalSwipeIndex}, Total Swipes: ${finalTotalSwipes}`);
                }
            }
        }

        // --- 4. Final Click to Generate --- (Uses local delay)
        console.log("[GuidedGenerations][Swipe] Performing final click to trigger generation...");
        $button.first().trigger('click');
        await delay(100); // Use local delay
        console.log("[GuidedGenerations][Swipe] New swipe generated successfully.");
        return true; // Indicate success

    } catch (error) {
        console.error("[GuidedGenerations][Swipe] Error during generateNewSwipe execution:", error);
        alert(`Guided Swipe Error: ${error.message}`);
        return false; // Indicate failure
    }
}

/**
 * Performs a guided swipe: injects current input as context, swipes to the end,
 * generates a new response, and restores the original input.
 * Uses the extracted generateNewSwipe function and local executeSTScriptCommand.
 */
const guidedSwipe = async () => {
    const textarea = document.getElementById('send_textarea');
    if (!textarea) {
        console.error('[GuidedGenerations][Swipe] Textarea #send_textarea not found.');
        alert("Guided Swipe Error: Textarea not found.");
        return; // Cannot proceed without textarea
    }
    const originalInput = textarea.value; // Get current input

    // Get the LATEST injection role setting HERE
    const injectionRole = extension_settings[extensionName]?.injectionEndRole ?? 'system'; // Get the role setting

    try {
        // Save the input state using the shared function (imported)
        setPreviousImpersonateInput(originalInput);

        // Use user-defined guided swipe prompt override
        const promptTemplate = extension_settings[extensionName]?.promptGuidedSwipe ?? '';
        const filledPrompt = promptTemplate.replace('{{input}}', originalInput);

        // --- 1. Store Input & Inject Context (if any) --- (Use direct context method)
        if (originalInput.trim()) {
            // Use the currentInjectionRole retrieved above
            const stscriptCommand = 
                `// Guided Swipe logic|
                /inject id=instruct position=chat ephemeral=true depth=0 role=${injectionRole} ${filledPrompt}|
                `;
            
            // Get context and execute directly
            if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
                const context = SillyTavern.getContext();
                if (typeof context.executeSlashCommandsWithOptions === 'function') {
                    await context.executeSlashCommandsWithOptions(stscriptCommand);
                    console.log('[GuidedGenerations][Swipe] Executed Command:', stscriptCommand); 
                } else {
                    throw new Error("context.executeSlashCommandsWithOptions function not found.");
                }
            } else {
                throw new Error("SillyTavern.getContext function not found.");
            }
        } else {
            console.log("[GuidedGenerations][Swipe] No input detected, skipping injection.");
        }
        
        // --- Wait for injection to be registered before swiping ---
        if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
            const injectionKey = 'script_inject_instruct';
            const maxAttempts = 5;
            let attempt = 0;
            while (attempt < maxAttempts) {
                const ctx = SillyTavern.getContext();
                if (ctx.extensionPrompts && ctx.extensionPrompts[injectionKey]) {
                    console.log('[GuidedGenerations][Swipe] Injection found:', injectionKey);
                    break;
                }
                await delay(200);
                attempt++;
            }
            if (attempt === maxAttempts) {
                console.warn('[GuidedGenerations][Swipe] Injection not found after waiting:', injectionKey);
            }
        }
        
        // --- 2. Generate New Swipe using the extracted function ---
        const swipeSuccess = await generateNewSwipe();

        if (swipeSuccess) {
            console.log("[GuidedGenerations][Swipe] Guided Swipe finished successfully.");
        } else {
            console.error("[GuidedGenerations][Swipe] Guided Swipe failed during swipe generation step.");
            // Error likely already alerted within generateNewSwipe
        }

    } catch (error) {
        // Catch errors specific to the guidedSwipe wrapper (e.g., from executeSTScriptCommand)
        console.error("[GuidedGenerations][Swipe] Error during guided swipe wrapper execution:", error);
        // Avoid duplicate alerts if generateNewSwipe already alerted
        if (!String(error.message).startsWith('Guided Swipe Error:')) {
            alert(`Guided Swipe Error: ${error.message}`);
        }
    } finally {
        // Always attempt to restore the input field from the shared state (imported)
        if (textarea) { // Check if textarea was found initially
            const restoredInput = getPreviousImpersonateInput();
            console.log(`[GuidedGenerations][Swipe] Restoring input field to: "${restoredInput}" (finally block)`);
            textarea.value = restoredInput;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            // This case should ideally not happen if the initial check passed
            console.warn("[GuidedGenerations][Swipe] Textarea was not available for restoration in finally block.");
        }
    }
};

// Export both functions
export { guidedSwipe, generateNewSwipe };
