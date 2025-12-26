// slashCommands.js
const { SlashCommandBuilder } = require('discord.js');

function toSerifBold(str) {
    const offsetUpper = 0x1D400 - 65;
    const offsetLower = 0x1D41A - 97;
    const offsetDigits = 0x1D7CE - 48;
    
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        if (charCode >= 65 && charCode <= 90) {
            result += String.fromCodePoint(charCode + offsetUpper);
        } else if (charCode >= 97 && charCode <= 122) {
            result += String.fromCodePoint(charCode + offsetLower);
        } else if (charCode >= 48 && charCode <= 57) {
            result += String.fromCodePoint(charCode + offsetDigits);
        } else {
            result += str[i];
        }
    }
    return result;
}

const commandsCollection = {
    decoration: {
        data: new SlashCommandBuilder()
            .setName("decoration")
            .setDescription("تزيين نص بإضافات زخرفية")
            .addStringOption(opt => opt.setName("text").setDescription("النص المراد تزيينه").setRequired(true))
            .setDMPermission(true),
        async execute(interaction, client) {
            const text = interaction.options.getString("text");
            const decorated = toSerifBold(text);
            await interaction.reply({ content: decorated, ephemeral: false });
        }
    }
};

module.exports = commandsCollection;