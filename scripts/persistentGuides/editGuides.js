/**
 * @file Contains the logic for the Edit Guides option in the Persistent Guides menu.
 */

/**
 * Executes the Edit Guides script to modify existing guides.
 * Allows users to select a guide and edit its content.
 */
const editGuides = () => {
    console.log('[GuidedGenerations] Edit Guides button clicked');

    const stscriptCommand = `/listinjects return=object | 
/let injections {{pipe}} | 
/keys {{var::injections}} | 
/let injection_names {{pipe}} | 
/buttons labels={{var::injection_names}} "Select an Guide to edit:" |
/let selected_injection {{pipe}} |
/let x {{var::injections}} | 
/var index={{var::selected_injection}} x | 
/let y {{pipe}} | 
/var index=value y |
/input large=off wide=on rows=20 default={{pipe}} Edit |
/inject id={{var::selected_injection}} position=chat depth=1 {{pipe}} |`;

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
