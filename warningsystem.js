const { PermissionsBitField } = require("discord.js");
const fs = require("fs").promises;
const path = require("path");

const WARNING_ROLES = {
  1: "1409178485934788658",
  2: "1409179571886231562",
  3: "1409179674852196483",
  4: "1409293924358553731"
};

const JAIL_NOTIFICATION_CHANNEL = "1410730391240708246";
const WARNINGS_CHANNELS_FILE = path.join(__dirname, "warningsChannels.json");
const WARNINGS_LOG_FILE = path.join(__dirname, "warninglog.json");
const SPECIAL_ADMIN_ID = "1239519557329223773";

const WARNING_MESSAGES = {
  1: (reason, guildName) => `⚠️ **لقد تلقيت تحذيرًا أول في سيرفر ${guildName}**\n\n` +
                `**السبب:** ${reason}\n\n` +
                `يرجى الالتزام بالقوانين لتجنب المزيد من العقوبات.`,
  2: (reason, guildName) => `⚠️ **لقد تلقيت تحذيرًا ثاني في سيرفر ${guildName}**\n\n` +
                `**السبب:** ${reason}\n\n` +
                `تم إسكاتك لمدة 10 دقائق. يرجى مراجعة سلوكك.`,
  3: (reason, guildName) => `⚠️ **لقد تلقيت تحذيرًا ثالث في سيرفر ${guildName}**\n\n` +
                `**السبب:** ${reason}\n\n` +
                `تم إسكاتك لمدة 20 دقائق. أي مخالفة أخرى ستؤدي لعقوبات أشد.`
};

(async () => {
  try {
    await fs.access(WARNINGS_LOG_FILE);
  } catch {
    await fs.writeFile(WARNINGS_LOG_FILE, JSON.stringify([], null, 2));
  }

  try {
    await fs.access(WARNINGS_CHANNELS_FILE);
  } catch {
    await fs.writeFile(WARNINGS_CHANNELS_FILE, JSON.stringify({ channels: [] }, null, 2));
  }
})();

async function applyTimeout(member, duration, reason) {
  try {
    await member.timeout(duration, reason);
    return true;
  } catch (error) {
    console.error(`❌ خطأ في تطبيق العقوبة: ${error.message}`);
    return false;
  }
}

let cachedChannels = null;
async function getAllowedChannels() {
  if (cachedChannels) return cachedChannels;
  
  try {
    const data = await fs.readFile(WARNINGS_CHANNELS_FILE, "utf8");
    const parsed = JSON.parse(data);
    cachedChannels = parsed.channels || [];
    return cachedChannels;
  } catch (err) {
    console.error("❌ خطأ في قراءة ملف قنوات التحذيرات:", err);
    return [];
  }
}

function updateChannelsCache(channels) {
  cachedChannels = channels;
}

