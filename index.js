'use strict';

// -- Dependencies
const Discord = require('discord.js');
const client = new Discord.Client();
const lodash = require('lodash');
const Config = (exports.Config = require('./config.json'));

// #region Variables
// Variable to hold the ID for the queue message
let queueMessageId = 0;
// Variable to hold the queue message
let queueMessageText = '';
// #endregion

// #region Constants
// Array to hold users in the queue
const usersInQueue = [];
// An embed for the the help command
const embedHelp = new Discord.MessageEmbed()
  .setColor(Config.embedAccentColor)
  .setTitle(Config.embedHelpTitle)
  .setAuthor(Config.embedAuthorName, Config.embedAuthorImage, Config.embedAuthorLink)
  .setDescription(Config.embedHelpDescription)
  .addFields(
    { name: 'Join the queue', value: '`!queue join`', inline: false },
    { name: 'Leave the queue', value: '`!queue leave`', inline: false },
    { name: 'See how long you have been in the queue', value: '`!queue time`', inline: false },
    { name: 'Get a list of available commands', value: '`!queue commands` or `!queue help`', inline: false },
  )
  .setFooter(Config.embedFooterText + process.env.npm_package_version);
// An embed template for the queue message
const embedQueue = new Discord.MessageEmbed()
  .setColor(Config.embedAccentColor)
  .setTitle(Config.queueTitle)
  .setAuthor(Config.embedAuthorName, Config.embedAuthorImage, Config.embedAuthorLink)
  .setDescription(queueMessageText)
  .setFooter(Config.embedFooterText + process.env.npm_package_version);
// #endregion

// #region Functions
/**
 * Create a User object
 * @param {string} username Discord Username
 * @param {string} userId Discord User ID
 */
function User (username, userId) {
  this.username = username;
  this.userId = userId;
  // Timestamp representing when user was added to the queue
  this.timestamp = new Date();
}

/**
 * Calculate the amount of time a user has spent in the queue
 * @param {string|number} userId Discord ID of user
 * @param {string} [timeFormat=true] Format to return the time in
 * @returns {string} Amount of time user has been in queue
 */
function timeInQueue (userId, timeFormat = 'm') {
  const userIsInQueue = isUserInQueue(userId);
  const queuedUserObj = getUserFromQueueByUserId(userId);
  if (userIsInQueue && queuedUserObj) {
    let timeValueReturned = 0;
    const now = new Date();
    const queueJoined = queuedUserObj.timestamp;
    const diffMs = (now - queueJoined);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
    const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
    switch (timeFormat) {
    case 'm':
      timeValueReturned = diffMins + ' minute(s)';
      break;
    case 'h':
      timeValueReturned = diffHrs + ' hour(s)';
      break;
    case 'd':
      timeValueReturned = diffDays + ' day(s)';
      break;
    default:
      timeValueReturned = diffMins + ' minute(s)';
    }
    return timeValueReturned;
  }
  return false;
}

/**
 * Add a User object to the usersInQueue array
 * @param {string} username Discord name of user
 * @param {string|number} userId Discord ID of user
 */
function addUserToQueue (username, userId) {
  // Check to see if the user already exists in the queue before adding
  if (isUserInQueue(userId)) {
    // Return false if the user could not be added
    return false;
  }
  return usersInQueue.push(new User(username, userId));
}

/**
 * Remove a User object from the usersInQueue array by Discord User ID
 * @param {string|number} userId Discord ID of user
 */
function removeUserFromQueueByUserId (userId) {
  if (!isUserInQueue(userId)) {
    return false;
  } else {
    lodash.remove(usersInQueue, function(userQueue) {
      return userQueue.userId === userId;
    });
  }
}

/**
 * Check if a user has an admin role
 * @param {*} userRoles Roles from message.member.roles.cache
 * @returns {boolean} True if a user has an admin role, otherwise return false
 */
