const { PermissionsBitField } = require("discord.js");
const path = require('path');

class AntiSpam {
  constructor() {
    this.spamTracker = new Map();
    this.messageHistory = new Map();
    this.SPAM_LIMIT = 4;
    this.SPAM_INTERVAL = 6000;
    this.MUTE_DURATION = 300000;
    this.IGNORED_CHANNELS = [];
    this.WHITELIST_ROLE = "1401433950337105990";
    this.LOG_FILE = path.join(__dirname, 'antispam.json');
  }

  async logAction(action) {
    try {
      console.log('إجراء مسجل:', JSON.stringify(action, null, 2));
    } catch (error) {
      console.error('حدث خطأ في تسجيل العملية:', error);
    }
  }

  async checkSpam(message) {
    if (message.author.bot || !message.guild) return false;
    
    if (message.member.roles.cache.has(this.WHITELIST_ROLE)) return false;
    
    if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return false;
    if (this.IGNORED_CHANNELS.includes(message.channel.id)) return false;

    const userId = message.author.id;
    const currentTime = Date.now();

    if (!this.messageHistory.has(userId)) {
      this.messageHistory.set(userId, []);
    }

    const userMessages = this.messageHistory.get(userId);
    userMessages.push({
      content: message.content,
      timestamp: currentTime,
      messageId: message.id,
      channelId: message.channel.id
    });

    const recentMessages = userMessages.filter(msg => (currentTime - msg.timestamp) < this.SPAM_INTERVAL);
    this.messageHistory.set(userId, recentMessages);
      
    const isSpam = this.areMessagesSpam(recentMessages);

    if (recentMessages.length >= this.SPAM_LIMIT && isSpam) {
      await this.punishUser(message, userId);
      return true;
    }

    return false;
  }

  areMessagesSpam(messages) {
    if (messages.length < this.SPAM_LIMIT) return false;

    const firstMessage = messages[0].content.toLowerCase().trim();
    return messages.every(msg => 
      msg.content.toLowerCase().trim() === firstMessage
    );
  }

  async punishUser(message, userId) {
    try {
      const userData = this.spamTracker.get(userId) || { muted: false };
      
      if (!userData.muted) {
        try {
          const userMessages = this.messageHistory.get(userId) || [];
          
          for (const msgData of userMessages) {
            try {
              const channel = message.guild.channels.cache.get(msgData.channelId);
              if (channel) {
                const msg = await channel.messages.fetch(msgData.messageId).catch(() => null);
                if (msg && msg.deletable) await msg.delete().catch(() => {});
              }
            } catch (err) {
              continue;
            }
          }

          if (message.member.moderatable) {
            await message.member.timeout(this.MUTE_DURATION, "Spamming");
            
            await this.logAction({
              type: "timeout",
              user: {
                id: message.author.id,
                username: message.author.username,
                tag: message.author.tag
              },
              channel: {
                id: message.channel.id,
                name: message.channel.name
              },
              moderator: "System",
              action: "timeout",
              duration: "5 دقائق",
              reason: "السبام",
              deletedMessages: userMessages.length,
              timestamp: new Date().toISOString()
            });

            await message.channel.send(`⚠️ ${message.author} تم إسكاتك لمدة 5 دقائق بسبب السبام!`).catch(() => {});
            
            this.spamTracker.set(userId, { muted: true });
            
            setTimeout(() => {
              this.spamTracker.delete(userId);
              this.messageHistory.delete(userId);
            }, this.MUTE_DURATION);
          }
        } catch (error) {
          console.error("حدث خطأ في تطبيق العقوبة:", error);
          await message.channel.send(`❌ لم أتمكن من معاقبة ${message.author} بسبب نقص الصلاحيات!`).catch(() => {});
        }
      }
    } catch (error) {
      console.error("حدث خطأ في نظام Anti-Spam:", error);
    }
  }
}

module.exports = new AntiSpam();