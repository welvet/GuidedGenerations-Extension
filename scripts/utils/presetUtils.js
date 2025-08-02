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
            const presetNames = presetList.preset_names || {};
            const validPresetIds = Object.values(presetNames).map(id => String(id));
            const presetValueStr = String(presetValue);

            if (validPresetIds.includes(presetValueStr)) {
                targetPresetId = presetValueStr;
            } else {
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
