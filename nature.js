const Discord = require('discord.js');
const client = new Discord.Client({
  disableMentions: 'everyone' 
})
const http = require("http");
const token = 'TOKEN';
const prefix = 'n!';
const ytdl = require('ytdl-core')
const fetch = require('node-fetch')
const settings = {
  prefix: 'n!',
  token: 'TOKEN'
};

const Discord = require('discord.js');
const client = new Discord.Client();

client.once('ready', () => {
	console.log('準備完了！');
});

client.on('message', message => {
	if (message.content.match(/!pause/)) {
    let pause = message.content;
    pause = pause.replace(/!pause /g, "");
    message.channel.setRateLimitPerUser(pause)    
    client.channels.cache.get('休止メンバーの理由チャンネルID').send(`${client.user.name}が休止するそうです。\n**休止時間は${pause}です。**`)
	let role = message.guild.roles.cache.get("付けるID")
	message.member.roles.add(role)
  	.then(console.log)
  	.catch(console.error)
        
}
});
client.on('message', message => {
	if (message.content.match(/!dispause/)) {
    let dispause = message.content;
    dispause = dispause.replace(/!dispause /g, "");
    message.channel.setRateLimitPerUser(dispause) 
    client.channels.cache.get('休止メンバーの理由チャンネルID').send(`${client.user.name}が再開をするそうです。\n**休止時間は${dispause}でした。**`)
	let role = message.guild.roles.cache.get("外すID")
	message.member.roles.remove(role)
  	.then(console.log)
  	.catch(console.error)
}
});

client.login('TOKEN');

client.on('ready', () => {
    console.log('ログインに成功しました。');
});
// music
const queue = new Map();

client.once("ready", () => {
  console.log("Ready!");
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else {
    message.channel.send("");
  }
});

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "動画が存在しません！\nやり方:n!play [youtubeのurl]"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "あなたの音声チャンネルに参加して話すには許可が必要です！"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
   };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} キューに追加されました！`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "音楽を停止するには音声チャンネルにいる必要があります！"
    );
  if (!serverQueue)
    return message.channel.send("スキップできる曲はありません！");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "音楽を止めるには音声チャンネルにいる必要があります！"
    );
    
  if (!serverQueue)
    return message.channel.send("止められる曲はありません！");
    
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`スタート(Start playing): **${song.title}**`);
}

// const ytdl = require('ytdl-core')
 
client.on('message', async message => {
   // メッセージが "!yt" からはじまっていてサーバー内だったら実行する
   if (message.content.startsWith('n!yt') && message.guild) {
     // メッセージから動画URLだけを取り出す
     const url = message.content.split(' ')[1]
     // まず動画が見つからなければ処理を止める
     if (!ytdl.validateURL(url)) return message.reply('動画が存在しません！')
     // コマンドを実行したメンバーがいるボイスチャンネルを取得
     const channel = message.member.voice.channel
     // コマンドを実行したメンバーがボイスチャンネルに入ってなければ処理を止める
     if (!channel) return message.reply('先にボイスチャンネルに参加してください！')
     // チャンネルに参加
     const connection = await channel.join()
     // 動画の音源を取得
     const stream = ytdl(ytdl.getURLVideoID(url), { filter: 'audioonly' })
     // 再生
     const dispatcher = connection.play(stream)
     
     // 再生が終了したら抜ける
     dispatcher.once('finish', () => {
       channel.leave()
     })
   }
})

// 処罰系
client.on('message', async message => {
  if (message.content.startsWith('n!kick') && message.guild) {
  	if (message.mentions.members.size !== 1)
  	　return message.channel.send('Kickするメンバーを1人指定してください\nn!kick [ID or mention]')
    const member = message.mentions.members.first()
    if (!member.kickable) return message.channel.send('このユーザーをKickすることができません\n考えられる理由:あなたの権限がKickする人よりも低い')
    
    await member.kick()
    
    message.channel.send(`${member.user.tag}をKickしました`)
  }
});

client.on('message', async message => {
  if (message.content.startsWith('n!ban') && message.guild) {
    if (!message.member.hasPermission('BAN_MEMBERS')) return message.channel.send('BANする権限がありません')
    if (message.mentions.members.size !== 1) return message.channel.send('BANするメンバーを1人指定してください\nn!ban [ID or mention]')
    const member = message.mentions.members.first()
    if (!member.bannable) return message.channel.send('このユーザーをBANすることができません\n考えられる理由:あなたの権限がBANする人よりも低い')
         
    await member.ban()
         
    message.channel.send(`${member.user.tag} をBANしました`)
  }
});

// Admin管理系
const { inspect } = require("util");
client.on("message", async message => {
  const args = message.content.split(" ").slice(1);

  if (message.content.startsWith("n!run")) {
    
    if (message.author.id !== "872748965194518548")
      return message.channel.send("このコマンドは管理者しか使えないよぉ〜えっ？使えると思ったの！？\nお前ごときじゃ無理だよwww");
    try {
      const code = args.join(" ");
      let evaled = eval(code);
    
      if (typeof evaled !== "string") evaled = require("util").inspect(evaled);
    
      message.channel.send(inspect(evaled), { code: "xl" });
    } catch (err) {
      message.channel.send({
        embed: {
          title: "実行エラー",
          description: "エラー内容:\n\`\`\`xl\n" + inspect(err) + "\`\`\`",
          color: 961818,
          timestamp: new Date(),
          footer: {
            icon_url: client.user.avatarURL,
            text: "embed"
          }
        }
      });
    } //`\`エラー\nエラー内容:\` \`\`\`xl\n${inspect(err)}\n\`\`\``
  }
});
     
