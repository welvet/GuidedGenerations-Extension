import { getContext } from '../../../../../extensions.js';
import { extensionName, debugLog } from '../../index.js';
import { withProfile, getCurrentProfile, switchToProfile } from './profileUtils.js';

/**
 * Waits for preset change events or times out
 */
export async function waitForPresetChange(operation) {
    return new Promise((resolve) => {
        const context = getContext();
        if (context?.eventSource && context?.eventTypes?.OAI_PRESET_CHANGED_AFTER) {
            debugLog(`Event listener ready for ${operation}`);

            // Set up one-time listener for preset change completion
            const presetChangeListener = () => {
                debugLog(`OAI_PRESET_CHANGED_AFTER event received - ${operation} complete`);
                // Add a small delay to ensure preset change is fully settled before resolving
                setTimeout(() => {
                    debugLog(`Preset change fully settled for ${operation}, resolving...`);
                    resolve();
                }, 500);
            };
            context.eventSource.once(context.eventTypes.OAI_PRESET_CHANGED_AFTER, presetChangeListener);

            // Add timeout fallback in case event doesn't fire
            const timeout = setTimeout(() => {
                debugLog(`OAI_PRESET_CHANGED_AFTER event timeout for ${operation}, proceeding anyway`);
                resolve();
            }, 5000);

            // Clear timeout if event fires first
            const originalResolve = resolve;
            resolve = () => {
                clearTimeout(timeout);
                originalResolve();
            };

            // Small delay to ensure event system is ready
        } else {
            debugLog(`OAI_PRESET_CHANGED_AFTER event not available for ${operation}, falling back to fixed delay`);
            setTimeout(resolve, 1000);
        }
    });
}

/**
 * Handles mapping and switching presets for different ST formats
 */
