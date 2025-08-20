/**
 * @file Central import/export hub for all GuidedGenerations extension modules.
 * This file serves as a single point of entry for all imports, eliminating path depth issues.
 */

// External dependencies (SillyTavern)
import { getContext, extension_settings, renderExtensionTemplateAsync } from '../../../../../extensions.js';
import { chat, eventSource, event_types, saveChatConditional, addOneMessage } from '../../../../../../script.js';

// Core extension constants and functions (defined locally to avoid circular dependency)
const extensionName = "GuidedGenerations-Extension";

// Conditional logging utility that only logs when debug mode is enabled
function debugLog(...args) {
    if (extension_settings[extensionName]?.debugMode) {
        console.log(`[${extensionName}][DEBUG]`, ...args);
    }
}

// Conditional warning utility that only logs when debug mode is enabled
function debugWarn(...args) {
    if (extension_settings[extensionName]?.debugMode) {
        console.warn(`[${extensionName}][DEBUG]`, ...args);
    }
}

// Shared state functions for impersonate input management
let previousImpersonateInput = '';
let lastImpersonateResult = '';

function setPreviousImpersonateInput(input) {
    previousImpersonateInput = input;
}

function getPreviousImpersonateInput() {
    return previousImpersonateInput;
}

function setLastImpersonateResult(result) {
    lastImpersonateResult = result;
}

function getLastImpersonateResult() {
    return lastImpersonateResult;
}

// Group chat detection function
function isGroupChat() {
    const context = getContext();
    return context && context.groupId && context.groups;
}

// Settings management functions - imported from index.js
import { loadSettings, updateSettingsUI, addSettingsEventListeners, debugProfileSystem } from '../../index.js';

// Default settings object
const defaultSettings = {
    autoTriggerClothes: false,
    autoTriggerState: false,
    autoTriggerThinking: false,
    enableAutoCustomAutoGuide: false,
    showImpersonate1stPerson: true,
    showImpersonate2ndPerson: false,
    showImpersonate3rdPerson: false,
    showGuidedContinue: false,
    showGuidedResponse: true,
    showGuidedSwipe: true,
    showSimpleSendButton: false,
    showRecoverInputButton: false,
    showEditIntrosButton: false,
    showCorrectionsButton: false,
    showSpellcheckerButton: false,
    showClearInputButton: false,
    showUndoButton: false,
    showRevertButton: false,
    integrateQrBar: true,
    debugMode: false,
    injectionEndRole: 'system'
};

// Utility functions
import { handleProfileAndPresetSwitching, handlePresetSwitching } from '../utils/presetUtils.js';
import { getProfileApiType, getPresetsForApiType, getCurrentProfile } from '../utils/profileUtils.js';

// Guide functions
import situationalGuide from './situationalGuide.js';
import thinkingGuide from './thinkingGuide.js';
import clothesGuide from './clothesGuide.js';
import stateGuide from './stateGuide.js';
import rulesGuide from './rulesGuide.js';
import customGuide from './customGuide.js';
import customAutoGuide from './customAutoGuide.js';
import editGuides from './editGuides.js';
import showGuides from './showGuides.js';
import flushGuides from './flushGuides.js';
import funGuide from './funGuide.js';
import trackerGuide from './trackerGuide.js';
import { executeTracker, checkAndExecuteTracker } from './trackerLogic.js';
import { runGuideScript } from './runGuide.js';
import { updateCharacter } from './updateCharacter.js';

// Tool functions
import { corrections } from '../tools/corrections.js';
import { spellchecker } from '../tools/spellchecker.js';
import editIntros from '../tools/editIntros.js';
import clearInput from '../tools/clearInput.js';

// Main script functions
import { guidedSwipe, generateNewSwipe } from '../guidedSwipe.js';
import { guidedContinue, initGuidedContinueListeners, undoLastGuidedAddition, revertToOriginalGuidedContinue } from '../guidedContinue.js';
import { guidedResponse } from '../guidedResponse.js';
import { guidedImpersonate } from '../guidedImpersonate.js';
import { guidedImpersonate2nd } from '../guidedImpersonate2nd.js';
import { guidedImpersonate3rd } from '../guidedImpersonate3rd.js';
import { simpleSend } from '../simpleSend.js';
import { recoverInput } from '../inputRecovery.js';
import { loadSettingsPanel } from '../settingsPanel.js';

// Export everything
export {
    // External dependencies
    getContext,
    extension_settings,
    renderExtensionTemplateAsync,
    chat,
    eventSource,
    event_types,
    saveChatConditional,
    addOneMessage,
    
    // Core extension
    extensionName,
    debugLog,
    debugWarn,
    
    // Shared state functions
    setPreviousImpersonateInput,
    getPreviousImpersonateInput,
    setLastImpersonateResult,
    getLastImpersonateResult,
    
    // Utility functions
    isGroupChat,
    loadSettings,
    updateSettingsUI,
    addSettingsEventListeners,
    debugProfileSystem,
    defaultSettings,
    
    // Profile and preset utilities
    handleProfileAndPresetSwitching,
    handlePresetSwitching,
    getProfileApiType,
    getPresetsForApiType,
    getCurrentProfile,
    
    // Guides
    situationalGuide,
    thinkingGuide,
    clothesGuide,
    stateGuide,
    rulesGuide,
    customGuide,
    customAutoGuide,
    editGuides,
    showGuides,
    flushGuides,
    funGuide,
    trackerGuide,
    executeTracker,
    checkAndExecuteTracker,
    runGuideScript,
    updateCharacter,
    
    // Tools
    corrections,
    spellchecker,
    editIntros,
    clearInput,
    
    // Main script functions
    guidedSwipe,
    generateNewSwipe,
    guidedContinue,
    initGuidedContinueListeners,
    undoLastGuidedAddition,
    revertToOriginalGuidedContinue,
    guidedResponse,
    guidedImpersonate,
    guidedImpersonate2nd,
    guidedImpersonate3rd,
    simpleSend,
    recoverInput,
    loadSettingsPanel
};
