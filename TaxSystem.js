const TAX_CHANNEL_ID = '1413249301492138084';
const TAX_RATE = 0.05;
const MAX_AMOUNT = 999999999999;

function formatNumber(num) {
    return Math.abs(num).toLocaleString('en-US', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
    });
}

function parseAmount(input) {
    const regex = /^(\d+(\.\d+)?)([kKmMbB])?$/;
    const match = input.match(regex);

    if (!match) return NaN;

    let number = parseFloat(match[1]);
    const suffix = match[3] ? match[3].toLowerCase() : null;

    switch (suffix) {
        case 'k':
            number *= 1000;
            break;
        case 'm':
            number *= 1000000;
            break;
        case 'b':
            number *= 1000000000;
            break;
    }

    return number;
}

function calculateTaxInfo(amount) {
    const taxAmount = Math.ceil(amount * TAX_RATE);
    const receivedAmount = amount - taxAmount;
    const requiredAmount = Math.ceil(amount / (1 - TAX_RATE));
    
    return {
        original: amount,
        tax: taxAmount,
        received: receivedAmount,
        required: requiredAmount
    };
}

async function handleTaxCalculation(message) {
    if (message.channel.id !== TAX_CHANNEL_ID) {
        return;
    }

    const content = message.content.trim();
    const amount = parseAmount(content);
    
    if (isNaN(amount) || amount <= 0) {
        try {
            await message.reply("❌ | يرجى إرسال رقم صحيح فقط! (مثال: 100 أو 1k أو 2.5m)");
        } catch (error) {
            console.error('Error sending tax error message:', error);
        }
        return;
    }

    if (amount > MAX_AMOUNT) {
        try {
            await message.reply(`❌ | الحد الأقصى هو ${formatNumber(MAX_AMOUNT)} فقط.`);
        } catch (error) {
            console.error('Error sending max amount error message:', error);
        }
        return;
    }

    const taxInfo = calculateTaxInfo(amount);

    const replyMessage = 
`• 🪙 ضريبة مبلغ **${formatNumber(taxInfo.original)}** كردت

• 💳 كم بيسحب منك البوت: **(${formatNumber(taxInfo.tax)})**
• 💵 كم بتوصل إلى الشخص: **(${formatNumber(taxInfo.received)})**
• 💰 كم لازم تحول عشان يوصل المبلغ بالضبط: **(${formatNumber(taxInfo.required)})**`;

    try {
        await message.reply(replyMessage);
    } catch (error) {
        console.error('Error sending tax calculation reply:', error);
    }
}

module.exports = {
    handleTaxCalculation
};