export function handlePresetSwitching(presetValue) {
    debugLog(`handlePresetSwitching called with presetValue:`, presetValue);

    const context = getContext();
    debugLog(`Getting preset manager...`);
    const presetManager = context?.presetManager || context?.PresetManager || context?.getPresetManager?.();
    debugLog(`Preset manager:`, presetManager);

    let validPresetIds = [];
    const presetNameToIdMap = {};
    const presetIdToNameMap = {};
    let isTextCompletionMode = false;

    try {
        debugLog(`Getting preset list...`);
        const presetList = presetManager?.getPresetList?.() || presetManager?.list || context?.presetList;
        debugLog(`Preset list:`, presetList);
        debugLog(`Looking for preset with value:`, presetValue);

        const presetValueStr = String(presetValue ?? '');

        if (presetList && typeof presetList === 'object' && 'preset_names' in presetList) {
            debugLog(`Found preset_names property:`, presetList.preset_names);
            const presetNames = presetList.preset_names;

            if (Array.isArray(presetNames)) {
                debugLog(`Text Completion format: preset_names is an array`);
                isTextCompletionMode = true;
                validPresetIds = presetNames.map((name, index) => String(index));
                presetNames.forEach((name, index) => {
                    presetNameToIdMap[String(name).toLowerCase()] = String(index);
                    presetIdToNameMap[String(index)] = String(name);
                });
            } else if (typeof presetNames === 'object') {
                debugLog(`Chat Completion format: preset_names is an object`);
                isTextCompletionMode = false;
                validPresetIds = Object.values(presetNames).map(id => String(id));
                Object.entries(presetNames).forEach(([name, id]) => {
                    presetNameToIdMap[String(name).toLowerCase()] = String(id);
                    presetIdToNameMap[String(id)] = String(name);
                });
            } else {
                debugLog(`Unknown preset_names format:`, typeof presetNames);
            }
        } else if (Array.isArray(presetList)) {
            debugLog(`Legacy format: presetList is an array`);
            isTextCompletionMode = false;
            validPresetIds = presetList.map(p => String(p.id));
            presetList.forEach(p => {
                presetNameToIdMap[String(p.name).toLowerCase()] = String(p.id);
                presetIdToNameMap[String(p.id)] = String(p.name);
            });
            debugLog(`Valid preset IDs (Legacy):`, validPresetIds);
            debugLog(`Preset name to ID map:`, presetNameToIdMap);
            debugLog(`Preset ID to name map:`, presetIdToNameMap);
        } else {
            debugLog(`Unknown preset list format:`, presetList);
        }

        debugLog(`Checking if presetValueStr '${presetValueStr}' is in validPresetIds:`, validPresetIds);

        let targetPresetId = null;
        if (validPresetIds.includes(presetValueStr)) {
            targetPresetId = presetValueStr;
            debugLog(`Found target preset by ID:`, targetPresetId);
        } else {
            debugLog(`Not found by ID, trying by name...`);
            const normalizedValue = presetValueStr.toLowerCase().trim();
            debugLog(`Looking for normalized value:`, normalizedValue);
            debugLog(`Available names:`, Object.keys(presetNameToIdMap));
            targetPresetId = presetNameToIdMap[normalizedValue] || null;
            if (targetPresetId) {
                debugLog(`Found target preset by name:`, targetPresetId);
            }
        }

        function switchPreset() {
            debugLog(`switchPreset called with targetPresetId:`, targetPresetId);
            if (!targetPresetId) {
                debugLog(`No target preset ID, skipping switch`);
                return Promise.resolve();
            }

            debugLog(`Getting preset manager for switching...`);
            const presetManager = context?.presetManager || context?.getPresetManager?.();
            debugLog(`Preset manager for switching:`, presetManager);

            return new Promise(async (resolve) => {
                try {
                    debugLog(`Getting current selected preset...`);
                    const originalPresetId = presetManager?.getSelectedPreset?.();
                    debugLog(`Current selected preset:`, originalPresetId);
                    debugLog(`Target preset ID:`, targetPresetId);
                    debugLog(`Is text completion mode:`, isTextCompletionMode);

                    let switchValue = targetPresetId;
                    if (isTextCompletionMode) {
                        switchValue = presetIdToNameMap[targetPresetId] || targetPresetId;
                        debugLog(`Converting ID ${targetPresetId} to name ${switchValue} for text completion mode`);
                    }

                    // Only switch if we're not already on the target preset
                    if (originalPresetId !== targetPresetId) {
                        debugLog(`Switching from ${originalPresetId || 'unknown'} to ${switchValue}...`);
                        presetManager?.selectPreset?.(switchValue);
                        debugLog(`Preset switch initiated, waiting for completion...`);
                        await waitForPresetChange('switch');
                    } else {
                        debugLog(`No switch needed - already on target preset`);
                    }

                    const newSelectedPreset = presetManager?.getSelectedPreset?.();
                    debugLog(`Verification - new selected preset:`, newSelectedPreset);
                    resolve();
                } catch (error) {
                    debugLog(`Error during preset switch:`, error);
                    resolve();
                }
            });
        }

        function restore(originalPresetId, targetPresetId) {
            debugLog(`restore called with originalPresetId:`, originalPresetId, 'targetPresetId:', targetPresetId);
            if (!originalPresetId || originalPresetId === targetPresetId) {
                debugLog(`No restore needed - missing IDs or same preset`);
                return Promise.resolve();
            }

            debugLog(`Getting preset manager for restore...`);
            const presetManager = context?.presetManager || context?.getPresetManager?.();
            debugLog(`Preset manager for restore:`, presetManager);

            return new Promise(async (resolve) => {
                try {
                    debugLog(`Getting current preset for restore check...`);
                    const currentPreset = presetManager?.getSelectedPreset?.();
                    debugLog(`Current preset:`, currentPreset, 'Target preset was:', targetPresetId);

                    let shouldRestore = false;
                    if (isTextCompletionMode) {
                        const targetPresetName = presetIdToNameMap[targetPresetId] || targetPresetId;
                        shouldRestore = currentPreset !== targetPresetName;
                        debugLog(`Text completion mode - checking if current preset '${currentPreset}' matches target name '${targetPresetName}':`, shouldRestore);
                    } else {
                        shouldRestore = currentPreset !== targetPresetId;
                        debugLog(`Chat completion mode - checking if current preset '${currentPreset}' matches target ID '${targetPresetId}':`, shouldRestore);
                    }

                    if (shouldRestore) {
                        let restoreValue = originalPresetId;
                        if (isTextCompletionMode) {
                            restoreValue = presetIdToNameMap[originalPresetId] || originalPresetId;
                            debugLog(`Converting original ID ${originalPresetId} to name ${restoreValue} for text completion mode restore`);
                        }
                        debugLog(`Restoring from ${currentPreset} to ${restoreValue}...`);
                        presetManager?.select?.(restoreValue);
                        debugLog(`Preset restore initiated, waiting for completion...`);
                        await waitForPresetChange('restore');

                        const newSelectedPreset = presetManager?.getSelectedPreset?.();
                        debugLog(`Verification - new selected preset after restore:`, newSelectedPreset);
                    } else {
                        debugLog(`No restore needed - not on target preset`);
                    }

                    resolve();
                } catch {
                    resolve();
                }
            });
        }

        return { switch: switchPreset, restore };
    } catch (error) {
        console.error(`[${extensionName}] Error in handlePresetSwitching:`, error);
        return { switch: async () => {}, restore: async () => {} };
    }
}

