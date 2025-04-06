/**
 * @file Contains the logic for the Custom Guide option in the Persistent Guides menu.
 */

/**
 * Executes the Custom Guide script to let users create their own personal guides.
 * This allows for maximum flexibility in creating specialized context for characters.
 */
const customGuide = () => {
    console.log('[GuidedGenerations] Custom Guide button clicked');

    // Check for existing custom guide to edit |
    const stscriptCommand = `/listinjects return=object | 
/let injections {{pipe}} | 
/let x {{var::injections}} | 
/var index=Custom x | 
/let y {{pipe}} | 
/var index=value y |

// If we have an existing Custom guide, prefill the input field with it |
/if left={{pipe}} rule=neq right="" {:
    /setvar key=existing_guide {{pipe}} |
:} {:
    /setvar key=existing_guide "Write your custom guide here..." |
:}|

// Show input field with existing content or default text |
/input label="Enter your custom guide:" value={{getvar::existing_guide}} |
/setvar key=custom_guide_input {{pipe}} |

// Inject the custom guide if the user entered something |
/if left={{getvar::custom_guide_input}} rule=neq right="" {:
    /flushinject Custom |
    /inject id=Custom position=chat depth=0 [Custom Guide: {{getvar::custom_guide_input}}] |
    /:"Guided Generations.SysCustom"|
    /listinjects |
:} {:
    // User canceled or didn't enter anything |
    /echo Custom guide creation canceled. |
:}|`;

    console.log(`[GuidedGenerations] Executing Custom Guide stscript`);

    // Use the context executeSlashCommandsWithOptions method
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            // Send the combined script via context
            context.executeSlashCommandsWithOptions(stscriptCommand, { showOutput: false }); // Keep output hidden
            console.log('[GuidedGenerations] Custom Guide stscript executed.');
        } catch (error) {
            console.error(`[GuidedGenerations] Error executing Custom Guide: ${error}`);
        }
    }
};

// Export the function for use in the main extension file
export default customGuide;
