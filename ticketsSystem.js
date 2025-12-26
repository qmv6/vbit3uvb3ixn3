const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, StringSelectMenuBuilder, AttachmentBuilder, UserSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

let client;
const tickets = new Map();
const cooldowns = new Map();
const TICKETS_FILE = path.join(__dirname, 'tickets.json');
const TICKET_COUNTER_FILE = path.join(__dirname, 'ticketCounter.json');
const TARGET_GUILD_ID = '1408177713851666573';
const CLOSED_CATEGORY_ID = '1409242593702707210';
const GIRLS_ROLE_ID = '1408880405007962183';

async function fetchAllMessages(channel) {
    let allMessages = [];
    let lastId;
    while (true) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;
        const messages = await channel.messages.fetch(options);
        if (messages.size === 0) break;
        allMessages.push(...messages.values());
        lastId = messages.last().id;
        if (messages.size < 100) break;
    }
    return allMessages.reverse();
}

async function setChannelPermissions(channel, id, permissions) {
    try {
        if (!id) return null;
        const guild = channel.guild;
        const member = await guild.members.fetch(id).catch(() => null);
        if (member) return await channel.permissionOverwrites.edit(member.id, permissions);
        const role = guild.roles.cache.get(id);
        if (role) return await channel.permissionOverwrites.edit(role.id, permissions);
        return await channel.permissionOverwrites.edit(id, permissions);
    } catch (error) {
        return null;
    }
}

async function loadTickets() {
    if (fs.existsSync(TICKETS_FILE)) {
        try {
            const data = fs.readFileSync(TICKETS_FILE, 'utf8');
            const savedTickets = JSON.parse(data);
            for (const rawTicket of savedTickets) {
                if (!rawTicket || !rawTicket.id) continue;
                const ticket = Object.assign({}, rawTicket);
                const targetGuild = client.guilds.cache.get(TARGET_GUILD_ID);
                if (!targetGuild) continue;
                const channel = await targetGuild.channels.fetch(ticket.id).catch(() => null);
                if (channel) {
                    tickets.set(ticket.id, ticket);
                }
            }
        } catch (error) {}
    } else {
        fs.writeFileSync(TICKETS_FILE, '[]', 'utf8');
    }
}

function saveTickets() {
    const ticketsArray = Array.from(tickets.values());
    try {
        fs.writeFileSync(TICKETS_FILE, JSON.stringify(ticketsArray, null, 2));
    } catch (error) {}
}

function loadTicketCounter() {
    try {
        if (fs.existsSync(TICKET_COUNTER_FILE)) {
            const data = fs.readFileSync(TICKET_COUNTER_FILE, 'utf8');
            return JSON.parse(data).counter || 1;
        }
        return 1;
    } catch (error) {
        return 1;
    }
}

function saveTicketCounter(counter) {
    try {
        fs.writeFileSync(TICKET_COUNTER_FILE, JSON.stringify({ counter }, null, 2));
    } catch (error) {}
}

let ticketCounter = loadTicketCounter();

function getNextTicketNumber() {
    const currentNumber = ticketCounter;
    ticketCounter++;
    saveTicketCounter(ticketCounter);
    return currentNumber;
}

function canCloseTicket(ticket) {
    if (!ticket.reopenedAt) return true;
    const cooldownTime = 15 * 60 * 1000;
    return (Date.now() - new Date(ticket.reopenedAt).getTime()) >= cooldownTime;
}

function canManageTicket(member, ticket, targetMember) {
    return member.id === ticket.creator || member.id === ticket.claimedBy || targetMember.roles.cache.has(ticket.roleId);
}

const createTicketActionRows = (isClaimed) => {
    const claimButton = isClaimed
        ? new ButtonBuilder().setCustomId('unclaim_ticket').setLabel('إلغاء الاستلام').setStyle(ButtonStyle.Danger).setEmoji('❌')
        : new ButtonBuilder().setCustomId('claim_ticket').setLabel('استلام التكت').setStyle(ButtonStyle.Success).setEmoji('✅');

    const actionsMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_actions')
        .setPlaceholder('الإجراءات')
        .addOptions([
            { label: 'إغلاق التكت', value: 'close_ticket', emoji: '🔒' },
            { label: 'إضافة عضو', value: 'add_member', emoji: '👥' },
            { label: 'استدعاء', value: 'call_ticket', emoji: '✉️' },
            { label: 'طلب نسخة', value: 'copy_ticket', emoji: '📝' },
        ]);

    return [new ActionRowBuilder().addComponents(claimButton), new ActionRowBuilder().addComponents(actionsMenu)];
};

