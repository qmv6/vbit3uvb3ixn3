const fs = require('fs');
const { PermissionsBitField } = require('discord.js');

let memberPoints = {};

function loadPoints() {
    try {
        if (fs.existsSync('./MemberPoints.json')) {
            const data = fs.readFileSync('./MemberPoints.json', 'utf8');
            return JSON.parse(data);
        } else {
            fs.writeFileSync('./MemberPoints.json', JSON.stringify({}, null, 2));
            return {};
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل نقاط الأعضاء:', error);
        return {};
    }
}

function savePoints() {
    try {
        fs.writeFileSync('./MemberPoints.json', JSON.stringify(memberPoints, null, 2));
    } catch (error) {
        console.error('❌ خطأ في حفظ نقاط الأعضاء:', error);
    }
}

function initializePointsSystem() {
    memberPoints = loadPoints();
    console.log('✅ نظام النقاط جاهز');
}

function hasPermission(member) {
    return member.permissions.has(PermissionsBitField.Flags.Administrator) || member.id === '1086728403660582932';
}

function addPoints(userId, points, message) {
    if (!hasPermission(message.member)) {
        message.reply({ content: '❌ تحتاج إلى صلاحية Administrator لاستخدام هذا الأمر.', ephemeral: true });
        return false;
    }

    if (!memberPoints[userId]) {
        memberPoints[userId] = 0;
    }

    memberPoints[userId] += points;
    savePoints();
    
    return true;
}

function removePoints(userId, points, message) {
    if (!hasPermission(message.member)) {
        message.reply({ content: '❌ تحتاج إلى صلاحية Administrator لاستخدام هذا الأمر.', ephemeral: true });
        return false;
    }

    if (!memberPoints[userId]) {
        memberPoints[userId] = 0;
    }

    memberPoints[userId] = Math.max(0, memberPoints[userId] - points);
    savePoints();
    
    return true;
}

function resetAllPoints(message) {
    if (!hasPermission(message.member)) {
        message.reply({ content: '❌ تحتاج إلى صلاحية Administrator لاستخدام هذا الأمر.', ephemeral: true });
        return false;
    }

    memberPoints = {};
    savePoints();
    
    return true;
}

function getPoints(userId) {
    return memberPoints[userId] || 0;
}

function getTopMembers(limit = 5) {
    const sortedMembers = Object.entries(memberPoints)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
    
    return sortedMembers;
}

module.exports = {
    initializePointsSystem,
    addPoints,
    removePoints,
    resetAllPoints,
    getPoints,
    getTopMembers,
    hasPermission
};