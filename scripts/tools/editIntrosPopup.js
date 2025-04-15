/**
 * Edit Intros Popup - Handles UI for editing character intros with various formatting options
 */

// Map of options to their corresponding stscript prompts
const EDIT_INTROS_OPTIONS = {
    // Perspective options
    'first-person-standard': 'Rewrite the intro in first person, where {{user}} is the narrator using I/me. Keep {{char}}\'s references consistent.',
    'first-person-by-name': 'Rewrite the intro in first person, but refer to {{user}} by their name instead of I/me, as if the narrator refers to themselves in the third person.',
    'first-person-as-you': 'Rewrite the intro in first person, but refer to {{user}} as \'you\', creating a self-addressing perspective.',
    'first-person-he-him': 'Rewrite the intro in first person, but refer to {{user}} using he/him pronouns, as if the narrator speaks about themselves in the third person masculine.',
    'first-person-she-her': 'Rewrite the intro in first person, but refer to {{user}} using she/her pronouns, as if the narrator speaks about themselves in the third person feminine.',
    'first-person-they-them': 'Rewrite the intro in first person, but refer to {{user}} using they/them pronouns, as if the narrator speaks about themselves in the third person neutral.',
    'second-person-as-you': 'Rewrite the intro in second person, addressing {{user}} directly as \'you\', and referring to {{char}} accordingly.',
    'third-person-by-name': 'Rewrite the intro in third person, referring to {{user}} by name and appropriate pronouns, and {{char}} by their pronouns, describing surroundings as if viewed from an outside observer.',
    
    // Tense options
    'past-tense': 'Rewrite the intro entirely in the past tense, as if these events had already occurred.',
    'present-tense': 'Rewrite the intro in present tense, making it feel immediate and ongoing.',
    
    // Style options
    'novella-style': 'Change in a novella style format: use full paragraphs, proper punctuation for dialogue, and a consistent narrative voice, as if taken from a published novel. Don\'t use * for narration and Don\'t add anything other to the text. Keep all links to images intakt.',
    'internet-rp-style': 'Change the intro in internet RP style: use asterisks for actions and narration like *She walks towards {{char}}*, keep all dialogue as is with quotes.',
    'literary-style': 'Rewrite the intro in a literary style: employ rich metaphors, intricate descriptions, and a more poetic narrative flow, while maintaining proper punctuation and formatting.',
    'script-style': 'Rewrite the intro in a script style: minimal narration, character names followed by dialogue lines, and brief scene directions in parentheses.',
    
    // Gender options
    'he-him': 'Rewrite the intro changing all references to {{user}} to use he/him pronouns.',
    'she-her': 'Rewrite the intro changing all references to {{user}} to use she/her pronouns.',
    'they-them': 'Rewrite the intro changing all references to {{user}} to use they/them pronouns.'
};

import { generateNewSwipe } from '../guidedSwipe.js';

// Class to handle the popup functionality
export class EditIntrosPopup {
    constructor() {
        this.selectedOption = null;
        this.popupElement = null;
        this.initialized = false;
        this.lastCustomCommand = sessionStorage.getItem('gg_lastCustomCommand') || ''; // Load last command
    }

