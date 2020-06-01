# Discord Queue Bot
A Bot for managing queues of users in Discord.

## Installation
These instructions assume you have already created an application from within the [Discord Developer Portal](https://discord.com/developers/applications), registered it as a bot, and invited it to your Discord server.
1. `git clone` the repository
2. Open a terminal, navigate to the directory where the repository is located, and type `npm install`
3. Open the config.json file and add your bot's token to the `token` field
4. Run the bot by typing `npm start`

## Usage
Once the bot is running, start a queue by issuing the `!queue start` command.
### Queue Commands
| Command | Description |
| --------------- | --------------- |
| `!queue start` | Start a queue (Admins-only) |
| `!queue add @username` | Add a user to the queue (Admins-only) |
| `!queue remove @username` | Remove a user from the queue (Admins-only) |
| `!queue join` | Join the queue |
| `!queue leave` | Leave the queue |
| `!queue time` | See how long you've been in the queue |