async function initializeTicketsSystem(clientInstance) {
    client = clientInstance;
    await loadTickets();
}

function sendTicketPanel(message) {
    const imagePath = path.join(__dirname, 'prayer_images', 'support.png');
    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('نظام الدعم الفني 🎫')
        .setDescription('للحصول على مساعدة من فريق الدعم، يرجى اختيار نوع التكت المناسب من القائمة الآتية.\nسنقوم بالرد عليك في أقرب وقت ممكن!');

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('select_ticket_type')
            .setPlaceholder('اختر نوع التكت من هنا')
            .addOptions([
                { label: 'الدعم الفني', value: 'techSupport', description: 'تلقي الدعم الفني في السيرفر', emoji: '💡' },
                { label: 'شكوى على عضو', value: 'complaintOnMember', description: 'تقديم شكوى على عضو في السيرفر', emoji: '✉️' },
                { label: 'شكوى على اداري', value: 'complaintOnAdmin', description: 'تقديم شكوى على اداري في السيرفر', emoji: '🚨' },
                { label: 'توثيق بنات', value: 'girlsVerification', description: 'قسم خاص لتوثيق البنات في السيرفر', emoji: '🌺' }
            ])
    );

    message.delete().catch(() => {});
    const payload = { embeds: [embed], components: [menu] };
    if (fs.existsSync(imagePath)) {
        const imageAttachment = new AttachmentBuilder(imagePath, { name: 'support.png' });
        embed.setImage('attachment://support.png');
        payload.files = [imageAttachment];
    }
    message.channel.send(payload);
}

async function handleInteraction(interaction) {
    if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isUserSelectMenu()) return;
    try {
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_ticket_type') {
            await handleTicketCreation(interaction);
        } else if (interaction.isButton()) {
            await handleTicketButtons(interaction);
        } else if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_actions') {
            await handleTicketActions(interaction);
        } else if (interaction.isUserSelectMenu() && interaction.customId === 'add_member_select') {
            await handleMemberSelection(interaction);
        }
    } catch (error) {}
}

