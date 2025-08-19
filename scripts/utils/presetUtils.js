import { debugLog, debugWarn } from '../../index.js';
import { withProfile, getCurrentProfile, switchToProfile, switchToPreset } from './profileUtils.js';

const extensionName = 'Guided Generations';

/**
 * Handle combined profile and preset switching
 * @param {string} profileValue - The profile to switch to
 * @param {string} presetValue - The preset to switch to
 * @param {string} originalProfile - The original profile to restore to
 * @returns {Promise<{switch: Function, restore: Function}>} Object with switch and restore functions
 */
export async function handleProfileAndPresetSwitching(profileValue, presetValue, originalProfile = null) {
    debugLog(`[${extensionName}] handleProfileAndPresetSwitching called with profileValue: "${profileValue}", presetValue: "${presetValue}", originalProfile: "${originalProfile}"`);
    
    // If no profile is specified, fall back to just preset switching
    if (!profileValue || profileValue.trim() === '') {
        debugLog(`[${extensionName}] No profile specified, falling back to preset-only switching`);
        return handlePresetSwitching(presetValue);
    }

    // Capture the original preset if we have a preset value
    let originalPreset = null;
    if (presetValue && presetValue.trim() !== '') {
        try {
            const context = SillyTavern.getContext();
            if (context && context.getPresetManager) {
                // Get the current preset manager and selected preset
                const currentProfile = await getCurrentProfile();
                if (currentProfile) {
                    // Try to get the current preset from the active preset manager
                    const presetManagers = ['openai', 'textgenerationwebui', 'novel', 'kobold'];
                    for (const apiID of presetManagers) {
                        try {
                            const presetManager = context.getPresetManager(apiID);
                            if (presetManager && presetManager.getSelectedPreset) {
                                const selected = presetManager.getSelectedPreset();
                                if (selected && selected.name) {
                                    originalPreset = selected.name;
                                    debugLog(`[${extensionName}] Captured original preset: "${originalPreset}" from ${apiID}`);
                                    break;
                                }
                            }
                        } catch (e) {
                            // Continue to next preset manager
                        }
                    }
                }
            }
        } catch (error) {
            debugWarn(`[${extensionName}] Error capturing original preset:`, error);
        }
    }

    debugLog(`[${extensionName}] Profile to restore to: "${originalProfile}", original preset: "${originalPreset}"`);
    debugLog(`[${extensionName}] Target profile: "${profileValue}", target preset: "${presetValue}"`);

    /**
     * Switch to the target profile and preset
     */
    async function switchProfileAndPreset() {
        try {
            debugLog(`[${extensionName}] Switching to profile: "${profileValue}"`);
            
            // Switch to the target profile
            const profileSwitchSuccess = await switchToProfile(profileValue);
            if (!profileSwitchSuccess) {
                throw new Error(`Failed to switch to profile: ${profileValue}`);
            }

            // Wait for profile to settle
            await new Promise(resolve => setTimeout(resolve, 1000));

            // If we have a preset value, switch to it
            if (presetValue && presetValue.trim() !== '') {
                debugLog(`[${extensionName}] Switching to preset: "${presetValue}"`);
                
                // Get the API type for the target profile
                const { getProfileApiType } = await import('./profileUtils.js');
                const apiType = await getProfileApiType(profileValue);
                
                if (apiType) {
                    const presetSwitchSuccess = await switchToPreset(presetValue, apiType);
                    if (!presetSwitchSuccess) {
                        debugWarn(`[${extensionName}] Failed to switch to preset: ${presetValue}, but continuing with profile switch`);
                    }
                } else {
                    debugWarn(`[${extensionName}] Could not determine API type for profile: ${profileValue}`);
                }
            }

            debugLog(`[${extensionName}] Successfully switched to profile: "${profileValue}" and preset: "${presetValue}"`);
        } catch (error) {
            debugWarn(`[${extensionName}] Error in switchProfileAndPreset:`, error);
            throw error;
        }
    }

    /**
     * Restore the original profile and preset
     */
    async function restore() {
        try {
            debugLog(`[${extensionName}] Restore function called - this should only happen after generation completes`);
            
            // Determine what to restore
            const profileToRestore = originalProfile || '';
            const presetToRestore = originalPreset || '';
            
            debugLog(`[${extensionName}] Restoring from profile "${profileValue}" back to "${profileToRestore}"`);
            debugLog(`[${extensionName}] Restore order: 1) Preset restore, 2) Profile restore`);

            // Step 1: Restore original preset if we had one
            if (presetToRestore && presetValue && presetValue.trim() !== '') {
                debugLog(`[${extensionName}] Step 1: Restoring original preset`);
                
                try {
                    const { getProfileApiType } = await import('./profileUtils.js');
                    const currentProfile = await getCurrentProfile();
                    if (currentProfile) {
                        const apiType = await getProfileApiType(currentProfile);
                        if (apiType) {
                            await switchToPreset(presetToRestore, apiType);
                            debugLog(`[${extensionName}] Successfully restored preset to: "${presetToRestore}"`);
                        }
                    }
                } catch (error) {
                    debugWarn(`[${extensionName}] Error restoring preset:`, error);
                }
            }

            // Step 2: Restore original profile if it was different
            if (profileToRestore && profileToRestore !== profileValue) {
                debugLog(`[${extensionName}] Step 2: Restoring original profile: "${profileToRestore}"`);
                
                try {
                    await switchToProfile(profileToRestore);
                    debugLog(`[${extensionName}] Successfully restored profile to: "${profileToRestore}"`);
                } catch (error) {
                    debugWarn(`[${extensionName}] Error restoring profile:`, error);
                }
            }

            debugLog(`[${extensionName}] Successfully restored original profile and preset`);
        } catch (error) {
            debugWarn(`[${extensionName}] Error in restore:`, error);
        }
    }

    return {
        switch: switchProfileAndPreset,
        restore: restore
    };
}

