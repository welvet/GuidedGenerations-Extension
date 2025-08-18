/**
 * @file Contains the logic for the Tracker option in the Persistent Guides menu.
 * @description Opens a popup for creating and configuring trackers to monitor specific aspects of your story or characters.
 */

import { getContext } from '../../../../../extensions.js';
import { extensionName } from '../../index.js';
import { executeTracker } from './trackerLogic.js';

export default async function trackerGuide() {
    console.log('[GuidedGenerations] Tracker button clicked');
    
    try {
        // Get current chat context
        const context = getContext();
        const characterId = context.characterId;
        const chatId = context.chatId;
        
        // Load existing tracker config from chat metadata
        const existingConfig = context.chatMetadata?.[`${extensionName}_trackers`] || {};
        const trackerConfig = {
            enabled: existingConfig.enabled || false,
            messageCount: existingConfig.messageCount || 4,
            initialFormat: existingConfig.initialFormat || '[OOC: Answer me out of Character! Don\'t continue the RP. Considering where we are currently in the story, write me ...]',
            guidePrompt: existingConfig.guidePrompt || '[OOC: Answer me out of Character! Don\'t continue the RP. Considering where we are currently in the story, write me ...]',
            trackerPrompt: existingConfig.trackerPrompt || '[OOC: Answer me out of Character! Don\'t continue the RP. Considering where we are currently in the story, write me ...]'
        };
        
        // Create popup using the same structure as edit guides popup
        const popup = document.createElement('div');
        popup.className = 'gg-popup';
        popup.style.display = 'block';
        
        popup.innerHTML = `
            <div class="gg-popup-content">
                <div class="gg-popup-header">
                    <h2>Tracker Configuration</h2>
                    <span class="gg-popup-close">&times;</span>
                </div>
                <div class="gg-popup-body">
                                            <div class="gg-popup-section">
                            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                                <input type="checkbox" id="trackerEnabled" ${trackerConfig.enabled ? 'checked' : ''} style="margin-right: 8px;">
                                <label for="trackerEnabled" style="margin: 0; color: var(--SmartThemeBodyColor);">Enable Tracker</label>
                            </div>
                            
                            <div class="gg-popup-section">
                                <label for="trackerMessageCount" style="display: block; margin-bottom: 5px; color: var(--SmartThemeBodyColor);">Messages to Read Back:</label>
                                <input type="number" id="trackerMessageCount" min="1" max="20" value="${trackerConfig.messageCount}" style="width: 80px; color: var(--SmartThemeBodyColor); background: var(--SmartThemeBlurTintColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 5px; padding: 4px;">
                                <small style="color: var(--SmartThemeBodyColor); opacity: 0.8;">Number of recent messages to include as context for the tracker (default: 4).</small>
                            </div>
                            
                            <div class="gg-popup-section">
                                <label for="trackerInitialFormat" style="display: block; margin-bottom: 5px; color: var(--SmartThemeBodyColor);">Initial Tracker Format:</label>
                                <textarea id="trackerInitialFormat" rows="4" style="width: 100%; color: var(--SmartThemeBodyColor); background: var(--SmartThemeBlurTintColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 5px; padding: 8px;">${trackerConfig.initialFormat}</textarea>
                                <small style="color: var(--SmartThemeBodyColor); opacity: 0.8;">This defines the initial format and structure of your tracker.</small>
                            </div>
                        
                        <div class="gg-popup-section">
                            <label for="trackerGuidePrompt" style="display: block; margin-bottom: 5px; color: var(--SmartThemeBodyColor);">Guide Prompt:</label>
                            <textarea id="trackerGuidePrompt" rows="4" style="width: 100%; color: var(--SmartThemeBodyColor); background: var(--SmartThemeBlurTintColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 5px; padding: 8px;">${trackerConfig.guidePrompt}</textarea>
                            <small style="color: var(--SmartThemeBodyColor); opacity: 0.8;">This prompt will be used to generate the guide content.</small>
                        </div>
                        
                        <div class="gg-popup-section">
                            <label for="trackerTrackerPrompt" style="display: block; margin-bottom: 5px; color: var(--SmartThemeBodyColor);">Tracker Prompt:</label>
                            <textarea id="trackerTrackerPrompt" rows="4" style="width: 100%; color: var(--SmartThemeBodyColor); background: var(--SmartThemeBlurTintColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 5px; padding: 8px;">${trackerConfig.trackerPrompt}</textarea>
                            <small style="color: var(--SmartThemeBodyColor); opacity: 0.8;">This prompt will be used to update the tracker. It will receive "Last Update" (the guide content) and "Tracker" (current tracker content) as context.</small>
                        </div>
                    </div>
                </div>
                <div class="gg-popup-footer">
                    <button class="gg-button gg-button-primary" id="trackerSaveButton">Save</button>
                    <button class="gg-button gg-button-secondary" id="trackerSetupButton">Setup Tracker</button>
                    <button class="gg-button gg-button-secondary" id="trackerRunButton">Run Tracker</button>
                    <button class="gg-button gg-button-secondary" id="trackerCloseButton">Close</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const closeButton = popup.querySelector('.gg-popup-close');
        const closeButton2 = popup.querySelector('#trackerCloseButton');
        const saveButton = popup.querySelector('#trackerSaveButton');
        const setupButton = popup.querySelector('#trackerSetupButton');
        const runButton = popup.querySelector('#trackerRunButton');
        const enabledCheckbox = popup.querySelector('#trackerEnabled');
        const messageCountInput = popup.querySelector('#trackerMessageCount');
        const initialFormatTextarea = popup.querySelector('#trackerInitialFormat');
        const guidePromptTextarea = popup.querySelector('#trackerGuidePrompt');
        const trackerPromptTextarea = popup.querySelector('#trackerTrackerPrompt');
        
        const closePopup = () => {
            popup.style.display = 'none';
            document.body.removeChild(popup);
        };
        
        const saveTrackerConfig = async () => {
            const newConfig = {
                enabled: enabledCheckbox.checked,
                messageCount: parseInt(messageCountInput.value) || 4,
                initialFormat: initialFormatTextarea.value,
                guidePrompt: guidePromptTextarea.value,
                trackerPrompt: trackerPromptTextarea.value
            };
            
            // Save to chat metadata
            context.updateChatMetadata({
                [`${extensionName}_trackers`]: newConfig
            }, false);
            
            console.log('[GuidedGenerations] Tracker configuration saved:', newConfig);
            closePopup();
        };
        
        closeButton.addEventListener('click', closePopup);
        closeButton2.addEventListener('click', closePopup);
        saveButton.addEventListener('click', saveTrackerConfig);
        setupButton.addEventListener('click', async () => {
            const initialFormat = initialFormatTextarea.value;
            if (initialFormat.trim()) {
                try {
                    await context.executeSlashCommandsWithOptions(
                        `/inject id=tracker position=chat scan=true depth=0 role=system ${initialFormat}`,
                        { showOutput: false, handleExecutionErrors: true }
                    );
                    console.log('[GuidedGenerations] Tracker setup completed');
                } catch (error) {
                    console.error('[GuidedGenerations] Error setting up tracker:', error);
                }
            }
        });
        runButton.addEventListener('click', async () => {
            await executeTracker(false);
        });
        
        // Close on outside click
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                closePopup();
            }
        });
        
        // Add to body
        document.body.appendChild(popup);
        
        console.log('[GuidedGenerations] Tracker popup opened.');
        
    } catch (error) {
        console.error(`[GuidedGenerations] Error opening Tracker popup: ${error}`);
    }
}
