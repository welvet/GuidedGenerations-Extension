// scripts/settingsPanel.js

import { extensionName, loadSettings, updateSettingsUI, addSettingsEventListeners, defaultSettings, debugLog, debugWarn, renderExtensionTemplateAsync, debugProfileSystem } from './persistentGuides/guideExports.js'; // Import from central hub

/**
 * Loads and renders the settings HTML for the extension.
 */
export async function loadSettingsPanel() {
    const containerId = `extension_settings_${extensionName}`;
    let container = document.getElementById(containerId);

    const parentContainer = document.getElementById('extensions_settings');
    debugLog(`[${extensionName}] Checking parent container #extensions_settings:`, parentContainer ? 'Found' : 'NOT Found');

    if (!container) {
        if (parentContainer) {
            debugLog(`[${extensionName}] Settings container #${containerId} not initially found. Ensuring it exists...`);
            container = document.createElement('div');
            container.id = containerId;
            parentContainer.appendChild(container);
        } else {
            console.error(`${extensionName}: Could not find main settings area (#extensions_settings) to create container.`);
            return;
        }
    } else {
        container.innerHTML = '';
    }

    try {
        const settingsHtml = await renderExtensionTemplateAsync(`third-party/${extensionName}`, 'settings');
        $(container).html(settingsHtml);

            // Remove any manual clear buttons to avoid duplicates
            container.querySelectorAll('.gg-clear-button').forEach(btn => btn.remove());

            setTimeout(async () => {
                loadSettings();
                updateSettingsUI();
                addSettingsEventListeners();

                // Initialize event listeners for profile and preset switching
                try {
                    const { initializeEventListeners } = await import('./persistentGuides/guideExports.js');
                    initializeEventListeners();
                    debugLog(`[${extensionName}] Event listeners initialized for profile/preset switching in settings panel`);
                } catch (error) {
                    debugWarn(`[${extensionName}] Could not initialize event listeners in settings panel:`, error);
                }

                // Setup preset and clear buttons with native event handlers
                const presetButtons = container.querySelectorAll('.gg-preset-button');
                presetButtons.forEach(btn => {
                    // Use existing clear button if present, else create one
                    let clearBtn = btn.nextElementSibling;
                    if (!clearBtn || !clearBtn.classList.contains('gg-clear-button')) {
                        clearBtn = document.createElement('button');
                        clearBtn.type = 'button';
                        clearBtn.className = 'gg-clear-button';
                        clearBtn.setAttribute('data-target', btn.getAttribute('data-target'));
                        clearBtn.textContent = '✖';
                        clearBtn.style.marginLeft = '4px';
                        clearBtn.style.color = 'red';
                        btn.insertAdjacentElement('afterend', clearBtn);
                    } else {
                        clearBtn.setAttribute('data-target', btn.getAttribute('data-target'));
                    }

                    // Preset fill click
                    btn.addEventListener('click', () => {
                        const key = btn.getAttribute('data-target');
                        const input = document.getElementById(`gg_${key}`);
                        if (input) {
                            input.value = 'GGSytemPrompt';
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    });

                    // Clear click
                    clearBtn.addEventListener('click', () => {
                        const key = clearBtn.getAttribute('data-target');
                        const input = document.getElementById(`gg_${key}`);
                        if (input) {
                            input.value = '';
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    });
                });

                // Setup default buttons with native event handlers
                const defaultButtons = container.querySelectorAll('.gg-default-button');
                defaultButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const key = btn.getAttribute('data-target'); // e.g., 'promptGuidedSwipe'
                        const input = document.getElementById(`gg_${key}`); // e.g., '#gg_promptGuidedSwipe'
                        if (input && defaultSettings.hasOwnProperty(key)) {
                            input.value = defaultSettings[key];
                            // Trigger change event to ensure SillyTavern recognizes the update
                            input.dispatchEvent(new Event('change', { bubbles: true })); 
                        } else {
                            debugWarn(`[${extensionName}] Could not find input for gg_${key} or default setting for ${key}`);
                        }
                    });
                });

                // Setup debug profile system button
                const debugButton = container.querySelector('#debugProfileSystem');
                if (debugButton) {
                    debugButton.addEventListener('click', async () => {
                        try {
                            const { debugProfileSystem } = await import('./persistentGuides/guideExports.js');
                            await debugProfileSystem();
                        } catch (error) {
                            console.error(`[${extensionName}] Error importing debugProfileSystem:`, error);
                        }
                    });
                }

                // Setup refresh profile dropdowns button
                const refreshButton = container.querySelector('#refreshProfileDropdowns');
                if (refreshButton) {
                    refreshButton.addEventListener('click', async () => {
                        try {
                            await updateSettingsUI();
                        } catch (error) {
                            console.error(`[${extensionName}] Error refreshing profile dropdowns:`, error);
                        }
                    });
                }

                // Setup debug logging buttons
                const copyDebugLogsButton = container.querySelector('#gg_copyDebugLogs');
                if (copyDebugLogsButton) {
                    copyDebugLogsButton.addEventListener('click', async () => {
                        try {
                            const { getDebugMessagesAsText } = await import('./persistentGuides/guideExports.js');
                            const debugText = getDebugMessagesAsText();
                            
                            if (debugText.trim() === '') {
                                alert('No debug messages available. Enable debug logging and perform some actions to generate debug messages.');
                                return;
                            }
                            
                            // Try modern clipboard API first
                            if (navigator.clipboard && window.isSecureContext) {
                                await navigator.clipboard.writeText(debugText);
                                alert('Debug logs copied to clipboard!');
                            } else {
                                // Fallback for older browsers or non-secure contexts
                                const textArea = document.createElement('textarea');
                                textArea.value = debugText;
                                textArea.style.position = 'fixed';
                                textArea.style.left = '-999999px';
                                textArea.style.top = '-999999px';
                                document.body.appendChild(textArea);
                                textArea.focus();
                                textArea.select();
                                
                                try {
                                    const successful = document.execCommand('copy');
                                    if (successful) {
                                        alert('Debug logs copied to clipboard!');
                                    } else {
                                        throw new Error('Copy command failed');
                                    }
                                } catch (err) {
                                    throw new Error('Copy command failed: ' + err.message);
                                } finally {
                                    document.body.removeChild(textArea);
                                }
                            }
                        } catch (error) {
                            console.error(`[${extensionName}] Error copying debug logs:`, error);
                            alert('Failed to copy debug logs. Check console for details. Error: ' + error.message);
                        }
                    });
                }

                const downloadDebugLogsButton = container.querySelector('#gg_downloadDebugLogs');
                if (downloadDebugLogsButton) {
                    downloadDebugLogsButton.addEventListener('click', async () => {
                        try {
                            const { getDebugMessagesAsText } = await import('./persistentGuides/guideExports.js');
                            const debugText = getDebugMessagesAsText();
                            
                            if (debugText.trim() === '') {
                                alert('No debug messages available. Enable debug logging and perform some actions to generate debug messages.');
                                return;
                            }
                            
                            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                            const filename = `guided-generations-debug-${timestamp}.txt`;
                            
                            const blob = new Blob([debugText], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            
                            alert(`Debug logs downloaded as ${filename}`);
                        } catch (error) {
                            console.error(`[${extensionName}] Error downloading debug logs:`, error);
                            alert('Failed to download debug logs. Check console for details.');
                        }
                    });
                }

                const clearDebugLogsButton = container.querySelector('#gg_clearDebugLogs');
                if (clearDebugLogsButton) {
                    clearDebugLogsButton.addEventListener('click', async () => {
                        try {
                            const { clearDebugMessages } = await import('./persistentGuides/guideExports.js');
                            clearDebugMessages();
                            alert('Debug logs cleared!');
                        } catch (error) {
                            console.error(`[${extensionName}] Error clearing debug logs:`, error);
                            alert('Failed to clear debug logs. Check console for details.');
                        }
                    });
                }

                // Static Raw checkboxes are defined in settings.html; dynamic insertion removed

                // Set width on preset text inputs
                container.querySelectorAll('.gg-setting-input[type="text"]').forEach(input => {
                    input.style.minWidth = '200px';
                });

            }, 100);
    } catch (error) {
        console.error(`[${extensionName}] Error rendering settings template:`, error);
        if (container) {
            container.innerHTML = '<p>Error: Could not render settings template. Check browser console (F12).</p>';
        }
    }
}