    /**
     * Initialize the popup
     */
    async init() {
        if (this.initialized) return;
        
        // Create popup container if it doesn't exist
        if (!document.getElementById('editIntrosPopup')) {
            // Create the popup container
            const popupHtml = `
                <div id="editIntrosPopup" class="gg-popup">
                    <div class="gg-popup-content">
                        <div class="gg-popup-header">
                            <h2>Edit Intros</h2>
                            <span class="gg-popup-close">&times;</span>
                        </div>
                        <div class="gg-popup-body">
                            <div class="gg-popup-section">
                                <h3>Perspective</h3>
                                <div class="gg-option-group">
                                    <div class="gg-option" data-option="first-person">
                                        <span class="gg-option-title">First Person</span>
                                        <div class="gg-suboptions">
                                            <div class="gg-suboption" data-value="first-person-standard">I/me (standard 1st person)</div>
                                            <div class="gg-suboption" data-value="first-person-by-name">{{user}} by name</div>
                                            <div class="gg-suboption" data-value="first-person-as-you">{{user}} as you</div>
                                            <div class="gg-suboption" data-value="first-person-he-him">{{user}} as he/him</div>
                                            <div class="gg-suboption" data-value="first-person-she-her">{{user}} as she/her</div>
                                            <div class="gg-suboption" data-value="first-person-they-them">{{user}} as they/them</div>
                                        </div>
                                    </div>
                                    <div class="gg-option" data-option="second-person">
                                        <span class="gg-option-title">Second Person</span>
                                        <div class="gg-suboptions">
                                            <div class="gg-suboption" data-value="second-person-as-you">{{user}} as you</div>
                                        </div>
                                    </div>
                                    <div class="gg-option" data-option="third-person">
                                        <span class="gg-option-title">Third Person</span>
                                        <div class="gg-suboptions">
                                            <div class="gg-suboption" data-value="third-person-by-name">{{user}} by name and pronouns</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="gg-popup-section">
                                <h3>Tense</h3>
                                <div class="gg-option-group">
                                    <div class="gg-option" data-option="past-tense">
                                        <span class="gg-option-title">Past Tense</span>
                                    </div>
                                    <div class="gg-option" data-option="present-tense">
                                        <span class="gg-option-title">Present Tense</span>
                                    </div>
                                </div>
                            </div>
                            <div class="gg-popup-section">
                                <h3>Style</h3>
                                <div class="gg-option-group">
                                    <div class="gg-option" data-option="novella-style">
                                        <span class="gg-option-title">Novella Style</span>
                                    </div>
                                    <div class="gg-option" data-option="internet-rp-style">
                                        <span class="gg-option-title">Internet RP Style</span>
                                    </div>
                                    <div class="gg-option" data-option="literary-style">
                                        <span class="gg-option-title">Literary Style</span>
                                    </div>
                                    <div class="gg-option" data-option="script-style">
                                        <span class="gg-option-title">Script Style</span>
                                    </div>
                                </div>
                            </div>
                            <div class="gg-popup-section">
                                <h3>Gender</h3>
                                <div class="gg-option-group">
                                    <div class="gg-option" data-option="he-him">
                                        <span class="gg-option-title">He/Him</span>
                                    </div>
                                    <div class="gg-option" data-option="she-her">
                                        <span class="gg-option-title">She/Her</span>
                                    </div>
                                    <div class="gg-option" data-option="they-them">
                                        <span class="gg-option-title">They/Them</span>
                                    </div>
                                </div>
                            </div>
                            <div class="gg-popup-section gg-custom-command-section">
                                <h3>Custom Command</h3>
                                <div class="gg-option gg-custom-option" data-option="custom">
                                    <span class="gg-option-title">Use Custom Instruction Below</span>
                                </div>
                                <textarea id="gg-custom-edit-command" placeholder="Enter custom rewrite instruction here...">${this.lastCustomCommand}</textarea>
                            </div>
                        </div>
                        <div class="gg-popup-footer">
                            <button id="ggCancelEditIntros" class="gg-button gg-button-secondary">Cancel</button>
                            <button id="ggApplyEditIntros" class="gg-button gg-button-primary">Apply</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Append to body
            const popupContainer = document.createElement('div');
            popupContainer.innerHTML = popupHtml;
            document.body.appendChild(popupContainer.firstElementChild);
        }
        
        // Get the popup element reference
        this.popupElement = document.getElementById('editIntrosPopup');
        
        // Setup event listeners
        this.setupEventListeners();
        
        this.initialized = true;
    }

    /**
     * Setup event listeners for the popup
     */
    setupEventListeners() {
        const closeButton = this.popupElement.querySelector('.gg-popup-close');
        const cancelButton = this.popupElement.querySelector('#ggCancelEditIntros');
        const applyButton = this.popupElement.querySelector('#ggApplyEditIntros');
        const options = this.popupElement.querySelectorAll('.gg-option:not(.gg-custom-option)');
        const suboptions = this.popupElement.querySelectorAll('.gg-suboption');
        const customOption = this.popupElement.querySelector('.gg-custom-option');
        const customCommandTextarea = this.popupElement.querySelector('#gg-custom-edit-command');

        closeButton.addEventListener('click', () => this.close());
        cancelButton.addEventListener('click', () => this.close());
        applyButton.addEventListener('click', () => this.applyChanges());

        options.forEach(option => {
            option.addEventListener('click', () => {
                if (option.querySelector('.gg-suboptions')) {
                    return;
                }
                
                this.deselectAllPresets();
                customOption.classList.remove('selected');
                
                option.classList.add('selected');
                this.selectedOption = option.dataset.option;
            });
        });

        suboptions.forEach(suboption => {
            suboption.addEventListener('click', (e) => {
                e.stopPropagation();
                
                this.deselectAllPresets();
                customOption.classList.remove('selected');

                suboption.classList.add('selected');
                this.selectedOption = suboption.dataset.value;
                
                // Optional: Close submenu after selection if desired
                // setTimeout(() => { suboption.closest('.gg-suboptions').style.display = 'none'; }, 200);
            });
        });

        customOption.addEventListener('click', () => {
            this.deselectAllPresets();
            customOption.classList.add('selected');
            this.selectedOption = 'custom';
        });
        
        customCommandTextarea.addEventListener('input', () => {
            this.lastCustomCommand = customCommandTextarea.value;
            if (this.lastCustomCommand.trim() !== '') {
                sessionStorage.setItem('gg_lastCustomCommand', this.lastCustomCommand);
            } else {
                sessionStorage.removeItem('gg_lastCustomCommand');
            }
        });

        this.restoreSelectionState();
    }

    deselectAllPresets() {
        this.popupElement.querySelectorAll('.gg-option:not(.gg-custom-option), .gg-suboption').forEach(el => {
            el.classList.remove('selected');
        });
        if (this.selectedOption !== 'custom') { 
             this.selectedOption = null;
        }
    }

    restoreSelectionState() {
        const customOption = this.popupElement.querySelector('.gg-custom-option');
        if (this.selectedOption) {
            if (this.selectedOption === 'custom') {
                customOption.classList.add('selected');
            } else {
                const selectedElement = this.popupElement.querySelector(`[data-option="${this.selectedOption}"], [data-value="${this.selectedOption}"]`);
                if (selectedElement) {
                    selectedElement.classList.add('selected');
                }
                customOption.classList.remove('selected'); 
            }
        } else {
             customOption.classList.remove('selected'); 
        }
    }

    /**
     * Open the popup
     */
    open() {
        if (!this.initialized) {
            this.init().then(() => {
                if (this.popupElement) {
                    this.popupElement.style.display = 'block';
                }
            });
        } else if (this.popupElement) {
            this.popupElement.style.display = 'block';
        }
    }

    /**
     * Close the popup
     */
    close() {
        if (this.popupElement) {
            this.popupElement.style.display = 'none';
        }
        this.selectedOption = null;
    }

    /**
     * Apply the selected changes
     */
    async applyChanges() {
        let instruction = '';
        const customCommandTextarea = this.popupElement.querySelector('#gg-custom-edit-command');

        if (this.selectedOption === 'custom') {
            const customCommand = customCommandTextarea.value.trim();
            if (customCommand === '') {
                alert('Please enter an instruction in the Custom Command text area.');
                return; 
            }
            instruction = customCommand;
            console.log('[GuidedGenerations] Applying custom instruction.');
            sessionStorage.setItem('gg_lastCustomCommand', customCommand); 
        } else if (this.selectedOption) {
            instruction = EDIT_INTROS_OPTIONS[this.selectedOption];
            if (!instruction) {
                console.error(`[GuidedGenerations] No instruction found for preset option: ${this.selectedOption}`);
                alert('Selected preset option is invalid. Please try again.');
                return; 
            }
             console.log(`[GuidedGenerations] Applying preset: ${this.selectedOption}`);
        } else {
            alert('Please select an edit option or choose Custom and enter an instruction.');
            return; 
        }

        const textareaElement = document.getElementById('send_textarea');
        const customEdit = textareaElement ? textareaElement.value.trim() : ''; 

        const scriptPart1 = `
            /qr-update set="Guided Generations" label=SysThinking user=false|
            /qr-update set="Guided Generations" label=SysState user=false|
            /qr-update set="Guided Generations" label=SysClothes user=false|
            /echo Autotrigger for the Persistent Guides State, Clothes, and Thinking have been deactivated. You can manually turn them back on after you are finished editing your Intro!

            // Editing Intro messages |
            /sys at=0 Editing Intro messages | 
            /hide 0 |

            // Set the instruction |
            /setvar key=inp "${instruction.replace(/"/g, '\\"')}" |

