/**
 * @file Contains the logic for the Flush Guides option in the Persistent Guides menu.
 */

/**
 * Executes the Flush Guides script to remove one or all active guides.
 * Allows users to select which guide to flush or remove all guides at once.
 */
const flushGuides = () => {
    console.log('[GuidedGenerations] Flush Guides button clicked');

    const stscriptCommand = `// Display initial Flush Options |
/listinjects return=object | 
/let injections {{pipe}} | 
/keys {{var::injections}} | 
/setvar key=injection_names {{pipe}} | 
/addvar key=injection_names "All" |
/buttons labels={{getvar::injection_names}} "Select an Guide to flush:" |
/let selected_injection {{pipe}} |
// Handle "All" selection |
/if left={{var::selected_injection}} rule=eq right="All" else={:
/flushinject {{var::selected_injection}} |
:} {:
  /flushinjects |
  /echo All Guides have been flushed. |
:} |`;

    console.log(`[GuidedGenerations] Executing Flush Guides stscript`);

    // Use the context executeSlashCommandsWithOptions method
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            // Send the combined script via context
            context.executeSlashCommandsWithOptions(stscriptCommand, { showOutput: true }); // Show output for user feedback
            console.log('[GuidedGenerations] Flush Guides stscript executed.');
        } catch (error) {
            console.error(`[GuidedGenerations] Error executing Flush Guides: ${error}`);
        }
    }
};

// Export the function for use in the main extension file
export default flushGuides;
