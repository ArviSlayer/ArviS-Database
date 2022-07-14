const Discord = require('discord.js')
const ChannelData = require('../models/Channel.js');

exports.run = async (client, message, args) => {

    if(global.config.owners.includes(message.author.id) === false) return;

    if (!args[0] || isNaN(args[0])) return message.channel.send(`❌・Geçerli Bir Kanal ID'si Belirt`);
  
      ChannelData.findOne({guildID: global.config.guild, channelID: args[0]}, async (err, channelData) => {
        if (!channelData) return message.channel.send("❌・Belirtilen Kanal ID'siyle İlgili Veri Bulunamadı");
        const kEmbed = new Discord.MessageEmbed()
        .setColor("#fd72a4")
        .setAuthor(message.member.displayName, message.author.avatarURL({dynamic:true}))
        .setFooter(global.config.footer, message.user.avatarURL({dynamic:true}))
        .setTimestamp()
        .setDescription(`Hey, **${channelData.name}** İsimli Kanalın Backup'u Kullanılarak, Sunucuda Aynı Ayar İle Oluşturulup, Kanalın Rol İzinleri Ayarlanacaktır \n\n Onaylıyorsan ✅ Emojisine Tıkla`)
  
        await message.channel.send({ embed: kEmbed }).then(msg => {
          msg.react("✅");
  
          const onay = (reaction, user) => reaction.emoji.name === "✅" && user.id === message.author.id;
  
          const collect = msg.createReactionCollector(onay, { time: 60000 });
  
          collect.on("collect", async r => {
            setTimeout(async function(){
  
              msg.delete().catch(err => console.log(`❌・Backup mesajı silinemedi`));
  
              message.guild.channels.create(channelData.name, {type: channelData.type}).then(channel => {
                if(channel.type === "voice"){
                  channel.setBitrate(channelData.bitrate);
                  channel.setUserLimit(channelData.userLimit);
                  channel.setParent(channelData.parentID);
                  channel.setPosition(channelData.position);

                  if(Object.keys(channelData.permissionOverwrites[0]).length > 0) {
                    for (let i = 0; i < Object.keys(channelData.permissionOverwrites[0]).length; i++) {
                      channel.createOverwrite(channelData.permissionOverwrites[0][i].permission, channelData.permissionOverwrites[0][i].thisPermOverwrites);
                    };
                  };

                }else if(channel.type === "category"){
                  if(Object.keys(channelData.permissionOverwrites[0]).length > 0) {
                    for (let i = 0; i < Object.keys(channelData.permissionOverwrites[0]).length; i++) {
                      channel.createOverwrite(channelData.permissionOverwrites[0][i].permission, channelData.permissionOverwrites[0][i].thisPermOverwrites);
                    };
                  };
                }else {
                  channel.setRateLimitPerUser(channelData.setRateLimitPerUser);
                  channel.setTopic(channelData.topic);
                  channel.setParent(channelData.parentID);
                  channel.setPosition(channelData.position);

                  if(Object.keys(channelData.permissionOverwrites[0]).length > 0) {
                    for (let i = 0; i < Object.keys(channelData.permissionOverwrites[0]).length; i++) {
                      channel.createOverwrite(channelData.permissionOverwrites[0][i].permission, channelData.permissionOverwrites[0][i].thisPermOverwrites);
                    };
                  };

                };
              });

              let logKanali = client.channels.cache.get(global.config.logChannel);
              if (logKanali) { logKanali.send(new Discord.MessageEmbed().setColor("#fd72a4").setAuthor('✅・Kanal Yedeği Kullanıldı', message.guild.iconURL({dynamic: true})).setDescription(`**${message.author.tag}** Tarafından **${channelData.name}** (**${channelData.channelID}**) Kanalının Yedeği Kurulmaya Başlandı! Kanal, Tekrar Aynı Ayarlarıyla Oluşturuluyor, Rol İzinleri Ekleniyor`).setFooter(global.config.footer).setTimestamp()).catch(); } else { message.guild.owner.send(new Discord.MessageEmbed().setColor("#fd72a4").setAuthor('✅・Kanal Yedeği Kullanıldı', message.guild.iconURL({dynamic: true})).setDescription(`**${message.author.tag}** Tarafından **${channelData.name}** (**${channelData.channelID}**) Kanalının Yedeği Kurulmaya Başlandı! Kanal Tekrar Aynı Ayar İle Oluşturuluyor, Rol İzinleri Ekleniyor`).setFooter(global.config.footer).setTimestamp()).catch(err => {}); };
            
            }, 450)
          })
        })
        });
    
}


exports.conf ={
   enabled: true,
    guildOnly: true,
    aliases: ['channelsetup', 'kanalsetup', 'kanal-kur', 'channel-kur', 'channel-setup'],
    permLevel: 0
}

exports.help = {
    name: 'kanalkur',
    description: 'Silinen Bir Kanalı Aynı İzinleri İle Kurar',
    usage: 'kanalkur <id>'
}