client.on("message", async message => {
  if (message.content === "n!reload") {
    if (message.author.id != AdminID) return;
   message.channel.send("再起動を実行しました。");
   client.destroy();
   client.login("TOKEN"); 
    // バグる
  }
});

client.on("message", async message =>{
  if (message.content === "n!serverlist") {
    if(message.author.id === "ID") return message.channel.send("あなたはBOT管理者ではありません");
    // ↓ここに指定した文字列がボットの発言になる
    let serverlist = client.guilds.cache.map(a => a.name);
          const aaa = await message.channel.send('```\n' + serverlist + '\n```');
          message.channel.send('server数' + "**" + client.guilds.cache.size + "**")
  }

})

client.on('ready', message => {
  console.log('setActivityの起動が終わりました。');
  client.user.setActivity('n!help | ping:' + client.ws.ping + 'ms | ' + client.guilds.cache.size + 'servers', { type: "PLAYING" });
       /*
        typeの値:
            https://discord.js.org/#/docs/main/stable/class/ClientUser?scrollTo=setActivity
                'PLAYING': 〇〇 をプレイ中
                'STREAMING': 〇〇 を配信中
                'WATCHING': 〇〇 を視聴中
                'LISTENING': 〇〇 を再生中
        */
});

client.on('ready', () => {

  const ch_name = "BOT起動お知らせ";

  client.channels.forEach(channel => {
      if (channel.name === ch_name) {
          channel.send("NatureBot(890419404398034955)起動しました")
          return;
      }
      return;
  });
})

