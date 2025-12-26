const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const SUGGESTIONS_CHANNEL = '1409648848892067962';
const APPROVE_EMOJI = '👍';
const REJECT_EMOJI = '👎';
const EMBED_COLOR = '#3498db';
const LOG_FILE = path.join(__dirname, 'suggestions.json');

function logSuggestion(user, content, messageId) {
    const logData = {
        id: Date.now().toString(),
        author: {
            id: user.id,
            username: user.username,
            tag: user.tag
        },
        content: content,
        messageId: messageId,
        date: new Date().toLocaleString('ar-SA'),
        status: 'pending'
    };

    let allSuggestions = [];
    if (fs.existsSync(LOG_FILE)) {
        allSuggestions = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    }
    allSuggestions.push(logData);
    fs.writeFileSync(LOG_FILE, JSON.stringify(allSuggestions, null, 4));
}

module.exports = {
    async handleSuggestion(message) {
        if (message.channel.id !== SUGGESTIONS_CHANNEL || message.author.bot) return;

        try {
            const suggestionEmbed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle('اقتراح جديد')
                .setDescription(message.content)
                .setFooter({ 
                    text: `صاحب الاقتراح: ${message.author.username}`,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();

            const sentMessage = await message.channel.send({ embeds: [suggestionEmbed] });
            
            logSuggestion(message.author, message.content, sentMessage.id);

            await sentMessage.react(APPROVE_EMOJI);
            await sentMessage.react(REJECT_EMOJI);

            await message.delete().catch(() => {});

        } catch (error) {
            console.error('حدث خطأ في معالجة الاقتراح:', error);
        }
    }
};