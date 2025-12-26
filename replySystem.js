const fs = require('fs');

const replyFilePath = './reply.json';

function loadReplies() {
    try {
        if (!fs.existsSync(replyFilePath)) {
            fs.writeFileSync(replyFilePath, JSON.stringify({}, null, 2));
            console.log(`✅ تم إنشاء ملف ${replyFilePath} بنجاح.`);
        }

        const data = fs.readFileSync(replyFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ خطأ في تحميل أو إنشاء ملف الردود:', error);
        return {};
    }
}

let replies = loadReplies();

function handleReply(message) {
    const content = message.content.trim();

    for (const trigger in replies) {
        if (content === trigger) {
            message.reply(replies[trigger]);
            return true;
        }
    }

    return false;
}

module.exports = {
    handleReply
};