// help系
client.on("message", message => {
  if (message.content === "n!help" && message.guild) {
  message.channel.send({
          embed: {
            title: "ヘルプ画面",
            description:
              "`n!help <コマンド名>`コマンドの情報を手に入れることができます。(未実装)",
            color: 7506394,
            timestamp: new Date(),
            footer: {
              icon_url: client.user.avatarURL,
              text: ""
            },
            thumbnail: {
              url:
                ""
            },
            fields: [
              {
                name: ":one:基本情報",
                value: "`n!about`,`n!ping`"
              },
              {
                name: ":two:サーバー機能",
                value: "`n!serverinfo`,`n!topmsg`"
              },
              {
                name: ":three:便利機能",
                value: "`n!poll`,`n!add`(+),`n!out`(-),`n!hang`(x),`n!divide`(÷),`n!pcstatus`,`n!avatar`,\n`n!stimer`,`n!mtimer`,`n!htimer`,`n!shorturl`"
              },
              {
                name: ":four:ゲーム機能",
                value: "`n!uranai`,`n!coin`"
              },
              {
                name: ":five:チャンネル系",
                value: "`n!createch`,`n!archive`"
              },
              {
                name: ":six:vcチャンネル系",
                value: "`n!play`"
              },
              {
                name: "問い合わせ",
                value: "`n!report [report about]"
              },
              {
                name: "links",
                value:
                  'Discord,Twitter,Github'
              }
            ]
          }
});
}
});
client.on("message", message => {
  if (message.content === "n!about" && message.guild) {
  message.channel.send({
          embed: {
            title: "About this bot",
            color: 15105570,//embedの色
            timestamp: new Date(),
            footer: {
              icon_url: client.user.avatarURL,
              text: message.channel.name
            },
            fields: [
            {
              name: "<:staff:891093241984843837>開発者",
              value: "[rakku_chan#6126](https://twitter.com/kinoko1216)\n[Akkey57492#7319]()",
              inline: true
            },
            {
              name: "<:staff:891093241984843837>開発所属チーム",
              value: "Kinoko-Team",
              inline: true
            },
            {
              name: "<:serverdate:891094042824294420>作成日",
              value: "2021/09/22",
              inline: true
            },
            {
              name: "<:discord:891094694291996712>公式Discord鯖",
              value: "準備中...",
              inline: true
            },
            {
              name: "<:checkmark:891094106237993011>このプロジェクトを立ち上げるために関わった人",
              value: "[Thorin#8382](https://twitter.com/ThornBoneThrown)\n[Googlefan#3846](https://twitter.com/advictrius85)",
              inline: true
            },
            {
              name: "<:checkmark:891094106237993011>ソースとして使っているもの",
              value: "*https://scrapbox.io/discordjs-japan\n*https://www.google.com/" ,
              inline: true
            },
            ]
          }
  });
  }
});  

client.on("message", message => {
  if (message.content === "n!ping" && message.guild) {
  message.channel.send({
          embed: {
            title: "Ping値",
            color: 13,//embedの色
            timestamp: new Date(),
            footer: {
              icon_url: client.user.avatarURL,
              text: "ping"
            },
            fields: [
            {
              name: "Pong!",
              value: client.ws.ping,
              inline: true
            }
          ]
        }
});
}
});  
// channel
// channel系
client.on("message", message => {
  if (message.content === "n!chabout" && message.guild) {
  message.channel.send({
          embed: {
            title: "チャンネル詳細",
            color: 15105570,//embedの色
            timestamp: new Date(),
            footer: {
              icon_url: client.user.avatarURL,
              text: message.channel.name
            },
            fields: [
            {
              name: "チャンネル名",
              value: message.channel.name,
              inline: true
            },
            {
              name: "チャンネルID",
              value: message.channel.id,
              inline: true
            },
            {
              name: "作成日時",
              value: message.channel.Date,
              inline: true
            },
            {
              name: "トピック",
              value: message.channel.topic,
              inline: true
            },
            {
              name: "NSFW判定",
              value: message.channel.nsfw,
              inline: true
            },
            {
              name: "権限",
              value: "不明" ,
              inline: true
            },
            ]
          }
  });
  }
});  


client.on("message", async message => { 
  if (message.content.startsWith("n!clear")) { 
    //clear
    if (!message.member.hasPermission('MANAGE_MESSAGES')) return message.channel.send('権限がありません')
    const args = message.content.split(" ").slice(1).join(""); //コマンド空白数字の数字の部分取得
    if (!args) return message.channel.send("エラー発生:空白がない または数字が書いていません\nn!clear [1~30]"); //空白がないまたは数字がない場合表示
    const messages = await message.channel.messages.fetch({ limit: args }); //していした数を削除
    message.channel.bulkDelete(messages);
    const sdsd = await message.channel.send( //指定席
      //削除が終わったら表示
      args + //削除数
      "件のメッセージを消しました" +
      message.author.tag + "(" + message.author.id + ")" + //コマンドを実行した人
        "がコマンド実行"
    );
    sdsd; //表示
  }
});

