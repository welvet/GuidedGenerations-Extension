/**
 * @file Contains the logic for the Edit Guides option in the Persistent Guides menu.
 */

import editGuidesPopup from './editGuidesPopup.js'; // Import the popup instance

/**
 * Edit Guides Functionality
 * Fetches persistent guide injections directly from context and opens a custom popup for editing.
 */
async function editGuides() {
    try {
        const context = SillyTavern.getContext();
        if (!context || !context.extensionPrompts) {
            console.error('[GuidedGenerations] SillyTavern context or extensionPrompts not available.');
            // Optionally inform the user via echo
            try {
                await context.executeSlashCommandsWithOptions('/echo Error: SillyTavern context or extensionPrompts not available.', { showOutput: true });
            } catch (echoError) {
                console.error('[GuidedGenerations] Failed to echo error message:', echoError);
            }
            return;
        }

        const allPrompts = context.extensionPrompts;
        const guidePrompts = {};

        // Filter prompts to only include those starting with 'script_inject_'
        for (const key in allPrompts) {
            if (key.startsWith('script_inject_')) {
                // We only need the key, value, and depth for the editor
                guidePrompts[key] = {
                    value: allPrompts[key].value,
                    depth: allPrompts[key].depth
                    // Add other properties if needed later (e.g., position, role)
                };
            }
        }

        if (Object.keys(guidePrompts).length === 0) {
            console.warn('[GuidedGenerations] No guide prompts found starting with script_inject_.');
            try {
                await context.executeSlashCommandsWithOptions('/echo No editable guides found. |', { showOutput: true });
            } catch (echoError) { /* Ignore failure to echo */ }
            return;
        }

        // Ensure the popup is initialized (awaits if first time)
        await editGuidesPopup.init(); 

        // Open the popup with the fetched data
        editGuidesPopup.open(guidePrompts);

    } catch (error) {
        console.error('[GuidedGenerations] Error in editGuides function:', error);
        // Optionally inform the user via echo
        try {
            const context = SillyTavern.getContext();
            await context.executeSlashCommandsWithOptions(`/echo An error occurred while trying to edit guides: ${error.message} |`, { showOutput: true });
        } catch (echoError) {
            console.error('[GuidedGenerations] Failed to echo error message:', echoError);
        }
    }
}

// Expose the function using default export for dynamic import
export default editGuides;
