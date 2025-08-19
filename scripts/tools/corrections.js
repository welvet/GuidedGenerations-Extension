/**
 * @file Contains the logic for the Corrections tool.
 */
import { getContext, extension_settings } from '../../../../extensions.js';
import { extensionName, debugLog } from '../index.js';
import { handleProfileAndPresetSwitching } from '../utils/presetUtils.js';

const corrections = async () => {
    const textarea = document.getElementById('send_textarea');
    if (!textarea) {
        console.error('[GuidedGenerations] Textarea #send_textarea not found.');
        return;
    }
    const currentInputText = textarea.value;
    
    // Capture the original profile BEFORE any switching happens
    const context = getContext();
    let originalProfile = '';
    if (context && typeof context.executeSlashCommandsWithOptions === 'function') {
        try {
            // Get current profile before any switching
            const { getCurrentProfile } = await import('../utils/profileUtils.js');
            originalProfile = await getCurrentProfile();
            debugLog(`[Corrections] Captured original profile before switching: "${originalProfile}"`);
        } catch (error) {
            debugLog(`[Corrections] Could not get original profile:`, error);
        }
    }

    // Handle profile and preset switching using unified utility
    const profileKey = 'profileCorrections';
    const presetKey = 'presetCorrections';
    const profileValue = extension_settings[extensionName]?.[profileKey] ?? '';
    const presetValue = extension_settings[extensionName]?.[presetKey] ?? '';
    
    debugLog(`[Corrections] Using profile: ${profileValue || 'current'}, preset: ${presetValue || 'none'}`);
    
    const { switch: switchProfileAndPreset, restore } = await handleProfileAndPresetSwitching(profileValue, presetValue, originalProfile);

    // Use user-defined corrections prompt override
    const promptTemplate = extension_settings[extensionName]?.promptCorrections ?? '';
    const filledPrompt = promptTemplate.replace('{{input}}', currentInputText);

    // Build STScript without preset switching
    const stscriptCommand = `/gen ${filledPrompt} |`;
    const fullScript = `// Corrections guide|\n${stscriptCommand}`;

    try {
        const context = getContext();
        if (typeof context.executeSlashCommandsWithOptions === 'function') {
            debugLog('[Corrections] About to switch profile and preset...');
            
            // Switch profile and preset before executing
            await switchProfileAndPreset();
            
            debugLog('[Corrections] Profile and preset switch complete, about to execute STScript...');
            
            // Execute the command and wait for it to complete
            await context.executeSlashCommandsWithOptions(fullScript); 
            
            debugLog('[Corrections] STScript execution complete, about to restore profile...');
            
            // After completion, restore original profile and preset using utility restore function
            await restore();
            
            debugLog('[Corrections] Profile restore complete');

        } else {
            console.error('[GuidedGenerations] context.executeSlashCommandsWithOptions not found!');
        }
    } catch (error) {
        console.error(`[GuidedGenerations] Error executing Corrections stscript: ${error}`);
        
        debugLog('[Corrections] Error occurred, about to restore profile...');
        
        // Restore original profile and preset on error
        await restore();
        
        debugLog('[Corrections] Profile restore complete after error');
    }
};

// Export the function
export { corrections };
