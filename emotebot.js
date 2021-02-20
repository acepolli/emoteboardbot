const config = require('./config.json');
const aws = require('aws-sdk');
let s3 = new aws.S3({
    discordToken: process.env.DISCORD_TOKEN
});
const Discord = require("discord.js");
const client = new Discord.Client();
const prefix = config.prefix;

console.log(s3.discordToken);

client.on("ready", () => {
    console.log("bot ready");
});

client.on("message", (message) => {
    if(!message.content.startsWith(prefix) || message.author.bot) return

    // split the message by spaces
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    // remove the first arg from the array, and store it as the command
    const command = args.shift().toLowerCase();

    //handle command for setting the minimum emote number for a message to make it to the board
    if(command === 'emotelimit') {
        if(!isNaN(args[0])) {
            config.emotelimit = +args[0];
            message.channel.send('Emote limit has been updated to ' + config.emotelimit);
        } else {
            message.channel.send('Please use a number');
        }
    }
    // handle command for changing the emote
    if(command === 'emote') {
        config.emote = args[0];
        message.channel.send('Emote to look for updated to: ' + config.emote);
    }
    // handle command for changing the channel of the board
    if(command === 'boardchannel') {
        config.boardchannel = args[0];
        message.channel.send('Board channel has been updated to: ' + config.boardchannel);
    }
});

client.on("messageReactionAdd", async (reaction, user) => {
    const message = reaction.message;

    //message.channel.send(reaction.emoji.name);
    //console.log(reaction.emoji.name + '\n' + reaction.emoji.id + '\n' + reaction.emoji.identifier + '\n' + reaction.emoji.toString());

    if(reaction.emoji.name !== config.emote) return;
    if(message.author.bot) return;
    boardChannel = message.guild.channels.cache.find(channel => channel.name == config.boardchannel);
    if(!boardChannel) {
        return message.channel.send('channel not found: ' + config.boardchannel);
    }

    let msgExists = false;
    let fetchedMessages = [];
    let boardMsgID = 0;
    await boardChannel.messages.fetch({limit: 100}).then( async messages => {
        console.log(`${messages.size} messages.`)

        const putInArray = async (data) => fetchedMessages.push(data);

        for (const msg of messages.array()) {
            await putInArray(msg);
        }

        //console.log(fetchedMessages);

        fetchedMessages.forEach (msg => {
            if(msg.embeds[0].footer.text.endsWith(message.id)) {
                msgExists = true;
                console.log('message already exists! id: ' + message.id);
                boardMsgID = msg.id;
            }
        })

    }).catch(console.error);
    //const stars = fetchedMessages.find(m => m.embeds[0].footer.text.startsWith('⭐') && m.embeds[0].footer.text.endsWith(message.id));

    console.log('message id: \n' + message.id);

    if(!msgExists) {
        let emoteCount = message.reactions.cache.get(config.emote).count;

        if(emoteCount >= config.emotelimit) {
            //if the message does not exist, add it
            const image = message.attachments.size > 0 ? await extension(reaction, message.attachments.array()[0].url) : '';
            if(image === '' && message.cleanContent.length < 1) return;
            let member = await message.guild.member(message.author)
            const embed = new Discord.MessageEmbed()
            //    .setTitle(`wow! that message was ${config.descriptor}!`)
                .setColor('DARK_ORANGE')
                .setDescription(message.cleanContent + `\n\nSource: [Jump](${message.url})`)
                .setAuthor(member ? member.displayName : message.author.tag, iconURL = message.author.displayAvatarURL)
                .setTimestamp(new Date())
                .setFooter(config.emote + ` x ${emoteCount} | ${message.id}`)
                .setImage(image);
            await boardChannel.send(config.emote + ` x ${emoteCount}`, { embed });
        }
    }
    if(msgExists) {
        const boardMsg = await boardChannel.messages.fetch(boardMsgID);
        console.log(boardMsg.content);
        let emoteCount = +boardMsg.content.split(" ")[2];
        const image = message.attachments.size > 0 ? await extension(reaction, message.attachments.array()[0].url) : '';
        const embed = new Discord.MessageEmbed()
        //    .setTitle(`wow! that message was ${config.descriptor}!`)
            .setColor(boardMsg.embeds[0].color)
            .setDescription(boardMsg.embeds[0].description)
            .setAuthor(message.author.tag, message.author.displayAvatarURL)
            .setTimestamp()
            .setFooter(config.emote + `x ${parseInt(emoteCount)+1} | ${message.id}`)
            .setImage(image);
        await boardMsg.edit(config.emote + ` x ${parseInt(emoteCount)+1}`, { embed })
    }
    
});

client.on('messageReactionRemove', async (reaction, user) => {
    const message = reaction.message;
    if(message.author.bot) return;
    if (reaction.emoji.name !== config.emote) return;

    const boardChannel = message.guild.channels.cache.find(channel => channel.name == config.boardchannel);
    if(!boardChannel) return message.channel.send('channel not found: ' + config.boardchannel);
    const fetchedMessages = await boardChannel.messages.fetch({ limit: 100 });

});

function extension(reaction, attachment) {
    const imageLink = attachment.split('.');
    const typeOfImage = imageLink[imageLink.length - 1];
    const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);
    if (!image) return '';
    return attachment;
  }

client.login(s3.discordToken)