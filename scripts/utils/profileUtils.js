import { getContext } from '../../../../../extensions.js';
import { extensionName, debugLog } from '../../index.js';

/**
 * Gets the current active profile name
 * @returns {Promise<string>} The current profile name
 */
export async function getCurrentProfile() {
    try {
        const context = getContext();
        if (!context || typeof context.executeSlashCommandsWithOptions !== 'function') {
            debugLog(`[${extensionName}] executeSlashCommandsWithOptions not available for profile operations`);
            return '';
        }

        debugLog(`[${extensionName}] Executing /profile command...`);
        
        // Execute /profile command to get current profile
        const result = await context.executeSlashCommandsWithOptions('/profile', { 
            showOutput: false,
            displayCommand: false 
        });
        
        debugLog(`[${extensionName}] /profile result:`, result);
        debugLog(`[${extensionName}] Result type:`, typeof result);
        
        // Debug: Log all properties of the result object
        if (result && typeof result === 'object') {
            debugLog(`[${extensionName}] Result object properties:`, Object.keys(result));
            debugLog(`[${extensionName}] Result object values:`, Object.fromEntries(
                Object.entries(result).map(([key, value]) => [key, typeof value === 'string' ? value : typeof value])
            ));
        }
        
        // The result should contain the current profile name
        // We need to extract it from the output
        if (result && typeof result === 'string') {
            // Clean up the result to get just the profile name
            const profileName = result.trim();
            debugLog(`[${extensionName}] Current profile: ${profileName}`);
            return profileName;
        } else if (result && typeof result === 'object' && result.pipe) {
            // Handle SlashCommandClosureResult format where profile name is in the pipe property
            debugLog(`[${extensionName}] Found SlashCommandClosureResult with pipe property:`, result.pipe);
            const profileName = result.pipe.trim();
            debugLog(`[${extensionName}] Current profile from pipe: ${profileName}`);
            return profileName;
        }
        
        debugLog(`[${extensionName}] Could not determine current profile from result:`, result);
        
        // Fallback: try to get current profile from context if available
        if (context.currentProfile || context.getCurrentProfile) {
            debugLog(`[${extensionName}] Trying fallback current profile sources...`);
            const fallbackProfile = context.currentProfile || context.getCurrentProfile?.() || '';
            if (fallbackProfile) {
                debugLog(`[${extensionName}] Using fallback current profile:`, fallbackProfile);
                return fallbackProfile;
            }
        }
        
        return '';
    } catch (error) {
        console.error(`[${extensionName}] Error getting current profile:`, error);
        return '';
    }
}

/**
 * Gets a list of all available profiles
 * @returns {Promise<string[]>} Array of profile names
 */
export async function getProfileList() {
    try {
        const context = getContext();
        if (!context || typeof context.executeSlashCommandsWithOptions !== 'function') {
            debugLog(`[${extensionName}] executeSlashCommandsWithOptions not available for profile operations`);
            return [];
        }

        debugLog(`[${extensionName}] Executing /profile-list command...`);
        
        // Execute /profile-list command to get all profiles
        const result = await context.executeSlashCommandsWithOptions('/profile-list', { 
            showOutput: false,
            displayCommand: false 
        });
        
        debugLog(`[${extensionName}] /profile-list result:`, result);
        debugLog(`[${extensionName}] Result type:`, typeof result);
        
        // Debug: Log all properties of the result object
        if (result && typeof result === 'object') {
            debugLog(`[${extensionName}] Result object properties:`, Object.keys(result));
            debugLog(`[${extensionName}] Result object values:`, Object.fromEntries(
                Object.entries(result).map(([key, value]) => [key, typeof value === 'string' ? value : typeof value])
            ));
        }
        
        // The result should be a JSON array of profile names
        if (result && typeof result === 'string') {
            try {
                const profileList = JSON.parse(result);
                debugLog(`[${extensionName}] Parsed profile list:`, profileList);
                
                if (Array.isArray(profileList)) {
                    debugLog(`[${extensionName}] Found ${profileList.length} profiles:`, profileList);
                    return profileList;
                } else {
                    debugLog(`[${extensionName}] Parsed result is not an array:`, profileList);
                }
            } catch (parseError) {
                debugLog(`[${extensionName}] Error parsing profile list JSON:`, parseError);
                debugLog(`[${extensionName}] Raw result that failed to parse:`, result);
            }
        } else if (result && typeof result === 'object' && result.pipe) {
            // Handle SlashCommandClosureResult format where profiles are in the pipe property
            debugLog(`[${extensionName}] Found SlashCommandClosureResult with pipe property:`, result.pipe);
            try {
                const profileList = JSON.parse(result.pipe);
                debugLog(`[${extensionName}] Parsed profile list from pipe:`, profileList);
                
                if (Array.isArray(profileList)) {
                    debugLog(`[${extensionName}] Found ${profileList.length} profiles:`, profileList);
                    return profileList;
                } else {
                    debugLog(`[${extensionName}] Parsed pipe result is not an array:`, profileList);
                }
            } catch (parseError) {
                debugLog(`[${extensionName}] Error parsing profile list from pipe:`, parseError);
                debugLog(`[${extensionName}] Raw pipe content that failed to parse:`, result.pipe);
                
                // Try to extract profiles from the pipe content if it's not valid JSON
                if (typeof result.pipe === 'string' && result.pipe.includes('[') && result.pipe.includes(']')) {
                    debugLog(`[${extensionName}] Attempting to extract profiles from malformed JSON in pipe`);
                    try {
                        // Try to find JSON array in the pipe content
                        const match = result.pipe.match(/\[.*\]/);
                        if (match) {
                            const extractedJson = match[0];
                            const profileList = JSON.parse(extractedJson);
                            if (Array.isArray(profileList)) {
                                debugLog(`[${extensionName}] Successfully extracted profiles from malformed JSON:`, profileList);
                                return profileList;
                            }
                        }
                    } catch (extractError) {
                        debugLog(`[${extensionName}] Failed to extract profiles from malformed JSON:`, extractError);
                    }
                }
            }
        } else {
            debugLog(`[${extensionName}] Result is not a string or object with pipe property:`, result);
        }
        
        debugLog(`[${extensionName}] Could not get profile list from result:`, result);
        
        // Fallback: try to get profiles from context if available
        if (context.profiles || context.getProfiles) {
            debugLog(`[${extensionName}] Trying fallback profile sources...`);
            const fallbackProfiles = context.profiles || context.getProfiles?.() || [];
            if (Array.isArray(fallbackProfiles) && fallbackProfiles.length > 0) {
                debugLog(`[${extensionName}] Using fallback profiles:`, fallbackProfiles);
                return fallbackProfiles;
            }
        }
        
        return [];
    } catch (error) {
        console.error(`[${extensionName}] Error getting profile list:`, error);
        return [];
    }
}

