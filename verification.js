const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ThreadAutoArchiveDuration } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');

const sessionsFile = path.join(__dirname, 'verification_sessions.json');
let verificationSessions = new Map();

function loadSessions() {
    try {
        if (fs.existsSync(sessionsFile)) {
            const data = fs.readFileSync(sessionsFile, 'utf8');
            const sessions = JSON.parse(data);
            verificationSessions = new Map(Object.entries(sessions));
            for (const [userId, session] of verificationSessions) {
                session.createdAt = new Date(session.createdAt);
            }
        }
    } catch (error) {
        verificationSessions = new Map();
    }
}

function saveSessions() {
    try {
        const sessionsObject = Object.fromEntries(verificationSessions);
        const data = JSON.stringify(sessionsObject, null, 2);
        fs.writeFileSync(sessionsFile, data, 'utf8');
    } catch (error) {}
}

function generateCaptchaCode(length = 5) {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function getRandomColor(alpha = 1) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r},${g},${b},${alpha})`;
}

async function generateCaptchaImage(code) {
    try {
        const width = 450;
        const height = 180;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < 45; i++) {
            const grayValue = Math.floor(Math.random() * 120);
            const opacity = Math.random() * 0.5 + 0.2;
            ctx.fillStyle = `rgba(${grayValue}, ${grayValue}, ${grayValue}, ${opacity})`;
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 20 + 5, 0, Math.PI * 2);
            ctx.fill();
        }

        for (let i = 0; i < 2100; i++) {
            ctx.fillStyle = getRandomColor(Math.random() * 0.42);
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.6, 0, Math.PI * 2);
            ctx.fill();
        }

        for (let i = 0; i < 265; i++) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.98)';
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2.6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * 25, Math.random() * height);
            ctx.bezierCurveTo(
                Math.random() * width, Math.random() * height,
                Math.random() * width, Math.random() * height,
                width - Math.random() * 25, Math.random() * height
            );
            ctx.stroke();
        }

        ctx.font = 'bold 85px "BurnedFont"';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        const charSpacing = 75;
        const startX = (width / 2) - ((code.length - 1) * charSpacing / 2);

        for (let i = 0; i < code.length; i++) {
            ctx.save();
            const x = startX + (i * charSpacing);
            const y = (height / 2) + (Math.random() * 36 - 18);
            ctx.translate(x, y);
            ctx.rotate((Math.random() - 0.5) * 0.5);
            
            ctx.fillStyle = '#000000';
            ctx.shadowColor = 'rgba(0,0,0,0.45)';
            ctx.shadowBlur = 8;
            ctx.fillText(code[i], 0, 0);
            
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3.2;
            ctx.beginPath();
            ctx.moveTo(-30, Math.random() * 22 - 11);
            ctx.lineTo(30, Math.random() * 22 - 11);
            ctx.stroke();
            ctx.restore();
        }

        ctx.lineWidth = 2.4;
        for (let i = 0; i < 30; i++) {
            ctx.strokeStyle = getRandomColor(0.58);
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.lineTo(Math.random() * width, Math.random() * height);
            ctx.stroke();
        }

        for (let i = 0; i < 10; i++) {
            ctx.strokeStyle = getRandomColor(0.68);
            ctx.lineWidth = 3.4;
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.bezierCurveTo(
                Math.random() * width, Math.random() * height, 
                Math.random() * width, Math.random() * height, 
                Math.random() * width, Math.random() * height
            );
            ctx.stroke();
        }

        const buffer = canvas.toBuffer('image/png');
        return { image: buffer, code: code };
    } catch (error) {
        return { image: null, code: code };
    }
}

module.exports = {
    name: 'verify',
    description: 'نظام التحقق',

    async initialize() {
        const fontPath = path.join(__dirname, 'font.ttf');
        if (fs.existsSync(fontPath)) {
            GlobalFonts.registerFromPath(fontPath, 'BurnedFont');
        }
        loadSessions();
    },

    async setupVerification(message) {
        const verifyEmbed = new EmbedBuilder()
            .setTitle('🔐 **أثبت نفسك**')
            .setDescription('من فضلك، أضغط على الزر أدناه ثم أتبع الخطوات لإثبات نفسك.')
            .setImage('https://i.postimg.cc/mD00MsQy/Picsart-25-12-19-13-35-36-359.jpg')
            .setFooter({ text: 'مجتمع ثلج يرحب بكم.' })
            .setColor('#0099ff');

        const verifyButton = new ButtonBuilder()
            .setCustomId('start_verification')
            .setLabel('Verify')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(verifyButton);
        await message.channel.send({ embeds: [verifyEmbed], components: [row] });
        if (message.deletable) await message.delete().catch(() => {});
    },

    async handleButton(interaction) {
        if (interaction.customId === 'start_verification') {
            await this.startVerificationProcess(interaction);
        }
    },

    async startVerificationProcess(interaction) {
        const userId = interaction.user.id;
        const member = await interaction.guild.members.fetch(userId);
        
        if (!member.roles.cache.has('1442621404770992189')) {
    return interaction.reply({
        content: '❌ | تم التحقق منك بالفعل.',
        ephemeral: true
    });
}
        
        if (verificationSessions.has(userId)) {
            const session = verificationSessions.get(userId);
            const threadExists = await interaction.guild.channels.fetch(session.threadId).catch(() => null);
            if (threadExists) {
                return interaction.reply({ content: '⚠️ لديك جلسة تحقق نشطة بالفعل في الثريد المخصص.', ephemeral: true });
            } else {
                verificationSessions.delete(userId);
                saveSessions();
            }
        }

        try {
            const thread = await interaction.channel.threads.create({
                name: `Captcha-${interaction.user.username}`,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
                type: ChannelType.PrivateThread
            });

            await thread.members.add(interaction.user.id);
            const captchaCode = generateCaptchaCode(5);
            
            verificationSessions.set(userId, {
                threadId: thread.id,
                captchaCode: captchaCode,
                createdAt: new Date(),
                attempts: 0,
                userId: userId,
                verified: false
            });
            saveSessions();

            const captchaData = await generateCaptchaImage(captchaCode);
            const msg1 = await thread.send(`لديك 5 دقائق، قم بإرسال الكود المكتوب في الصورة الآتية:`).catch(() => null);
            if (captchaData.image && msg1) {
                await thread.send({ files: [{ attachment: captchaData.image, name: 'captcha.png' }] }).catch(() => null);
            }

            setTimeout(async () => {
                const currentSession = verificationSessions.get(userId);
                if (currentSession && currentSession.threadId === thread.id && !currentSession.verified) {
                    const checkThread = await interaction.guild.channels.fetch(thread.id).catch(() => null);
                    if (checkThread) await checkThread.delete().catch(() => {});
                    verificationSessions.delete(userId);
                    saveSessions();
                }
            }, 300000);

            await interaction.reply({ content: '✅ تم إنشاء ثريد تحقق خاص بك!', ephemeral: true });
        } catch (error) {
            await interaction.reply({ content: '❌ حدث خطأ.', ephemeral: true });
        }
    },

    async handleThreadMessage(message) {
        if (!message.channel.isThread() || message.author.bot) return;
        const userId = message.author.id;
        const session = verificationSessions.get(userId);
        if (!session || session.threadId !== message.channel.id) return;

        if (message.content.trim().toUpperCase() === session.captchaCode) {
            try {
                session.verified = true;
                saveSessions();
                const member = await message.guild.members.fetch(userId);
                await message.reply('✅ **تم التحقق بنجاح**').catch(() => null);
                
                setTimeout(async () => {
                    await member.roles.remove('1442621404770992189').catch(() => {});
                    await member.roles.add('1408870577854349352').catch(() => {});
                    
                    setTimeout(async () => {
                        const finalThread = await message.guild.channels.fetch(message.channel.id).catch(() => null);
                        if (finalThread) await finalThread.delete().catch(() => {});
                        verificationSessions.delete(userId);
                        saveSessions();
                    }, 1000);
                }, 4000);
            } catch (error) {
                await message.channel.send('❌ حدث خطأ.').catch(() => null);
            }
        } else {
            session.attempts++;
            saveSessions();
            if (session.attempts >= 3) {
                await message.channel.send('❌ فشل التحقق. سيتم إغلاق الجلسة.').catch(() => null);
                setTimeout(async () => {
                    const failThread = await message.guild.channels.fetch(message.channel.id).catch(() => null);
                    if (failThread) await failThread.delete().catch(() => {});
                    verificationSessions.delete(userId);
                    saveSessions();
                }, 3000);
            } else {
                await message.channel.send(`❌ خطأ! تبقى ${3 - session.attempts} محاولات.`).catch(() => null);
            }
        }
    },

    async handleBotReady(client) {
        await this.initialize();
        client.on('threadDelete', (thread) => {
            for (const [userId, session] of verificationSessions.entries()) {
                if (session.threadId === thread.id) {
                    verificationSessions.delete(userId);
                    saveSessions();
                    break;
                }
            }
        });
        setInterval(() => {
            const now = Date.now();
            for (const [userId, session] of verificationSessions.entries()) {
                if (now - new Date(session.createdAt).getTime() > 300000) {
                    verificationSessions.delete(userId);
                    saveSessions();
                }
            }
        }, 30000);
    }
};