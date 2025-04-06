/**
 * @file Contains the logic for the Edit Guides option in the Persistent Guides menu.
 */

/**
 * Executes the Edit Guides script to modify existing guides.
 * Allows users to select a guide and edit its content.
 */
const editGuides = () => {
    console.log('[GuidedGenerations] Edit Guides button clicked');

    const stscriptCommand = `// Get list of active guides |
/listinjects return=object |
/setvar key=guides {{pipe}} |

/if left={{getvar::guides}} rule=eq right="{}" {:
    /echo No active guides to edit. Generate guides first. |
:} {:
    // Format guides into button labels |
    /var index=keys {{getvar::guides}} |
    /if left={{pipe}} rule=eq right="" {:
        /echo No active guides to edit. Generate guides first. |
    :} {:
        // Show selection buttons for guides |
        /buttons labels={{pipe}} "Select a guide to edit:" |
        /setvar key=selected_guide {{pipe}} |
        
        // Get the content of the selected guide |
        /var index={{getvar::selected_guide}} {{getvar::guides}} |
        /var index=value {{pipe}} |
        /setvar key=guide_content {{pipe}} |
        
        // Show input field with guide content |
        /input label="Edit guide content:" value={{getvar::guide_content}} |
        /setvar key=edited_content {{pipe}} |
        
        // Check if user entered something |
        /if left={{getvar::edited_content}} rule=neq right="" {:
            // Re-inject the guide with edited content |
            /flushinject {{getvar::selected_guide}} |
            /inject id={{getvar::selected_guide}} position=chat depth=0 [{{getvar::selected_guide}}: {{getvar::edited_content}}] |
            /echo Guide updated: {{getvar::selected_guide}} |
            /listinjects |
        :} {:
            // User canceled |
            /echo Edit canceled. |
        :} |
    :} |
:} |`;

    console.log(`[GuidedGenerations] Executing Edit Guides stscript`);

    // Use the context executeSlashCommandsWithOptions method
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            // Send the combined script via context
            context.executeSlashCommandsWithOptions(stscriptCommand, { showOutput: true }); // Show output for user feedback
            console.log('[GuidedGenerations] Edit Guides stscript executed.');
        } catch (error) {
            console.error(`[GuidedGenerations] Error executing Edit Guides: ${error}`);
        }
    }
};

// Export the function for use in the main extension file
export default editGuides;
