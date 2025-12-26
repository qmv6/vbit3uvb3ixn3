const { Client, GatewayIntentBits, Partials, ActivityType, Collection, PermissionsBitField, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, SlashCommandBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const prayerSystem = require('./prayerTimeSystem.js');
const replySystem = require('./replySystem.js');
const warningSystem = require('./warningsystem.js');
const pointsSystem = require('./EventsPointsSystem.js');
const taxSystem = require('./TaxSystem.js');
const antiSpam = require('./antiSpam.js');
const ticketsSystem = require('./ticketsSystem.js');
const suggestionsSystem = require('./Suggestions.js');
const opinionsSystem = require('./Opinions.js');
const QuranService = require('./QuranService.js');
const config = require('./config.json');
const verificationSystem = require('./verification.js');
const aiFilter = require('./Ai_filter.js');
require('dotenv').config();

const VOICE_CHANNEL_ID = '1451982065934405704';

let voiceConnection = null;
let audioPlayer = null;
let voiceChannel = null;
let isReconnecting = false;
let restartAttempts = 0;
const maxRestartAttempts = 1;
const quranService = new QuranService();

const rolesFile = path.join(__dirname, 'RolesBeforePrison.json');
const dmLogsFile = path.join(__dirname, 'dmLogs.json');
const guildSpamFile = path.join(__dirname, 'guildSpam.json');

function createSilentAudio() {
    const silentStream = new Readable({
        read() {
            this.push(Buffer.from([0xF8, 0xFF, 0xFE]));
            this.push(null);
        }
    });
    return createAudioResource(silentStream);
}

async function joinVoiceChannelFunc() {
    if (isReconnecting) return;
    
    try {
        isReconnecting = true;
        
        if (voiceConnection) {
            try {
                voiceConnection.destroy();
            } catch (e) {}
            voiceConnection = null;
        }

        voiceChannel = await client.channels.fetch(VOICE_CHANNEL_ID).catch(() => null);
        if (!voiceChannel || voiceChannel.type !== 2) {
            console.error('القناة غير موجودة أو ليست قناة صوتية');
            isReconnecting = false;
            return;
        }

        voiceConnection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });

        audioPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });

        const resource = createSilentAudio();
        audioPlayer.play(resource);
        
        voiceConnection.subscribe(audioPlayer);

        voiceConnection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            try {
                await Promise.race([
                    entersState(voiceConnection, VoiceConnectionStatus.Signalling, 2_000),
                    entersState(voiceConnection, VoiceConnectionStatus.Connecting, 2_000),
                ]);
            } catch (error) {
                voiceConnection.destroy();
                setTimeout(() => {
                    isReconnecting = false;
                    joinVoiceChannelFunc();
                }, 1_000);
            }
        });

        voiceConnection.on(VoiceConnectionStatus.Destroyed, () => {
            setTimeout(() => {
                isReconnecting = false;
                joinVoiceChannelFunc();
            }, 5_000);
        });

        console.log(`✅ دخل روم الفويس: ${voiceChannel.name}`);
        isReconnecting = false;

    } catch (error) {
        console.error('❌ خطأ في الدخول إلى روم الفويس:', error.message);
        isReconnecting = false;
        setTimeout(() => joinVoiceChannelFunc(), 10_000);
    }
}

function loadGuildSpamData() {
    if (!fs.existsSync(guildSpamFile)) {
        fs.writeFileSync(guildSpamFile, JSON.stringify({}, null, 2));
        return {};
    }
    try {
        return JSON.parse(fs.readFileSync(guildSpamFile, 'utf8'));
    } catch {
        return {};
    }
}

function saveGuildSpamData(data) {
    fs.writeFileSync(guildSpamFile, JSON.stringify(data, null, 2));
}

function loadRolesData() {
    if (!fs.existsSync(rolesFile)) {
        fs.writeFileSync(rolesFile, JSON.stringify({}, null, 2));
        return {};
    }
    try {
        return JSON.parse(fs.readFileSync(rolesFile, 'utf8'));
    } catch {
        return {};
    }
}

function saveRolesData(data) {
    fs.writeFileSync(rolesFile, JSON.stringify(data, null, 2));
}

function saveUserRoles(userId, roles) {
    const data = loadRolesData();
    data[userId] = roles;
    saveRolesData(data);
}

function getUserRoles(userId) {
    const data = loadRolesData();
    return data[userId] || [];
}

function removeUserRoles(userId) {
    const data = loadRolesData();
    delete data[userId];
    saveRolesData(data);
}

function loadDmLogs() {
    if (!fs.existsSync(dmLogsFile)) {
        fs.writeFileSync(dmLogsFile, JSON.stringify({ processedMessages: [] }, null, 2));
        return { processedMessages: [] };
    }
    try {
        return JSON.parse(fs.readFileSync(dmLogsFile, 'utf8'));
    } catch {
        return { processedMessages: [] };
    }
}