async function readWarningsLog() {
  try {
    const data = await fs.readFile(WARNINGS_LOG_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("❌ خطأ في قراءة ملف سجل التحذيرات:", err);
    return [];
  }
}

async function writeWarningsLog(logData) {
  try {
    await fs.writeFile(WARNINGS_LOG_FILE, JSON.stringify(logData, null, 2));
  } catch (err) {
    console.error("❌ خطأ في كتابة ملف سجل التحذيرات:", err);
  }
}

function logWarning(action, moderator, target, warningLevel, reason = "") {
  readWarningsLog().then(logData => {
    const logEntry = {
      action,
      moderator: moderator.id,
      target: target.id,
      warningLevel,
      reason,
      timestamp: new Date().toISOString()
    };
    logData.push(logEntry);
    writeWarningsLog(logData);
  }).catch(console.error);
}

function canWarn(moderator, target) {
  if (moderator.id === SPECIAL_ADMIN_ID) return true;
  if (moderator.id === target.id) return false;
  if (target.permissions.has(PermissionsBitField.Flags.Administrator)) return false;
  
  const moderatorHighestRole = moderator.roles.highest.position;
  const targetHighestRole = target.roles.highest.position;
  
  return moderatorHighestRole > targetHighestRole;
}

module.exports = {
  async execute(message, args) {
    const sentMessage = await message.reply("جاري معالجة طلب التحذير...");

    let allowedChannels;
    try {
      allowedChannels = await getAllowedChannels();
    } catch (err) {
      console.error("❌ خطأ في قراءة ملف قنوات التحذيرات:", err);
      await sentMessage.edit("❌ حدث خطأ في نظام التحذيرات! الرجاء المحاولة لاحقاً.");
      setTimeout(() => sentMessage.delete().catch(console.error), 5000);
      return;
    }

    if (!allowedChannels.includes(message.channel.id)) {
      const channelsList = allowedChannels.map(id => `<#${id}>`).join(" أو ");
      await sentMessage.edit(`❌ أوامر التحذيرات تعمل فقط في ${channelsList}`);
      setTimeout(() => sentMessage.delete().catch(console.error), 5000);
      return;
    }

    if (args.length < 1) {
      await sentMessage.edit("❌ يجب تحديد العضو عن طريق المنشن أو الـ ID.");
      setTimeout(() => sentMessage.delete().catch(console.error), 5000);
      return;
    }
    
    let target;
    const targetArg = args[0];
    
    if (message.mentions.members.first()) {
      target = message.mentions.members.first();
    } else if (/^\d{17,19}$/.test(targetArg)) {
      try {
        target = await message.guild.members.fetch(targetArg);
      } catch (err) {
        console.error(err);
        target = null;
      }
    }
    
    if (!target) {
      await sentMessage.edit("❌ لم أتمكن من العثور على العضو. يرجى التأكد من كتابة المنشن أو الـ ID بشكل صحيح.");
      setTimeout(() => sentMessage.delete().catch(console.error), 5000);
      return;
    }

    if (!canWarn(message.member, target)) {
      await sentMessage.edit("❌ لا يمكنك تحذير عضو برتبة مساوية أو أعلى منك.");
      setTimeout(() => sentMessage.delete().catch(console.error), 5000);
      return;
    }

    if (target.id === message.author.id) {
      await sentMessage.edit("❌ لا يمكنك تحذير نفسك.");
      setTimeout(() => sentMessage.delete().catch(console.error), 5000);
      return;
    }

    const reason = args.slice(1).join(" ").trim();
    if (!reason) {
      await sentMessage.edit("❌ يجب عليك ذكر سبب التحذير.\nمثال: `-تحذير @العضو مخالفة القوانين`");
      setTimeout(() => sentMessage.delete().catch(console.error), 5000);
      return;
    }

    let currentWarningLevel = 0;
    for (let level = 4; level >= 1; level--) {
      if (target.roles.cache.has(WARNING_ROLES[level])) {
        currentWarningLevel = level;
        break;
      }
    }

    const newWarningLevel = currentWarningLevel + 1;
    let timeoutDuration;
    
    if (newWarningLevel === 2) {
      timeoutDuration = 10 * 60 * 1000;
    } else if (newWarningLevel === 3) {
      timeoutDuration = 20 * 60 * 1000;
    }

    let replyMessage;
    
    try {
      if (newWarningLevel <= 3) {
        if (WARNING_MESSAGES[newWarningLevel]) {
          target.send(WARNING_MESSAGES[newWarningLevel](reason, message.guild.name)).catch(() => {});
        }

        await target.roles.add(WARNING_ROLES[newWarningLevel]);
        
        if (timeoutDuration) {
          const timeoutSuccess = await applyTimeout(target, timeoutDuration, reason);
          if (!timeoutSuccess) {
            await sentMessage.edit("✅️ | تم تحذير العضو ولكن لم أتمكن من تطبيق الإسكات");
            return;
          }
        }
        
        replyMessage = `✅ **تم تحذير ${target.user.username}**. (تحذير رقم ${newWarningLevel})\nالسبب: __${reason}__`;
      } else if (newWarningLevel === 4) {
        await target.roles.add(WARNING_ROLES[4]);
        
        const jailChannel = message.guild.channels.cache.get(JAIL_NOTIFICATION_CHANNEL);
        if (jailChannel) {
          await jailChannel.send(
            `__نموذج ضروري تعبيه لما تسجن اي شخص__**\n\n` +
            `يوزر المسجون: ${target.user.username}\n\n` +
            `سبب السجن: ${reason}\n\n` +
            `دليل على السبب: ${message.url}\n\n` +
            `ملاحظة: في حال سجنت شخص ولم تعبي هذا النموذج سيتم تحذيرك**.`
          );
        }
        
        replyMessage = `**تم تحذير ${target.user.username} (تحذير رقم 4)\nالسبب:__ ${reason} __**`;
      } else {
        await sentMessage.edit(
          `🚨 | ${target.user.username} وصل إلى الحد الأقصى للتحذيرات\n` +
          `**السبب:** ${reason}\n` +
          `يرجى التواصل مع الإدارة`
        );
        return;
      }
      
      logWarning("add", message.author, target, newWarningLevel, reason);
      await sentMessage.edit(replyMessage);

    } catch (error) {
      console.error("❌ خطأ في نظام التحذيرات:", error);
      await sentMessage.edit("❌ حدث خطأ أثناء معالجة التحذير.");
    }
  },

  async removeWarning(message, args) {
    const sentMessage = await message.reply("جاري معالجة طلب إزالة التحذير...");

    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      await sentMessage.edit("❌ تحتاج إلى صلاحية Moderate Members لاستخدام هذا الأمر.");
      return;
    }

    if (args.length < 1) {
      await sentMessage.edit("❌ يجب تحديد العضو عن طريق المنشن أو الـ ID.");
      return;
    }
    
    let target;
    const targetArg = args[0];
    
    if (message.mentions.members.first()) {
      target = message.mentions.members.first();
    } else if (/^\d{17,20}$/.test(targetArg)) {
      try {
        target = await message.guild.members.fetch(targetArg);
      } catch (err) {
        console.error(err);
        target = null;
      }
    }
    
    if (!target) {
      await sentMessage.edit("❌ لم أتمكن من العثور على العضو. يرجى التأكد من كتابة المنشن أو الـ ID بشكل صحيح.");
      setTimeout(() => sentMessage.delete().catch(console.error), 5000);
      return;
    }

    if (!canWarn(message.member, target)) {
      await sentMessage.edit("❌ لا يمكنك إزالة تحذير عضو برتبة مساوية أو أعلى منك.");
      setTimeout(() => sentMessage.delete().catch(console.error), 5000);
      return;
    }

    const warningLevel = parseInt(args[1]);
    if (isNaN(warningLevel) || ![1, 2, 3, 4].includes(warningLevel)) {
      await sentMessage.edit("❌ يجب تحديد رقم التحذير المراد إزالته (1, 2, 3, أو 4)");
      return;
    }
    
    try {
      if (!target.roles.cache.has(WARNING_ROLES[warningLevel])) {
        await sentMessage.edit(`❌ هذا العضو ليس لديه تحذير من المستوى ${warningLevel}`);
        return;
      }
      
      const reason = args.slice(2).join(" ").trim();
      
      await target.roles.remove(WARNING_ROLES[warningLevel]);
      
      logWarning("remove", message.author, target, warningLevel, reason);
      
      await sentMessage.edit(
        `✅️ | تم إزالة تحذير ${warningLevel} من ${target}`
      );
    } catch (error) {
      console.error("❌ خطأ في إزالة التحذير:", error);
      await sentMessage.edit("❌ حدث خطأ أثناء إزالة التحذير.");
    }
  }
};