/**
 * Handle preset-only switching (fallback for when no profile is specified)
 * @param {string} presetValue - The preset to switch to
 * @returns {Promise<{switch: Function, restore: Function}>} Object with switch and restore functions
 */
export async function handlePresetSwitching(presetValue) {
    debugLog(`[${extensionName}] handlePresetSwitching called with presetValue: "${presetValue}"`);
    
    if (!presetValue || presetValue.trim() === '') {
        debugLog(`[${extensionName}] No preset value provided, returning no-op functions`);
        return {
            switch: async () => {},
            restore: async () => {}
        };
    }

    // Capture the original preset
    let originalPreset = null;
    try {
        const context = SillyTavern.getContext();
        if (context && context.getPresetManager) {
            // Try to get the current preset from the active preset manager
            const presetManagers = ['openai', 'textgenerationwebui', 'novel', 'kobold'];
            for (const apiID of presetManagers) {
                try {
                    const presetManager = context.getPresetManager(apiID);
                    if (presetManager && presetManager.getSelectedPreset) {
                        const selected = presetManager.getSelectedPreset();
                        if (selected && selected.name) {
                            originalPreset = selected.name;
                            debugLog(`[${extensionName}] Captured original preset: "${originalPreset}" from ${apiID}`);
                            break;
                        }
                    }
                } catch (e) {
                    // Continue to next preset manager
                }
            }
        }
    } catch (error) {
        debugWarn(`[${extensionName}] Error capturing original preset:`, error);
    }

    /**
     * Switch to the target preset
     */
    async function switchPreset() {
        try {
            debugLog(`[${extensionName}] Switching to preset: "${presetValue}"`);
            
            // Get the current profile to determine API type
            const currentProfile = await getCurrentProfile();
            if (currentProfile) {
                const { getProfileApiType } = await import('./profileUtils.js');
                const apiType = await getProfileApiType(currentProfile);
                
                if (apiType) {
                    const presetSwitchSuccess = await switchToPreset(presetValue, apiType);
                    if (presetSwitchSuccess) {
                        debugLog(`[${extensionName}] Successfully switched to preset: "${presetValue}"`);
                    } else {
                        debugWarn(`[${extensionName}] Failed to switch to preset: "${presetValue}"`);
                    }
                } else {
                    debugWarn(`[${extensionName}] Could not determine API type for current profile: "${currentProfile}"`);
                }
            } else {
                debugWarn(`[${extensionName}] Could not determine current profile for preset switching`);
            }
        } catch (error) {
            debugWarn(`[${extensionName}] Error in switchPreset:`, error);
        }
    }

    /**
     * Restore the original preset
     */
    async function restore() {
        try {
            if (originalPreset && originalPreset !== presetValue) {
                debugLog(`[${extensionName}] Restoring original preset: "${originalPreset}"`);
                
                const currentProfile = await getCurrentProfile();
                if (currentProfile) {
                    const { getProfileApiType } = await import('./profileUtils.js');
                    const apiType = await getProfileApiType(currentProfile);
                    
                    if (apiType) {
                        await switchToPreset(originalPreset, apiType);
                        debugLog(`[${extensionName}] Successfully restored preset to: "${originalPreset}"`);
                    }
                }
            }
        } catch (error) {
            debugWarn(`[${extensionName}] Error in restore:`, error);
        }
    }

    return {
        switch: switchPreset,
        restore: restore
    };
}