function saveDmLogs(data) {
    fs.writeFileSync(dmLogsFile, JSON.stringify(data, null, 2));
}

function addProcessedMessage(messageId) {
    const data = loadDmLogs();
    if (!data.processedMessages.includes(messageId)) {
        data.processedMessages.push(messageId);
        if (data.processedMessages.length > 1000) {
            data.processedMessages = data.processedMessages.slice(-500);
        }
        saveDmLogs(data);
    }
}

function isMessageProcessed(messageId) {
    const data = loadDmLogs();
    return data.processedMessages.includes(messageId);
}

async function forwardDMMessage(message) {
    try {
        if (isMessageProcessed(message.id)) return;

        const forwardChannelId = '1425509606251171881';
        const forwardChannel = message.client.channels.cache.get(forwardChannelId);
        if (!forwardChannel) {
            console.error('قناة إعادة التوجيه غير موجودة:', forwardChannelId);
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('رسالة خاصة جديدة')
            .setDescription(message.content || 'لا يوجد محتوى نصي')
            .addFields(
                { name: 'المرسل', value: `${message.author.tag} (${message.author.id})`, inline: true },
                { name: 'الوقت', value: `<t:${Math.floor(message.createdTimestamp / 1000)}:F>`, inline: true },
                { name: 'نوع الرسالة', value: 'رسالة خاصة (DM)', inline: true }
            )
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `ID: ${message.id}` })
            .setTimestamp();

        if (message.attachments.size > 0) {
            const attachmentLinks = message.attachments.map(att => att.url).join('\n');
            embed.addFields({ name: `المرفقات (${message.attachments.size})`, value: attachmentLinks });
        }

        await forwardChannel.send({ embeds: [embed] });
        addProcessedMessage(message.id);
    } catch (error) {
        console.error('خطأ في إعادة توجيه رسالة DM:', error);
    }
}

async function forwardExistingDMs(client) {
    try {
        const forwardChannelId = '1425509606251171881';
        const forwardChannel = client.channels.cache.get(forwardChannelId);

        if (!forwardChannel) {
            console.error('قناة إعادة التوجيه غير موجودة:', forwardChannelId);
            return;
        }

        console.log('جاري جمع رسائل الـ DM السابقة...');
        let totalMessages = 0;
        const dmChannels = client.channels.cache.filter(channel => channel.type === 1);

        for (const [channelId, dmChannel] of dmChannels) {
            try {
                const messages = await dmChannel.messages.fetch({ limit: 50 });
                const userMessages = messages.filter(msg => !msg.author.bot && !isMessageProcessed(msg.id));

                for (const [messageId, message] of userMessages) {
                    const embed = new EmbedBuilder()
                        .setColor(0x9932CC)
                        .setTitle('رسالة خاصة سابقة')
                        .setDescription(message.content || 'لا يوجد محتوى نصي')
                        .addFields(
                            { name: 'المرسل', value: `${message.author.tag} (${message.author.id})`, inline: true },
                            { name: 'الوقت', value: `<t:${Math.floor(message.createdTimestamp / 1000)}:F>`, inline: true },
                            { name: 'النوع', value: 'رسالة سابقة', inline: true }
                        )
                        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                        .setFooter({ text: `ID: ${message.id}` })
                        .setTimestamp();

                    if (message.attachments.size > 0) {
                        const attachmentLinks = message.attachments.map(att => att.url).join('\n');
                        embed.addFields({ name: `المرفقات (${message.attachments.size})`, value: attachmentLinks });
                    }

                    await forwardChannel.send({ embeds: [embed] });
                    addProcessedMessage(message.id);
                    totalMessages++;
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (error) {
                console.error(`خطأ في جلب رسائل DM للقناة ${channelId}:`, error.message);
            }
        }

        console.log(`تم إعادة توجيه ${totalMessages} رسالة DM سابقة`);
    } catch (error) {
        console.error('خطأ في إعادة توجيه رسائل DM السابقة:', error);
    }
}

async function handleGuildSpam(member) {
    try {
        const data = loadGuildSpamData();
        const userId = member.user.id;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (!data[userId]) {
            data[userId] = { joins: [], bannedUntil: null };
        }

        const userData = data[userId];
        userData.joins.push(now);
        userData.joins = userData.joins.filter(time => now - time <= oneDay);
        const totalJoins = userData.joins.length;

        if (totalJoins > 2) {
            const banDuration = oneDay;
            const banUntil = now + banDuration;
            userData.bannedUntil = banUntil;

            try {
                await member.ban({ reason: 'Guild Spam' });
                console.log(`تم حظر العضو ${member.user.tag} بسبب Guild Spam`);
            } catch (banError) {
                console.error('خطأ في حظر العضو:', banError);
            }
        }

        saveGuildSpamData(data);
    } catch (error) {
        console.error('خطأ في نظام حماية Guild Spam:', error);
    }
}

async function checkAndUnbanMembers(guild) {
    try {
        const data = loadGuildSpamData();
        const now = Date.now();
        let unbannedCount = 0;

        for (const userId in data) {
            const userData = data[userId];
            if (userData.bannedUntil && now > userData.bannedUntil) {
                try {
                    await guild.members.unban(userId, 'Guild Spam');
                    delete data[userId];
                    unbannedCount++;
                } catch (unbanError) {
                    if (unbanError.code !== 10026) {
                        console.error(`خطأ في إلغاء حظر العضو ${userId}:`, unbanError);
                    } else {
                        delete data[userId];
                    }
                }
            }
        }

        if (unbannedCount > 0) {
            saveGuildSpamData(data);
            console.log(`تم إلغاء حظر ${unbannedCount} عضو من نظام Guild Spam`);
        }
    } catch (error) {
        console.error('خطأ في فحص وإلغاء الحظر:', error);
    }
}

async function updateRolePermissions(guild) {
    try {
        const targetRoleId = '1442621404770992189';
        const targetRole = guild.roles.cache.get(targetRoleId);

        if (!targetRole) {
            console.error(`الرتبة ${targetRoleId} غير موجودة في السيرفر`);
            return;
        }

        console.log(`جاري تحديث صلاحيات الرتبة ${targetRole.name}...`);

        let updatedChannels = 0;
        const channels = guild.channels.cache;

        for (const [channelId, channel] of channels) {
            try {
                if (!channel.permissionOverwrites) continue;
                
                if (channelId === '1442654611277090857') {
                    console.log(`تم تخطي الروم المستثنى: ${channel.name}`);
                    continue;
                }

                await channel.permissionOverwrites.edit(targetRoleId, {
                    ViewChannel: false,
                    SendMessages: false,
                    ReadMessageHistory: false,
                    Connect: false,
                    Speak: false
                });

                updatedChannels++;

                if (updatedChannels % 20 === 0) {
                    console.log(`تم تحديث ${updatedChannels} روم...`);
                }

            } catch (channelError) {
                continue;
            }
        }

        console.log(`تم تحديث صلاحيات الرتبة في ${updatedChannels} روم بنجاح!`);

    } catch (error) {
        console.error('خطأ في تحديث صلاحيات الرتبة:', error);
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.Reaction
    ]
});

client.commands = new Collection();

const decorationCommand = {
    data: new SlashCommandBuilder()
        .setName('decoration')
        .setDescription('تحويل النص إلى خط مزخرف')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('النص المراد تحويله')
                .setRequired(true)
        ),
    async execute(interaction) {
        const text = interaction.options.getString('text');
        const convertedText = convertToDecoratedText(text);
        await interaction.reply({ content: convertedText, ephemeral: false });
    }
};

