<a href="https://github.com/binlabs/queue-bot/actions"><img src="https://github.com/binlabs/queue-bot/workflows/Node.js%20Package/badge.svg" alt="Build Status" /></a>
<a href="https://www.npmjs.com/package/queue-bot"><img src="https://img.shields.io/npm/v/queue-bot.svg?maxAge=3600" alt="NPM version" /></a>
<a href="https://www.npmjs.com/package/queue-bot"><img src="https://img.shields.io/npm/dt/queue-bot.svg?maxAge=3600" alt="NPM downloads" /></a>

# Queue Bot
A simple bot for managing a queue of users in Discord.

## Installation
These instructions assume you have already created an application from within the [Discord Developer Portal](https://discord.com/developers/applications), registered it as a bot, and invited it to your Discord server.
1. Type `npm install queue-bot` in your terminal
2. Open the `config.json` file and add your bot's token to the `token` field
3. Run the bot by typing `npm start`

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
