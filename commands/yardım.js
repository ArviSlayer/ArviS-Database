const Discord = require("discord.js");

exports.run = async (client, message) => {

  const embed = new Discord.MessageEmbed()
    .setColor("#800000")
    .setImage("https://media.discordapp.net/attachments/997105193256747028/997108273188708473/unknown.png")
    .setFooter("❤️・ArviS")
    .addField(
      `Eval Komutu`,
      `\`,eval\``,
      true
    )
    .addField(
      `Kanalkur Komutu`,
      `\`,kanalkur\` `,
      true
    )
    .addField(
      `Rolkur Komutu`,
      `\`,rolkur\``,
      true
    )
  return message.channel.send(embed);
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['help'],
  permLevel: 0
};

exports.help = {
  name: "yardım",
  description: "Database Komut Menüsü",
  usage: "yardım"
};
