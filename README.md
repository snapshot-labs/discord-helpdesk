🎙 discord-helpdesk
========================

## Usage

You'll need to set 5 environment variables:
- `GOOGLE_APPLICATION_CREDENTIALS` should point to the JSON file of your project credentials `/app/google-credentials.json`
- `GOOGLE_CREDENTIALS` - to make it work in heroku, add Google creds json here
- `PROJECT_ID` should be set to your project ID in Google Cloud
- `DISCORD_TOKEN` should be set to your bot's token
- `DISCORD_PREFIX` should be set to the prefix you want your bot to activate with (bot will also work with DMs and @ mentions)
- `DISCORD_SERVER_IDS` server ids where bot is added ex: 12345,1235456

Then, just run `npm start`.
