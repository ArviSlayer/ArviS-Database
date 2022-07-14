const Discord = require('discord.js');
const mongoose = require('mongoose');

const fs = require('fs');

const client = global.client = new Discord.Client({fetchAllMembers: true});
client.moment = global.moment = require('moment');

client.moment.locale("tr");
global.moment.locale("tr");

const RoleData = require('./models/Role.js');
const ChannelData = require('./models/Channel.js');

//-------------------------------------------------------------------------------------------------------------------------------------

client.config = global.config = {
    prefix: "PREFİXSİNİZ",

    status: "online",
    color: "#800000",
    botdurum: "Database",
    owners: ["BOT OWNER ID"],

    guild: "SUNUCU ID",
    logChannel: "LOG KANAL ID", 
    voiceChannel: "SES KANAL ID",

    token: "BOT TOKENİ",
    mongourl: "MONGODB URL'Sİ",
};

mongoose.connect( global.config.mongourl , { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
    if(err) return console.log("❌・Veri Tabanı Bağlantısı Kurulamadı");
    console.log("✅・Veri Tabanının Bağlantısı Başarıyla Kuruldu");
});

//-------------------------------------------------------------------------------------------------------------------------------------

client.on("ready", () => {
  const log = message => {
    console.log(`[BİLGİ] - ${message}`)
  };
  
  console.log(`✅・Database Komutlar Yüklendi`)
  client.commands = new Discord.Collection();
  client.aliases = new Discord.Collection();
  
    fs.readdir("./commands/", (err, files) => {
      if (err) console.error(err);
      log(`⚡️・${files.length} Komut Yükleniyor`);
      files.forEach(f => {
        let props = require(`./commands/${f}`);
        log(`⭐️・Yüklenen Komut: ${props.help.name}`);
        client.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
          client.aliases.set(alias, props.help.name);
        });
      });
    });
  
  client.elevation = message => {
    if (!message.guild) return;
    let permlvl = 0;
    if (client.config.owners.includes(message.author.id)) permlvl = 5;
    return permlvl;
  };
})

client.on("message", async (message) => {
  let client = message.client;
  let prefix = client.config.prefix;
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  let command = message.content.split(' ')[0].slice(prefix.length);
  let params = message.content.split(' ').slice(1);
  let perms = client.elevation(message);
  let cmd;
  if (client.commands.has(command)) {
    cmd = client.commands.get(command);
  } else if (client.aliases.has(command)) {
    cmd = client.commands.get(client.aliases.get(command));
  }
  if (cmd) {
    if (perms < cmd.conf.permLevel) return;
    cmd.run(client, message, params, perms);
  }
})

//-------------------------------------------------------------------------------------------------------------------------------------

function setRoleBackup() {
  let guild = client.guilds.cache.get(client.config.guild);
  if (guild) {
    guild.roles.cache.filter(r => r.name !== "@everyone" && !r.managed).forEach(role => {
      let roleChannelOverwrites = [];
      guild.channels.cache.filter(c => c.permissionOverwrites.has(role.id)).forEach(c => {
        let channelPerm = c.permissionOverwrites.get(role.id);
        let pushlanacak = { id: c.id, allow: channelPerm.allow.toArray(), deny: channelPerm.deny.toArray() };
        roleChannelOverwrites.push(pushlanacak);
      });

      RoleData.findOne({guildID: client.config.guild, roleID: role.id}, async (err, savedRole) => {
        if (!savedRole) {
          let newRoleSchema = new RoleData({
            _id: new mongoose.Types.ObjectId(),
            guildID: client.config.guild,
            roleID: role.id,
            name: role.name,
            color: role.hexColor,
            hoist: role.hoist,
            position: role.position,
            permissions: role.permissions,
            mentionable: role.mentionable,
            time: Date.now(),
            members: role.members.map(m => m.id),
            channelOverwrites: roleChannelOverwrites
          });
          newRoleSchema.save();
        } else {
          savedRole.name = role.name;
          savedRole.color = role.hexColor;
          savedRole.hoist = role.hoist;
          savedRole.position = role.position;
          savedRole.permissions = role.permissions;
          savedRole.mentionable = role.mentionable;
          savedRole.time = Date.now();
          savedRole.members = role.members.map(m => m.id);
          savedRole.channelOverwrites = roleChannelOverwrites;
          savedRole.save();
        };
      });
    });

    RoleData.find({guildID: client.config.guild}).sort().exec((err, roles) => {
      roles.filter(r => !guild.roles.cache.has(r.roleID) && Date.now()-r.time > 1000*60*60*24*3).forEach(r => {//1 saatte bir alır. Süreyi değiştirebilirsiinz.
        RoleData.findOneAndDelete({roleID: r.roleID});
      });
    });
    console.log(`⚠️・[${client.moment(Date.now()).format("L")}] Rol Veri Tabanı Düzenlendi`);
  };
};