function convertToDecoratedText(text) {
    const boldMap = {
        'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌',
        'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
        'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣', 'k': '𝐤', 'l': '𝐥', 'm': '𝐦',
        'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳',
        '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
    };

    return text.split('').map(char => boldMap[char] || char).join('');
}

client.commands.set(decorationCommand.data.name, decorationCommand);

client.on('channelCreate', async (channel) => {
    try {
        const targetRoleId = '1409293924358553731';
        const restrictedRoleId = '1442621404770992189';

        if (channel.guild.id === '1408177713851666573' && (channel.isTextBased() || channel.isVoiceBased())) {
            if (channel.id !== '1442621461834760312') {
                if (channel.permissionOverwrites) {
                    await channel.permissionOverwrites.edit(restrictedRoleId, {
                        ViewChannel: false,
                        SendMessages: false,
                        ReadMessageHistory: false,
                        Connect: false,
                        Speak: false
                    });
                    console.log(`تم تحديث صلاحيات الرتبة ${restrictedRoleId} في الروم الجديد: ${channel.name}`);
                }
            } else {
                console.log(`تم تخطي الروم المستثنى: ${channel.name}`);
            }
        }

        if ((channel.isTextBased() || channel.isVoiceBased()) && channel.permissionOverwrites) {
            await channel.permissionOverwrites.edit(targetRoleId, {
                ViewChannel: false,
                SendMessages: false
            });
            console.log(`تم تحديث صلاحيات الرتبة ${targetRoleId} في الروم ${channel.name} (${channel.id})`);
        }
    } catch (error) {
        console.error(`فشل في تحديث صلاحيات الرتبة في الروم ${channel.name}:`, error);
    }
});

