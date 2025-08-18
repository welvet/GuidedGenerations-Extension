/**
 * @file Contains the core tracker logic for automatically running trackers when enabled.
 * @description Handles the automatic execution of trackers based on chat metadata configuration.
 */

import { getContext } from '../../../../../extensions.js';
import { extensionName } from '../../index.js';

/**
 * Executes the tracker logic automatically when triggered
 * @param {boolean} isAuto - Whether this is being auto-triggered
 * @returns {Promise<void>}
 */
export async function executeTracker(isAuto = false) {
    try {
        const context = getContext();
        if (!context) {
            console.error('[GuidedGenerations] Context not available for tracker execution');
            return;
        }

        // Get tracker configuration from chat metadata
        const trackerConfig = context.chatMetadata?.[`${extensionName}_trackers`];
        if (!trackerConfig || !trackerConfig.enabled) {
            console.log('[GuidedGenerations] Tracker not enabled or not configured');
            return;
        }

        console.log('[GuidedGenerations] Executing tracker with config:', trackerConfig);

        // Check if the last message is a comment - if so, skip tracker execution
        const lastMessage = context.chat[context.chat.length - 1];
        if (lastMessage?.extra?.type === 'comment') {
            console.log('[GuidedGenerations] Last message is a comment, skipping tracker execution (likely deleted/broken generation)');
            return;
        }

        // Step 1: Generate guide content using the first prompt
        const guideResult = await context.executeSlashCommandsWithOptions(
            `/gen ${trackerConfig.guidePrompt}`,
            { showOutput: false, handleExecutionErrors: true }
        );

        if (!guideResult || !guideResult.pipe) {
            console.error('[GuidedGenerations] Failed to generate guide content');
            return;
        }

        const guideContent = guideResult.pipe;
        console.log('[GuidedGenerations] Generated guide content:', guideContent);

        // Half second delay between the two tracker calls
        console.log('[GuidedGenerations] Waiting 500ms before second tracker call...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 2: Get current tracker content to include in context
        let currentTrackerContent = '';
        try {
            const listResult = await context.executeSlashCommandsWithOptions(
                '/listinjects return=object',
                { showOutput: false, handleExecutionErrors: true }
            );
            
            if (listResult && listResult.pipe) {
                const injections = JSON.parse(listResult.pipe);
                if (injections.tracker && injections.tracker.value) {
                    currentTrackerContent = injections.tracker.value;
                }
            }
        } catch (error) {
            console.log('[GuidedGenerations] Could not retrieve current tracker content, proceeding with empty context');
        }

        // Step 2: Generate tracker update using /genraw with the guide content and current tracker as context
        const trackerPrompt = `${trackerConfig.trackerPrompt}\n\nLast Update:\n${guideContent}\n\nTracker:\n${currentTrackerContent}`;
        
        const trackerResult = await context.executeSlashCommandsWithOptions(
            `/genraw ${trackerPrompt}`,
            { showOutput: false, handleExecutionErrors: true }
        );

        if (!trackerResult || !trackerResult.pipe) {
            console.error('[GuidedGenerations] Failed to generate tracker update');
            console.error('[GuidedGenerations] trackerResult:', trackerResult);
            return;
        }

        const trackerUpdate = trackerResult.pipe;
        console.log('[GuidedGenerations] Generated tracker update:', trackerUpdate);
        console.log('[GuidedGenerations] Tracker update length:', trackerUpdate?.length || 0);
        console.log('[GuidedGenerations] Tracker update type:', typeof trackerUpdate);

        // Half second delay after the second tracker call
        console.log('[GuidedGenerations] Waiting 500ms after second tracker call...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 3: Update the tracker injection
        if (trackerUpdate && trackerUpdate.trim()) {
            const injectionCommand = `/inject id=tracker position=chat scan=true depth=1 role=system [Tracker Information ${trackerUpdate}]`;
            await context.executeSlashCommandsWithOptions(injectionCommand, { 
                showOutput: false, 
                handleExecutionErrors: true 
            });
            console.log('[GuidedGenerations] Tracker injection updated with content length:', trackerUpdate.length);
        } else {
            console.error('[GuidedGenerations] Tracker update is empty or undefined, skipping injection update');
        }

        // Step 4: Add a comment with the tracker update
        const commentCommand = `/comment ${trackerUpdate}`;
        await context.executeSlashCommandsWithOptions(commentCommand, { 
            showOutput: false, 
            handleExecutionErrors: true 
        });

        console.log('[GuidedGenerations] Tracker execution completed successfully');

    } catch (error) {
        console.error('[GuidedGenerations] Error executing tracker:', error);
    }
}

/**
 * Checks if tracker should be auto-triggered and executes it if needed
 * @returns {Promise<void>}
 */
export async function checkAndExecuteTracker() {
    try {
        const context = getContext();
        if (!context) {
            return;
        }

        // Check if tracker is enabled in chat metadata
        const trackerConfig = context.chatMetadata?.[`${extensionName}_trackers`];
        if (trackerConfig && trackerConfig.enabled) {
            console.log('[GuidedGenerations] Auto-triggering tracker');
            await executeTracker(true);
        }
    } catch (error) {
        console.error('[GuidedGenerations] Error checking tracker auto-trigger:', error);
    }
}
