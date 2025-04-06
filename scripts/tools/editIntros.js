/**
 * Provides a tool to edit character intros with various formatting options
 * 
 * @returns {Promise<void>}
 */
export default async function editIntros() {
    const extensionName = "guided-generations";
    console.log(`${extensionName}: Executing Edit Intros tool`);
    
    // Disable auto-trigger guides while editing intros
    const stscript = `
        /qr-update set="Guided Generations" label=SysThinking user=false|
        /qr-update set="Guided Generations" label=SysState user=false|
        /qr-update set="Guided Generations" label=SysClothes user=false|
        /echo Autotrigger for the Persistent Guides State, Clothes, and Thinking have been deactivated. You can manually turn them back on after you are finished editing your Intro!

        // Editing Intro messages |
        /sys at=0 Editing Intro messages | 
        /hide 0 |

        // Check if the input field is empty |
        /breakpoint |
        /if left={{input}} rule=not else={:
            /setvar key=inp {{input}} |
        :}{:
            // No input provided, present main menu of transformations |
            /buttons labels=["Change Perspective","Change Tense","Change Style","Change Gender"] "Select what you want to change in the intro:" |
            /let mainchoice {{pipe}} |

            // --- PERSPECTIVE --- |
            /if left={{var::mainchoice}} rule=eq right="Change Perspective" {:
                /buttons labels=["First Person","Second Person","Third Person"] "Select a perspective:" |
                /let perspectivechoice {{pipe}} |

                /if left={{var::perspectivechoice}} rule=eq right="First Person" {:
                    // First Person sub-options |
                    /buttons labels=["I/me (standard 1st person)","{{user}} by name","{{user}} as you","{{user}} as he/him","{{user}} as she/her","{{user}} as they/them"] "How should {{user}} be referred to?" |
                    /let fpchoice {{pipe}} |
                    /if left={{var::fpchoice}} rule=eq right="I/me (standard 1st person)" {:
                        /setvar key=inp "Rewrite the intro in first person, where {{user}} is the narrator using I/me. Keep {{char}}'s references consistent."
                    :}|
                    /if left={{var::fpchoice}} rule=eq right="{{user}} by name" {:
                        /setvar key=inp "Rewrite the intro in first person, but refer to {{user}} by their name instead of I/me, as if the narrator refers to themselves in the third person."
                    :}|
                    /if left={{var::fpchoice}} rule=eq right="{{user}} as you" {:
                        /setvar key=inp "Rewrite the intro in first person, but refer to {{user}} as 'you', creating a self-addressing perspective."
                    :}|
                    /if left={{var::fpchoice}} rule=eq right="{{user}} as he/him" {:
                        /setvar key=inp "Rewrite the intro in first person, but refer to {{user}} using he/him pronouns, as if the narrator speaks about themselves in the third person masculine."
                    :}|
                    /if left={{var::fpchoice}} rule=eq right="{{user}} as she/her" {:
                        /setvar key=inp "Rewrite the intro in first person, but refer to {{user}} using she/her pronouns, as if the narrator speaks about themselves in the third person feminine."
                    :}|
                    /if left={{var::fpchoice}} rule=eq right="{{user}} as they/them" {:
                        /setvar key=inp "Rewrite the intro in first person, but refer to {{user}} using they/them pronouns, as if the narrator speaks about themselves in the third person neutral."
                    :}|
                :}|

                /if left={{var::perspectivechoice}} rule=eq right="Second Person" {:
                    // Second Person sub-option |
                    /buttons labels=["{{user}} as you"] "Second Person Options:" |
                    /let spchoice {{pipe}} |
                    /if left={{var::spchoice}} rule=eq right="{{user}} as you" {:
                        /setvar key=inp "Rewrite the intro in second person, addressing {{user}} directly as 'you', and referring to {{char}} accordingly."
                    :}|
                :}|

                /if left={{var::perspectivechoice}} rule=eq right="Third Person" {:
                    // Third Person sub-options |
                    /buttons labels=["{{user}} by name and pronouns"] "Third Person Options:" |
                    /let tpchoice {{pipe}} |
                    /if left={{var::tpchoice}} rule=eq right="{{user}} by name and pronouns" {:
                        /setvar key=inp "Rewrite the intro in third person, referring to {{user}} by name and appropriate pronouns, and {{char}} by their pronouns, describing surroundings as if viewed from an outside observer."
                    :}|
                :}|
            :}|

            // --- TENSE --- |
            /if left={{var::mainchoice}} rule=eq right="Change Tense" {:
                /buttons labels=["Past Tense","Present Tense"] "Select a tense:" |
                /let tensechoice {{pipe}} |
                /if left={{var::tensechoice}} rule=eq right="Past Tense" {:
                    /setvar key=inp "Rewrite the intro entirely in the past tense, as if these events had already occurred."
                :}|
                /if left={{var::tensechoice}} rule=eq right="Present Tense" {:
                    /setvar key=inp "Rewrite the intro in present tense, making it feel immediate and ongoing."
                :}|
            :}|

            // --- STYLE --- |
            /if left={{var::mainchoice}} rule=eq right="Change Style" {:
                /buttons labels=["Novella Style","Internet RP Style","Literary Style","Script Style"] "Select a style:" |
                /let stylechoice {{pipe}} |
                /if left={{var::stylechoice}} rule=eq right="Novella Style" {:
                    /setvar key=inp "Change in a novella style format: use full paragraphs, proper punctuation for dialogue, and a consistent narrative voice, as if taken from a published novel. Don't use * for narration and Don't add anything other to the text. Keep all links to images intakt."
                :}|
                /if left={{var::stylechoice}} rule=eq right="Internet RP Style" {:
                    /setvar key=inp "Change the intro in internet RP style: use asterisks for actions and narration like *She walks towards {{char}}*, keep all dialogue as is with quotes."
                :}|
                /if left={{var::stylechoice}} rule=eq right="Literary Style" {:
                    /setvar key=inp "Rewrite the intro in a literary style: employ rich metaphors, intricate descriptions, and a more poetic narrative flow, while maintaining proper punctuation and formatting."
                :}|
                /if left={{var::stylechoice}} rule=eq right="Script Style" {:
                    /setvar key=inp "Rewrite the intro in a script style: minimal narration, character names followed by dialogue lines, and brief scene directions in parentheses."
                :}|
            :}|

            // --- GENDER --- |
            /if left={{var::mainchoice}} rule=eq right="Change Gender" {:
                /buttons labels=["He/Him","She/Her","They/Them"] "Select pronouns for {{user}}:" |
                /let genderchoice {{pipe}} |
                /if left={{var::genderchoice}} rule=eq right="He/Him" {:
                    /setvar key=inp "Rewrite the intro changing all references to {{user}} to use he/him pronouns."
                :}|
                /if left={{var::genderchoice}} rule=eq right="She/Her" {:
                    /setvar key=inp "Rewrite the intro changing all references to {{user}} to use she/her pronouns."
                :}|
                /if left={{var::genderchoice}} rule=eq right="They/Them" {:
                    /setvar key=inp "Rewrite the intro changing all references to {{user}} to use they/them pronouns."
                :}|
            :}|
        :}|

        // After all choices and conditions, if inp is set, rewrite the intro. |
        /if left={{getvar::inp}} {:
            /inject id=msgtorework position=chat depth=0 role=assistant {{lastMessage}}|
            /inject id=instruct position=chat depth=0 [Write msgtorework again but correct it to reflect the following: {{getvar::inp}}. Don't cut the message or make changes besides that.] |
            /swipes-swipe |
        :}|

        /flushinjects instruct|
        /flushinjects msgtorework|
        /cut 0|
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