client.once(Events.ClientReady, async () => {
    console.log(`${client.user.tag} يعمل الآن!`);

    await ticketsSystem.initializeTicketsSystem(client);
    prayerSystem.initializePrayerSystem(client);
    pointsSystem.initializePointsSystem();
    await verificationSystem.initialize();

    await forwardExistingDMs(client);

    const targetGuild = client.guilds.cache.get('1408177713851666573');
    if (targetGuild) {
        await updateRolePermissions(targetGuild);
    }

    try {
        const commands = [decorationCommand.data.toJSON()];

        const currentCommands = await client.application.commands.fetch();
        if (currentCommands.size > 0) {
            await client.application.commands.set([]);
            console.log('تم مسح الأوامر القديمة');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        await client.application.commands.set(commands);
        console.log(`تم نشر ${commands.length} أمر سلاش للعام بنجاح!`);
    } catch (error) {
        console.error('خطأ في نشر الأوامر السلاش:', error);
    }

    client.user.setPresence({
        status: 'dnd',
        activities: [{ name: 'Muslim', type: ActivityType.Listening }]
    });

    setInterval(() => {
        client.guilds.cache.forEach(guild => {
            checkAndUnbanMembers(guild);
        });
    }, 30 * 60 * 1000);

    try {
        const channel = await client.channels.fetch('1399656339999035444');
        if (channel && channel.isTextBased()) {
            const message = await channel.messages.fetch('1421520408301142046').catch(() => null);
            if (message) {
                await message.reply({ content: 'اسرع من هيك مافي (:' });
            }
        }
    } catch (err) {
        console.warn('لم يتم الرد على الرسالة المحددة عند التشغيل:', err.message);
    }

    setTimeout(() => {
        joinVoiceChannelFunc();
    }, 3000);
});

client.on(Events.GuildMemberAdd, async (member) => {
    await handleGuildSpam(member);
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    if (oldState.member.id === client.user.id && !newState.channelId) {
        setTimeout(() => {
            joinVoiceChannelFunc();
        }, 1000);
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content === '!F-on') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: "تحتاج صلاحية Administrator!", ephemeral: true });
        }
        aiFilter.saveFilterStatus('on');
        message.reply({ content: '✅ تم تشغيل نظام التصنيف بالذكاء الاصطناعي.', ephemeral: true });
        return;
    }

    if (message.content === '!F-off') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: "تحتاج صلاحية Administrator!", ephemeral: true });
        }
        aiFilter.saveFilterStatus('off');
        message.reply({ content: '✅ تم إيقاف نظام التصنيف.', ephemeral: true });
        return;
    }

    if (message.channel.type === 1) {
        await forwardDMMessage(message);
        return;
    }

    const filterStatus = aiFilter.loadFilterStatus();
    if (filterStatus.status === 'on') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const classification = await aiFilter.classifyMessageWithAI(message);
            
            if (classification.level > 1) {
                await aiFilter.executeAction(message, classification);
                return;
            }
        }
    }

    if (message.channel.isThread()) {
        await verificationSystem.handleThreadMessage(message);
        return;
    }

    const targetRooms = [
        '1408880969359949904', '1409290487919022091', '1408910161497690172',
        '1409902820060168262', '1409149500664315904', '1409149133046026300',
        '1409149760618758204', '1410707207422611486', '1410676679218823248',
        '1410677630252093490', '1410678448237842493', '1421888582049599540',
        '1409651761890725960', '1409648848892067962', '1408840234350805033', '1409162379165565101', '1409230514803576876',
        '1408916225748369459', '1408855385024102594', '1409701380997910661',
        '1428414983724863630',
        '1428415186980835508',
        '1428415046249349141',
        '1428414703981563914',
        '1428414778162024639',
        '1428415133532557334',
        '1428414847758110730',
        '1432078751784767588',
        '1439959220941230263',
        '1441852380160331846',
        '1441861147879018556',
        '1441855037478404206',
        '1441854390284587200',
        '1441854250408738836',
        '1441855196811628697',
        '1441854059307991090',
        '1441853619866697818',
        '1449104106504327209'
    ];

    if (targetRooms.includes(message.channel.id)) {
        await message.channel.send('https://i.postimg.cc/Pxtx1wpj/Snow-Community.png ');
    }

    await suggestionsSystem.handleSuggestion(message);
    await opinionsSystem.handleOpinion(message);
    await antiSpam.checkSpam(message);

    if (message.content.includes('<@1410720822531854438>')) {
        await message.react('👀');
    }

    if (message.content === '𝕏7𝖅Q𝕏7𝖅') {
        await quranService.handleCommand(message);
        return;
    }

    const replied = replySystem.handleReply(message);
    if (replied) return;

    if (message.content.startsWith('!!-reply')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: "تحتاج إلى صلاحية Administrator لاستخدام هذا الأمر!", ephemeral: true });
        }

        const args = message.content.slice('!!-reply'.length).trim().split(/ +/);
        if (args.length < 2) {
            return message.reply({ content: "صيغة الأمر خاطئة! استخدم: !!-reply [رابط الرسالة] [الرد]", ephemeral: true });
        }

        const messageLink = args[0];
        const replyContent = args.slice(1).join(' ');
        const messageIdRegex = /channels\/(\d+)\/(\d+)\/(\d+)/;
        const match = messageLink.match(messageIdRegex);

        if (!match) {
            return message.reply({ content: "رابط الرسالة غير صحيح!", ephemeral: true });
        }

        const [, guildId, channelId, messageId] = match;

        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return message.reply({ content: "لم أستطع العثور على السيرفر!", ephemeral: true });
            }

            const channel = guild.channels.cache.get(channelId);
            if (!channel) {
                return message.reply({ content: "لم أستطع العثور على الروم!", ephemeral: true });
            }

            const targetMessage = await channel.messages.fetch(messageId);
            if (!targetMessage) {
                return message.reply({ content: "لم أستطع العثور على الرسالة!", ephemeral: true });
            }

            await targetMessage.reply(replyContent);
            await message.react('✅');
        } catch (error) {
            console.error('خطأ في أمر الرد:', error);
            message.reply({ content: "حدث خطأ أثناء محاولة الرد على الرسالة!", ephemeral: true });
        }
        return;
    }

    if (message.content === '𝕏7𝖅ver𝕏7𝖅') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: "تحتاج إلى صلاحية Administrator لاستخدام هذا الأمر!", ephemeral: true });
        }

        await verificationSystem.setupVerification(message);
        return;
    }

    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === '𝕏7𝖅DM'.toLowerCase()) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: "تحتاج إلى صلاحية Administrator لاستخدام هذا الأمر!", ephemeral: true });
        }

        if (args.length < 2) {
            return message.reply({ content: `صيغة الأمر خاطئة! الاستخدام الصحيح: ${config.prefix}𝕏7𝖅DM [USERID أو USERNAME] [الرسالة]`, ephemeral: true });
        }

        const targetInput = args.shift();
        const messageContent = args.join(' ');
        let targetUser = null;

        if (!isNaN(targetInput) && targetInput.length >= 17) {
            targetUser = client.users.cache.get(targetInput);
        }

        if (!targetUser) {
            const targetNameLower = targetInput.toLowerCase();
            targetUser = client.users.cache.find(user => 
                user.username.toLowerCase() === targetNameLower || 
                user.tag.toLowerCase() === targetNameLower
            );
        }
        
        if (!targetUser && !isNaN(targetInput) && targetInput.length >= 17) {
            try {
                targetUser = await client.users.fetch(targetInput);
            } catch (err) {
                targetUser = null;
            }
        }

        if (!targetUser) {
            return message.reply({ content: `❌ لم يتم العثور على عضو بالمعرّف/الاسم: **${targetInput}**. يجب أن يكون العضو في سيرفر مشترك مع البوت.` });
        }

        try {
            const dmChannel = await targetUser.createDM();
            await dmChannel.send(messageContent);
            await message.reply({ content: `✅ تم إرسال الرسالة الخاصة بنجاح إلى **${targetUser.tag}**.` });
        } catch (error) {
            if (error.code === 50007) {
                return message.reply({ content: `🚫 فشل إرسال الرسالة إلى **${targetUser.tag}**. ربما قام بتعطيل الرسائل الخاصة أو حظر البوت.` });
            }
            console.error('خطأ في أمر إرسال الرسالة الخاصة:', error);
            message.reply({ content: "❌ حدث خطأ غير متوقع أثناء الإرسال." });
        }
    }
    else if (command === 'سجن') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: "تحتاج إلى صلاحية Administrator لاستخدام هذا الأمر!", ephemeral: true });
        }

        if (args.length < 1) {
            return message.reply({ content: "يجب ذكر المستخدم! استخدم: سجن @المستخدم", ephemeral: true });
        }

        const userInput = args[0];
        const reason = args.slice(1).join(' ') || 'لم يتم ذكر السبب';
        let targetUser;

        if (message.mentions.users.size > 0) {
            targetUser = message.mentions.users.first();
        } else {
            const userId = userInput.replace(/[<@!>]/g, '');
            targetUser = message.guild.members.cache.get(userId)?.user;
        }

        if (!targetUser) {
            return message.reply({ content: "لم يتم العثور على المستخدم!", ephemeral: true });
        }

        if (targetUser.id === client.user.id) {
            return message.reply({ content: "لا يمكن سجن البوت!", ephemeral: true });
        }

        if (targetUser.id === message.author.id) {
            return message.reply({ content: "لا يمكنك سجن نفسك!", ephemeral: true });
        }

        try {
            const targetMember = await message.guild.members.fetch(targetUser.id);
            const roleToAdd = message.guild.roles.cache.get('1409293924358553731');

            if (!roleToAdd) {
                return message.reply({ content: "لم يتم العثور على رتبة السجن!", ephemeral: true });
            }

            if (targetMember.roles.cache.has(roleToAdd.id)) {
                return message.reply({ content: "هذا العضو مسجون بالفعل !" });
            }

            const currentRoles = targetMember.roles.cache.filter(role =>
                role.id !== message.guild.id &&
                role.id !== '1408967212311515207'
            );

            const rolesToSave = currentRoles.map(role => role.id);
            saveUserRoles(targetUser.id, rolesToSave);

            const newRoleIds = [message.guild.id, roleToAdd.id];
            if (targetMember.roles.cache.has('1408967212311515207')) {
                newRoleIds.push('1408967212311515207');
            }

            await targetMember.roles.set(newRoleIds, `Imprisoned by ${message.author.tag} | Reason: ${reason}`);

            const logChannel = client.channels.cache.get('1410730391240708246');
            if (logChannel) {
                const logMessage = `__نموذج ضروري تعبيه لما تسجن اي شخص__\n\nيوزر المسجون: <@${targetUser.id}>\n\nسبب السجن: ${reason}\n\nدليل على السبب: ${message.url}\n\nملاحظة: في حال سجنت شخص ولم تعبي هذا النموذج سيتم تحذيرك.`;
                await logChannel.send(logMessage);
            }

            message.reply({ content: `✅️ | تم سجن **${targetUser.username}** بنجاح.` });
        } catch (error) {
            console.error('خطأ في أمر السجن:', error);
            message.reply({ content: "حدث خطأ أثناء محاولة سجن المستخدم.", ephemeral: true });
        }
    }
    else if (command === 'افراج' || command === 'أفراج' || command === 'إفراج') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: "تحتاج إلى صلاحية Administrator لاستخدام هذا الأمر!", ephemeral: true });
        }

        if (args.length < 1) {
            return message.reply({ content: "صيغة الأمر خاطئة! استخدم: افراج @المستخدم", ephemeral: true });
        }

        const userInput = args[0];
        let targetUser;

        if (message.mentions.users.size > 0) {
            targetUser = message.mentions.users.first();
        } else {
            const userId = userInput.replace(/[<@!>]/g, '');
            targetUser = message.guild.members.cache.get(userId)?.user;
        }

        if (!targetUser) {
            return message.reply({ content: "لم يتم العثور على المستخدم!", ephemeral: true });
        }

        try {
            const targetMember = await message.guild.members.fetch(targetUser.id);
            const prisonRole = message.guild.roles.cache.get('1409293924358553731');
            const savedRoles = getUserRoles(targetUser.id);

            if (savedRoles.length === 0) {
                return message.reply({ content: "هذا العضو غير مسجون 🤔!", ephemeral: true });
            }

            const rolesToSet = [message.guild.id, ...savedRoles];
            if (targetMember.roles.cache.has('1408967212311515207')) {
                rolesToSet.push('1408967212311515207');
            }

            await targetMember.roles.set(rolesToSet, `Released by ${message.author.tag}`);
            removeUserRoles(targetUser.id);

            message.reply({ content: `✅️ | تم الإفراج عن **${targetUser.username}** بنجاح.` });
        } catch (error) {
            console.error('خطأ في أمر الإفراج:', error);
            message.reply({ content: "حدث خطأ أثناء محاولة الإفراج عن المستخدم.", ephemeral: true });
        }
    }
    else if (command === 'مواقيت') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply({ content: "ليس لديك صلاحية كتم الأعضاء!", ephemeral: true });
        }

        try {
            await message.delete();
            await prayerSystem.sendPrayerMenu(message);
        } catch (error) {
            console.error('خطأ في حذف الرسالة:', error);
        }
    }
    else if (command === 'تحذير') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply({ content: "ليس لديك صلاحية!", ephemeral: true });
        }
        await warningSystem.execute(message, args);
    }
    else if (command === 'ازالة-تحذير') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply({ content: "ليس لديك صلاحية!", ephemeral: true });
        }
        await warningSystem.removeWarning(message, args);
    }
    else if (command === '!!p-add') {
        if (args.length < 2) {
            return message.reply({ content: "صيغة الأمر خاطئة! استخدم: +p @المستخدم عدد النقاط", ephemeral: true });
        }

        const userMention = args[0];
        const points = parseInt(args[1]);

        if (isNaN(points) || points <= 0) {
            return message.reply({ content: "عدد النقاط يجب أن يكون رقمًا صحيحًا موجبًا!", ephemeral: true });
        }

        let targetUser;
        if (message.mentions.users.size > 0) {
            targetUser = message.mentions.users.first();
        } else {
            const userId = userMention.replace(/[<@!>]/g, '');
            targetUser = message.guild.members.cache.get(userId)?.user;
        }

        if (!targetUser) {
            return message.reply({ content: "لم يتم العثور على المستخدم!", ephemeral: true });
        }

        const success = pointsSystem.addPoints(targetUser.id, points, message);
        if (success) {
            message.reply({ content: `تم إضافة ${points} نقطة إلى <@${targetUser.id}>`, ephemeral: true });
        }
    }
    else if (command === '!!p-remove') {
        if (args.length < 2) {
            return message.reply({ content: "صيغة الأمر خاطئة! استخدم: -p @المستخدم عدد النقاط", ephemeral: true });
        }

        const userMention = args[0];
        const points = parseInt(args[1]);

        if (isNaN(points) || points <= 0) {
            return message.reply({ content: "عدد النقاط يجب أن يكون رقمًا صحيحًا موجبًا!", ephemeral: true });
        }

        let targetUser;
        if (message.mentions.users.size > 0) {
            targetUser = message.mentions.users.first();
        } else {
            const userId = userMention.replace(/[<@!>]/g, '');
            targetUser = message.guild.members.cache.get(userId)?.user;
        }

        if (!targetUser) {
            return message.reply({ content: "لم يتم العثور على المستخدم!", ephemeral: true });
        }

        const success = pointsSystem.removePoints(targetUser.id, points, message);
        if (success) {
            message.reply({ content: `تم إزالة ${points} نقطة من <@${targetUser.id}>`, ephemeral: true });
        }
    }
    else if (command === '!!reset') {
        const success = pointsSystem.resetAllPoints(message);
        if (success) {
            message.reply({ content: "تم حذف جميع النقاط من جميع الأعضاء!", ephemeral: true });
        }
    }
    else if (command === '!!top') {
        if (!pointsSystem.hasPermission(message.member)) {
            return message.reply({ content: "تحتاج إلى صلاحية Administrator لاستخدام هذا الأمر!", ephemeral: true });
        }

        const topMembers = pointsSystem.getTopMembers(5);
        if (topMembers.length === 0) {
            return message.reply({ content: "لا توجد نقاط مسجلة لأي عضو بعد!", ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('نقاط الأعضاء الحالية')
            .setColor('#0099ff')
            .setDescription(
                topMembers.map(([userId, points], index) =>
                    `${index + 1}. <@${userId}> : ${points} نقطة`
                ).join('\n')
            )
            .setFooter({ text: `أعلى ${topMembers.length} أعضاء بالنقاط` })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
    else if (command === '×p') {
        if (args.length < 1) {
            return message.reply({ content: "صيغة الأمر خاطئة! استخدم: ×p @المستخدم", ephemeral: true });
        }

        const userMention = args[0];
        let targetUser;
        if (message.mentions.users.size > 0) {
            targetUser = message.mentions.users.first();
        } else {
            const userId = userMention.replace(/[<@!>]/g, '');
            targetUser = message.guild.members.cache.get(userId)?.user;
        }

        if (!targetUser) {
            return message.reply({ content: "لم يتم العثور على المستخدم!", ephemeral: true });
        }

        const points = pointsSystem.getPoints(targetUser.id);
        message.reply({ content: `نقاط <@${targetUser.id}> الحالية: ${points} نقطة` });
    }
    else if (command === 'خط') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: "تحتاج إلى صلاحية Administrator لاستخدام هذا الأمر!", ephemeral: true });
        }

        try {
            await message.delete();
            await message.channel.send('https://i.postimg.cc/Pxtx1wpj/Snow-Community.png ');
        } catch (error) {
            console.error('خطأ في إرسال الصورة:', error);
        }
    }
    else if (command === '!!!𝕏7𝖅ticket') {
        ticketsSystem.sendTicketPanel(message);
    }
    else if (command === '!!send-tpanel') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: "تحتاج إلى صلاحية Administrator لاستخدام هذا الأمر!", ephemeral: true });
        }

        if (args.length < 1) {
            return message.reply({ content: "صيغة الأمر خاطئة! استخدم: !!send-tpanel [رقم التكت]", ephemeral: true });
        }

        const ticketNumber = args[0];
        if (isNaN(ticketNumber)) {
            return message.reply({ content: "رقم التكت يجب أن يكون رقماً صحيحاً!", ephemeral: true });
        }

        await ticketsSystem.sendTicketControlPanel(parseInt(ticketNumber), message);
    }
    else if (command === '14255333397540374501425533339754037450') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: "تحتاج إلى صلاحية Administrator لاستخدام هذا الأمر!", ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('اختيار المذهب')
            .setDescription('اختر مذهبك عن طريق الضغط على الزر.')
            .setColor(0x0099FF);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('madhhab_selection')
            .setPlaceholder('Select Role')
            .addOptions(
                {
                    label: 'حنبلي',
                    description: 'لاخذ رتبة حنبلي اضغط على الايموجي',
                    emoji: { id: '1425523203266183258' },
                    value: 'hanbali_1425532104829174001'
                },
                {
                    label: 'شافعي',
                    description: 'لاخذ رتبة شافعي اضغط على الايموجي',
                    emoji: { id: '1425524585385824257' },
                    value: 'shafi_1425533251459747971'
                },
                {
                    label: 'حنفي',
                    description: 'لاخذ رتبة حنفي اضغط على الايموجي',
                    emoji: { id: '1425526122652635319' },
                    value: 'hanafi_1425533488098050154'
                },
                {
                    label: 'مالكي',
                    description: 'لاخذ رتبة مالكي اضغط على الايموجي',
                    emoji: { id: '1425524612686680155' },
                    value: 'maliki_1425533339754037450'
                }
            );

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        await message.channel.send({ embeds: [embed], components: [row] });
    }

    await taxSystem.handleTaxCalculation(message);
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isButton() && interaction.customId.startsWith('ai_')) {
        await aiFilter.handleButtonInteraction(interaction);
        return;
    }

    if (interaction.isButton() && interaction.customId === 'start_verification') {
        await verificationSystem.handleButton(interaction);
        return;
    }

    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'حدث خطأ أثناء تنفيذ هذا الأمر!', ephemeral: true });
        }
    } else if (interaction.isButton()) {
        if (interaction.customId === 'reset_subscription') {
            await prayerSystem.handleResetButton(interaction);
        }
        else if (interaction.customId === 'quran_show_modal') {
            await quranService.handleShowModal(interaction);
        } 
        else if (interaction.customId === 'quran_show_index') {
            await quranService.handleShowIndex(interaction);
        }
        else if (interaction.customId === 'quran_prev_page' || interaction.customId === 'quran_next_page') {
            await quranService.handleButtonInteraction(interaction);
        }
        else {
            await ticketsSystem.handleInteraction(interaction);
        }
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'quran_page_modal') {
            await quranService.handleModalSubmit(interaction);
        }
    } else if (interaction.isStringSelectMenu()) {
        if (interaction.customId.startsWith('country_selection')) {
            await prayerSystem.handlePrayerSelection(interaction);
        } else if (interaction.customId === 'madhhab_selection') {
            await handleMadhhabSelection(interaction);
        } else {
            await ticketsSystem.handleInteraction(interaction);
        }
    } else if (interaction.isUserSelectMenu()) {
        await ticketsSystem.handleInteraction(interaction);
    } else {
        await ticketsSystem.handleInteraction(interaction);
    }
});