function setChannelBackup() {
  let guild = client.guilds.cache.get(client.config.guild);
  if (guild) {
    guild.channels.cache.filter(kanal => kanal.deleted !== true).forEach(channel => {
      let permissionss = {};
      let sayi = Number(0);
      channel.permissionOverwrites.forEach((perm) => {
        let thisPermOverwrites = {};
        perm.allow.toArray().forEach(p => {
          thisPermOverwrites[p] = true;
        });
        perm.deny.toArray().forEach(p => {
          thisPermOverwrites[p] = false;
        });
        permissionss[sayi] = {permission: perm.id == null ? guild.id : perm.id, thisPermOverwrites};
        sayi++;
      })

      ChannelData.findOne({guildID: client.config.guild, channelID: channel.id}, async (err, savedChannel) => {
        if (!savedChannel) {
          if(channel.type === "voice"){
            let newChannelSchema = new ChannelData({
              _id: new mongoose.Types.ObjectId(),
              guildID: client.config.guild,
              channelID: channel.id,
              name: channel.name,
              parentID: channel.parentID,
              position: channel.position,
              time: Date.now(),
              type: channel.type,
              permissionOverwrites: permissionss,
              userLimit: channel.userLimit,
              bitrate: channel.bitrate
            });
            newChannelSchema.save();
          }else if(channel.type === "category"){
            let newChannelSchema = new ChannelData({
              _id: new mongoose.Types.ObjectId(),
              guildID: client.config.guild,
              channelID: channel.id,
              name: channel.name,
              position: channel.position,
              time: Date.now(),
              type: channel.type,
              permissionOverwrites: permissionss,
            });
            newChannelSchema.save();
          }else {
            let newChannelSchema = new ChannelData({
              _id: new mongoose.Types.ObjectId(),
              guildID: client.config.guild,
              channelID: channel.id,
              name: channel.name,
              parentID: channel.parentID,
              position: channel.position,
              time: Date.now(),
              nsfw: channel.nsfw,
              rateLimitPerUser: channel.rateLimitPerUser,
              type: channel.type,
              topic: channel.topic ? channel.topic : "😲・Bu Kanal ``ArviS Database``` Tarafından Kurtarıldı",
              permissionOverwrites: permissionss,
            });
            newChannelSchema.save();
          }
        } else {
          if(channel.type === "voice"){
            savedChannel.name = channel.name;
            savedChannel.parentID = channel.parentID;
            savedChannel.position = channel.position;
            savedChannel.type = channel.type;
            savedChannel.time = Date.now();
            savedChannel.permissionOverwrites = permissionss;
            savedChannel.userLimit = channel.userLimit;
            savedChannel.bitrate = channel.bitrate;
            savedChannel.save();
          }else if(channel.type === "category"){
            savedChannel.name = channel.name;
            savedChannel.position = channel.position;
            savedChannel.type = channel.type;
            savedChannel.time = Date.now();
            savedChannel.permissionOverwrites = permissionss;
            savedChannel.save();
          }else {
            savedChannel.name = channel.name;
            savedChannel.parentID = channel.parentID;
            savedChannel.position = channel.position;
            savedChannel.nsfw = channel.nsfw;
            savedChannel.rateLimitPerUser = channel.rateLimitPerUser;
            savedChannel.type = channel.type;
            savedChannel.time = Date.now();
            savedChannel.topic = channel.topic ? channel.topic : "😲・Bu Kanal ``ArviS Database``` Tarafından Kurtarıldı";
            savedChannel.permissionOverwrites = permissionss;
            savedChannel.save();
          }
        };
      });
    })

    ChannelData.find({guildID: client.config.guild}).sort().exec((err, channels) => {
      channels.filter(r => !guild.channels.cache.has(r.channelID) && Date.now()-r.time > 1000*60*60*24*3).forEach(r => {
        ChannelData.findOneAndDelete({channelID: r.channelID});
      });
    });
    console.log(`⚠️・[${client.moment(Date.now()).format("L")}] Kanal Veri Tabanı Düzenlendi`);
  };
};

//-------------------------------------------------------------------------------------------------------------------------------------

client.on('ready', async () => {
  client.user.setPresence({ activity: { name: global.config.botdurum }, status: global.config.status });

    let sesKanal = client.channels.cache.get(global.config.voiceChannel);
    if(sesKanal) sesKanal.join().catch(err => console.error("❌・Bot Ses Kanalına Bağlanamadı"));

    setInterval(() => {
        setRoleBackup();
        setChannelBackup();
    }, 1000*60*60*1);
})

client.login(global.config.token).then(arvis => console.log(`✅・${client.user.username}: Aktif`)).catch(err => console.log("❌・Database Giriş Yapamadı"));

//-------------------------------------------------------------------------------------------------------------------------------------