function isUserIsAdmin (userRoles) {
  if (userRoles.some(r=>Config.adminRoles.includes(r.name))) {
    return true;
  }
  return false;
}

/**
 * Gets a user object from the queue array
 * @param {string|number} userId Discord ID of user
 * @returns {Object} User object
 */
function getUserFromQueueByUserId (userId) {
  return lodash.find(usersInQueue, { 'userId': userId });
}

/**
 * Determine whether a specific user already exists in the queue array
 * @param {string} userId Discord ID of user
 * @param {boolean} checkByUserId If false, checks by username
 * @returns {boolean} Returns true if user is in queue, otherwise false
 */
function isUserInQueue (userToCheck, checkByUserId = true) {
  let isDuplicate = false;
  if (checkByUserId) {
    // Check duplicate by userId
    isDuplicate = usersInQueue.some(queuedUser => queuedUser.userId === userToCheck);
  } else {
    // Check duplicate by username
    isDuplicate = usersInQueue.some(queuedUser => queuedUser.username === userToCheck);
  }
  // If the user does NOT already exist in queue, add it
  if (isDuplicate) {
    return true;
  }
  return false;
}

/**
 * Iterates over the queue array to produce a list
 */
function assembleQueueMessage () {
  // Set an empty string if using embeds, otherwise prepend the title before iteration
  if (Config.useEmbeds) {
    queueMessageText = '';
  } else {
    queueMessageText = Config.queueTitle;
  }
  // Iterate over each user object in the array and add them to the message
  usersInQueue.forEach(function(arrayObj) {
    queueMessageText += '\n' + arrayObj.username;
  });
}
// #endregion functions

// #region Event Listeners
// Listen for the ready state
client.on('ready', () => {
  // Bot is running and ready
  console.log('Queue Bot is Running on Discord...');
});

