/**
 * @file Contains the logic for the Tracker option in the Persistent Guides menu.
 * @description Opens a popup for creating and configuring trackers to monitor specific aspects of your story or characters.
 */

import { getContext } from '../../../../../extensions.js';
import { extensionName } from '../../index.js';
import { executeTracker } from './trackerLogic.js';
import { debugLog } from '../../index.js';

export default async function trackerGuide() {
	debugLog('[TrackerGuide] Button clicked');
	
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
			includeTrackerInGuide: existingConfig.includeTrackerInGuide || false,
			initialFormat: existingConfig.initialFormat || '> Distance {{char}} has moved in meters: 0',
			guidePrompt: existingConfig.guidePrompt || '[OOC: Answer me out of Character! Don\'t continue the RP. Considering the last message alone, write me how far {{char}} has moved in meter in the last message. Give an exact number of your best estimate.]',
			trackerPrompt: existingConfig.trackerPrompt || '[OOC: Answer me out of Character! Don\'t continue the RP. Update the Tracker with the Last update without any preamble. Use the follwing format for your output:]\n> Distance {{char}} has moved in meters: X'
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
						<div style="margin-bottom: 20px; padding: 15px; background: var(--SmartThemeBlurTintColor); border-radius: 8px; border-left: 4px solid var(--SmartThemeBorderColor);">
							<h4 style="margin: 0 0 10px 0; color: var(--SmartThemeBodyColor);">What is the Tracker?</h4>
							<p style="margin: 0; color: var(--SmartThemeBodyColor); line-height: 1.4;">
								The Tracker automatically runs before each message generation. It does 2 API calls:<br>
								1. Analyzes recent chat messages to extract information<br>
								2. Updates a persistent tracker with the new data<br>
								Perfect for tracking things like character movement, relationships, or story progress.
							</p>
						</div>
						
						<div style="display: flex; align-items: center; margin-bottom: 15px;">
							<input type="checkbox" id="trackerEnabled" ${trackerConfig.enabled ? 'checked' : ''} style="margin-right: 8px;">
							<label for="trackerEnabled" style="margin: 0; color: var(--SmartThemeBodyColor);">Enable Tracker</label>
						</div>
						
						<div class="gg-popup-section">
							<label for="trackerMessageCount" style="display: block; margin-bottom: 5px; color: var(--SmartThemeBodyColor);">Messages to Read Back:</label>
							<input type="number" id="trackerMessageCount" min="1" max="20" value="${trackerConfig.messageCount}" style="width: 80px; color: var(--SmartThemeBodyColor); background: var(--SmartThemeBlurTintColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 5px; padding: 4px;">
							<small style="color: var(--SmartThemeBodyColor); opacity: 0.8;">How many recent messages to check for updates (default: 4)</small>
						</div>
							
						<div class="gg-popup-section">
							<label for="trackerInitialFormat" style="display: block; margin-bottom: 5px; color: var(--SmartThemeBodyColor);">Initial Tracker Format:</label>
							<textarea id="trackerInitialFormat" rows="4" style="width: 100%; color: var(--SmartThemeBodyColor); background: var(--SmartThemeBlurTintColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 5px; padding: 8px;">${trackerConfig.initialFormat}</textarea>
							<small style="color: var(--SmartThemeBodyColor); opacity: 0.8;">Starting template for your tracker. Click "Setup Tracker" to create it.</small>
						</div>
						
						<div class="gg-popup-section">
							<label for="trackerGuidePrompt" style="display: block; margin-bottom: 5px; color: var(--SmartThemeBodyColor);">Guide Prompt:</label>
							<textarea id="trackerGuidePrompt" rows="4" style="width: 100%; color: var(--SmartThemeBodyColor); background: var(--SmartThemeBlurTintColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 5px; padding: 8px;">${trackerConfig.guidePrompt}</textarea>
							<small style="color: var(--SmartThemeBodyColor); opacity: 0.8;">Tells the AI what to look for in recent messages. Enable the checkbox below to also include current tracker state.</small>
						</div>
						
						<div class="gg-popup-section">
							<div style="display: flex; align-items: center; margin-bottom: 15px;">
								<input type="checkbox" id="trackerIncludeTrackerInGuide" ${trackerConfig.includeTrackerInGuide ? 'checked' : ''} style="margin-right: 8px;">
								<label for="trackerIncludeTrackerInGuide" style="margin: 0; color: var(--SmartThemeBodyColor);">Include Current Tracker in Guide Prompt Context</label>
							</div>
							<small style="color: var(--SmartThemeBodyColor); opacity: 0.8;">Enable this for trackers like mood that need to consider previous tracker state</small>
						</div>
						
						<div class="gg-popup-section">
							<label for="trackerTrackerPrompt" style="display: block; margin-bottom: 5px; color: var(--SmartThemeBodyColor);">Tracker Prompt:</label>
							<textarea id="trackerTrackerPrompt" rows="4" style="width: 100%; color: var(--SmartThemeBodyColor); background: var(--SmartThemeBlurTintColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 5px; padding: 8px;">${trackerConfig.trackerPrompt}</textarea>
							<small style="color: var(--SmartThemeBodyColor); opacity: 0.8;">Tells the AI how to update your tracker. Gets "Last Update" (from Guide Prompt) and "Tracker" (current tracker content)</small>
						</div>
					</div>
				</div>
				<div class="gg-popup-footer">
					<div style="display: flex; gap: 10px; margin-bottom: 10px;">
						<button class="gg-button gg-button-primary" id="trackerSetupButton">Setup Tracker</button>
						<button class="gg-button gg-button-primary" id="trackerSyncButton">Sync Tracker with Comment</button>
					</div>
					<div style="display: flex; gap: 10px;">
						<button class="gg-button gg-button-primary" id="trackerSaveButton">Save</button>
						<button class="gg-button gg-button-secondary" id="trackerRunButton">Run Tracker</button>
						<button class="gg-button gg-button-secondary" id="trackerCloseButton">Close</button>
					</div>
				</div>
			</div>
		`;
		
		// Add event listeners
		const closeButton = popup.querySelector('.gg-popup-close');
		const closeButton2 = popup.querySelector('#trackerCloseButton');
		const saveButton = popup.querySelector('#trackerSaveButton');
		const setupButton = popup.querySelector('#trackerSetupButton');
		const syncButton = popup.querySelector('#trackerSyncButton');
		const runButton = popup.querySelector('#trackerRunButton');
		const enabledCheckbox = popup.querySelector('#trackerEnabled');
		const messageCountInput = popup.querySelector('#trackerMessageCount');
		const includeTrackerInGuideCheckbox = popup.querySelector('#trackerIncludeTrackerInGuide');
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
				includeTrackerInGuide: includeTrackerInGuideCheckbox.checked,
				initialFormat: initialFormatTextarea.value,
				guidePrompt: guidePromptTextarea.value,
				trackerPrompt: trackerPromptTextarea.value
			};
			
			// Save to chat metadata
			context.updateChatMetadata({
				[`${extensionName}_trackers`]: newConfig
			}, false);
			
			debugLog('[TrackerGuide] Configuration saved:', newConfig);
			// Don't close popup after saving - let user continue configuring
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
					debugLog('[TrackerGuide] Tracker setup completed');
				} catch (error) {
					console.error('[GuidedGenerations] Error setting up tracker:', error);
				}
			}
		});
		
		syncButton.addEventListener('click', async () => {
			try {
				// Find the last comment in the chat
				let lastComment = null;
				debugLog('[TrackerGuide] Searching for comments in chat...');
				
				for (let i = context.chat.length - 1; i >= 0; i--) {
					const message = context.chat[i];
					debugLog(`[TrackerGuide] Message ${i}: name="${message.name}", is_system=${message.is_system}, extra=`, message.extra);
					
					if (message.extra && message.extra.type === 'comment') {
						lastComment = message;
						debugLog('[TrackerGuide] Found comment message:', message);
						break;
					}
				}
				
				if (lastComment && lastComment.mes) {
					// Update the tracker injection with the comment content
					const injectionCommand = `/inject id=tracker position=chat scan=true depth=1 role=system [Tracker Information ${lastComment.mes}]`;
					await context.executeSlashCommandsWithOptions(injectionCommand, { 
						showOutput: false, 
						handleExecutionErrors: true 
					});
					debugLog('[TrackerGuide] Tracker synced with last comment:', lastComment.mes);
				} else {
					debugLog('[TrackerGuide] No comment found to sync with.');
				}
			} catch (error) {
				console.error('[GuidedGenerations] Error syncing tracker with comment:', error);
			}
		});
		
		runButton.addEventListener('click', async () => {
			await executeTracker(false);
			closePopup(); // Close popup after running tracker
		});
		
		// Close on outside click
		popup.addEventListener('click', (e) => {
			if (e.target === popup) {
				closePopup();
			}
		});
		
		// Add to body
		document.body.appendChild(popup);
		
		debugLog('[TrackerGuide] Popup opened.');
		
	} catch (error) {
		console.error(`[GuidedGenerations] Error opening Tracker popup: ${error}`);
	}
}