/**
 * Handles switching both profile and preset for a guide
 * @param {string} profileValue - The profile to switch to (empty string means use current)
 * @param {string} presetValue - The preset to switch to
 * @param {string} [originalProfile] - The profile that was active before switching (optional)
 * @returns {Promise<{switch: Function, restore: Function}>} Object with switch and restore functions
 */
export async function handleProfileAndPresetSwitching(profileValue, presetValue, originalProfile = null) {
    debugLog(`handleProfileAndPresetSwitching called with profileValue: "${profileValue}", presetValue: "${presetValue}", originalProfile: "${originalProfile || 'auto-detect'}"`);
    debugLog(`Profile value type: ${typeof profileValue}, length: ${profileValue?.length || 0}`);
    debugLog(`Profile value trimmed: "${profileValue?.trim() || ''}"`);

    // If no profile is specified, only handle preset switching
    if (!profileValue || profileValue.trim() === '') {
        debugLog(`No profile specified, using current profile for preset switching`);
        return handlePresetSwitching(presetValue);
    }

    // If profile is specified, we need to switch profile first, then handle preset
    try {
        const context = getContext();
        const presetManager = context?.presetManager || context?.PresetManager || context?.getPresetManager?.();
        
        if (!presetManager) {
            debugLog(`Preset manager not available`);
            return { switch: async () => {}, restore: async () => {} };
        }

        // Get current profile and preset for restoration (only if not provided)
        let profileToRestore = originalProfile;
        if (!profileToRestore) {
            profileToRestore = await getCurrentProfile();
            debugLog(`Auto-detected original profile: "${profileToRestore}"`);
        } else {
            debugLog(`Using provided original profile: "${profileToRestore}"`);
        }
        
        const originalPreset = presetManager?.getSelectedPreset?.();
        
        debugLog(`Profile to restore to: "${profileToRestore}", original preset: "${originalPreset}"`);
        debugLog(`Target profile: "${profileValue}", target preset: "${presetValue}"`);

        async function switchProfileAndPreset() {
            try {
                // Switch to the target profile first
                debugLog(`Switching to profile: "${profileValue}"`);
                const profileSwitchSuccess = await switchToProfile(profileValue);
                
                if (!profileSwitchSuccess) {
                    debugLog(`Failed to switch to profile "${profileValue}", aborting`);
                    return;
                }

                // Verify the profile switch worked
                const newCurrentProfile = await getCurrentProfile();
                debugLog(`Profile switch verification - new current profile: "${newCurrentProfile}"`);

                // Only handle preset switching if a preset is specified
                if (presetValue && presetValue.trim() !== '') {
                    debugLog(`Preset specified, switching to preset: "${presetValue}"`);
                    const presetHandler = handlePresetSwitching(presetValue);
                    await presetHandler.switch();
                } else {
                    debugLog(`No preset specified, skipping preset switch`);
                }
                
                // Add a delay to ensure profile switch is fully settled
                debugLog(`Waiting 1000ms for profile switch to settle...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                debugLog(`Successfully switched to profile "${profileValue}" and ${presetValue ? 'preset' : 'no preset'}`);
                debugLog(`Profile switch complete - ready for generation. Restore will happen after generation completes.`);
            } catch (error) {
                debugLog(`Error during profile and preset switch:`, error);
            }
        }

        async function restore() {
            try {
                debugLog(`Restore function called - this should only happen after generation completes`);
                debugLog(`Restoring from profile "${profileValue}" back to "${profileToRestore}"`);
                debugLog(`Restore order: 1) Preset restore, 2) Profile restore`);
                
                // First restore the original preset (if there was one)
                if (presetValue && presetValue.trim() !== '') {
                    debugLog(`Step 1: Restoring original preset`);
                    const presetHandler = handlePresetSwitching(presetValue);
                    await presetHandler.restore();
                } else {
                    debugLog(`Step 1: No preset to restore (was empty)`);
                }
                
                // Then restore the original profile
                if (profileToRestore && profileToRestore !== profileValue) {
                    debugLog(`Step 2: Restoring original profile: "${profileToRestore}"`);
                    await switchToProfile(profileToRestore);
                } else {
                    debugLog(`Step 2: No profile restore needed (same profile or no original)`);
                }
                
                debugLog(`Successfully restored original profile and preset`);
            } catch (error) {
                debugLog(`Error during restore:`, error);
            }
        }

        return { switch: switchProfileAndPreset, restore };
    } catch (error) {
        console.error(`[${extensionName}] Error in handleProfileAndPresetSwitching:`, error);
        return { switch: async () => {}, restore: async () => {} };
    }
}