// gban系
client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith("n!")) return;
  if (message.author.id === "872748965194518548||880689075051454504") return message.channel.send("BOT管理者の使用権限がありません。");
  const args = message.content.slice(2).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
   if (command === "gban") {
     const gbanid = args[0];
     const reason = message.content.replace(`n!gban ${gbanid}`, "");
     const m = await message.channel.send("GBANを執行しています...Loading Now...");
     client.guilds.forEach(g => {
      try {
        if (g.me.hasPermission("BAN_MEMBERS")) {
          g.ban(gbanid, {reason: `BOTによりGBANされました。理由: ${reason}`});
        } else {
          console.log(g.name + "でのGBANに失敗しました。");
        }
      } catch(err) {
        client.channels.get("ErrorSendChannelID").send("GBAN執行エラー: " + g.name + "(" + g.id + ")" + "でのGBANの執行に失敗しました。\n" + err);
      }
     });
     client.channels.filter(ch => ch.name == "nature-gbans").forEach(ch => { // この指定のチャンネルにEmbed表示でGBANの表示を出す。
      try {
      ch.send({embed: {
                title: "NatureBOT | GBAN",
                description: "BOTが危険なユーザーをGBANしました。",
                fields: [
                  {
                    name: "ユーザー名",
                    value: `<@!${gbanid}>`
                  },
                  {
                    name: "ユーザーID",
                    value: gbanid
                  },
                  {
                    name: "理由",
                    value: reason
                  }
                ],
                color: 0xdc143c
              }})
      } catch(err) {
        client.channels.get("ErrorSendChannelID").send("GBANお知らせ送信エラー: " + ch.guild.name + "(" + ch.guild.id + ")" + "でのGBANのお知らせの送信に失敗しました。\n" + err);
      }
     })
     m.edit("GBAN執行が完了しました。")
   }

  if (command === "ungban") {
     const gbanid = args[0];
     const reason = message.content.replace(`n!ungban ${gbanid}`, "");
    const m = await message.channel.send("GBAN解除しています...");
     client.guilds.forEach(g => {
      try {
        if (g.me.hasPermission("BAN_MEMBERS")) { // BAN権限必要
          g.unban(gbanid, {reason: `BOTによりGBAN解除されました。理由: ${reason}`});
        } else {
          console.log(g.name + "でのGBANに失敗しました。");
        }
      } catch(err) {
        client.channels.get("ErrorSendChannelID").send("GBAN執行エラー: " + g.name + "(" + g.id + ")" + "でのGBANの執行に失敗しました。\n" + err);
      }
     });
    client.channels.filter(ch => ch.name == "nature-gbans").forEach(ch => {
      try {
      ch.send({embed: {
                title: "NatureBOT | GBAN",
                description: "BOTがユーザーのGBANを解除しました。",
                fields: [
                  {
                    name: "ユーザー名",
                    value: `<@!${gbanid}>`
                  },
                  {
                    name: "ユーザーID",
                    value: gbanid
                  },
                  {
                    name: "理由",
                    value: reason
                  }
                ],
                color: 0x6495ed
              }})
      } catch(err) {
        client.channels.get("ErrorSendChannelID").send("GBANお知らせ送信エラー: " + ch.guild.name + "(" + ch.guild.id + ")" + "でのGBANのお知らせの送信に失敗しました。\n" + err);
      }
     })
    m.edit("GBAN解除が完了しました。")
   }
});

// 便利
client.on('message', async (message) => {
  const args = message.content.split(' ').slice(1)

  if (message.content.startsWith('n!trans')) {
    const source = encodeURIComponent(args.shift())
    const target = encodeURIComponent(args.shift())
    const text = encodeURIComponent(args.join(' '))

    const content = await fetch(`https://script.google.com/macros/s/AKfycbweJFfBqKUs5gGNnkV2xwTZtZPptI6ebEhcCU2_JvOmHwM2TCk/exec?text=${text}&source=${source}&target=${target}`).then(res => res.text())
    message.channel.send(content)
  }
})
client.on('message', async message => {
  if (!message.content.startsWith(prefix)) return
  const [command, ...args] = message.content.slice(prefix.length).split(' ')
  if (command === 'add') {
    const [a, b] = args.map(str => Number(str))
    message.channel.send(`${a} + ${b} = ${a + b}`)
  }
})

client.on('message', async message => {
  if (!message.content.startsWith(prefix)) return
  const [command, ...args] = message.content.slice(prefix.length).split(' ')
  if (command === 'out') {
    const [a, b] = args.map(str => Number(str))
    message.channel.send(`${a} - ${b} = ${a - b}`)
  }
})

client.on('message', async message => {
  if (!message.content.startsWith(prefix)) return
  const [command, ...args] = message.content.slice(prefix.length).split(' ')
  if (command === 'hang') {
    const [a, b] = args.map(str => Number(str))
    message.channel.send(`${a} * ${b} = ${a * b}`)
  }
})