// Listen for messages
client.on('message', message => {
  // If the message doesn't contain our prefix, or if the message is from the bot, ignore it
  if (!message.content.startsWith(Config.prefix) || message.author.bot) return;

  // Split the arguments from the command for parsing
  const args = message.content.slice(Config.prefix.length).split(/ +/);
  // Set the command to a constant for brevity
  const command = args.shift().toLowerCase();
  // Set the subcommand to false so we can check if it set in the future
  let subcommand = false;
  // If no arguments are provided then there is nothing to do, so return a help message
  if (!args.length) {
    return message.channel.send(`No commands provided, ${message.author}! Type !queue help for a list of queue commands and their usage.`);
  } else {
    subcommand = args[0].toString();
  }

  // command: !queue start
  if (command === 'queue' && subcommand === 'start') {
    if (queueMessageId !== 0) {
      console.log(`A queue was attempted to be started by ${message.author}, but one already exists.`);
      message.channel.send('A queue already exists.');
      return;
    }
    if (Config.useEmbeds) {
      message.channel.send(embedQueue).then(queueMessage => {
        console.log('Queue created using an embed');
        // Set the queueMessageId to the ID of the message the bot just created
        queueMessageId = queueMessage.id;
      });
    } else {
      message.channel.send(Config.queueTitle).then(queueMessage => {
        console.log('Queue created using a plain-text message');
        // Set the queueMessageId to the ID of the message the bot just created
        queueMessageId = queueMessage.id;
      });
    }
  }

  // command: !queue join
  if (command === 'queue' && subcommand === 'join') {
    // If queueMessageId is still 0, no queue has been created
    if (queueMessageId === 0) {
      message.channel.send('A queue does not currently exist.');
      // Otherwise, the queue already exists, so users can join
    } else {
      message.channel.messages.fetch(queueMessageId).then(queueMessage => {
        if (addUserToQueue(message.member.displayName, message.member.id, args)) {
          assembleQueueMessage();
          if (Config.useEmbeds) {
            queueMessage.edit(embedQueue.setDescription(queueMessageText));
          } else {
            queueMessage.edit(queueMessageText);
          }
        } else {
          message.channel.send(`${message.author} already exists in the queue`);
        }
      })
        .catch(console.error);
    }
  }

  // command: !queue leave
  if (command === 'queue' && subcommand === 'leave') {
    // If queueMessageId is still 0, no queue has been created
    if (queueMessageId === 0) {
      message.channel.send('Queue does not exist!');
    // Otherwise, the queue already exists, so users can join
    } else {
      message.channel.messages.fetch(queueMessageId).then(queueMessage => {
        const userToRemove = message.member.id;
        const userRemoved = removeUserFromQueueByUserId(userToRemove);
        if (userRemoved === false) {
          message.channel.send(`${message.author} wasn't in the queue`);
        } else {
          assembleQueueMessage();
          if (Config.useEmbeds) {
            queueMessage.edit(embedQueue.setDescription(queueMessageText));
          } else {
            queueMessage.edit(queueMessageText);
          }
        }
      })
        .catch(console.error);
    }
  }

  // command: !queue add
  if (command === 'queue' && subcommand === 'add') {
    if (isUserIsAdmin(message.member.roles.cache) && args.length === 2) {
      console.log('User is an admin');
      let userToAdd = args[1];
      if (userToAdd.startsWith('<')) {
        userToAdd = userToAdd.replace(/\D/g, '');
      }
      message.channel.messages.fetch(queueMessageId).then(queueMessage => {
        client.users.fetch(userToAdd).then(userSnowflake => {
          const userAdded = addUserToQueue(userSnowflake.username, userSnowflake.id);
          if (userAdded) {
            assembleQueueMessage();
            if (Config.useEmbeds) {
              queueMessage.edit(embedQueue.setDescription(queueMessageText));
            } else {
              queueMessage.edit(queueMessageText);
            }
          }
        });
      });
    } else {
      console.log('User is not an admin');
    }
  }

  // command: !queue remove
  if (command === 'queue' && subcommand === 'remove') {
    if (isUserIsAdmin(message.member.roles.cache) && args.length === 2) {
      console.log('User is an admin');
      let userToRemove = args[1];
      if (userToRemove.startsWith('<')) {
        userToRemove = userToRemove.replace(/\D/g, '');
      }
      message.channel.messages.fetch(queueMessageId).then(queueMessage => {
        const userRemoved = removeUserFromQueueByUserId(userToRemove);
        console.log(userRemoved);
        assembleQueueMessage();
        if (Config.useEmbeds) {
          queueMessage.edit(embedQueue.setDescription(queueMessageText));
        } else {
          queueMessage.edit(queueMessageText);
        }
      });
    } else {
      console.log('User is not an admin');
    }
  }

  // command: !queue up
  // if (command === 'queue' && subcommand === 'up') {}

  // command: !queue down
  // if (command === 'queue' && subcommand === 'down') {}

  // command: !queue time
  if (command === 'queue' && subcommand === 'time') {
    // If queueMessageId is still 0, no queue has been created
    if (queueMessageId === 0) {
      message.channel.send('Queue does not exist!');
    // Otherwise, the queue already exists, so users can join
    } else {
      const userQueueDuration = timeInQueue(message.member.id);
      if (typeof userQueueDuration === 'string' || userQueueDuration instanceof String) {
        message.channel.send(`${message.author} has been in the queue for ${userQueueDuration}.`);
      } else {
        message.channel.send(`${message.author} is not in the queue.`);
      }
    }
  }

  // command: !queue help
  if (command === 'queue' && (subcommand === 'help' || subcommand === 'commands')) {
    message.channel.send(embedHelp);
    // message.channel.send('**Queue Commands**:\n`!queue join`\tJoin the queue\n`!queue leave`\tLeave the queue\n`!queue help` _alias:_ `!queue commands`\tView a list of available commands.\n`!queue time`\tCheck how long you\'ve been in the queue');
  }
});
// #endregion

client.login(Config.token);
