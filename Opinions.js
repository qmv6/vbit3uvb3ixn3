const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const OPINIONS_CHANNEL = '1409651761890725960';
const ROSE_EMOJI = '<:whiteheart:1409907744772849684>';
const EMBED_COLOR = '#3498db';
const LOG_FILE = path.join(__dirname, 'opinions.json');

function logOpinion(user, content, messageId) {
    try {
        const opinionData = {
            id: Date.now().toString(),
            author: {
                id: user.id,
                username: user.username,
                tag: user.tag,
            },
            content: content,
            messageId: messageId,
            timestamp: new Date().toISOString(),
            emoji: ROSE_EMOJI
        };

        let allOpinions = [];
        if (fs.existsSync(LOG_FILE)) {
            const fileContent = fs.readFileSync(LOG_FILE, 'utf8');
            allOpinions = JSON.parse(fileContent);
        }

        allOpinions.push(opinionData);
        fs.writeFileSync(LOG_FILE, JSON.stringify(allOpinions, null, 4));
        console.log('تم تسجيل الرأي بنجاح في opinions.json');
    } catch (error) {
        console.error('حدث خطأ أثناء تسجيل الرأي:', error);
    }
}

module.exports = {
    async handleOpinion(message) {
        if (message.channel.id !== OPINIONS_CHANNEL || message.author.bot) return;

        try {
            const opinionEmbed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle('رأي جديد')
                .setDescription(message.content)
                .setFooter({ 
                    text: `صاحب الرأي: ${message.author.username}`,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();

            const sentMessage = await message.channel.send({ embeds: [opinionEmbed] });
            
            logOpinion(message.author, message.content, sentMessage.id);

            await sentMessage.react(ROSE_EMOJI);

            await message.delete().catch(() => {});

        } catch (error) {
            console.error('حدث خطأ في معالجة الرأي:', error);
        }
    }
};