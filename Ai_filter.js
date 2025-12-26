const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const statusFile = path.join(__dirname, 'AiFilterStatus.json');

function loadFilterStatus() {
    if (!fs.existsSync(statusFile)) {
        fs.writeFileSync(statusFile, JSON.stringify({ status: 'off' }, null, 2));
        return { status: 'off' };
    }
    try {
        return JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    } catch (error) {
        return { status: 'off' };
    }
}

function saveFilterStatus(status) {
    fs.writeFileSync(statusFile, JSON.stringify({ status: status }, null, 2));
}

async function sendToLogChannels(message, classification) {
    const excludedChannelId = ['1408180090226872321', '1438958356609110240'];
    const excludedCategories = ['1441852025766936666', '1428414593017053194', '1409149071431700580'];
    
    if (excludedChannelId.includes(message.channel.id) || (message.channel.parentId && excludedCategories.includes(message.channel.parentId))) {
        return;
    }
    
    const logChannels = ['1453723217121251391', '1453726857772929046'];
    
    for (const channelId of logChannels) {
        try {
            const channel = message.client.channels.cache.get(channelId);
            if (!channel) continue;
            
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('📊 تفاصيل تصنيف الذكاء الاصطناعي')
                .addFields(
                    { name: '👤 العضو', value: `${message.author.tag} (${message.author.id})`, inline: true },
                    { name: '📅 الوقت', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                    { name: '📍 الروم', value: `${message.channel.name}`, inline: true },
                    { name: '📝 الرسالة الأصلية', value: `\`\`\`${message.content.substring(0, 500)}\`\`\`` },
                    { name: '🔢 المستوى', value: `**${classification.level}**`, inline: true },
                    { name: '📊 الحالة', value: `**${classification.status}**`, inline: true },
                    { name: '📋 الإجراء', value: `**${classification.action}**`, inline: true },
                    { name: '❓ السبب', value: classification.reason },
                    { name: '📄 JSON', value: `\`\`\`json\n${JSON.stringify(classification, null, 2)}\n\`\`\`` }
                )
                .setFooter({ text: '📡 نظام SNOW AI - سجلات التصنيف' })
                .setTimestamp();
            
            await channel.send({ embeds: [embed] });
        } catch (error) {
            continue;
        }
    }
}

async function getLastMessages(message, limit = 5) {
    try {
        const messages = await message.channel.messages.fetch({ limit: limit + 1 });
        const filteredMessages = Array.from(messages.values())
            .filter(msg => msg.id !== message.id)
            .slice(0, limit)
            .reverse();
        
        return filteredMessages.map(msg => {
            return `${msg.author.username}: ${msg.content}`;
        });
    } catch (error) {
        return [];
    }
}

async function classifyMessageWithAI(message) {
    if (!message.content || message.content.trim().split(/\s+/).length < 2) {
        return getFallbackClassification();
    }

    const excludedChannelId = ['1408180090226872321', '1438958356609110240'];
    const excludedCategories = ['1441852025766936666', '1428414593017053194', '1409149071431700580'];

    if (excludedChannelId.includes(message.channel.id) || (message.channel.parentId && excludedCategories.includes(message.channel.parentId))) {
        return getFallbackClassification();
    }

    const apiKeys = [
        process.env.GROQ_API_KEY_1 || '',
        process.env.GROQ_API_KEY_2 || '',
        process.env.GROQ_API_KEY_3 || '',
        process.env.GROQ_API_KEY_4 || '',
        process.env.GROQ_API_KEY_5 || '',
        process.env.GROQ_API_KEY_6 || ''
    ].filter(key => key && key.trim() !== '');

    if (apiKeys.length === 0) {
        return getFallbackClassification();
    }

    const lastMessages = await getLastMessages(message, 5);
    const currentMessageContent = message.content.substring(0, 800);
    
    let contextPrompt = 'الرسائل الأخيرة للسياق:\n\n';
    contextPrompt += lastMessages.length > 0 ? lastMessages.join('\n') : 'لا توجد رسائل سابقة.';
    contextPrompt += `\n\nالرسالة الحالية للفحص:\n${message.author.username}: ${currentMessageContent}`;
    
    const systemPrompt = `أنت نظام خبير في إدارة مجتمعات ديسكورد العربية. مهمتك هي فحص الرسائل وتصنيفها بناءً على النية الحقيقية والسياق.

الفلسفة الأساسية: "خير الأمور أوسطها".
1. الأصل في الرسائل أنها سليمة (Clean) ما لم يثبت العكس يقيناً.
2. إذا كانت الرسالة تحتمل (المزاح، الهياط، لغة الألعاب، أو العبارات العامية الدارجة)، صنفها دائماً كلِفل 1.
3. التهديدات داخل سياق الألعاب (مثل: سأقتلك، سأفجرك) تعتبر Clean تماماً.
4. تجاهل تماماً الكلمات المفردة التي قد تُستخدم للمزاح.
5. تجاهل أي شيء يخص التكفير لأنه مزاح 100% بدون أي مشكلة.
6. هذا سيرفر ديسكورد ديني ، لا تمنع التكلم في الدين إلا إذا كان هناك سب حقيقي و واضح لأي ديانة. ( مثلا : يلعن دينك - دين خرا - يا دين امي [ او أي سب قوي مثل هذا فقط ] )

مستويات التصنيف:
- Level 1 (Clean): محادثة طبيعية، مزاح، كلمات عامية.
- Level 2 (Mild):  (قلة أدب خفيفة أو سخرية واضحة، عنصرية بجميع أنواعها (لا تستحق العقاب.
- Level 3 (Toxic): سب مباشر وصريح للشخص أو الأهل.
- Level 4 (Extreme): شتائم قذرة جداً، تحريض على العنف الواقعي، أو إهانة الأديان.
- Level 5 (Extreme_18_plus): محتوى جنسي صريح.

قاعدة القرار:
- كن متسامحاً جداً في Level 1 و 2.
- في حال الحيرة، اختر دائماً المستوى الأقل عقوبة.

أرجع JSON فقط بهذا التنسيق:
{
  "status": "clean | mild | toxic | extreme | extreme_18_plus",
  "level": 1 | 2 | 3 | 4 | 5,
  "reason": "سبب مختصر بالعربية",
  "action": "ignore | delete | delete_and_timeout | delete_and_request_moderator_confirmation"
}
`;

    const models = ['gemma2-9b-it', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];

    for (const apiKey of apiKeys) {
        for (const model of models) {
            try {
                const response = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: model,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: contextPrompt }
                        ],
                        temperature: 0.1,
                        max_tokens: 200,
                        response_format: { type: "json_object" }
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        timeout: 10000
                    }
                );

                const aiResponse = response.data.choices[0].message.content;
                const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
                if (!jsonMatch) continue;

                const classification = JSON.parse(jsonMatch[0]);
                
                if (!classification.level) continue;

                classification.status = getStatusFromLevel(classification.level);
                classification.action = getActionFromLevel(classification.level);
                classification.reason = classification.reason || getReasonFromLevel(classification.level);

                await sendToLogChannels(message, classification);
                return classification;

            } catch (error) {
                if (error.response?.status === 429) break;
                continue;
            }
        }
    }

    return getFallbackClassification();
}

