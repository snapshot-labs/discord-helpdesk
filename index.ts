const dialogflow = require('dialogflow');
const { Client, Intents } = require('discord.js');
const uuid = require('uuid');
require('dotenv').config()

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');

const sessionId = uuid.v4();

const {auth} = require('google-auth-library');

// load the environment variable with our keys
const keysEnvVar = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
if(keysEnvVar) {
  const keys = JSON.parse(keysEnvVar);
  
  async function main() {
    // load the JWT or UserRefreshClient from the keys
    const client = auth.fromJSON(keys);
    client.scopes = ['https://www.googleapis.com/auth/cloud-platform'];
    const url = `https://dns.googleapis.com/dns/v1/projects/${keys.project_id}`;
    const res = await client.request({url});
    console.log(res.data);
  }
  main().catch(console.error);
}

// Create a new session
const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.sessionPath(process.env.PROJECT_ID, sessionId);

const discordClient = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ] });

discordClient.on('ready', () => {
  console.log('Ready!');
  (async () => {
    try {
      const commands = [ new SlashCommandBuilder()
        .setName(process.env.DISCORD_PREFIX || 'hd')
        .setDescription('Helpdesk to answer your questions!')
        .addStringOption(option =>
          option.setName('input')
            .setDescription('Enter message')
            .setRequired(true)) 
      ];
      const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
      console.log('Started refreshing application (/) commands.');
      
      process.env.DISCORD_SERVER_IDS.split(',').forEach(id => {
        rest.put(
          Routes.applicationGuildCommands(discordClient.user.id, id),
          { body: commands },
        ).then(() => {
          console.log('Successfully reloaded application (/) commands for server with id: ' + id);
        });
      })
    } catch (error) {
      console.error(error);
    }
  })();
});

discordClient.on('interactionCreate', interaction => {
  if (interaction.commandName === process.env.DISCORD_PREFIX || 'hd') {
    const message = interaction.options._hoistedOptions[0].value
    
    const dialogflowRequest = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
          languageCode: 'en-US'
        }
      }
    };
  
    sessionClient.detectIntent(dialogflowRequest).then(responses => {
      interaction.reply(responses[0].queryResult.fulfillmentText);
    });
  }
});

discordClient.on('messageCreate', discordMessage => {
  if (!shouldBeInvoked(discordMessage)) {
    return;
  }
  const message = remove(discordClient.user.username, discordMessage.content);
  const dialogflowRequest = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: 'en-US'
      }
    }
  };

  sessionClient.detectIntent(dialogflowRequest).then(responses => {
    discordMessage.reply(responses[0].queryResult.fulfillmentText);
  });
});

function shouldBeInvoked(message) {
  return (
          (message.cleanContent.indexOf('!' + process.env.DISCORD_PREFIX) != -1) ||
          (message.content.indexOf('<@!' + discordClient.user.id + '>') != -1) ||
          message.channel.type === 'dm'
        ) &&
        discordClient.user.id !== message.author.id;
}

function remove(username, text) {
  return text.replace('<@!' + discordClient.user.id + '> ', '').replace('!' + process.env.DISCORD_PREFIX + ' ', '');
}

discordClient.login(process.env.DISCORD_TOKEN);
