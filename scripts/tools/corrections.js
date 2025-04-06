/**
 * Provides a tool to modify the last message based on user's instructions
 * 
 * @returns {Promise<void>}
 */
export default async function corrections() {
    const extensionName = "guided-generations";
    console.log(`${extensionName}: Executing Corrections tool`);
    
    // Execute the corrections workflow
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
        /setvar key=inp {{input}} |

        /inject id=msgtorework position=chat ephemeral=true depth=0 role=assistant {{lastMessage}}|
        /inject id=instruct position=chat ephemeral=true depth=0 [OOC: Do not continue the story do not wrote in character, instead write {{char}}'s last response again but change it to reflect the following: {{getvar::inp}}. Don't make any other changes besides this.] |

        /swipes-swipe |

        /flushinjects instruct|
        /flushinjects msgtorework

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
    const extensionName = "guided-generations";
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
