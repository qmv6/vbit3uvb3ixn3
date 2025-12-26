const fs = require('fs');
const axios = require('axios');
const moment = require('moment-timezone');
const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');

const config = require('./config.json');

let dailyPrayerTimes = {}; 
let subscriptions = {};
let sentNotifications = {};
let lastCheckedMinute = -1;
let lastFetchTimestamp = null;

const arabicCountries = {
    "Egypt": "مصر", "Saudi Arabia": "السعودية", "Qatar": "قطر", "Kuwait": "الكويت", "Bahrain": "البحرين",
    "United Arab Emirates": "الإمارات", "Oman": "عمان", "Yemen": "اليمن", "Iraq": "العراق", "Syria": "سوريا",
    "Lebanon": "لبنان", "Jordan": "الأردن", "Palestine": "فلسطين", "Sudan": "السودان", "Morocco": "المغرب",
    "Algeria": "الجزائر", "Tunisia": "تونس", "Libya": "ليبيا", "Mauritania": "موريتانيا", "Somalia": "الصومال",
    "Pakistan": "باكستان", "Afghanistan": "أفغانستان", "Turkey": "تركيا", "Germany": "ألمانيا"
};

const countryEmojis = {
    "Egypt": "🇪🇬", "Saudi Arabia": "🇸🇦", "Qatar": "🇶🇦", "Kuwait": "🇰🇼", "Bahrain": "🇧🇭",
    "United Arab Emirates": "🇦🇪", "Oman": "🇴🇲", "Yemen": "🇾🇪", "Iraq": "🇮🇶", "Syria": "🇸🇾",
    "Lebanon": "🇱🇧", "Jordan": "🇯🇴", "Palestine": "🇵🇸", "Sudan": "🇸🇩", "Morocco": "🇲🇦",
    "Algeria": "🇩🇿", "Tunisia": "🇹🇳", "Libya": "🇱🇾", "Mauritania": "🇲🇷", "Somalia": "🇸🇴",
    "Pakistan": "🇵🇰", "Afghanistan": "🇦🇫", "Turkey": "🇹🇷", "Germany": "🇩🇪"
};

const prayerImages = {
    "Fajr": "./prayer_images/Fajir.png",
    "Dhuhr": "./prayer_images/Dhur.png",
    "Asr": "./prayer_images/Aser.png",
    "Maghrib": "./prayer_images/Maghrib.png",
    "Isha": "./prayer_images/Isha.png"
};

