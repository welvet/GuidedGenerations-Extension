// scripts/persistentGuides/editGuidesPopup.js

/**
 * Edit Guides Popup - Handles UI for editing guide injections.
 */
export class EditGuidesPopup {
    constructor() {
        this.popupId = 'editGuidesPopup';
        this.popupElement = null;
        this.initialized = false;
        this.injectionData = {}; // To store the {key: {value, depth, ...}} object
        this.selectedGuideKey = null;

        // Define the HTML structure once
        this.popupHtml = `
            <div id="${this.popupId}" class="gg-popup" style="display: none;">
                <div class="gg-popup-content">
                    <div class="gg-popup-header">
                        <h2>Edit Guide</h2>
                        <span class="gg-popup-close">&times;</span>
                    </div>
                    <div class="gg-popup-body">
                        <div class="gg-popup-section">
                            <label for="editGuideSelect">Select Guide:</label>
                            <select id="editGuideSelect">
                                <option value="">-- Select a Guide --</option>
                                <!-- Options will be populated dynamically -->
                            </select>
                        </div>
                        <div class="gg-popup-section">
                            <label for="editGuideTextarea">Guide Content:</label>
                            <textarea id="editGuideTextarea" rows="15" placeholder="Select a guide to see its content..."></textarea>
                        </div>
                    </div>
                    <div class="gg-popup-footer">
                        <button id="editGuideSaveButton" class="gg-button gg-button-primary">Save Changes</button>
                        <button id="editGuideCancelButton" class="gg-button gg-button-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize the popup elements and event listeners.
     * @param {HTMLElement} parentElement - The DOM element to append the popup to. Defaults to document.body.
     */
    async init(parentElement = document.body) {
        if (this.initialized) return;

        console.log('[GuidedGenerations] Initializing Edit Guides Popup...');

        // Check if popup exists, create if not
        this.popupElement = document.getElementById(this.popupId);
        if (!this.popupElement) {
            parentElement.insertAdjacentHTML('beforeend', this.popupHtml);
            this.popupElement = document.getElementById(this.popupId);
            console.log('[GuidedGenerations] Edit Guides Popup element created.');
        }

        // Ensure popupElement is valid before proceeding
        if (!this.popupElement) {
            console.error('[GuidedGenerations] Failed to find or create Edit Guides Popup element.');
            return;
        }

        this.setupEventListeners();
        this.initialized = true;
        console.log('[GuidedGenerations] Edit Guides Popup initialized successfully.');
    }

    /**
     * Setup event listeners for the popup controls.
     */
    setupEventListeners() {
        if (!this.popupElement) return;

        const closeButton = this.popupElement.querySelector('.gg-popup-close');
        const cancelButton = this.popupElement.querySelector('#editGuideCancelButton');
        const saveButton = this.popupElement.querySelector('#editGuideSaveButton');
        const selectElement = this.popupElement.querySelector('#editGuideSelect');
        const textareaElement = this.popupElement.querySelector('#editGuideTextarea');

        // Close functionality
        closeButton?.addEventListener('click', () => this.close());
        cancelButton?.addEventListener('click', () => this.close());

        // Guide selection change
        selectElement?.addEventListener('change', (event) => {
            this.selectedGuideKey = event.target.value;
            if (this.selectedGuideKey && this.injectionData[this.selectedGuideKey]) {
                textareaElement.value = this.injectionData[this.selectedGuideKey].value || '';
                textareaElement.disabled = false;
                saveButton.disabled = false;
            } else {
                textareaElement.value = 'Select a guide to see its content...';
                textareaElement.disabled = true;
                saveButton.disabled = true;
                this.selectedGuideKey = null; // Reset if invalid selection
            }
        });

        // Save functionality
        saveButton?.addEventListener('click', () => this.saveChanges());

        // Disable save button initially
        saveButton.disabled = true;
    }

    /**
     * Open the popup and populate it with guide data.
     * @param {object} injectionData - The object containing guide keys and their data ({ value, depth, ... }).
     */
    open(injectionData) {
        if (!this.initialized) {
            this.init().then(() => this._populateAndShow(injectionData));
        } else {
            this._populateAndShow(injectionData);
        }
    }

    /**
     * Internal helper to populate and show the popup after init.
     * @param {object} injectionData - The object containing guide keys and their data.
     */
    _populateAndShow(injectionData) {
        this.injectionData = injectionData || {};
        this.selectedGuideKey = null; // Reset selection

        const selectElement = this.popupElement.querySelector('#editGuideSelect');
        const textareaElement = this.popupElement.querySelector('#editGuideTextarea');
        const saveButton = this.popupElement.querySelector('#editGuideSaveButton');

        // Clear previous options
        selectElement.innerHTML = '<option value="">-- Select a Guide --</option>';

        // Populate dropdown
        const guideKeys = Object.keys(this.injectionData);
        if (guideKeys.length > 0) {
            guideKeys.forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                selectElement.appendChild(option);
            });
        } else {
             // Handle case with no guides - maybe disable select/show message
             console.log("[GuidedGenerations] No guides found to populate editor.");
        }


        // Reset textarea and button state
        textareaElement.value = 'Select a guide to see its content...';
        textareaElement.disabled = true;
        saveButton.disabled = true;

        // Show the popup
        if (this.popupElement) {
            this.popupElement.style.display = 'block';
            // Add logic here to check window size and adjust position/size if needed
            this.adjustPopupPosition();
        }
    }

    /**
     * Adjust popup position/size based on window dimensions (basic example).
     */
     adjustPopupPosition() {
        if (!this.popupElement) return;

        const popupContent = this.popupElement.querySelector('.gg-popup-content');
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;

        // Remove JS overrides - CSS will handle max-height/max-width
        // popupContent.style.maxHeight = `${windowHeight * 0.9}px`;
        // popupContent.style.maxWidth = `${windowWidth * 0.8}px`; // Example max width

        // Relying on CSS (e.g., position: absolute, top: 50%, left: 50%, transform: translate(-50%, -50%))
        // and max-height/max-width set in style.css.
        console.log(`[GuidedGenerations] Window size: ${windowWidth}x${windowHeight}. CSS handles popup sizing/positioning.`);
     }


    /**
     * Close the popup.
     */
    close() {
        if (this.popupElement) {
            this.popupElement.style.display = 'none';
        }
        this.selectedGuideKey = null; // Clear selection on close
        // Reset textarea? Optional.
    }

    /**
     * Save the changes made to the selected guide.
     */
    async saveChanges() {
        if (!this.selectedGuideKey || !this.injectionData[this.selectedGuideKey]) {
            console.error('[GuidedGenerations] No guide selected or data missing for save.');
            // Optionally show a user-friendly message
            return;
        }

        const textareaElement = this.popupElement.querySelector('#editGuideTextarea');
        const newContent = textareaElement.value; // Get potentially modified content

        // Call the direct update method
        const success = this.updateGuidePromptDirectly(this.selectedGuideKey, newContent);

        if (success) {
            console.log(`[GuidedGenerations] Guide "${this.selectedGuideKey}" updated directly in context.`);
            // Update the internal data cache if needed, although reopening will refresh it
            this.injectionData[this.selectedGuideKey].value = newContent;
            this.close();
        } else {
            console.error(`[GuidedGenerations] Failed to update guide "${this.selectedGuideKey}" directly.`);
            // Optionally show an error message to the user
        }
    }

    /**
     * Directly modifies the SillyTavern context's extensionPrompts object.
     * @param {string} key - The key/ID of the guide prompt to update (e.g., 'script_inject_state').
     * @param {string} content - The new content for the guide prompt.
     * @returns {boolean} - True if successful, false otherwise.
     */
    updateGuidePromptDirectly(key, content) {
        try {
            const context = SillyTavern.getContext();
            if (!context || !context.extensionPrompts || !context.extensionPrompts[key]) {
                console.error(`[GuidedGenerations] Cannot update prompt: Context or prompt key '${key}' not found.`);
                return false;
            }

            // Directly update the value property
            context.extensionPrompts[key].value = content;
            
            // Optionally update other properties if needed (e.g., depth, though less likely here)
            // context.extensionPrompts[key].depth = newDepth; 

            return true; // Indicate success

        } catch (error) {
            console.error(`[GuidedGenerations] Error directly updating guide prompt for key "${key}":`, error);
            return false; // Indicate failure
        }
    }
}

// Create a singleton instance
const editGuidesPopup = new EditGuidesPopup();
export default editGuidesPopup; // Export the instance