            // Rewrite the intro |
            /inject id=msgtorework position=chat depth=0 role=assistant {{lastMessage}}|
            /inject id=instruct position=chat depth=0 [Write msgtorework again but correct it to reflect the following: {{getvar::inp}}. Don't cut the message or make changes besides that.] |
        `;

        const scriptPart2 = `
            /flushinjects instruct|
            /flushinjects msgtorework|
            /cut 0|
        `;

        try {
            if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
                const context = SillyTavern.getContext();
                await context.executeSlashCommandsWithOptions(scriptPart1);
                const swipeSuccess = await generateNewSwipe();
                if (swipeSuccess) {
                    await context.executeSlashCommandsWithOptions(scriptPart2);
                    console.log('[GuidedGenerations] Edit Intros script executed successfully.');
                } else {
                    console.error('[GuidedGenerations] Failed to generate new swipe.');
                }
            } else {
                console.error('[GuidedGenerations] SillyTavern.getContext function not found.');
            }
        } catch (error) {
            console.error('[GuidedGenerations] Error executing Edit Intros script:', error);
        }
        
        if (customEdit && textareaElement) {
            textareaElement.value = '';
        }
        
        this.close();
    }

    /**
     * Execute the edit intros script
     * @param {string} instruction - The transformation instruction
     */
    executeEditIntros(instruction) {
        const stscript = `
            /qr-update set="Guided Generations" label=SysThinking user=false|
            /qr-update set="Guided Generations" label=SysState user=false|
            /qr-update set="Guided Generations" label=SysClothes user=false|
            /echo Autotrigger for the Persistent Guides State, Clothes, and Thinking have been deactivated. You can manually turn them back on after you are finished editing your Intro!

            // Editing Intro messages |
            /sys at=0 Editing Intro messages | 
            /hide 0 |

            // Set the instruction |
            /setvar key=inp "${instruction.replace(/"/g, '\\"')}" |

            // Rewrite the intro |
            /inject id=msgtorework position=chat depth=0 role=assistant {{lastMessage}}|
            /inject id=instruct position=chat depth=0 [Write msgtorework again but correct it to reflect the following: {{getvar::inp}}. Don't cut the message or make changes besides that.] |
            /swipes-swipe |

            /flushinjects instruct|
            /flushinjects msgtorework|
            /cut 0|
        `;
        
        try {
            if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
                const context = SillyTavern.getContext();
                context.executeSlashCommandsWithOptions(stscript);
                console.log('[GuidedGenerations] Edit Intros script executed successfully.');
            } else {
                console.error('[GuidedGenerations] SillyTavern.getContext function not found.');
            }
        } catch (error) {
            console.error('[GuidedGenerations] Error executing Edit Intros script:', error);
        }
    }
}

// Singleton instance
const editIntrosPopup = new EditIntrosPopup();
export default editIntrosPopup;
