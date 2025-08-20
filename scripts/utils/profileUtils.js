import { debugLog, debugWarn } from '../persistentGuides/guideExports.js'; // Import from central hub

const extensionName = 'Guided Generations';

/**
 * Wait for the connection manager to be available
 * @param {number} maxAttempts - Maximum number of attempts
 * @param {number} delayMs - Delay between attempts in milliseconds
 * @returns {Promise<boolean>} True if connection manager becomes available
 */
async function waitForConnectionManager(maxAttempts = 10, delayMs = 200) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const context = SillyTavern.getContext();
        if (context?.extensionSettings?.connectionManager) {
            debugLog(`[${extensionName}] Connection manager available on attempt ${attempt}`);
            return true;
        }
        
        if (attempt < maxAttempts) {
            debugLog(`[${extensionName}] Connection manager not available, attempt ${attempt}/${maxAttempts}, waiting ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    
    debugWarn(`[${extensionName}] Connection manager not available after ${maxAttempts} attempts`);
    return false;
}

/**
 * Get the current active connection profile name
 * @returns {Promise<string>} The name of the current profile or empty string if none
 */
export async function getCurrentProfile() {
    try {
        // Wait for connection manager to be available
        const isAvailable = await waitForConnectionManager();
        if (!isAvailable) {
            return '';
        }

        const context = SillyTavern.getContext();
        const { selectedProfile, profiles } = context.extensionSettings.connectionManager;
        if (!selectedProfile || !profiles || !Array.isArray(profiles)) {
            debugLog(`[${extensionName}] No profile selected or profiles not available`);
            return '';
        }

        const currentProfile = profiles.find(p => p.id === selectedProfile);
        if (!currentProfile) {
            debugLog(`[${extensionName}] Current profile not found in profiles list`);
            return '';
        }

        debugLog(`[${extensionName}] Current profile: ${currentProfile.name}`);
        return currentProfile.name;
    } catch (error) {
        debugWarn(`[${extensionName}] Error getting current profile:`, error);
        return '';
    }
}

/**
 * Get list of all available connection profile names
 * @returns {Promise<string[]>} Array of profile names
 */
export async function getProfileList() {
    try {
        // Wait for connection manager to be available
        const isAvailable = await waitForConnectionManager();
        if (!isAvailable) {
            return [];
        }

        const context = SillyTavern.getContext();
        const { profiles } = context.extensionSettings.connectionManager;
        if (!profiles || !Array.isArray(profiles)) {
            debugLog(`[${extensionName}] Profiles not available`);
            return [];
        }

        const profileNames = profiles.map(p => p.name);
        debugLog(`[${extensionName}] Available profiles:`, profileNames);
        return profileNames;
    } catch (error) {
        debugWarn(`[${extensionName}] Error getting profile list:`, error);
        return [];
    }
}

/**
 * Switch to a specific connection profile
 * @param {string} profileName - Name of the profile to switch to
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function switchToProfile(profileName) {
    try {
        // Wait for connection manager to be available
        const isAvailable = await waitForConnectionManager();
        if (!isAvailable) {
            return false;
        }

        const context = SillyTavern.getContext();
        const { profiles } = context.extensionSettings.connectionManager;
        if (!profiles || !Array.isArray(profiles)) {
            debugWarn(`[${extensionName}] Profiles not available`);
            return false;
        }

        // Find the profile by name
        const targetProfile = profiles.find(p => p.name === profileName);
        if (!targetProfile) {
            debugWarn(`[${extensionName}] Profile not found: ${profileName}`);
            return false;
        }

        // Debug: Log all potential profile-related elements
        debugLog(`[${extensionName}] Searching for profiles dropdown...`);
        const allSelects = document.querySelectorAll('select');
        const profileRelatedSelects = Array.from(allSelects).filter(select => {
            const id = select.id || '';
            const name = select.name || '';
            const className = select.className || '';
            return id.includes('profile') || name.includes('profile') || className.includes('profile');
        });
        
        debugLog(`[${extensionName}] Found ${profileRelatedSelects.length} profile-related select elements:`, 
            profileRelatedSelects.map(s => ({ id: s.id, name: s.name, className: s.className })));

        // Try multiple selectors to find the profiles dropdown
        let profilesDropdown = document.getElementById('profiles') || 
                             document.querySelector('#profiles') ||
                             document.querySelector('select[name="profiles"]') ||
                             document.querySelector('.profiles-select') ||
                             document.querySelector('[data-profile-selector]') ||
                             document.querySelector('select[id*="profile"]') ||
                             document.querySelector('select[name*="profile"]') ||
                             document.querySelector('select[class*="profile"]');

        if (!profilesDropdown) {
            // Try to find by looking at the connection manager UI
            debugLog(`[${extensionName}] Trying to find profiles dropdown in connection manager UI...`);
            
            // Look for elements that might be the profiles dropdown
            const possibleDropdowns = document.querySelectorAll('select');
            for (const dropdown of possibleDropdowns) {
                const options = Array.from(dropdown.options);
                const hasMatchingProfiles = options.some(option => 
                    profiles.some(profile => profile.name === option.text || profile.id === option.value)
                );
                
                if (hasMatchingProfiles) {
                    debugLog(`[${extensionName}] Found potential profiles dropdown:`, {
                        id: dropdown.id,
                        name: dropdown.name,
                        className: dropdown.className,
                        optionsCount: options.length,
                        sampleOptions: options.slice(0, 3).map(o => ({ text: o.text, value: o.value }))
                    });
                    profilesDropdown = dropdown;
                    break;
                }
            }
        }

        if (!profilesDropdown) {
            debugWarn(`[${extensionName}] Profiles dropdown not found with any selector`);
            debugWarn(`[${extensionName}] Available select elements:`, 
                Array.from(document.querySelectorAll('select')).map(s => ({ id: s.id, name: s.name, className: s.className })));
            return false;
        }

        debugLog(`[${extensionName}] Found profiles dropdown:`, {
            id: profilesDropdown.id,
            name: profilesDropdown.name,
            className: profilesDropdown.className,
            optionsCount: profilesDropdown.options.length
        });

        // Find the index of the target profile
        const profileIndex = Array.from(profilesDropdown.options).findIndex(o => o.value === targetProfile.id);
        if (profileIndex === -1) {
            debugWarn(`[${extensionName}] Profile not found in dropdown: ${profileName}`);
            debugWarn(`[${extensionName}] Available dropdown options:`, 
                Array.from(profilesDropdown.options).map(o => ({ text: o.text, value: o.value })));
            debugWarn(`[${extensionName}] Looking for profile with ID: ${targetProfile.id}`);
            return false;
        }

        // Switch to the profile
        profilesDropdown.selectedIndex = profileIndex;
        profilesDropdown.dispatchEvent(new Event('change'));

        debugLog(`[${extensionName}] Switched to profile: ${profileName}`);
        return true;
    } catch (error) {
        debugWarn(`[${extensionName}] Error switching to profile:`, error);
        return false;
    }
}

/**
 * Switch to a specific preset using the preset manager
 * @param {string} presetValue - The preset value (ID or name)
 * @param {string} apiType - The API type for the current profile
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function switchToPreset(presetValue, apiType) {
    try {
        if (!presetValue || !apiType) {
            debugLog(`[${extensionName}] No preset value or API type provided for preset switch`);
            return false;
        }

        const context = SillyTavern.getContext();
        if (!context || !context.CONNECT_API_MAP) {
            debugWarn(`[${extensionName}] Context or CONNECT_API_MAP not available`);
            return false;
        }

        const apiInfo = context.CONNECT_API_MAP[apiType];
        if (!apiInfo) {
            debugWarn(`[${extensionName}] No API info found for type: ${apiType}`);
            return false;
        }

        // Extract the apiID from the API info
        let apiID;
        if (typeof apiInfo === 'string') {
            apiID = apiInfo;
        } else if (apiInfo && typeof apiInfo === 'object' && apiInfo.selected) {
            apiID = apiInfo.selected;
        } else if (apiInfo && typeof apiInfo === 'object' && apiInfo.apiID) {
            apiID = apiInfo.apiID;
        } else {
            debugWarn(`[${extensionName}] Could not extract apiID from API info:`, apiInfo);
            return false;
        }

        const presetManager = context.getPresetManager(apiID);
        if (!presetManager || typeof presetManager.selectPreset !== 'function') {
            debugWarn(`[${extensionName}] Preset manager not available for API ID: ${apiID}`);
            return false;
        }

        // Try to select the preset
        const result = presetManager.selectPreset(presetValue);
        debugLog(`[${extensionName}] Switched to preset: ${presetValue} for API type: ${apiType} (${apiID})`);
        return result !== false;
    } catch (error) {
        debugWarn(`[${extensionName}] Error switching to preset:`, error);
        return false;
    }
}

/**
 * Temporarily switch to a profile, execute an operation, then restore the original profile
 * @param {string} targetProfile - Profile to temporarily switch to
 * @param {Function} operation - Async function to execute while on the target profile
 * @returns {Promise<any>} Result of the operation
 */
export async function withProfile(targetProfile, operation) {
    const originalProfile = await getCurrentProfile();
    
    try {
        // Switch to target profile
        const switchSuccess = await switchToProfile(targetProfile);
        if (!switchSuccess) {
            throw new Error(`Failed to switch to profile: ${targetProfile}`);
        }

        // Wait for profile to settle
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Execute the operation
        const result = await operation();

        return result;
    } finally {
        // Always restore the original profile
        if (originalProfile && originalProfile !== targetProfile) {
            await switchToProfile(originalProfile);
        }
    }
}

/**
 * Get the API type of a specific profile
 * @param {string} profileName - Name of the profile
 * @returns {Promise<string>} The API type (e.g., "featherless", "openai") or empty string if not found
 */
export async function getProfileApiType(profileName) {
    try {
        // Wait for connection manager to be available
        const isAvailable = await waitForConnectionManager();
        if (!isAvailable) {
            return '';
        }

        const context = SillyTavern.getContext();
        const { profiles } = context.extensionSettings.connectionManager;
        if (!profiles || !Array.isArray(profiles)) {
            debugWarn(`[${extensionName}] Profiles not available`);
            return '';
        }

        const profile = profiles.find(p => p.name === profileName);
        if (!profile) {
            debugWarn(`[${extensionName}] Profile not found: ${profileName}`);
            return '';
        }

        const apiType = profile.api || '';
        debugLog(`[${extensionName}] Profile ${profileName} API type: ${apiType}`);
        return apiType;
    } catch (error) {
        debugWarn(`[${extensionName}] Error getting profile API type:`, error);
        return '';
    }
}

/**
 * Get presets for a specific API type
 * @param {string} apiType - The API type (e.g., "featherless", "openai")
 * @returns {Promise<Array>} Array of preset objects
 */
export async function getPresetsForApiType(apiType) {
    try {
        const context = SillyTavern.getContext();
        if (!context || !context.CONNECT_API_MAP) {
            debugWarn(`[${extensionName}] Context or CONNECT_API_MAP not available`);
            return [];
        }

        const apiInfo = context.CONNECT_API_MAP[apiType];
        if (!apiInfo) {
            debugWarn(`[${extensionName}] No API info found for type: ${apiType}`);
            return [];
        }

        // Extract the apiID from the API info
        let apiID;
        if (typeof apiInfo === 'string') {
            apiID = apiInfo;
        } else if (apiInfo && typeof apiInfo === 'object' && apiInfo.selected) {
            apiID = apiInfo.selected;
        } else if (apiInfo && typeof apiInfo === 'object' && apiInfo.apiID) {
            apiID = apiInfo.apiID;
        } else {
            debugWarn(`[${extensionName}] Could not extract apiID from API info:`, apiInfo);
            return [];
        }

        const presetManager = context.getPresetManager(apiID);
        if (!presetManager || typeof presetManager.getPresetList !== 'function') {
            debugWarn(`[${extensionName}] Preset manager not available for API ID: ${apiID}`);
            return [];
        }

        const presetList = presetManager.getPresetList();
        debugLog(`[${extensionName}] Presets for ${apiType} (${apiID}):`, presetList);
        return presetList || [];
    } catch (error) {
        debugWarn(`[${extensionName}] Error getting presets for API type:`, error);
        return [];
    }
}

/**
 * Get the CONNECT_API_MAP from SillyTavern context
 * @returns {Object} The CONNECT_API_MAP object
 */
export function getConnectApiMap() {
    try {
        const context = SillyTavern.getContext();
        return context?.CONNECT_API_MAP || {};
    } catch (error) {
        debugWarn(`[${extensionName}] Error getting CONNECT_API_MAP:`, error);
        return {};
    }
}