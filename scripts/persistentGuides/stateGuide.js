/**
 * @file Contains the logic for the State option in the Persistent Guides menu.
 */

/**
 * Executes the State Guide script to track the physical state and positions of characters.
 * This helps maintain spatial awareness and physical continuity in the scene.
 */
const stateGuide = () => {
    console.log('[GuidedGenerations] State Guide button clicked');

    const stscriptCommand = `//set the current Injection to depth 4|
/listinjects return=object | 
/let injections {{pipe}} | 
/let x {{var::injections}} | 
/var index=state x | 
/let y {{pipe}} | 
/var index=value y |
/inject id=state position=chat depth=4 [Relevant Informations for portraying characters {{pipe}}] |

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

/gen as=char [OOC: Answer me out of Character! Considering the last response, write me a list entailing what state and position of all participating characters, including {{user}}, that are present in the current scene. Don't describe their clothes or how they are dressed. Don't mention People who are no longer relevant to the ongoing scene.]  |

/inject id=state position=chat depth=1 [Relevant Informations for portraying characters {{pipe}}] |
// Switch back to the original preset|
/preset {{getvar::oldPreset}} |
/:\"Guided Generations.SysState\"|
/listinjects |`;

    console.log(`[GuidedGenerations] Executing State Guide stscript: ${stscriptCommand}`);

    // Use the context executeSlashCommandsWithOptions method
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            // Send the combined script via context
            context.executeSlashCommandsWithOptions(stscriptCommand, { showOutput: false }); // Keep output hidden
            console.log('[GuidedGenerations] State Guide stscript executed.');
        } catch (error) {
            console.error(`[GuidedGenerations] Error executing State Guide stscript: ${error}`);
        }
    } else {
        console.error('[GuidedGenerations] SillyTavern.getContext function not found.');
    }
};

// Export the function for use in the main extension file
export default stateGuide;