/**
 * Switches to a specific profile
 * @param {string} profileName - The name of the profile to switch to
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function switchToProfile(profileName) {
    try {
        if (!profileName || profileName.trim() === '') {
            debugLog(`[${extensionName}] No profile name provided for switch`);
            return false;
        }

        debugLog(`[${extensionName}] Attempting to switch to profile: "${profileName}"`);
        debugLog(`[${extensionName}] Profile name type: ${typeof profileName}, length: ${profileName.length}`);

        const context = getContext();
        if (!context || typeof context.executeSlashCommandsWithOptions !== 'function') {
            debugLog(`[${extensionName}] executeSlashCommandsWithOptions not available for profile operations`);
            return false;
        }

        // Execute /profile command with profile name to switch
        const command = `/profile ${profileName}`;
        debugLog(`[${extensionName}] Executing command: "${command}"`);
        
        await context.executeSlashCommandsWithOptions(command, { 
            showOutput: false,
            displayCommand: false 
        });
        
        debugLog(`[${extensionName}] Switched to profile: ${profileName}`);
        return true;
    } catch (error) {
        console.error(`[${extensionName}] Error switching to profile ${profileName}:`, error);
        return false;
    }
}

/**
 * Switches to a profile, executes a function, then restores the original profile
 * @param {string} targetProfile - The profile to temporarily switch to
 * @param {Function} operation - The function to execute while on the target profile
 * @returns {Promise<any>} The result of the operation
 */
export async function withProfile(targetProfile, operation) {
    if (!targetProfile || targetProfile.trim() === '') {
        debugLog(`[${extensionName}] No target profile provided, executing operation without profile switch`);
        return await operation();
    }

    try {
        // Get current profile before switching
        const originalProfile = await getCurrentProfile();
        debugLog(`[${extensionName}] Original profile: ${originalProfile}, switching to: ${targetProfile}`);

        // Switch to target profile
        const switchSuccess = await switchToProfile(targetProfile);
        if (!switchSuccess) {
            debugLog(`[${extensionName}] Failed to switch to profile ${targetProfile}, executing operation on current profile`);
            return await operation();
        }

        // Execute the operation
        const result = await operation();

        // Restore original profile if it was different
        if (originalProfile && originalProfile !== targetProfile) {
            debugLog(`[${extensionName}] Restoring original profile: ${originalProfile}`);
            await switchToProfile(originalProfile);
        }

        return result;
    } catch (error) {
        console.error(`[${extensionName}] Error in withProfile operation:`, error);
        
        // Try to restore original profile even if operation failed
        try {
            const originalProfile = await getCurrentProfile();
            if (originalProfile && originalProfile !== targetProfile) {
                debugLog(`[${extensionName}] Attempting to restore original profile after error: ${originalProfile}`);
                await switchToProfile(originalProfile);
            }
        } catch (restoreError) {
            console.error(`[${extensionName}] Failed to restore original profile after error:`, restoreError);
        }
        
        throw error;
    }
}