async function handleTicketCreation(interaction) {
    const customId = interaction.values[0];
    const targetGuild = client.guilds.cache.get(TARGET_GUILD_ID);
    const member = await targetGuild.members.fetch(interaction.user.id).catch(() => null);

    if (customId === 'girlsVerification') {
        if (!member.roles.cache.has(GIRLS_ROLE_ID)) {
            return interaction.reply({ content: '❌ | هذا القسم مخصص للبنات فقط!', ephemeral: true });
        }
    }

    const categoryId = config.ticketCategories[customId];
    const roleId = config.mentionRoles[customId];

    await interaction.deferReply({ ephemeral: true });

    const cooldownKey = `${member.id}`;
    const cooldownTime = config.cooldownMinutes * 60 * 1000;
    if (cooldowns.has(cooldownKey)) {
        const remainingTime = cooldownTime - (Date.now() - cooldowns.get(cooldownKey));
        if (remainingTime > 0) return interaction.editReply(`⏱️ يجب الانتظار ${Math.ceil(remainingTime / 60000)} دقيقة!`);
    }
    cooldowns.set(cooldownKey, Date.now());
    setTimeout(() => cooldowns.delete(cooldownKey), cooldownTime);

    const ticketNumber = getNextTicketNumber();
    const channel = await targetGuild.channels.create({
        name: `🎫・${ticketNumber}`,
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: [
            { id: targetGuild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: member.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            { id: roleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
        ]
    });

    const descriptions = {
        techSupport: "اهلا بك في قسم الدعم الفني 💡\nاكتب طلبك وسيتم الرد عليك قريباً.",
        complaintOnMember: "اهلا بك في قسم الشكاوى على الأعضاء ✉️\nيرجى تقديم الأدلة.",
        complaintOnAdmin: "اهلا بك في قسم الشكاوى على الإدارة 🚨\nيرجى كتابة الشكوى بالتفصيل.",
        girlsVerification: "اهلا بك في قسم توثيق البنات 🌺\nيرجى انتظار المسؤولة لتوثيق الحساب."
    };

    const labels = {
        techSupport: 'الدعم الفني 💡',
        complaintOnMember: 'شكوى على عضو ✉️',
        complaintOnAdmin: 'شكوى على اداري 🚨',
        girlsVerification: 'توثيق بنات 🌺'
    };

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(labels[customId])
        .setDescription(descriptions[customId])
        .setFooter({ text: `بواسطة: ${member.user.tag}`, iconURL: member.user.displayAvatarURL() });

    const sentMessage = await channel.send({ content: `<@&${roleId}> ${member}`, embeds: [embed], components: createTicketActionRows(false) });

    const ticketData = {
        id: channel.id,
        number: ticketNumber,
        creator: String(member.id),
        type: customId,
        roleId: String(roleId),
        createdAt: new Date().toISOString(),
        claimed: false,
        claimedBy: null,
        closed: false,
        creationMessageId: sentMessage.id,
        originalCategory: String(categoryId),
        addedMembers: [],
        reopenedAt: null
    };

    tickets.set(channel.id, ticketData);
    saveTickets();
    await interaction.editReply(`✅ تم إنشاء التكت: ${channel}`);
}

async function handleTicketButtons(interaction) {
    const { channel, member, customId } = interaction;
    const ticket = tickets.get(channel.id);
    if (!ticket) return;

    if (customId === 'cancel_close' || customId === 'cancel_add_member') {
        return await interaction.message.delete().catch(() => {});
    }

    if (customId === 'claim_ticket') {
        await interaction.deferReply({ ephemeral: false });
        const targetGuild = client.guilds.cache.get(TARGET_GUILD_ID);
        const targetMember = await targetGuild.members.fetch(member.id);
        if (member.id === ticket.creator || !targetMember.roles.cache.has(ticket.roleId)) return interaction.editReply('❌ لا يمكنك الاستلام!');
        await setChannelPermissions(channel, member.id, { ViewChannel: true, SendMessages: true });
        ticket.claimed = true;
        ticket.claimedBy = member.id;
        saveTickets();
        const originalMessage = await channel.messages.fetch(ticket.creationMessageId);
        const embed = new EmbedBuilder(originalMessage.embeds[0].data).addFields({ name: 'المستلم', value: member.toString() });
        await originalMessage.edit({ embeds: [embed], components: createTicketActionRows(true) });
        await interaction.editReply(`✅ تم استلام التكت بواسطة ${member}`);
    }

    else if (customId === 'confirm_close') {
        const targetGuild = client.guilds.cache.get(TARGET_GUILD_ID);
        const targetMember = await targetGuild.members.fetch(member.id);
        if (!canManageTicket(member, ticket, targetMember)) return interaction.reply({ content: '❌ لا تملك الصلاحية!', ephemeral: true });

        await interaction.message.delete().catch(() => {});

        await setChannelPermissions(channel, channel.guild.roles.everyone.id, { ViewChannel: false });
        await setChannelPermissions(channel, ticket.creator, { ViewChannel: true, SendMessages: false });
        if (ticket.roleId) await setChannelPermissions(channel, ticket.roleId, { ViewChannel: true, SendMessages: false });
        if (ticket.claimedBy) await setChannelPermissions(channel, ticket.claimedBy, { ViewChannel: true, SendMessages: false });
        await channel.setParent(CLOSED_CATEGORY_ID).catch(() => {});
        
        ticket.closed = true;
        ticket.closedBy = member.id;
        saveTickets();
        
        await channel.setName(`🔒・${ticket.number}`);
        
        const closeEmbed = new EmbedBuilder()
            .setColor('#FFFF00')
            .setTitle('تم إغلاق التكت 🔒')
            .setDescription('يمكنك إعادة فتحه أو حذفه نهائياً.');
            
        const closeButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('reopen_ticket').setLabel('فتح التكت').setStyle(ButtonStyle.Success).setEmoji('🔓'),
            new ButtonBuilder().setCustomId('delete_ticket').setLabel('حذف التكت').setStyle(ButtonStyle.Danger).setEmoji('🗑')
        );
        
        await channel.send({ embeds: [closeEmbed], components: [closeButtons] });
    }

    else if (customId === 'delete_ticket') {
        await interaction.deferReply({ ephemeral: false });
        await interaction.editReply('سيتم حذف التكت بعد 5 ثواني 🗑');
        const messages = await fetchAllMessages(channel);
        const transcript = messages.map(m => `${m.author.tag} (${m.author.id}) [${m.createdAt.toLocaleString()}]: ${m.content}${m.attachments.size > 0 ? ' [Attachment]' : ''}`).join('\n');
        const transcriptBuffer = Buffer.from(transcript, 'utf-8');
        const logChannel = client.channels.cache.get(config.logChannel);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('سجل حذف تكت 🗑')
                .addFields(
                    { name: 'رقم التكت', value: `#${ticket.number}`, inline: true },
                    { name: 'صاحب التكت', value: `<@${ticket.creator}>`, inline: true },
                    { name: 'حذف بواسطة', value: `${member}`, inline: true },
                    { name: 'نوع التكت', value: ticket.type, inline: true }
                )
                .setTimestamp();
            await logChannel.send({ embeds: [logEmbed], files: [new AttachmentBuilder(transcriptBuffer, { name: `ticket-${ticket.number}.txt` })] }).catch(() => {});
        }
        setTimeout(async () => {
            await channel.delete().catch(() => {});
            tickets.delete(channel.id);
            saveTickets();
        }, 5000);
    }

    else if (customId === 'reopen_ticket') {
        await interaction.deferReply({ ephemeral: false });
        if (ticket.originalCategory) await channel.setParent(ticket.originalCategory).catch(() => {});
        await setChannelPermissions(channel, ticket.creator, { ViewChannel: true, SendMessages: true });
        ticket.closed = false;
        ticket.reopenedAt = new Date().toISOString();
        saveTickets();
        await channel.setName(`🎫・${ticket.number}`);
        await interaction.message.delete().catch(() => {});
        await interaction.editReply('✅ تم إعادة فتح التكت بنجاح');
    }

    else if (customId === 'confirm_add_member') {
        await interaction.deferReply({ ephemeral: false });
        const match = interaction.message.embeds[0].description.match(/<@!?(\d+)>/);
        const targetUserId = match ? match[1] : null;
        if (!targetUserId) return interaction.editReply('❌ فشل تحديد العضو!');
        await setChannelPermissions(channel, targetUserId, { ViewChannel: true, SendMessages: true });
        await interaction.editReply(`✅️ | تم إضافة العضو <@${targetUserId}> بواسطة ${interaction.user} بنجاح.`);
        setTimeout(() => interaction.message.delete().catch(() => {}), 2000);
    }
}

