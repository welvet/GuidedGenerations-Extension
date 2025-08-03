import { getContext } from '../../../../../extensions.js';
import { extensionName } from '../../index.js';

/**
 * Handles preset switching with legacy name support and provides restore function
 * @param {string} presetValue - The preset ID or name to switch to
 * @param {boolean} autoRestore - Whether to automatically restore the original preset when the returned restore function is called
 * @returns {Object} - Object containing originalPresetId, targetPresetId, and restore function
 */
export function handlePresetSwitching(presetValue) {
    const extensionName = "GuidedGenerations-Extension";
    let originalPresetId = null;
    let targetPresetId = null;

    // Determine target preset ID without switching yet
    if (presetValue) {
        const presetManager = getContext()?.getPresetManager?.();
        if (presetManager) {
            const presetList = presetManager.getPresetList();
            const presetValueStr = String(presetValue);

            // Handle multiple possible data structures from getPresetList()
            let validPresetIds = [];
            let presetNameToIdMap = {};

            // Check if presetList has a preset_names property (newer format)
            if (presetList && presetList.preset_names) {
                const presetNames = presetList.preset_names;
                
                if (Array.isArray(presetNames)) {
                    // Text Completion format: preset_names is an array of names
                    validPresetIds = presetNames.map((name, index) => String(index));
                    presetNames.forEach((name, index) => {
                        presetNameToIdMap[String(name).toLowerCase()] = String(index);
                    });
                } else {
                    // Chat Completion format: preset_names is an object with name-to-id mapping
                    validPresetIds = Object.values(presetNames).map(id => String(id));
                    Object.entries(presetNames).forEach(([name, id]) => {
                        presetNameToIdMap[String(name).toLowerCase()] = String(id);
                    });
                }
            } else if (Array.isArray(presetList)) {
                // Legacy format: presetList is an array of objects with id and name properties
                validPresetIds = presetList.map(p => String(p.id));
                presetList.forEach(preset => {
                    if (preset.name && preset.id !== undefined) {
                        presetNameToIdMap[String(preset.name).toLowerCase()] = String(preset.id);
                    }
                });
            }

            // Try to find the target preset
            if (validPresetIds.includes(presetValueStr)) {
                targetPresetId = presetValueStr;
            } else {
                // Try to find by name (case-insensitive)
                const normalizedValue = presetValueStr.toLowerCase();
                if (presetNameToIdMap[normalizedValue]) {
                    targetPresetId = presetNameToIdMap[normalizedValue];
                }
            }

            if (!targetPresetId) {
                console.warn(`${extensionName}: Preset '${presetValue}' not found. Valid IDs: ${validPresetIds.join(', ')}`);
            }
        }
    }

    const switchPreset = () => {
        if (!targetPresetId) return;
        try {
            const presetManager = getContext()?.getPresetManager?.();
            if (presetManager) {
                originalPresetId = presetManager.getSelectedPreset();
                if (targetPresetId !== originalPresetId) {
                    presetManager.selectPreset(targetPresetId);
                }
            }
        } catch (error) {
            console.error(`${extensionName}: Error switching preset:`, error);
        }
    };

    const restore = () => {
        if (!originalPresetId || !targetPresetId || originalPresetId === targetPresetId) return;
        try {
            const presetManager = getContext()?.getPresetManager?.();
            if (presetManager) {
                const currentPreset = presetManager.getSelectedPreset();
                if (currentPreset === targetPresetId) {
                    presetManager.selectPreset(originalPresetId);
                }
            }
        } catch (restoreError) {
            console.error(`${extensionName}: Error restoring original preset:`, restoreError);
        }
    };

    return { switch: switchPreset, restore };
}