/**
 * Gets the API type for a specific profile without switching to it
 * @param {string} profileName - The name of the profile to check
 * @returns {Promise<string|null>} The API type (e.g., "openai", "textgenerationwebui") or null if not found
 */
export async function getProfileApiType(profileName) {
    try {
        if (!profileName || profileName.trim() === '') {
            debugLog(`[${extensionName}] No profile name provided for API type check`);
            return null;
        }

        debugLog(`[${extensionName}] Getting API type for profile: "${profileName}"`);
        
        const context = getContext();
        if (!context || typeof context.executeSlashCommandsWithOptions !== 'function') {
            debugLog(`[${extensionName}] executeSlashCommandsWithOptions not available for profile API type check`);
            return null;
        }

        // Execute /profile-get command to get profile details
        const command = `/profile-get ${profileName}`;
        debugLog(`[${extensionName}] Executing command: "${command}"`);
        
        const result = await context.executeSlashCommandsWithOptions(command, { 
            showOutput: false,
            displayCommand: false 
        });
        
        debugLog(`[${extensionName}] /profile-get result:`, result);
        
        // Parse the result to extract the API type
        let profileData = null;
        if (result && typeof result === 'string') {
            try {
                profileData = JSON.parse(result);
            } catch (parseError) {
                debugLog(`[${extensionName}] Error parsing profile-get result:`, parseError);
            }
        } else if (result && typeof result === 'object' && result.pipe) {
            try {
                profileData = JSON.parse(result.pipe);
            } catch (parseError) {
                debugLog(`[${extensionName}] Error parsing profile-get pipe result:`, parseError);
            }
        }
        
        if (profileData && profileData.api) {
            debugLog(`[${extensionName}] Profile "${profileName}" uses API type: "${profileData.api}"`);
            return profileData.api;
        } else {
            debugLog(`[${extensionName}] Could not determine API type for profile "${profileName}"`);
            return null;
        }
    } catch (error) {
        console.error(`[${extensionName}] Error getting API type for profile ${profileName}:`, error);
        return null;
    }
}

/**
 * Gets presets for a specific API type without switching profiles
 * @param {string} apiType - The API type (e.g., "featherless", "custom", "openai")
 * @returns {Promise<Object|null>} The preset list object or null if not available
 */
export async function getPresetsForApiType(apiType) {
    try {
        if (!apiType || apiType.trim() === '') {
            debugLog(`[${extensionName}] No API type provided for preset retrieval`);
            return null;
        }

        debugLog(`[${extensionName}] Getting presets for API type: "${apiType}"`);
        
        const context = getContext();
        if (!context || typeof context.getPresetManager !== 'function') {
            debugLog(`[${extensionName}] getPresetManager not available`);
            return null;
        }

        // Get the CONNECT_API_MAP to find the correct apiID for this API type
        const connectApiMap = context.CONNECT_API_MAP;
        if (!connectApiMap) {
            debugLog(`[${extensionName}] CONNECT_API_MAP not available`);
            return null;
        }

        // Find the API type in the map and get its selected apiID
        const apiInfo = connectApiMap[apiType];
        if (!apiInfo || !apiInfo.selected) {
            debugLog(`[${extensionName}] No API info found for type "${apiType}" in CONNECT_API_MAP`);
            return null;
        }

        const apiID = apiInfo.selected;
        debugLog(`[${extensionName}] API type "${apiType}" maps to apiID "${apiID}"`);

        // Get the preset manager for the specific apiID
        const presetManager = context.getPresetManager(apiID);
        if (!presetManager) {
            debugLog(`[${extensionName}] No preset manager found for apiID: "${apiID}"`);
            return null;
        }

        // Get the preset list
        const presetList = presetManager.getPresetList();
        debugLog(`[${extensionName}] Retrieved ${presetList?.preset_names?.length || 0} presets for apiID "${apiID}" (API type: "${apiType}")`);
        
        return presetList;
    } catch (error) {
        console.error(`[${extensionName}] Error getting presets for API type ${apiType}:`, error);
        return null;
    }
}

/**
 * Gets the API type mapping from SillyTavern's CONNECT_API_MAP
 * @returns {Object|null} The CONNECT_API_MAP object or null if not available
 */
export function getConnectApiMap() {
    try {
        const context = getContext();
        if (context && context.CONNECT_API_MAP) {
            debugLog(`[${extensionName}] Retrieved CONNECT_API_MAP:`, context.CONNECT_API_MAP);
            return context.CONNECT_API_MAP;
        } else {
            debugLog(`[${extensionName}] CONNECT_API_MAP not available in context`);
            return null;
        }
    } catch (error) {
        console.error(`[${extensionName}] Error getting CONNECT_API_MAP:`, error);
        return null;
    }
}