function getFallbackClassification() {
    return {
        status: "clean",
        level: 1,
        reason: "رسالة عادية",
        action: "ignore"
    };
}

function getStatusFromLevel(level) {
    const statusMap = {1: "clean", 2: "mild", 3: "toxic", 4: "extreme", 5: "extreme_18_plus"};
    return statusMap[level] || "clean";
}

function getActionFromLevel(level) {
    const actionMap = {
        1: "ignore", 
        2: "ignore", 
        3: "delete", 
        4: "delete_and_timeout", 
        5: "delete_and_request_moderator_confirmation"
    };
    return actionMap[level] || "ignore";
}

function getReasonFromLevel(level) {
    const reasonMap = {1: "رسالة نظيفة", 2: "قلة أدب", 3: "سب مباشر", 4: "تهديد أو شتم شديد", 5: "محتوى جنسي صريح"};
    return reasonMap[level] || "رسالة عادية";
}

async function executeAction(message, classification) {
    const excludedChannelId = ['1408180090226872321', '1438958356609110240'];
    const excludedCategories = ['1441852025766936666', '1428414593017053194', '1409149071431700580'];

    if (excludedChannelId.includes(message.channel.id) || (message.channel.parentId && excludedCategories.includes(message.channel.parentId))) return;
    
    const { level, reason } = classification;
    
    switch (level) {
        case 1:
        case 2:
            break;
            
        case 3:
            await message.delete().catch(() => {});
            break;
            
        case 4:
            await message.delete().catch(() => {});
            try {
                await message.member.timeout(12 * 60 * 60 * 1000, reason);
            } catch (error) {}
            break;
            
        case 5:
            await message.delete().catch(() => {});
            try {
                const role1 = message.guild.roles.cache.get('1409939297141915658');
                const role2 = message.guild.roles.cache.get('1409293924358553731');
                if (role1) await message.member.roles.add(role1);
                if (role2) await message.member.roles.add(role2);
            } catch (roleError) {}
            await requestModeratorApproval(message, classification);
            break;
    }
}

async function requestModeratorApproval(message, classification) {
    const modChannelId = '1409532029690708169';
    const modChannel = message.client.channels.cache.get(modChannelId);
    if (!modChannel) return;
    
    const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚨 تصنيف +18 - يحتاج موافقة')
        .setDescription('تم اكتشاف محتوى جنسي صريح')
        .addFields(
            { name: '👤 العضو', value: `${message.author.tag} (<@${message.author.id}>)` },
            { name: '🔍 السبب', value: classification.reason },
            { name: '📝 المحتوى', value: `\`\`\`${message.content.substring(0, 500)}\`\`\`` }
        )
        .setFooter({ text: '🚔 Catched by : SNOW AI' })
        .setTimestamp();
    
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`ai_ban_${message.author.id}`)
                .setLabel('✅ حظر')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`ai_ignore_${message.author.id}`)
                .setLabel('❌ تجاهل')
                .setStyle(ButtonStyle.Danger)
        );
    
    await modChannel.send({ 
        content: '<@&1408880241098756146>',
        embeds: [embed],
        components: [row]
    });
}

async function handleButtonInteraction(interaction) {
    if (!interaction.isButton() || !interaction.customId.startsWith('ai_')) return;
    
    const [_, action, userId] = interaction.customId.split('_');
    
    if (action === 'ban') {
        try {
            const member = await interaction.guild.members.fetch(userId);
            await member.ban({ reason: 'محتوى جنسي - موافقة مشرف' });
            await interaction.update({
                content: `✅ تم حظر <@${userId}> بواسطة ${interaction.user.tag}`,
                components: [],
                embeds: []
            });
        } catch (error) {
            await interaction.reply({ content: '❌️ | خطأ في تنفيذ الحظر.', ephemeral: true });
        }
    } else if (action === 'ignore') {
        await interaction.update({
            content: `❌ تم تجاهل الطلب بواسطة ${interaction.user.tag}`,
            components: [],
            embeds: []
        });
    }
}

module.exports = {
    loadFilterStatus,
    saveFilterStatus,
    classifyMessageWithAI,
    executeAction,
    handleButtonInteraction
};