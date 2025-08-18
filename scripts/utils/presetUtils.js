import { getContext } from '../../../../../extensions.js';
import { extensionName, debugLog } from '../../index.js';

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
