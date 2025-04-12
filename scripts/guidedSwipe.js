// scripts/guidedSwipe.js

import { getContext } from '../../../../extensions.js'; // Import getContext
import { setPreviousImpersonateInput, getPreviousImpersonateInput } from '../index.js'; // Import shared state functions

// Helper function for delays
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to execute STScripts using the context method
async function executeSTScriptCommand(command) {
    console.log(`[GuidedGenerations] Executing STScript: ${command}`);
    try {
        // Check if SillyTavern context is available
        if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
            const context = SillyTavern.getContext();
            // Check if the method exists on the context
            if (typeof context.executeSlashCommandsWithOptions === 'function') {
                // Execute the command via the context
                await context.executeSlashCommandsWithOptions(command); // Assuming this might be async
                console.log(`[GuidedGenerations] STScript executed via context.executeSlashCommandsWithOptions.`);
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
        // Re-throw the error to be caught by the main try/catch block
        throw error;
    }
}


const guidedSwipe = async () => {
    console.log('[GuidedGenerations] Guided Swipe (Inject > Swipe > Verify > Final Click) started.');
    const textarea = document.getElementById('send_textarea');

    try {
        if (!textarea) {
            console.error('[GuidedGenerations][Swipe] Textarea #send_textarea not found.');
            alert("Guided Swipe Error: Textarea not found.");
            return; // Cannot proceed without textarea
        }
        const originalInput = textarea.value; // Get current input

        // Save the input state using the shared function
        setPreviousImpersonateInput(originalInput);
        console.log('[GuidedGenerations][Swipe] Original input saved.');

        const jQueryRef = (typeof $ !== 'undefined') ? $ : jQuery;
        if (!jQueryRef) {
            console.error("[GuidedGenerations][Swipe] jQuery not found.");
            alert("Guided Swipe Error: jQuery not available.");
            return; // Restoration will happen in finally
        }

        // --- 1. Store Input & Inject Context ---
        if (originalInput.trim()) {
             // Construct the injection command separately for clarity
             // Use originalInput directly in the injection string
             const injectCommand = `/inject id=gg_instruct position=chat ephemeral=true depth=0 [Context: ${originalInput}]`;
             await executeSTScriptCommand(injectCommand);
             console.log("[GuidedGenerations][Swipe] Input stored and injected as context.");
        } else {
             console.log("[GuidedGenerations][Swipe] No input detected, skipping injection.");
        }


        // --- Get Initial Swipe State ---
        let context = getContext(); // Use the imported getContext here
        if (!context || !context.chat || context.chat.length === 0) {
            console.error("[GuidedGenerations][Swipe] Could not get initial chat context for swiping.");
            alert("Guided Swipe Error: Cannot access chat context.");
            return; // Restoration will happen in finally
        }
        let lastMessageIndex = context.chat.length - 1;
        let messageData = context.chat[lastMessageIndex];
         if (!messageData || typeof messageData.swipe_id === 'undefined' || !Array.isArray(messageData.swipes)) {
            console.error("[GuidedGenerations][Swipe] Invalid initial message data for swiping.", messageData);
            alert("Guided Swipe Error: Cannot read initial swipe data.");
            return; // Restoration will happen in finally
        }
        let initialSwipeId = messageData.swipe_id;
        let initialTotalSwipes = messageData.swipes.length;
        console.log(`[GuidedGenerations][Swipe] Initial state: Message ${lastMessageIndex}, Swipe ID: ${initialSwipeId}, Total Swipes: ${initialTotalSwipes}`);

        // --- 2. Swipe to Last Existing Swipe ---
        const targetSwipeIndex = Math.max(0, initialTotalSwipes - 1);
        let clicksToReachLast = Math.max(0, targetSwipeIndex - initialSwipeId);

        console.log(`[GuidedGenerations][Swipe] Target swipe index: ${targetSwipeIndex}. Clicks needed to reach target: ${clicksToReachLast}`);

        // Find the swipe button
        const selector1 = '#chat .mes:last-child .swipe_right:not(.stus--btn)';
        const selector2 = '#chat .mes:last-child .mes_img_swipe_right';
        let $button = jQueryRef(selector1);
        if ($button.length === 0) $button = jQueryRef(selector2);

        if ($button.length === 0) {
            console.error(`[GuidedGenerations][Swipe] Could not find swipe button.`);
            alert("Guided Swipe Error: Could not find the swipe button.");
            return; // Restoration will happen in finally
        }

        if (clicksToReachLast > 0) {
            console.log(`[GuidedGenerations][Swipe] Performing ${clicksToReachLast} clicks to reach the last swipe...`);
            for (let i = 0; i < clicksToReachLast; i++) {
                console.log(`[GuidedGenerations][Swipe] Clicking swipe (${i + 1}/${clicksToReachLast})...`);
                $button.first().trigger('click');
                await delay(50); // Small delay
            }
            console.log("[GuidedGenerations][Swipe] Finished initial swiping.");
            // Add a slightly longer delay after bulk swiping before verification
            await delay(150);
        } else {
             console.log("[GuidedGenerations][Swipe] Already at or beyond the target swipe index. No initial swiping needed.");
        }


        // --- 3. Verify & Retry ---
        let verificationAttempts = 0;
        const MAX_VERIFICATION_ATTEMPTS = 3;
        let finalSwipeIndex = -1;
        let finalTotalSwipes = -1;

        while (verificationAttempts < MAX_VERIFICATION_ATTEMPTS) {
            verificationAttempts++;
            console.log(`[GuidedGenerations][Swipe] Verification attempt ${verificationAttempts}/${MAX_VERIFICATION_ATTEMPTS}...`);
            context = getContext(); // Get fresh context
             lastMessageIndex = context.chat.length - 1;
             messageData = context.chat[lastMessageIndex];
             if (!messageData || typeof messageData.swipe_id === 'undefined' || !Array.isArray(messageData.swipes)) {
                 console.error(`[GuidedGenerations][Swipe] Verification attempt ${verificationAttempts}: Invalid message data. Aborting.`);
                 alert(`Guided Swipe Error: Cannot read swipe data during verification attempt ${verificationAttempts}.`);
                 return; // Restoration will happen in finally
             }

            finalSwipeIndex = messageData.swipe_id;
            finalTotalSwipes = messageData.swipes.length;
            const currentTargetIndex = Math.max(0, finalTotalSwipes - 1);

            console.log(`[GuidedGenerations][Swipe] Verification attempt ${verificationAttempts}: Current Swipe ID: ${finalSwipeIndex}, Total Swipes: ${finalTotalSwipes}, Target Index: ${currentTargetIndex}`);

            if (finalSwipeIndex >= currentTargetIndex) {
                console.log(`[GuidedGenerations][Swipe] Verification attempt ${verificationAttempts}: Successfully on the last swipe.`);
                break;
            }

            if (verificationAttempts < MAX_VERIFICATION_ATTEMPTS) {
                console.log(`[GuidedGenerations][Swipe] Verification attempt ${verificationAttempts}: Not on last swipe. Waiting 100ms...`);
                await delay(100);
            } else {
                 console.warn(`[GuidedGenerations][Swipe] Verification attempt ${verificationAttempts}: Still not on last swipe after retries. Forcing...`);
                 const forceClicks = Math.max(0, currentTargetIndex - finalSwipeIndex);
                 console.log(`[GuidedGenerations][Swipe] Force clicks needed: ${forceClicks}`);
                 if (forceClicks > 0) {
                     for (let i = 0; i < forceClicks; i++) {
                         console.log(`[GuidedGenerations][Swipe] Force Clicking swipe (${i + 1}/${forceClicks})...`);
                         $button.first().trigger('click');
                         await delay(50);
                     }
                     await delay(150); // Delay after force clicks
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

        // --- 4. Final Click to Generate ---
        console.log("[GuidedGenerations][Swipe] Performing final click to trigger generation...");
        $button.first().trigger('click');
        console.log("[GuidedGenerations][Swipe] Final click performed.");

        // --- 5. Restore Input ---
        await delay(100); // Allow final click to process slightly
        console.log("[GuidedGenerations][Swipe] Guided Swipe finished successfully.");


    } catch (error) {
        console.error("[GuidedGenerations][Swipe] Error during guided swipe execution:", error);
        alert(`Guided Swipe Error: ${error.message}`);
    } finally {
        // Always attempt to restore the input field from the shared state
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

export { guidedSwipe };