function loadPrayerTimes() {
    try {
        if (fs.existsSync('./prayerTimes.json')) {
            const data = JSON.parse(fs.readFileSync('./prayerTimes.json', 'utf8'));
            dailyPrayerTimes = data.prayerTimes || {};
            lastFetchTimestamp = data.timestamp || null;
            if (lastFetchTimestamp) {
                const lastFetchDate = new Date(lastFetchTimestamp);
                const lastDate = `${String(lastFetchDate.getDate()).padStart(2, '0')}-${String(lastFetchDate.getMonth() + 1).padStart(2, '0')}-${lastFetchDate.getFullYear()}`;
                console.log(`📂 تم تحميل مواقيت الصلاة بتاريخ ${lastDate}`);
            }
            return dailyPrayerTimes;
        } else {
            dailyPrayerTimes = {};
            lastFetchTimestamp = null;
            return {};
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل مواقيت الصلاة:', error.message || error);
        dailyPrayerTimes = {};
        lastFetchTimestamp = null;
        return {};
    }
}

function savePrayerTimes() {
    try {
        const saveData = {
            timestamp: lastFetchTimestamp,
            prayerTimes: dailyPrayerTimes
        };
        fs.writeFileSync('./prayerTimes.json', JSON.stringify(saveData, null, 2));
        console.log(`💾 تم حفظ مواقيت الصلاة (${Object.keys(dailyPrayerTimes).length} دولة)`);
    } catch (error) {
        console.error('❌ خطأ في حفظ مواقيت الصلاة:', error.message || error);
    }
}

function loadSubscriptions() {
    try {
        if (fs.existsSync('./userSubscriptions.json')) {
            const data = JSON.parse(fs.readFileSync('./userSubscriptions.json', 'utf8'));
            subscriptions = data.prayerTimes || {};
            console.log(`📂 تم تحميل ${Object.keys(subscriptions).length} اشتراك`);
            return subscriptions;
        } else {
            subscriptions = {};
            fs.writeFileSync('./userSubscriptions.json', JSON.stringify({ prayerTimes: {} }, null, 2));
            return {};
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل الاشتراكات:', error.message || error);
        subscriptions = {};
        return {};
    }
}

function saveSubscriptions() {
    try {
        const saveData = { prayerTimes: subscriptions };
        fs.writeFileSync('./userSubscriptions.json', JSON.stringify(saveData, null, 2));
        console.log(`💾 تم حفظ ${Object.keys(subscriptions).length} اشتراك`);
    } catch (error) {
        console.error('❌ خطأ في حفظ الاشتراكات:', error.message || error);
    }
}

function shouldFetchNewTimes() {
    if (!lastFetchTimestamp) {
        console.log('🔄 لم يتم جلب المواقيت من قبل، سيتم الجلب الآن');
        return true;
    }
    const now = Date.now();
    const hoursSinceLastFetch = (now - lastFetchTimestamp) / (1000 * 60 * 60);
    if (hoursSinceLastFetch >= 6) {
        console.log(`🔄 مضى ${hoursSinceLastFetch.toFixed(1)} ساعة منذ آخر جذب، سيتم جلب مواقيت جديدة`);
        return true;
    }
    const lastFetchDate = new Date(lastFetchTimestamp);
    const today = new Date();
    const lastDate = `${String(lastFetchDate.getDate()).padStart(2, '0')}-${String(lastFetchDate.getMonth() + 1).padStart(2, '0')}-${lastFetchDate.getFullYear()}`;
    const todayDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    if (lastDate !== todayDate) {
        console.log(`📅 تغيير التاريخ (آخر: ${lastDate}, اليوم: ${todayDate})، سيتم جلب مواقيت جديدة`);
        return true;
    }
    console.log(`⏱️ المواقيت حديثة (منذ ${hoursSinceLastFetch.toFixed(1)} ساعة)`);
    return false;
}

async function fetchPrayerTimes() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayFormatted = `${dd}-${mm}-${yyyy}`;
    console.log(`🔄 جلب مواقيت الصلاة ليوم ${todayFormatted}...`);
    if (!config.countries || Object.keys(config.countries).length === 0) {
        console.error('❌ لم يتم العثور على قائمة الدول في config.json');
        return;
    }
    const countries = Object.keys(config.countries);
    let successCount = 0;
    let failCount = 0;
    const newPrayerTimes = {};
    for (let i = 0; i < countries.length; i++) {
        const country = countries[i];
        const countryConfig = config.countries[country];
        if (!countryConfig || !countryConfig.lat || !countryConfig.lon) {
            console.error(`❌ إعدادات غير مكتملة لـ ${country}`);
            failCount++;
            continue;
        }
        const { lat, lon, method = 4 } = countryConfig;
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        let retries = 3;
        let success = false;
        while (retries > 0 && !success) {
            try {
                console.log(`🌍 جلب مواقيت ${country}... (المحاولة ${4 - retries}/3)`);
                const apiUrl = `http://api.aladhan.com/v1/timings/${todayFormatted}?latitude=${lat}&longitude=${lon}&method=${method}`;
                const response = await axios.get(apiUrl, { timeout: 15000 });
                if (response.data && response.data.data && response.data.data.timings) {
                    newPrayerTimes[country] = response.data.data.timings;
                    successCount++;
                    success = true;
                    console.log(`✅ تم جلب مواقيت ${country} بنجاح`);
                } else {
                    throw new Error('لا توجد بيانات في الرد');
                }
            } catch (error) {
                retries--;
                if (retries === 0) {
                    failCount++;
                    console.error(`❌ فشل جلب مواقيت ${country} بعد 3 محاولات:`, error.message || error);
                    if (dailyPrayerTimes[country]) {
                        newPrayerTimes[country] = dailyPrayerTimes[country];
                        console.log(`⚠️ استخدام مواقيت قديمة لـ ${country}`);
                        successCount++;
                    }
                } else {
                    console.log(`🔄 إعادة المحاولة لـ ${country} بعد خطأ: ${error.message || error}`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
    }
    if (successCount > 0) {
        dailyPrayerTimes = newPrayerTimes;
        lastFetchTimestamp = Date.now();
        savePrayerTimes();
        console.log(`✅ تم تحديث ${successCount} دولة بنجاح (فشل: ${failCount})`);
        const missingCountries = countries.filter(country => !dailyPrayerTimes[country]);
        if (missingCountries.length > 0) {
            console.warn(`⚠️ الدول المفقودة: ${missingCountries.join(', ')}`);
        }
    } else {
        console.error('❌ فشل جلب جميع المواقيت، سيتم استخدام البيانات المخزنة');
        if (Object.keys(dailyPrayerTimes).length === 0) {
            console.error('❌ لا توجد بيانات مخزنة!');
        }
    }
}

function getTodayPrayerTimes(country) {
    if (!dailyPrayerTimes[country]) {
        console.error(`⚠️ لا توجد مواقيت لـ ${country}`);
        return null;
    }
    return dailyPrayerTimes[country];
}

async function sendNotification(client, userId, country, prayer, type) {
    try {
        const user = await client.users.fetch(userId);
        if (!user) {
            console.log(`❌ لا يمكن العثور على المستخدم ${userId}`);
            return;
        }
        const arabicCountryName = arabicCountries[country] || country;
        const emoji = countryEmojis[country] || '🕌';
        const arabicPrayerName = config.prayerNames[prayer] || prayer;
        const imagePath = prayerImages[prayer]; 
        if (type === 'early') {
            await user.send(`${emoji} تبقى 10 دقائق على موعد ${arabicPrayerName} في ${arabicCountryName}!`);
            console.log(`🔔 تم إرسال إشعار مبكر لـ ${userId} لصلاة ${prayer}`);
        } else {
            if (imagePath && fs.existsSync(imagePath)) {
                const imageAttachment = new AttachmentBuilder(imagePath);
                await user.send({
                    content: `${emoji} حان الآن وقت ${arabicPrayerName} في ${arabicCountryName}!`,
                    files: [imageAttachment] 
                });
            } else {
                await user.send(`${emoji} حان الآن وقت ${arabicPrayerName} في ${arabicCountryName}!`);
            }
            console.log(`🕌 تم إرسال إشعار صلاة لـ ${userId} لصلاة ${prayer}`);
        }
    } catch (error) {
        console.error(`❌ خطأ في إرسال الإشعار لـ ${userId}:`, error.message || error);
    }
}

function checkPrayerTimes(client) {
    try {
        const now = new Date();
        const currentMinuteCheck = now.getMinutes();
        if (currentMinuteCheck === lastCheckedMinute) return;
        lastCheckedMinute = currentMinuteCheck;
        console.log(`⏰ التحقق من مواقيت الصلاة في الدقيقة ${currentMinuteCheck}`);
        if (now.getHours() === 0 && now.getMinutes() === 0) {
            sentNotifications = {};
            console.log("🕛 منتصف الليل، تم إعادة تعيين سجل الإشعارات.");
        }
        if (shouldFetchNewTimes()) {
            console.log("🔄 بدأ جلب المواقيت الجديدة...");
            fetchPrayerTimes();
        }
        for (const userId in subscriptions) {
            const country = subscriptions[userId];
            const todayPrayers = getTodayPrayerTimes(country); 
            if (todayPrayers && config.countries[country]) {
                if (!sentNotifications[userId]) {
                    sentNotifications[userId] = {};
                }
                const timezone = config.countries[country].timezone;
                const nowInCountry = moment().tz(timezone);
                const currentHour = nowInCountry.hours();
                const currentMinuteInCountry = nowInCountry.minutes();
                const currentTotalMinutes = currentHour * 60 + currentMinuteInCountry;
                console.log(`⏰ الوقت في ${country}: ${String(currentHour).padStart(2, '0')}:${String(currentMinuteInCountry).padStart(2, '0')}`);
                const mainPrayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
                for (const prayer of mainPrayers) {
                    const prayerTimeStr = todayPrayers[prayer];
                    if (!prayerTimeStr) {
                        console.log(`⚠️ لا يوجد وقت لصلاة ${prayer} في ${country}`);
                        continue;
                    }
                    const prayerTimeMatch = prayerTimeStr.match(/(\d{1,2}):(\d{1,2})/);
                    if (!prayerTimeMatch) {
                        console.log(`⚠️ تنسيق وقت غير صالح لصلاة ${prayer}: ${prayerTimeStr}`);
                        continue;
                    }
                    const prayerHour = parseInt(prayerTimeMatch[1], 10);
                    const prayerMinute = parseInt(prayerTimeMatch[2], 10);
                    const prayerTotalMinutes = prayerHour * 60 + prayerMinute;
                    let beforePrayerTotalMinutes = prayerTotalMinutes - 10;
                    if (beforePrayerTotalMinutes < 0) {
                        beforePrayerTotalMinutes += 1440;
                    }
                    console.log(`📿 ${prayer}: ${String(prayerHour).padStart(2, '0')}:${String(prayerMinute).padStart(2, '0')} (${prayerTotalMinutes} دقيقة)`);
                    console.log(`   قبل 10 دقائق: ${Math.floor(beforePrayerTotalMinutes/60)}:${beforePrayerTotalMinutes%60} (${beforePrayerTotalMinutes} دقيقة)`);
                    if (currentTotalMinutes === beforePrayerTotalMinutes) {
                        const earlyNotificationKey = `${prayer}_early_${country}_${todayPrayers[prayer]}`;
                        if (!sentNotifications[userId][earlyNotificationKey]) {
                            console.log(`🔔 إشعار مبكر لـ ${userId} لصلاة ${prayer} في ${country}`);
                            sendNotification(client, userId, country, prayer, 'early');
                            sentNotifications[userId][earlyNotificationKey] = true;
                        }
                    }
                    if (currentTotalMinutes === prayerTotalMinutes) {
                        const exactNotificationKey = `${prayer}_exact_${country}_${todayPrayers[prayer]}`;
                        if (!sentNotifications[userId][exactNotificationKey]) {
                            console.log(`🕌 إشعار صلاة لـ ${userId} لصلاة ${prayer} في ${country}`);
                            sendNotification(client, userId, country, prayer, 'exact');
                            sentNotifications[userId][exactNotificationKey] = true;
                        }
                    }
                }
            } else {
                console.log(`⚠️ خطأ في العثور على مواقيت ${country} للمستخدم ${userId}`);
            }
        }
    } catch (error) {
        console.error('❌ خطأ في التحقق من مواقيت الصلاة:', error.message || error);
    }
}

function initializePrayerSystem(client) {
    try {
        console.log("🔄 تهيئة نظام الصلوات...");
        loadPrayerTimes();
        loadSubscriptions();
        console.log(`📊 تم تحميل ${Object.keys(subscriptions).length} اشتراك`);
        console.log(`📊 تم تحميل ${Object.keys(dailyPrayerTimes).length} دولة`);
        checkPrayerTimes(client);
        setInterval(() => checkPrayerTimes(client), 60000);
        setInterval(() => {
            if (shouldFetchNewTimes()) {
                console.log("🔄 تحديث دوري للمواقيت كل 6 ساعات...");
                fetchPrayerTimes();
            }
        }, 6 * 60 * 60 * 1000);
        console.log('✅ نظام الصلوات اليومي يعمل.');
    } catch (error) {
        console.error('❌ خطأ في تهيئة نظام الصلوات:', error.message || error);
    }
}

async function sendPrayerMenu(message) {
    try {
        console.log(`📨 إرسال قائمة الصلوات بواسطة ${message.author.tag}`);
        const sortedCountries = Object.keys(arabicCountries).sort((a, b) => arabicCountries[a].localeCompare(arabicCountries[b], 'ar'));
        const chunkSize = 25;
        const countryChunks = [];
        for (let i = 0; i < sortedCountries.length; i += chunkSize) {
            countryChunks.push(sortedCountries.slice(i, i + chunkSize));
        }
        const rows = countryChunks.map((chunk, index) => {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`country_selection_${index}`)
                .setPlaceholder('اختر الدولة لتذكير مواقيت الصلاة')
                .addOptions(
                    chunk.map(country => ({
                        label: arabicCountries[country],
                        description: `تذكير بمواقيت الصلاة في ${arabicCountries[country]}`,
                        value: country,
                        emoji: countryEmojis[country]
                    }))
                );
            return new ActionRowBuilder().addComponents(selectMenu);
        });
        const resetButton = new ButtonBuilder()
            .setCustomId('reset_subscription')
            .setLabel('إلغاء الاشتراك')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌');
        const lastRow = new ActionRowBuilder().addComponents(resetButton);
        rows.push(lastRow);
        const embed = new EmbedBuilder()
            .setTitle('🕌 تذكير بمواقيت الصلاة')
            .setDescription('اختر دولة لتلقي تذكيرات بمواقيت الصلاة أو اضغط على زر "إلغاء الاشتراك" لحذف موقتك الحالي.')
            .setColor(config.embedColor)
            .setImage(config.embedImage)
            .setFooter({ text: 'يتم تحديث المواقيت تلقائياً كل 24 ساعة' });
        await message.channel.send({ embeds: [embed], components: rows });
        console.log('✅ تم إرسال قائمة الصلوات بنجاح');
    } catch (error) {
        console.error('❌ خطأ في إرسال قائمة الدول:', error.message || error);
    }
}

async function handlePrayerSelection(interaction) {
    try {
        console.log(`🤝 معالجة اختيار صلاة بواسطة ${interaction.user.tag}`);
        await interaction.deferReply({ ephemeral: true });
        const selectedCountry = interaction.values[0];
        const user = interaction.user;
        const userId = user.id;
        if (subscriptions[userId]) {
            await interaction.editReply({
                content: '❌️ لديك اشتراك حالي. يرجى الضغط على زر "إلغاء الاشتراك" أولاً.',
                ephemeral: true
            });
            return;
        }
        subscriptions[userId] = selectedCountry;
        saveSubscriptions();
        try {
            const arabicCountryName = arabicCountries[selectedCountry];
            const emoji = countryEmojis[selectedCountry];
            await user.send(`✅️ تم تفعيل التذكير بمواعيد الأذان في **${arabicCountryName} ${emoji}**.\nسيصلك إشعار قبل كل صلاة بـ 10 دقائق وعند وقت الصلاة.`);
            await interaction.editReply({
                content: 'تم الاشتراك بنجاح ✅، يرجى مراجعة رسائل الخاص.',
                ephemeral: true
            });
            console.log(`✅ تم الاشتراك لـ ${user.tag} في ${selectedCountry}`);
        } catch (dmError) {
            if (dmError.code === 50007) {
                await interaction.editReply({
                    content: '❌️ تم الاشتراك، لكن يرجى فتح الرسائل الخاصة لاستقبال التذكيرات.',
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: 'حدث خطأ أثناء معالجة طلبك.',
                    ephemeral: true
                });
            }
        }
    } catch (error) {
        console.error('❌ خطأ في معالجة اختيار الدولة:', error.message || error);
        await interaction.editReply({ content: 'حدث خطأ أثناء معالجة طلبك.', ephemeral: true });
    }
}

async function handleResetButton(interaction) {
    try {
        console.log(`🗑️ معالجة إلغاء اشتراك بواسطة ${interaction.user.tag}`);
        await interaction.deferReply({ ephemeral: true });
        const userId = interaction.user.id;
        if (subscriptions[userId]) {
            const countryName = arabicCountries[subscriptions[userId]] || subscriptions[userId];
            delete subscriptions[userId];
            saveSubscriptions();
            await interaction.editReply({
                content: `✅️ تم إلغاء اشتراكك في تذكيرات مواقيت الصلاة لـ ${countryName}.`,
                ephemeral: true
            });
            console.log(`✅ تم إلغاء اشتراك لـ ${interaction.user.tag}`);
        } else {
            await interaction.editReply({
                content: '❌️ لا يوجد لديك اشتراك حالي لإلغائه.',
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('❌ خطأ في معالجة زر الإلغاء:', error.message || error);
        await interaction.editReply({ content: 'حدث خطأ أثناء معالجة طلبك.', ephemeral: true });
    }
}

module.exports = {
    initializePrayerSystem,
    sendPrayerMenu,
    handlePrayerSelection,
    handleResetButton
};