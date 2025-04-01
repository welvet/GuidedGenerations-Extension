// scripts/simpleSend.js

// State variable specific to simpleSend to prevent rapid clicks
let isSending = false; 

const simpleSend = () => {
    if (isSending) {
        console.log(`[GuidedGenerations] simpleSend already in progress, skipping.`);
        return;
    }
    isSending = true;
    console.log(`[GuidedGenerations] simpleSend function entered (isSending = true).`);
    
    // Stscript: Send current input, then clear input and set gg_old_input
    const command = `/setglobalvar key=gg_old_input {{input}} | /send {{input}} | /setinput`; 
    
    console.log("GG Simple Send Executing:", command);
    try {
        // Use the context executeSlashCommandsWithOptions method
        if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
            const context = SillyTavern.getContext();
            // Send the combined script via context
            context.executeSlashCommandsWithOptions(command);
            console.log('GG Simple Send stscript executed.');
        } else {
            console.error('[GuidedGenerations] SillyTavern.getContext function not found.');
        } 
    } catch (error) {
        console.error("GG Simple Send Error:", error);
    }

    // Reset the flag after a short delay 
    setTimeout(() => { isSending = false; }, 100); 
    console.log(`[GuidedGenerations] simpleSend function finished (isSending = false after delay).`);
};

// Export the function
export { simpleSend };
