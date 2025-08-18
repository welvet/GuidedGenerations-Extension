/**
 * @file Contains the logic for the Corrections tool.
 */
import { extensionName, setPreviousImpersonateInput, debugLog } from '../../index.js'; // Import shared state function
import { getContext, extension_settings } from '../../../../../extensions.js'; 
import { generateNewSwipe } from '../guidedSwipe.js'; // Import the new function
import { handlePresetSwitching } from '../utils/presetUtils.js';

// Helper function for delays (copied from guidedSwipe.js)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Provides a tool to modify the last message based on user's instructions
 * 
 * @returns {Promise<void>}
 */
export default async function corrections() {
	const textarea = document.getElementById('send_textarea');
	if (!textarea) {
		console.error('[GuidedGenerations][Corrections] Textarea #send_textarea not found.');
		return;
	}
	const originalInput = textarea.value; // Get current input

	// Save the input state using the shared function
	setPreviousImpersonateInput(originalInput);
	debugLog(`[Corrections] Original input saved: "${originalInput}"`);

	// Use user-defined corrections prompt override
	const isRaw = extension_settings[extensionName]?.rawPromptCorrections ?? false;
	const promptTemplate = extension_settings[extensionName]?.promptCorrections ?? '';
	const filledPrompt = promptTemplate.replace('{{input}}', originalInput);

	// Handle preset switching using unified utility
	const presetKey = 'presetCorrections';
	const presetValue = extension_settings[extensionName]?.[presetKey] ?? '';
	debugLog(`[Corrections] Using preset: ${presetValue || 'none'}`);
	
	const { switch: switchPreset, restore } = handlePresetSwitching(presetValue);

	// --- Part 1: Execute STscript for Injections --- 
	const instructionInjection = isRaw ? filledPrompt : `[${filledPrompt}]`;
	const depth = extension_settings[extensionName]?.depthPromptCorrections ?? 0;
	const stscriptPart1 = `
		// Inject assistant message to rework and instructions|
		/inject id=msgtorework position=chat ephemeral=true scan=true depth=${depth} role=assistant {{lastMessage}}|
		// Inject instructions using user override prompt|
		/inject id=instruct position=chat ephemeral=true scan=true depth=${depth} ${instructionInjection}|
	`;
	
	try {
		// Switch preset before executing
		switchPreset();
		
		await executeSTScript(stscriptPart1); // Use the helper for STscript

		// --- Part 2: Execute JS Swipe Logic --- 
		const jQueryRef = (typeof $ !== 'undefined') ? $ : jQuery;
		if (!jQueryRef) {
			console.error("[GuidedGenerations][Corrections] jQuery not found.");
			alert("Corrections Tool Error: jQuery not available.");
			return; 
		}

		const swipeSuccess = await generateNewSwipe(); // Call the imported function

		if (swipeSuccess) {
			debugLog('[Corrections] Executed successfully.');
		} else {
			console.error("[GuidedGenerations][Corrections] generateNewSwipe() reported failure or an issue occurred.");
		}

	} catch (error) {
		console.error("[GuidedGenerations][Corrections] Error during Corrections tool execution:", error);
		alert(`Corrections Tool Error: ${error.message || 'An unexpected error occurred.'}`);
	} finally {
		// Restore original preset after completion
		restore();
	}
}

/**
 * Helper function to execute ST-Script commands
 * @param {string} stscript - The ST-Script command to execute
 */
async function executeSTScript(stscript) { // Make helper async
	if (!stscript || stscript.trim() === '') {
		debugLog('[Corrections] executeSTScript: No script provided, skipping.');
		return;
	}
	try {
		// Use the context executeSlashCommandsWithOptions method
		const context = getContext(); // Get context via imported function
		// Send the combined script via context
		await context.executeSlashCommandsWithOptions(stscript);
	} catch (error) {
		console.error(`${extensionName}: Corrections Error executing ST-Script:`, error);
		 // Optional: Re-throw or handle differently if needed
	}
}
