const Discord = require('discord.js')

exports.run = async (client, message, args) => {
  if (global.config.owners.includes(message.author.id) === false) return message.channel.send(`❌・**Bu Komutu Sadece \`ArviS#0001\` Kullanabilir**`);
  let msg = message;
  
    let code = args.join(" ");
    if (!code) return message.channel.send("Çalıştırılacak Kodu Gir");
    
    const clean = (text) => {
        if (typeof text !== "string") text = require("util").inspect(text, { depth: 0 });
        text = text
            .replace(/`/g, "`" + String.fromCharCode(8203))
            .replace(/@/g, "@" + String.fromCharCode(8203))
            .replace(new RegExp(client.token, "g"), "arvisdatabase");

        return text;
    }
    try {
        var evaled = await (eval(code));
        return message.channel.send(clean(evaled), {
            code: "js",
            split: true
        }).catch(e => {
            return message.channel.send(e, {
                split: true,
                code: "xl"
            });
        });
    } catch(e) {
        return message.channel.send(e, {
            split: true,
            code: "xl"
        }).catch(err => {
            return message.channel.send(err, {
                split: true,
                code: "xl"
            });
        });
    }

}


exports.conf = {
   enabled: true,
    guildOnly: true,
    aliases: ['eval'],
    permLevel: 0
}

exports.help = {
    name: 'eval',
    description: 'Yazılan Kodu Çalıştırır',
    usage: 'eval <kod>'
}
