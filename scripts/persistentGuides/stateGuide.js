/**
 * @file Contains the logic for the State option in the Persistent Guides menu.
 */

/**
 * Executes the State Guide script to track the physical state and positions of characters.
 * This helps maintain spatial awareness and physical continuity in the scene.
 * @param {boolean} isAuto - Whether this guide is being auto-triggered (true) or called directly from menu (false)
 * @returns {Promise<string|null>} The generated state info from the pipe, or null on error.
 */
const stateGuide = async (isAuto = false) => {
    console.log('[GuidedGenerations] State Guide ' + (isAuto ? 'auto-triggered' : 'button clicked'));

    let stscriptCommand = `//set the current Injection to depth 4|
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
/preset {{getvar::oldPreset}} |`;

    // Only include /listinjects if not auto-triggered
    if (!isAuto) {
        console.log('[GuidedGenerations] Running in manual mode, adding /listinjects command');
        stscriptCommand += `
/listinjects |`;
    } else {
        console.log('[GuidedGenerations] Running in auto mode, NOT adding /listinjects command');
    }

    // Print the full command for debugging
    console.log(`[GuidedGenerations] State Guide final stscript (isAuto=${isAuto}):`);
    console.log(stscriptCommand);

    console.log(`[GuidedGenerations] Executing State Guide stscript: ${isAuto ? 'auto mode' : 'manual mode'}`);

    // Use the context executeSlashCommandsWithOptions method
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            // Send the combined script via context and await the result
            const result = await context.executeSlashCommandsWithOptions(stscriptCommand, {
                showOutput: false, // Keep output hidden
                handleExecutionErrors: true // Allow capturing script errors
            });

            console.log('[GuidedGenerations] State Guide stscript executed. Full Result:', result);

            // Check specifically for STScript execution errors
            if (result && result.isError) {
                console.error(`[GuidedGenerations] STScript execution failed: ${result.errorMessage}`, result);
                return null; // Indicate failure
            }

            // Check the pipe for the result
            if (result && result.pipe !== undefined && result.pipe !== null && result.pipe !== '') {
                console.log('[GuidedGenerations] Successfully retrieved pipe value:', result.pipe);
                if (typeof window !== 'undefined') {
                    window.ggLastStateGeneratedContent = result.pipe;
                    console.log('[GuidedGenerations] Stored pipe value in window.ggLastStateGeneratedContent');
                }
                return result.pipe; // Return the content from pipe
            } else {
                console.warn('[GuidedGenerations] State Guide did not return a value in the pipe. Result:', result);
                return null; // Indicate failure
            }
        } catch (error) {
            console.error(`[GuidedGenerations] JavaScript error executing State Guide script: ${error}`);
            return null; // Indicate failure
        }
    } else {
        console.error('[GuidedGenerations] SillyTavern context is not available.');
        return null; // Indicate failure
    }
};

// Export the function for use in the main extension file
export default stateGuide;
