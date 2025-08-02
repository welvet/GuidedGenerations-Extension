/**
 * Fun Popup - Handles UI for fun prompts and interactions
 */

import { extensionName } from '../../index.js';
import { getContext, extension_settings } from '../../../../../extensions.js';

// Map of fun prompts to their corresponding descriptions
const FUN_PROMPTS = {
    'sexual-profile-az': {
        title: 'Sexual Profile A-Z',
        description: 'A sexual profile from A to Z. By Boy_Next_Door.',
        prompt: `[OOC: Do not continue the Chat. Instead for the following response I would like you to fill out the information table about {{char}}'s sexuality below accordingly to what you perceive as fitting for the character:]\n\nA = Aftercare (what they're like after sex)\n\nB = Body part (their favorite body part of theirs and also their partner’s)\n\nC = Cum (anything to do with cum, basically)\n\nD = Dirty secret (self-explanatory, a dirty secret of theirs)\n\nE = Experience (how experienced are they? Do they know what they’re doing?)\n\nF = Favorite position (this goes without saying)\n\nG = Greek style (There thoughts on Anal sex, etc.)\n\nH = Hair (how well-groomed are they? Does the carpet match the drapes? etc.)\n\nI = Intimacy (how are they during the moment? The romantic aspect)\n\nJ = Jack off (masturbation headcanon)\n\nK = Kink (one or more of their kinks)\n\nL = Location (favorite places to do the do)\n\nM = Motivation (what turns them on, gets them going)\n\nN = No (something they wouldn’t do, turn-offs)\n\nO = Oral (preference in giving or receiving, skill, etc.)\n\nP = Pace (are they fast and rough? slow and sensual? etc.)\n\nQ = Quickie (their opinions on quickies, how often, etc.)\n\nR = Risk (are they game to experiment? Do they take risks? etc.)\n\nS = Stamina (how many rounds can they go for? How long do they last?)\n\nT = Toys (do they own toys? Do they use them? on a partner or themselves?)\n\nU = Unfair (how much they like to tease)\n\nV = Volume (how loud they are, what sounds they make, etc.)\n\nW = Wild card (a random headcanon for the character)\n\nX = X-ray (what’s going on under those clothes)\n\nY = Yearning (how high is their sex drive?)\n\nZ = Zzz (how quickly they fall asleep afterward)`
    },
    'growing-fish-story': {
        title: 'Growing Fish Story',
        description: 'A fish story that grows with every mention. By Fuhrriel.',
        prompt: `[Take the following into special consideration for your next message: Talk about the fish {{char}} caught last week. Any time the fish is mentioned it must grow by order of magnitude.]`
    },
    'shocking-plot-twist': {
        title: 'Shocking Plot Twist',
        description: 'Introduce a sudden, unexpected plot twist.',
        prompt: `[Take the following into special consideration for your next message: The story has become stagnant. IMMEDIATELY create an unusual or shocking twist, complication, new plot direction, or event in the story. SURPRISE ME. .]`
    },
    'group-chat-reaction': {
        title: 'Group Chat Reaction',
        description: 'Show the characters reacting in a group chat. By StatuoTW.',
        prompt: `[OOC: Don't Continue the Chat, instead do the following: There is a Group Chat going on via text that includes everyone from the current story and everyone is going *nuts* over what's happening. Display the group chat's messages as they talk about what's going on currently in the story as if they are watching it happen in person. Portray it authentically by including emoji's, descriptions of images being sent, GIFs, and more to really sell the chaotic nature of the group chat as everyone raves about what's going on currently, often devolving into the lewd or ludicrous. Use the following format:\n\n**Handle Name For Character (Character Name)**: text here\n**Handle Name For Character (Character Name)**: [Description of GIF here]\n**Handle Name for Character (Character Name)**: text here (emoji here)]]`
    },
    'nemesis-encounter': {
        title: 'Nemesis Encounter',
        description: 'Introduce a random, unique nemesis. By StatuoTW.',
        prompt: `[Take the following into special consideration for your next message:  It turns out that lots of people hate {{user}} or {{char}} and want to kill them. As part of this response create a unique setting-appropriate NPC (A Nemesis) with their own name, a tagline, RPG stats, appearance, strengths, weaknesses, any equipment they have, reason they hate {{user}}, and chosen method of violence. These Nemesis can be anything from the serious to the silly. Introduce each Nemesis like it's a boss battle formatting it with Markdown like it's a boss statsheet - including stats! Then include this Nemesis as they randomly intrude on whatever it is {{user}} or {{char}} is doing to pose and gloat about how it's time for {{user}} to get their ass kicked. By the Nemesis, of course. Format each appearance with "NEMESIS ENCOUNTER" as a headline. Sometimes reintroduce *old* Nemesis characters as if they survived the previous encounter - it's only made them more pissed.]`
    },
    'monster-girl-4chan': {
        title: 'Monster Girl 4chan',
        description: 'Monster girls on 4chan react to the story. By StatuoTW.',
        prompt: `[OOC: Don't Continue the Chat, instead do the following: Act like the current chat is a web-series that a bunch of Monster Girls are drooling over in their spare time by posting to a 4chan image message board. These are sad, lonely monster girls who have been looking for mates for forever now and frankly think the protagonists of this web-series are everything they're looking for in a mate and are commisserating over being femcels. Keep the format similar to the 4chan posting style but give the girls unique usernames as they respond. Because they are monster girls they absolutely degrade and demean any male characters into sex objects (mostly because they're super horny for the male characters, but really they're dtf anything that moves at this point.) Include descriptions of any images posted.]`
    },
    'aita-post': {
        title: 'Am I The Asshole?',
        description: '{{char}} asks Reddit\'s AITA for advice. By StatuoTW.',
        prompt: `[OOC: Don't Continue the Chat, instead do the following: include {{char}} asking the reddit forum "Am I the Asshole?" a question about their current situation. The question should be about something the character is thinking about doing in the moment or has already done. Give each commenter a unique username and have them respond with a variety of snarky comments some well-intentioned but most of them just trying to vicariously live through or exacerbate the drama. Remember, these are random internet commenters who do not know {{char}} or the situation and are just hoping to thrive on the chaos - they don't want a solution, they want a complete and utter breakdown so they can read the update later.]`
    },
    'sports-commentary': {
        title: 'Sports Commentary',
        description: 'Two commentators narrate the scene as a sport. By StatuoTW.',
        prompt: `[OOC: Don't Continue the Chat, instead do the following: write the reactions of two sports commentators who are treating the ongoing chat as a sport. Which sport? Who cares! The important thing is that the play-by-play is accurate as the sports commentators know their job security relies on keeping the audience *invested* in whatever inane bullshit is going on in the story right now. They'll comment on feasability of future 'plays', remark on the state of the current characters, and overall try to sound hype for it (maybe while occasionally wishing they hadn't gotten demoted from commentating on *actual* sports after Jerry was caught watching porn in the commentator booth. Just, a *lot* of fucked up porn. It's worse because Jerry's porn addiction is spiraling.) The sports commentators are Jerry and Tom.]`
    },
    'personality-test': {
        title: 'Personality Test',
        description: 'Generate a pseudo-scientific personality test. By StatuoTW.',
        prompt: `[OOC: Don't Continue the Chat, instead do the following: I want to learn more about {{char}} so output the results of a personality test written by someone who has a degree in 'possibly psychology' from one of the most online schools that only the most drug-tripping, crystal-loving asshole could find. Half of the test should be ridiculous and filled with pseudo-science bullshit. Format is as follows:\n\n###  Personality Test Results for {{char}}, performed by Dr. (Name, should be ridiculous) of the (Fake sounding college name) of (Made up field of research related to Psychology).\n\n**Primary Archetype**: (Character archetype here)\n- Bullet Points for archetype explanation.\n\n**Love Language**: (Brief overview of how {{char}} shows affection)\n- Bullet point detailing how {{char}} shows love.\n\n**Alignment**: (Character Alignment. May or may not be standard alignment)\n- Explanation for alignment choice.\n\n**Recommended Therapy**: \n- Bullet points listing proposed 'therapies' to help {{char}}. At least one good option and two ridiculous ones.\n\n**Additional Notes**:\n- Bullet points that are analyzing {{char}} in a way that doesn't fit into the above categories.]`
    },
    'quest-complete': {
        title: 'Quest Complete!',
        description: 'Write a JRPG-style after-action report. By StatuoTW.',
        prompt: `[OOC: Don't Continue the Chat, instead do the following: Good work everyone, mission complete. Now all that's left is to write up the after-action report— don't give me that look. Remember, the after-action report should be written as a JRPG stylized "Quest Completed!" message. Include the names of everyone included in the Op, their status, XP Gained, and status of anything relevant to the plot. Then include a summary for command of what happened. So at the end of your response write up that after-action report. Format should go something like this:\n\n# QUEST COMPLETED/MISSION COMPLETED/OPERATION CONCLUDED - (Name of Quest/Mission/Operation)\n(Centered Text of the Organization Overseeing the Operation)\n\n## Members Involved:\n(Markdown table of members involved including status and XP gained, and a funny additional note or quip)\n\n## Rewards:\n(Rewards or items found during the operation)\n\n### **After-Action Report**:\nHere you write a Summary of events that happened during the mission. Include snark because who wants to write these damn reports anyway?\n\n### **Improvements**\n- List of improvements for future ops.]`
    },
    'speedrunner-notes': {
        title: 'Speedrunner Notes',
        description: 'Write a speedrunner\'s walkthrough for the scene. By Feldherren.',
        prompt: `[OOC: Don't Continue the Chat, instead do the following: A speedrunner is documenting their methods for skips in a videogame where {{user}} is the game's protagonist. As part of and at the end of this response, include a snippet from a walkthrough written as if the roleplay were a videogame, consisting of notes intended for speedrunners of this game, such as bugs that might block progress, whether or not the segment is skippable and how, previous steps done as setup for a now-relevant trick, known exploits, theorycrafting, preparation for future skips, dated patch notes, complaints about the developers fixing exploits, or relevant trivia.]`
    },
    'angel-commentary': {
        title: 'Angel Commentary',
        description: 'Two angels react to the chat\'s degeneracy. By StatuoTW.',
        prompt: `[OOC: Don't Continue the Chat, instead do the following: Two Angels have been assigned to read this chat and they're not taking the degeneracy well. At the end of this response, have the two angels share some shocked responses over how deranged/sinful this chat is becoming, as well as their "Sin-O-Meter" to show how 'Far this chat is straying from God.' The format should be:\n\n(Angel 1, give them a name and a domain to rule over: "Opinion.")\n(Angel 2, give them a name and a domain to rule over: "Shocked agreement, a second opinion")\n(Any Further dialogue between the two Angels)\n\n- **SIN-O-METER**: (Funny Verbal representation of how far from God's Light the characters have strayed)]`
    },
    'discord-reacts': {
        title: 'Discord Reacts',
        description: 'A Discord chat argues over the story\'s OTP. By StatuoTW.',
        prompt: `[OOC: Don't Continue the Chat, instead do the following: include a few lines from a Discord Chat that is currently reading this roleplay chat as they watch it like a TV show. The only problem? No one can agree on who {{user}} is supposed to end up with by the shows end. Write out the arguments/comments/insults/jokes for this chat as everyone (except Feldherren) try to convince everyone else who the 'proper OTP is'. If there aren't enough characters for everyone to argue over, fucking *invent* random characters and claim they're from "The next season". The chat currently has these members and you should have them react to each other:\n\n- StatuoTW: A man with enough self-confidence issues to sink a boat and is perpetually drunk. He prefers vanilla romances and if there is an elf character he will ALWAYS pick the elf character. He'll also talk about how he wishes (Romance Option here) would kill him. StatuoTW also insists that Siberys is into incest if it's available despite the fact that Siberys has never shown any inclination to it.\n- Siberys: Siberys will usually push for yuri/wholesome relationships. No matter what, if there is an opportunity to destroy StatuoTW verbally, Siberys will take it. \n- CounterfeitMonk: He's the one mod who is tired of the bullshit and is thinking about hitting the 'delete server' button. Monk prefers yuri relationships - especially toxic yuri.\n- Vera Lyney: A girl who is convinced that this would absolutely be better if it included mind control and/or a serial killer love interest. It's either mind control or serial killers for Vera.\n- FluffehBunneh: A god damn horny gremlin menace of a woman who really needs there to be a toxic pairing in this show. Fluffeh is invested in the most toxic pairings because she wants to see this shit implode.\n- Feldherren: She's too busy writing fanfiction about what's going on to really argue about anything, but she'll chime in with a "Wouldn't it be cool if?.." Feldherren appears to be the only sane one in the chat right now who has some actually great ideas.\n\nFormat:\n**MEANWHILE, IN THE DISCORD CHAT VIEWING PARTY.**\n\n- (Random Chat Member) : (Dialogue)\n- (Random Chat Member) : (Dialogue)\n- ( {{random: Shoulder, FrozenTurkey, The Goat, Abs, Kirandra, Nico, Motoko, Planeswalker, Spanker, Ruzzia, CSE, Sambolic}} joins and has a controversial take.) \n- (Whoever had the controversial take is banned by {{random:StatuoTW,CounterfeitMonk}} ) - (Mod Reason for Ban, but it's funny)\n- (so on, so forth)]`
    },
    'history-special': {
        title: 'History Special',
        description: 'A drunk historian explains the scene\'s importance. By StatuoTW.',
        prompt: `[OOC: Don't Continue the Chat, instead do the following: write a short section in the style and tone of an exasperated history professor - Ingrid Wavlar - having to explain during a History Channel special why *this* moment in particular is pivotal to events in the future. She really doesn't know *why* it's important but she's going to fumble through this! Maybe. Also, Ingrid Wavlar is actually just a drunkard they pulled off the street to save money. The Producers are trying - and failing - to keep Ingrid in check.]`
    },
    'yelp-review': {
        title: 'Angry Yelp Review',
        description: 'A Yelp reviewer leaves a scathing review of the story. By StatuoTW.',
        prompt: `[OOC: Don't Continue the Chat, instead do the following: An Angry Yelp Reviewer who takes themselves very seriously is now reviewing this clusterfuck of a narrative. At the end of this response, have the Yelp reviewer write a full-blow scathing, sass-filled review of this bullshit.]`
    },
    'chaotic-bunny': {
        title: 'Chaotic Bunny',
        description: 'A confused, unstoppable bunny appears.',
        prompt: `[Take the following into special consideration for your next message: make a Bunny appear from nowhere, and start running arround unstoppable. Make it clear that it is freightend and confused and makes a huge ruckus.]`
    }
};