async function handleTicketActions(interaction) {
    const { channel, member } = interaction;
    const ticket = tickets.get(channel.id);
    const action = interaction.values[0];

    if (action === 'close_ticket') {
        const confirmEmbed = new EmbedBuilder().setColor('#FFA500').setTitle('تأكيد الإغلاق 🔒').setDescription('هل أنت متأكد من رغبتك في إغلاق هذا التكت؟');
        const confirmButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_close').setLabel('تأكيد الإغلاق').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
            new ButtonBuilder().setCustomId('cancel_close').setLabel('إلغاء العملية').setStyle(ButtonStyle.Secondary).setEmoji('❌')
        );
        return await interaction.reply({ embeds: [confirmEmbed], components: [confirmButtons] });
    }

    await interaction.deferReply({ ephemeral: true });

    if (action === 'add_member') {
        const userSelect = new UserSelectMenuBuilder().setCustomId('add_member_select').setPlaceholder('اختر العضو المراد إضافته').setMaxValues(1);
        await interaction.editReply({ components: [new ActionRowBuilder().addComponents(userSelect)] });
    } else if (action === 'copy_ticket') {
        const messages = await fetchAllMessages(channel);
        const transcript = messages.map(m => `${m.author.tag}: ${m.content}`).join('\n');
        await member.send({ content: '📝 نسخة من محادثة التكت:', files: [{ attachment: Buffer.from(transcript), name: `ticket-${ticket.number}.txt` }] }).catch(() => {});
        await interaction.editReply('✅ تم إرسال النسخة إلى الخاص بنجاح');
    } else if (action === 'call_ticket') {
        if (member.id === ticket.creator) {
            return await interaction.editReply('❌ لا يمكنك استدعاء نفسك!');
        }
        const targetGuild = client.guilds.cache.get(TARGET_GUILD_ID);
        const creator = await targetGuild.members.fetch(ticket.creator).catch(() => null);
        if (creator) {
            await creator.send(`🔔 تم استدعاؤك للتكت: ${channel.url}`).catch(() => {});
            await interaction.editReply('✅ تم إرسال الاستدعاء لصاحب التكت');
        } else {
            await interaction.editReply('❌ تعذر العثور على صاحب التكت');
        }
    }
}

async function handleMemberSelection(interaction) {
    const selectedUser = interaction.users.first();
    const confirmEmbed = new EmbedBuilder().setColor('#0099ff').setDescription(`هل أنت متأكد من إضافة ${selectedUser} إلى التكت؟`);
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('confirm_add_member').setLabel('تأكيد الإضافة').setStyle(ButtonStyle.Success).setEmoji('✅'),
        new ButtonBuilder().setCustomId('cancel_add_member').setLabel('إلغاء').setStyle(ButtonStyle.Danger).setEmoji('❌')
    );
    await interaction.reply({ embeds: [confirmEmbed], components: [row] });
}

module.exports = { initializeTicketsSystem, sendTicketPanel, handleInteraction };