async function handleMadhhabSelection(interaction) {
    try {
        const selectedValue = interaction.values[0];
        const member = await interaction.guild.members.fetch(interaction.user.id);

        const madhhabRoles = {
            'hanbali_1425532104829174001': '1425532104829174001',
            'shafi_1425533251459747971': '1425533251459747971',
            'hanafi_1425533488098050154': '1425533488098050154',
            'maliki_1425533339754037450': '1425533339754037450'
        };

        const selectedRoleId = madhhabRoles[selectedValue];
        const allRoleIds = Object.values(madhhabRoles);

        for (const roleId of allRoleIds) {
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId);
            }
        }

        await member.roles.add(selectedRoleId);

        const roleNames = {
            'hanbali_1425532104829174001': 'حنبلي',
            'shafi_1425533251459747971': 'شافعي',
            'hanafi_1425533488098050154': 'حنفي',
            'maliki_1425533339754037450': 'مالكي'
        };

        await interaction.reply({
            content: `تم إعطاؤك رتبة ${roleNames[selectedValue]} بنجاح.`,
            ephemeral: true
        });
    } catch (error) {
        console.error('خطأ في نظام اختيار المذهب:', error);
        await interaction.reply({
            content: 'حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
            ephemeral: true
        });
    }
}

function handleShutdown() {
    console.log('جاري إغلاق البوت بشكل آمن...');
    if (voiceConnection) {
        voiceConnection.destroy();
    }
    client.destroy();
    process.exit(0);
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

client.on('disconnect', () => {
    console.log('تم فصل البوت عن الديسكورد!');
});

client.on('shardDisconnect', (event, shardID) => {
    console.log(`تم فصل الشارد ${shardID}:`, event);
});

client.on('error', (error) => {
    console.error('حدث خطأ في الكلينت:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('رفض غير معالج:', reason);

    if (restartAttempts < maxRestartAttempts) {
        restartAttempts++;
        console.log(`محاولة إعادة التشغيل ${restartAttempts}/${maxRestartAttempts}...`);
        setTimeout(() => {
            client.destroy();
            client.login(config.token).catch(err => {
                console.error('فشل إعادة التشغيل:', err);
                process.exit(1);
            });
        }, 5000);
    } else {
        console.log('تم تجاوز الحد الأقصى لمحاولات إعادة التشغيل!');
        process.exit(1);
    }
});

client.login(config.token).catch(error => {
    console.error('خطأ في تسجيل الدخول:', error);
});