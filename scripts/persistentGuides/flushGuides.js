/**
 * @file Contains the logic for the Flush Guides option in the Persistent Guides menu.
 */

/**
 * Executes the Flush Guides script to remove one or all active guides.
 * Allows users to select which guide to flush or remove all guides at once.
 */
const flushGuides = () => {
    console.log('[GuidedGenerations] Flush Guides button clicked');

    const stscriptCommand = `// Get list of active guides |
/listinjects return=object |
/setvar key=guides {{pipe}} |

/if left={{getvar::guides}} rule=eq right="{}" {:
    /echo No active guides to flush. |
:} {:
    // Format guides into button labels and add "All" option |
    /var index=keys {{getvar::guides}} |
    /if left={{pipe}} rule=eq right="" {:
        /echo No active guides to flush. |
    :} {:
        // Add "All" option to the buttons |
        /setvar key=guide_options {{pipe}},"All" |
        
        // Show selection buttons for guides |
        /buttons labels={{getvar::guide_options}} "Select a guide to flush:" |
        /setvar key=selected_guide {{pipe}} |
        
        // Handle selected guide |
        /if left={{getvar::selected_guide}} rule=eq right="All" {:
            // Flush all guides |
            /flushinjects |
            /echo All guides have been flushed. |
        :} {:
            // Flush specific guide |
            /flushinject {{getvar::selected_guide}} |
            /echo Guide flushed: {{getvar::selected_guide}} |
            /listinjects |
        :} |
    :} |
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
