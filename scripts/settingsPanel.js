// scripts/settingsPanel.js

import { extensionName, loadSettings, updateSettingsUI, addSettingsEventListeners } from '../index.js';
import { renderExtensionTemplateAsync } from '../../../../extensions.js';

/**
 * Loads and renders the settings HTML for the extension.
 */
export async function loadSettingsPanel() {
    const containerId = `extension_settings_${extensionName}`;
    let container = document.getElementById(containerId);

    const parentContainer = document.getElementById('extensions_settings');
    console.log(`[${extensionName}] Checking parent container #extensions_settings:`, parentContainer ? 'Found' : 'NOT Found');

    if (!container) {
        if (parentContainer) {
            console.log(`[${extensionName}] Settings container #${containerId} not initially found. Ensuring it exists...`);
            container = document.createElement('div');
            container.id = containerId;
            parentContainer.appendChild(container);
        } else {
            console.error(`${extensionName}: Could not find main settings area (#extensions_settings) to create container.`);
            return;
        }
    } else {
        console.log(`${extensionName}: Settings container #${containerId} found.`);
        container.innerHTML = '';
    }

    try {
        console.log(`${extensionName}: Rendering settings template using renderExtensionTemplateAsync...`);
        const settingsHtml = await renderExtensionTemplateAsync(`third-party/${extensionName}`, 'settings');
        console.log(`${extensionName}: Settings template rendered successfully.`);
        $(container).html(settingsHtml);

        setTimeout(() => {
            console.log(`${extensionName}: DOM updated, now loading settings and adding listeners...`);
            loadSettings();
            updateSettingsUI();
            addSettingsEventListeners();

            // Setup preset and clear buttons with native event handlers
            const presetButtons = container.querySelectorAll('.gg-preset-button');
            presetButtons.forEach(btn => {
                // Insert clear button
                const clearBtn = document.createElement('button');
                clearBtn.type = 'button';
                clearBtn.className = 'gg-clear-button';
                clearBtn.setAttribute('data-target', btn.getAttribute('data-target'));
                clearBtn.textContent = '✖';
                clearBtn.style.marginLeft = '4px';
                clearBtn.style.color = 'red';
                btn.insertAdjacentElement('afterend', clearBtn);

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

            // Set width on preset text inputs
            container.querySelectorAll('.gg-setting-input[type="text"]').forEach(input => {
                input.style.minWidth = '200px';
            });

            console.log(`[${extensionName}] Settings panel actions complete.`);
        }, 100);
    } catch (error) {
        console.error(`[${extensionName}] Error rendering settings template:`, error);
        if (container) {
            container.innerHTML = '<p>Error: Could not render settings template. Check browser console (F12).</p>';
        }
    }
}
