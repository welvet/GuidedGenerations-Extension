/**
 * @file Contains the logic for the State option in the Persistent Guides menu.
 */

// Import necessary items from SillyTavern's extension system
// Adjust the path based on your actual file structure if needed
import { getContext, extension_settings } from '../../../../../extensions.js'; 
import { extensionName } from '../../index.js'; // Import extensionName from index.js

/**
 * Executes the State Guide script to track the physical state and positions of characters.
 * This helps maintain spatial awareness and physical continuity in the scene.
 * @param {boolean} isAuto - Whether this guide is being auto-triggered (true) or called directly from menu (false)
 * @returns {Promise<string|null>} The generated state info from the pipe, or null on error.
 */
const stateGuide = async (isAuto = false) => {
    console.log('[GuidedGenerations] State Guide ' + (isAuto ? 'auto-triggered' : 'button clicked'));

    // --- Get Settings ---
    // Use optional chaining and nullish coalescing for safety
    const usePresetSwitching = extension_settings[extensionName]?.useGGSytemPreset ?? true; 
    const injectionRole = extension_settings[extensionName]?.injectionEndRole ?? 'system'; // Get the role setting
    console.log(`[GuidedGenerations] State Guide: useGGSytemPreset=${usePresetSwitching}, injectionEndRole=${injectionRole}`);

    // --- Build Preset Switching Script Parts Conditionally ---
    let presetSwitchStart = '';
    let presetSwitchEnd = '';

    if (usePresetSwitching) {
        console.log('[GuidedGenerations] State Guide: Preset switching ENABLED.');
        presetSwitchStart = `
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
`; // Note the closing pipe on the last comment and if block
        presetSwitchEnd = `
// Switch back to the original preset if it was stored|
/preset {{getvar::oldPreset}} |
`; // Note the closing pipe
    } else {
        console.log('[GuidedGenerations] State Guide: Preset switching DISABLED.');
        presetSwitchStart = `// Preset switching disabled by setting|`;
        presetSwitchEnd = `// Preset switching disabled by setting|`;
    }

    // --- Build Main Script ---
    let stscriptCommand = `// Initial guide setup|
/listinjects return=object | 
/let injections {{pipe}} | 
/let x {{var::injections}} | 
/var index=state x | 
/let y {{pipe}} | 
/var index=value y |
/inject id=state position=chat depth=4 [Relevant Informations for portraying characters {{pipe}}] |

${presetSwitchStart}

// Generate the state description|
/gen as=char [OOC: Answer me out of Character! Considering the last response, write me a list entailing what state and position of all participating characters, including {{user}}, that are present in the current scene. Don't describe their clothes or how they are dressed. Don't mention People who are no longer relevant to the ongoing scene.]  |

// Inject the generated state|
/inject id=state position=chat depth=1 role=${injectionRole} [Relevant Informations for portraying characters {{pipe}}] |

${presetSwitchEnd}
`; // Removed extra pipe at the end here, will be added below if needed

    // Only include /listinjects if not auto-triggered
    if (!isAuto) {
        console.log('[GuidedGenerations] Running in manual mode, adding /listinjects command');
        stscriptCommand += `
/listinjects |`; // Add the command and the required pipe
    } else {
        console.log('[GuidedGenerations] Running in auto mode, NOT adding /listinjects command');
        // Ensure the script ends with a pipe if no listinjects is added
        if (!stscriptCommand.trim().endsWith('|')) {
             stscriptCommand += ' |'; 
        }
    }

    // Print the full command for debugging
    console.log(`[GuidedGenerations] State Guide final stscript (isAuto=${isAuto}, usePreset=${usePresetSwitching}):`);
    console.log(stscriptCommand);

    console.log(`[GuidedGenerations] Executing State Guide stscript: ${isAuto ? 'auto mode' : 'manual mode'}`);

    // --- Execute Script ---
    // Use the context executeSlashCommandsWithOptions method
    // Get context within the function call
    const context = getContext(); 
    if (context && typeof context.executeSlashCommandsWithOptions === 'function') {
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
                return null; // Indicate failure or no output
            }
        } catch (error) {
            console.error(`[GuidedGenerations] JavaScript error executing State Guide script: ${error}`);
            return null; // Indicate failure
        }
    } else {
        console.error('[GuidedGenerations] SillyTavern context or executeSlashCommandsWithOptions is not available.');
        return null; // Indicate failure
    }
};

// Export the function for use in the main extension file
export default stateGuide;