client.on('message', async message => {
  if (!message.content.startsWith(prefix)) return
  const [command, ...args] = message.content.slice(prefix.length).split(' ')
  if (command === 'divide') {
    const [a, b] = args.map(str => Number(str))
    message.channel.send(`${a} / ${b} = ${a / b}`)
  }
})

client.on('message', async message => {
  if (!message.content.startsWith(prefix)) return
  const [command, ...args] = message.content.slice(prefix.length).split(' ')
  if (command === "poll") {
    message.delete();
    const [title, ...choices] = args;
    if (!title) return message.channel.send("タイトルを指定してください");
    const emojis = [
      "🇦","🇧","🇨","🇩","🇪","🇫","🇬","🇭","🇮","🇯","🇰","🇱","🇲","🇳","🇴","🇵","🇶","🇷","🇸","🇹"
    ];
    if (choices.length < 2 || choices.length > emojis.length)
      return message.channel.send(
        `選択肢は2から${emojis.length}つを指定してください`
      );
    const poll = await message.channel.send({
      embed: {
        color: 0x7ef5bb,
        title: title,
        description: choices.map((c, i) => `${emojis[i]} ${c}`).join("\n"),
        footer: {
          text: message.author.icon + "この人がコマンドを打った人だよ〜：" + message.author.username + "(" + message.author.id + ")"
        }
      }
    });
    emojis.slice(0, choices.length).forEach(emoji => poll.react(emoji));
  }
  }
)

client.on('message', message => {
  if (message.content === 'n!pcstatus') {
    const userStatus = message.author.presence.clientStatus

    if (!userStatus) {
      return message.channel.send('どのデバイスからもアクセスされていません。')
    }
    
    message.channel.send(
      [
        'desktop: ' + (userStatus.desktop || 'offline'),
        'mobile: ' + (userStatus.mobile || 'offline'),
        'web: ' + (userStatus.web || 'offline'),
      ].join('\n')
    )
  }
})

client.on('message', message => {
  if (message.content === 'n!avatar') {
    message.channel.send(message.author.avatarURL() || 'アバターが設定されてないよ。')
  }
})

client.on('message', message => {
  if (!message.content.startsWith(prefix)) return
  const [command, ...args] = message.content.slice(prefix.length).split(' ')

  if (command === 'stimer') {
    // 引数から待ち時間を取り出す
    const seconds = Number(args[0])
    message.channel.send(`タイマーを${seconds}秒に設定しました。`)
    setTimeout(() => {
      message.reply(`${seconds}秒経ちました`)
    }, seconds * 1000) // setTimeoutに指定するのはミリ秒なので秒数に1000を掛ける
  }
})

client.on('message', message => {
  if (!message.content.startsWith(prefix)) return
  const [command, ...args] = message.content.slice(prefix.length).split(' ')

  if (command === 'mtimer') {
    // 引数から待ち時間を取り出す
    const minutes = Number(args[0])
    message.channel.send(`タイマーを${minutes}分に設定しました。`)
    setTimeout(() => {
      message.reply(`${minutes}分経ちました`)
    }, minutes * 10000) // setTimeoutに指定するのはミリ秒なので秒数に1000を掛ける
  }
})

// game系
client.on('message', message => {
  if(message.content === 'n!uranai'){
  var array = ["凶　えぇ、、、", "小吉　まあ、がんば", "中吉　普通で草", "吉　おめでと。", "大吉　おめでと。"];
  message.channel.send({
    embed: {
      description: array[Math.floor(Math.random() * array.length)],
      color: 16757683,
    }
  })
  console.log(array[Math.floor(Math.random() * array.length)]);
  }
});

client.on('message', message => {
  if(message.content === 'n!coin'){
  var array = ["📀omote　君の勝ち！おめでとう🎉", "💿ura　君の負け...ペプシ買ってほしいな..."];
  message.channel.send({
    embed: {
      description: array[Math.floor(Math.random() * array.length)],
      color: 16757683,
    }
  })
  console.log(array[Math.floor(Math.random() * array.length)]);
  }
});

