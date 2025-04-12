/**
 * @file Contains the logic for the Corrections tool.
 */
import { extensionName, setPreviousImpersonateInput } from '../../index.js'; // Import shared state function
import { getContext, extension_settings } from '../../../../../extensions.js'; 

// Helper function for delays (copied from guidedSwipe.js)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Provides a tool to modify the last message based on user's instructions
 * 
 * @returns {Promise<void>}
 */
export default async function corrections() {
    console.log('[GuidedGenerations][Corrections] Tool activated.');
    const textarea = document.getElementById('send_textarea');
    if (!textarea) {
        console.error('[GuidedGenerations][Corrections] Textarea #send_textarea not found.');
        return;
    }
    const originalInput = textarea.value; // Get current input

    // Save the input state using the shared function
    setPreviousImpersonateInput(originalInput);
    console.log(`[GuidedGenerations][Corrections] Original input saved: "${originalInput}"`);

    // Get setting (use optional chaining and nullish coalescing for safety)
    const usePresetSwitching = extension_settings[extensionName]?.useGGSytemPreset ?? true; 
    console.log(`[GuidedGenerations][Corrections] useGGSytemPreset setting is ${usePresetSwitching}`);

    // --- Build Preset Switching Script Parts Conditionally ---
    let presetSwitchStartScript = '';
    let presetSwitchEndScript = '';

    if (usePresetSwitching) {
        console.log(`[GuidedGenerations][Corrections] Preset switching ENABLED.`);
        presetSwitchStartScript = `
// Get the currently active preset|
/preset|
/setvar key=currentPreset {{pipe}} |

// If current preset is already GGSytemPrompt, do NOT overwrite oldPreset|
/if left={{getvar::currentPreset}} rule=neq right="GGSytemPrompt" {: 
   // Store the current preset in oldPreset|
   /setvar key=oldPreset {{getvar::currentPreset}} |
   // Now switch to GGSytemPrompt|
   /preset GGSytemPrompt |
:}| 
`; // Note the closing pipe
        presetSwitchEndScript = `
// Switch back to the original preset if it was stored|
/preset {{getvar::oldPreset}} |
`; // Note the closing pipe
    } else {
        console.log(`[GuidedGenerations][Corrections] Preset switching DISABLED.`);
        presetSwitchStartScript = `// Preset switching disabled by setting|`;
        presetSwitchEndScript = `// Preset switching disabled by setting|`;
    }

    // --- Part 1: Execute STscript for Presets and Injections --- 
    const stscriptPart1 = `
        ${presetSwitchStartScript}

        // Inject assistant message to rework and instructions
        /inject id=msgtorework position=chat ephemeral=true depth=0 role=assistant {{lastMessage}}|
        /inject id=instruct position=chat ephemeral=true depth=0 [OOC: Do not continue the story do not wrote in character, instead write {{char}}'s last response again but change it to reflect the following: ${originalInput}. Don't make any other changes besides this.] |
    `;
    
    try {
        console.log('[GuidedGenerations][Corrections] Executing STScript Part 1 (Presets/Injections)...');
        await executeSTScript(stscriptPart1); // Use the helper for STscript
        console.log('[GuidedGenerations][Corrections] STScript Part 1 executed.');

        // --- Part 2: Execute JS Swipe Logic --- 
        console.log('[GuidedGenerations][Corrections] Starting JS Swipe Logic...');
        const jQueryRef = (typeof $ !== 'undefined') ? $ : jQuery;
        if (!jQueryRef) {
            console.error("[GuidedGenerations][Corrections] jQuery not found.");
            alert("Corrections Tool Error: jQuery not available.");
            // Attempt to run preset end script even if swipe fails
             await executeSTScript(presetSwitchEndScript);
            return; 
        }

        // Get Initial Swipe State
        let context = getContext(); 
        if (!context || !context.chat || context.chat.length === 0) {
            console.error("[GuidedGenerations][Corrections] Could not get initial chat context for swiping.");
            alert("Corrections Tool Error: Cannot access chat context.");
             await executeSTScript(presetSwitchEndScript);
            return; 
        }
        let lastMessageIndex = context.chat.length - 1;
        let messageData = context.chat[lastMessageIndex];
         if (!messageData || typeof messageData.swipe_id === 'undefined' || !Array.isArray(messageData.swipes)) {
            console.error("[GuidedGenerations][Corrections] Invalid initial message data for swiping.", messageData);
            alert("Corrections Tool Error: Cannot read initial swipe data.");
             await executeSTScript(presetSwitchEndScript);
            return; 
        }
        let initialSwipeId = messageData.swipe_id;
        let initialTotalSwipes = messageData.swipes.length;
        console.log(`[GuidedGenerations][Corrections] Initial state: Message ${lastMessageIndex}, Swipe ID: ${initialSwipeId}, Total Swipes: ${initialTotalSwipes}`);

        // Swipe to Last Existing Swipe
        const targetSwipeIndex = Math.max(0, initialTotalSwipes - 1);
        let clicksToReachLast = Math.max(0, targetSwipeIndex - initialSwipeId);
        console.log(`[GuidedGenerations][Corrections] Target swipe index: ${targetSwipeIndex}. Clicks needed to reach target: ${clicksToReachLast}`);

        // Find the swipe button
        const selector1 = '#chat .mes:last-child .swipe_right:not(.stus--btn)';
        const selector2 = '#chat .mes:last-child .mes_img_swipe_right';
        let $button = jQueryRef(selector1);
        if ($button.length === 0) $button = jQueryRef(selector2);

        if ($button.length === 0) {
            console.error(`[GuidedGenerations][Corrections] Could not find swipe button.`);
            alert("Corrections Tool Error: Could not find the swipe button.");
             await executeSTScript(presetSwitchEndScript);
            return; 
        }

        if (clicksToReachLast > 0) {
            console.log(`[GuidedGenerations][Corrections] Performing ${clicksToReachLast} clicks to reach the last swipe...`);
            for (let i = 0; i < clicksToReachLast; i++) {
                console.log(`[GuidedGenerations][Corrections] Clicking swipe (${i + 1}/${clicksToReachLast})...`);
                $button.first().trigger('click');
                await delay(50); // Small delay
            }
            console.log("[GuidedGenerations][Corrections] Finished initial swiping.");
            await delay(150); // Longer delay after bulk swiping
        } else {
             console.log("[GuidedGenerations][Corrections] Already at or beyond the target swipe index. No initial swiping needed.");
        }

        // Verification Step (Optional but recommended)
        // Add verification logic here if needed, similar to guidedSwipe.js, 
        // but maybe simpler if just ensuring we are ready for final click.
        console.log('[GuidedGenerations][Corrections] Skipping verification step for now.');

        // Final Click to Generate
        console.log("[GuidedGenerations][Corrections] Performing final click to trigger generation...");
        $button.first().trigger('click');
        console.log("[GuidedGenerations][Corrections] Final click performed.");

        console.log('[GuidedGenerations][Corrections] JS Swipe Logic finished.');

    } catch (error) {
        console.error("[GuidedGenerations][Corrections] Error during Corrections tool execution:", error);
        alert(`Corrections Tool Error: ${error.message || 'An unexpected error occurred.'}`);
    } finally {
        // --- Part 3: Execute STscript for Preset End --- 
        console.log('[GuidedGenerations][Corrections] Executing STScript Part 2 (Preset End)...');
        await executeSTScript(presetSwitchEndScript); // Ensure presets are switched back
        console.log('[GuidedGenerations][Corrections] Corrections tool finished.');
    }
}

/**
 * Helper function to execute ST-Script commands
 * @param {string} stscript - The ST-Script command to execute
 */
async function executeSTScript(stscript) { // Make helper async
    if (!stscript || stscript.trim() === '') {
        console.log('[GuidedGenerations][Corrections] executeSTScript: No script provided, skipping.');
        return;
    }
    try {
        // Use the context executeSlashCommandsWithOptions method
        const context = getContext(); // Get context via imported function
        // Send the combined script via context
        console.log(`[GuidedGenerations][Corrections] Executing STScript: ${stscript}`);
        await context.executeSlashCommandsWithOptions(stscript);
        console.log(`${extensionName}: Corrections ST-Script executed successfully.`);
    } catch (error) {
        console.error(`${extensionName}: Corrections Error executing ST-Script:`, error);
         // Optional: Re-throw or handle differently if needed
    }
}
