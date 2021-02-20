# emoteboard.py
import os
import discord
from dotenv import load_dotenv

emote_threshold = 1
emote = ':poop:';
channelName = "poopboard"

load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')

client = discord.Client()

@client.event
async def on_ready():
    print(f'{client.user} has connected to discord!')



@client.event
async def on_message(message):
    #print('message event')
    if message.author == client.user:
        return
    print(message.content.lower())
    if message.content.lower().startswith('!emotethreshold'):
        a = message.content.split(" ", 1)
        
        if len(a) == 2:
            try:
                val = int(a[1])
                emote_threshold = val
                print('emote threshold updated to: ', emote_threshold)
            except ValueError:
                print("please enter a number")

    if message.content.lower().startswith('!emoteset'):
        a = message.content.split(" ", 1)
        
        if len(a) == 2:
            emote = a[1]
            print('emote updated to: ' + a[1])
            
@client.event
async def on_reaction_add(reaction, user):
    print('emote add event')
    print(reaction)
    if reaction.emoji == emote:
        if reaction.count >= emote_threshold:
            print('add this to the board!')
            response = reaction.message.jump_url
            boardChannel = 0
            for channel in reaction.message.guild.text_channels:
                if channel.name == channelName:
                    boardChannel = channel
            await boardChannel.send(response)


client.run(TOKEN)