/**
 * @file Contains the logic for the Thinking option in the Persistent Guides menu.
 */
import { isGroupChat, extensionName } from '../../index.js'; // Import from two levels up
import { getContext, extension_settings } from '../../../../../extensions.js';
import { runGuideScript } from './runGuide.js';

/**
 * Executes the Thinking Guide script to create an insight into what characters are thinking.
 * This helps authors understand character motivations and inner thoughts without changing the chat.
 * @param {boolean} isAuto - Whether this guide is being auto-triggered (true) or called directly from menu (false)
 */
const thinkingGuide = async (isAuto = false) => {
    const injectionRole = extension_settings[extensionName]?.injectionEndRole ?? 'system';
    if (await isGroupChat()) {
        // Phase 1: select group member via direct STScript
        const selectionScript = `/split {{group}} |
        /setvar key=x {{pipe}} |
        /buttons labels=x Select members {{group}} |
        /setglobalvar key=selection {{pipe}} |`;
        let selection;
        try {
            const context = getContext();
            const result = await context.executeSlashCommandsWithOptions(selectionScript, { showOutput: false });
            selection = result?.pipe?.trim();
        } catch (err) {
            console.error(`[${extensionName}] Error selecting group member:`, err);
            return null;
        }
        if (!selection) return null;
        // Phase 2: generate and inject thoughts for selected member
        const genCommandSuffix2 = `/gen name=${selection} [Write what ${selection} is currently thinking, pure thought only.] |`;
        const injectLabel2 = `${selection} is currently thinking: {{pipe}}`;
        const finalCommand2 = `/inject id=thinking position=chat depth=0 role=${injectionRole} [${injectLabel2}] |`;
        return await runGuideScript({
            guideId: 'thinking',
            genCommandSuffix: genCommandSuffix2,
            finalCommand: finalCommand2,
            isAuto,
            previousInjectionAction: 'flush'
        });
    } else {
        // Single chat: generate and inject directly
        const genCommandSuffix = `/gen name={{char}} [Write what {{char}} and other characters in the current scene are currently thinking, pure thought only. Do not include the {{user}}'s thoughts.] |`;
        const injectLabel = `{{char}} is currently thinking: {{pipe}}`;
        const finalCommand = `/inject id=thinking position=chat depth=0 role=${injectionRole} [${injectLabel}] |`;
        return await runGuideScript({
            guideId: 'thinking',
            genCommandSuffix,
            finalCommand,
            isAuto,
            previousInjectionAction: 'flush'
        });
    }
};

// Export the function for use in the main extension file
export default thinkingGuide;
