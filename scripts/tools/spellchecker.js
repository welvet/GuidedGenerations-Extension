/**
 * Provides a tool to correct grammar, punctuation, and improve paragraph flow
 * 
 * @returns {Promise<void>}
 */
export default async function spellchecker() {
    const extensionName = "GuidedGenerations-Extension";
    console.log(`${extensionName}: Executing Spellchecker tool`);
    
    // Execute the spellchecker workflow
    const stscript = `
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

        /ifempty value={{getglobalvar::old_input}} {{input}} |
        /setglobalvar key=old_input {{pipe}} |
        /genraw Without any intro or outro correct the grammar, and punctuation, and improves the paragraph's flow of: {{input}} |
        /setinput {{pipe}}|

        // Switch back to the original preset|
        /preset {{getvar::oldPreset}} |
    `;
    
    executeSTScript(stscript);
}

/**
 * Helper function to execute ST-Script commands
 * @param {string} stscript - The ST-Script command to execute
 */
function executeSTScript(stscript) {
    const extensionName = "GuidedGenerations-Extension";
    try {
        // Use the context executeSlashCommandsWithOptions method
        if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
            const context = SillyTavern.getContext();
            // Send the combined script via context
            context.executeSlashCommandsWithOptions(stscript);
            console.log(`${extensionName}: ST-Script executed successfully.`);
        } else {
            console.error(`${extensionName}: SillyTavern.getContext function not found.`);
        }
    } catch (error) {
        console.error(`${extensionName}: Error executing ST-Script:`, error);
    }
}