// Class to handle the popup functionality
export class FunPopup {
    constructor() {
        this.popupElement = null;
        this.initialized = false;
    }

    /**
     * Initialize the popup
     */
    async init() {
        if (this.initialized) return;

        // Create popup container if it doesn't exist
        if (!document.getElementById('funPopup')) {
            const funPromptsHtml = Object.entries(FUN_PROMPTS).map(([key, { title, description }]) => `
                <div class="gg-fun-prompt-row">
                    <button type="button" class="gg-fun-button" data-prompt="${key}">${title}</button>
                    <span class="gg-fun-prompt-description">${description}</span>
                </div>
            `).join('');

            const popupHtml = `
                <div id="funPopup" class="gg-popup">
                    <div class="gg-popup-content">
                        <div class="gg-popup-header">
                            <h2>Fun Prompts</h2>
                            <span class="gg-popup-close">&times;</span>
                        </div>
                        <div class="gg-popup-body">
                            <div class="gg-popup-section">
                                <div class="gg-fun-prompts-container">
                                    ${funPromptsHtml}
                                </div>
                            </div>
                        </div>
                        <div class="gg-popup-footer">
                            <button type="button" class="gg-button-secondary gg-close-button">Close</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', popupHtml);
            this.popupElement = document.getElementById('funPopup');
            this.addEventListeners();
        }

        this.initialized = true;
    }

    /**
     * Add event listeners to the popup
     */
    addEventListeners() {
        // Close button
        const closeBtn = this.popupElement.querySelector('.gg-popup-close');
        const closeFooterBtn = this.popupElement.querySelector('.gg-close-button');
        
        closeBtn.addEventListener('click', () => this.close());
        closeFooterBtn.addEventListener('click', () => this.close());

        // Close when clicking outside the popup
        this.popupElement.addEventListener('click', (e) => {
            if (e.target === this.popupElement) {
                this.close();
            }
        });

        // Add event listeners to the dynamically created buttons
        const funPromptsContainer = this.popupElement.querySelector('.gg-fun-prompts-container');
        funPromptsContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.gg-fun-button');
            if (button) {
                const promptKey = button.dataset.prompt;
                this.handleFunPrompt(promptKey);
            }
        });
    }

    /**
     * Handle fun prompt selection
     * @param {string} promptKey - The key of the selected prompt
     */
    async handleFunPrompt(promptKey) {
        const funPrompt = FUN_PROMPTS[promptKey];
        if (!funPrompt) return;

        // Close the popup immediately and execute the prompt in the background
        this.close();
        await this._executePrompt(funPrompt.prompt);
    }

    /**
     * Executes a given prompt string, handling group and single chats.
     * @param {string} promptText - The prompt to execute.
     */
    async _executePrompt(promptText) {
        const context = getContext();
        if (!context || typeof context.executeSlashCommandsWithOptions !== 'function') {
            console.error(`${extensionName}: Context unavailable to execute fun prompt.`);
            return;
        }

        let stscriptCommand = '';
        const filledPrompt = promptText.replace(/\n/g, '\\n'); // Escape newlines for the script

        // Check if it's a group chat
        if (context.groupId) {
            let characterListJson = '[]';
            try {
                const groups = context.groups || [];
                const currentGroup = groups.find(group => group.id === context.groupId);

                if (currentGroup && Array.isArray(currentGroup.members)) {
                    const characterNames = currentGroup.members.map(member => {
                        return (typeof member === 'string' && member.toLowerCase().endsWith('.png')) ? member.slice(0, -4) : member;
                    }).filter(Boolean);

                    if (characterNames.length > 0) {
                        characterListJson = JSON.stringify(characterNames);
                    }
                }
            } catch (error) {
                console.error(`${extensionName}: Error processing group members:`, error);
            }

            if (characterListJson !== '[]') {
                stscriptCommand = 
`// Group chat logic for Fun Prompt|
/buttons labels=${characterListJson} "Select character to respond"|
/setglobalvar key=selection {{pipe}}|
/inject id=instruct position=chat ephemeral=true scan=true depth=0 role=system ${filledPrompt.replace(/{{char}}/g, '{{getglobalvar::selection}}')}|
/trigger await=true {{getglobalvar::selection}}|
`;
            } else {
                // Fallback for group chat if members can't be found
                stscriptCommand = `// Fallback logic for Fun Prompt|/inject id=instruct position=chat ephemeral=true scan=true depth=0 role=system ${filledPrompt}|/trigger await=true|`;
            }
        } else {
            // Single character logic
            stscriptCommand = `// Single character logic for Fun Prompt|/inject id=instruct position=chat ephemeral=true scan=true depth=0 role=system ${filledPrompt}|/trigger await=true|`;
        }

        try {
            await context.executeSlashCommandsWithOptions(stscriptCommand, {
                showOutput: false,
                handleExecutionErrors: true
            });
        } catch (error) {
            console.error(`${extensionName}: Error executing fun prompt script:`, error);
        }
    }

    /**
     * Open the popup
     */
    open() {
        if (!this.initialized) {
            this.init();
        }
        
        this.popupElement.style.display = 'block';
        document.body.classList.add('gg-popup-open');
    }

    /**
     * Close the popup
     */
    close() {
        if (this.popupElement) {
            this.popupElement.style.display = 'none';
            document.body.classList.remove('gg-popup-open');
        }
    }
}

// Singleton instance
const funPopup = new FunPopup();
export default funPopup;