client.on('message', message => {
  if(message.content === 'n!dice'){
    var array = ["**1**ですよ", "**2**ですよ", "**3**ですよ", "**4**ですよ", "**5**ですよ","**6**ですよ",];
  message.channel.send({
    embed: {
      description: array[Math.floor(Math.random() * array.length)],
      color: 16757683,
    }
  })
  console.log(array[Math.floor(Math.random() * array.length)]);
  }
})

// コマンドなしの起動
client.on("message", async message => {
  if (message.author.id === "302050872383242240") {
    if (message.embeds[0].color == "2406327" && message.embeds[0].url == "https://disboard.org/" && (message.embeds[0].description.match(/表示順をアップしたよ/) || message.embeds[0].description.match(/Bump done/) || message.embeds[0].description.match(/Bump effectué/) || message.embeds[0].description.match(/Bump fatto/) || message.embeds[0].description.match(/Podbito serwer/) || message.embeds[0].description.match(/Успешно поднято/) || message.embeds[0].description.match(/갱신했어/) || message.embeds[0].description.match(/Patlatma tamamlandı/))) {
        const m = await message.channel.send("!d bumpを確認(''◇'')ゞ");
        m.delete({ timeout: 7200000 });
        setTimeout(() => { message.channel.send("!d bumpの時間やで～"); }, 7200000);
    }
  }
  if (message.webhookID && message.webhookID === '761562078095867916') {
    if (message.embeds[0].color === 7506394) {
        const unoti = await message.channel.send("Upを確認(''◇'')ゞ")
        unoti.delete({ timeout: 60000 });
        setTimeout(() => {
            message.channel.send("/dissoku upの時間やで～");
        }, 3600000);
      }
    }
  }
);

// 招待コードを記憶しておくためのオブジェクトを定義
const allInvites = {}

client.on('ready', () => {
  // ボット起動時に全サーバーの招待コードを読み込んで記録する
  client.guilds.cache.forEach(guild => {
    guild.fetchInvites().then(invites => {
      allInvites[guild.id] = invites
    }).catch(console.error);
  })
})

client.on('guildMemberAdd', member => {
  // メンバーが参加したサーバーの招待コードを全て取得する
  member.guild.fetchInvites().then(invites => {
    // 以前に取得したサーバーの招待コードを変数に入れて保持する
    const oldInvites = allInvites[member.guild.id]
    // 新たに取得した招待コードに置き換え
    allInvites[member.guild.id] = invites
    // 以前に取得した招待コードと新たに取得したので、使用回数が増えたものを探す
    const invite = invites.find(i => oldInvites.get(i.code).uses < i.uses)
    // ログに出す
    message.channel.id(890445961371992104).send(`${member.user.tag} は ${invite.code} を使ってサーバーに参加しました`)
  }).catch(console.error);
})

// サーバー機能(server)系
client.on('message', message => {
  if (message.content === "n!topmsg") {
    message.channel.messages.fetch({ after: '0', limit: 1 }) 
   .then(messages => messages.first()) 
   .then(m => message.channel.send(
     {embed: {
       color: 0xffd700,
       title: "🔼最初に飛ぶ！",
       url: m.url, 
   }}
   ))
   .catch(console.error)
  }}
);

client.on("message", message => {
  if (message.content === "n!serverinfo" && message.guild) {
  message.channel.send({
          embed: {
            title: "チャンネル詳細",
            color: 0x0ee1a2,//embedの色
            timestamp: new Date(),
            footer: {
              icon_url: client.user.avatarURL,
              text: "n!serverinfo-サーバー情報を出す。"
            },
            thumbnail: {
              url: message.guild.iconURL()
            },
            fields: [
            {
              name: "サーバー名",
              value: message.guild.name,
              inline: true
            },
            {
              name: "サーバーID",
              value: message.guild.id,
              inline: true
            },
            {
              name: "人数",
              value: `👤:${message.guild.memberCount}`,
              inline: true
            },
            {
              name: "<:channel:891090289643647006>チャンネル数",
              value: message.guild.channelCount,
              inline: true
            },
            {
              name: "ロールリスト",
              value: message.guild.rolelist,
              inline: true
            },
            {
              name: "<:discordnitro:891089542847803452>サーバーブースト",
              value: `サーバーブーストLv:${message.guild.premiumTier}\nサーバーブースト数:${message.guild.premiumSubscriptionCount}`,
              inline: true
            },
            ]
          }
  });
  }
});
client.login(token);
