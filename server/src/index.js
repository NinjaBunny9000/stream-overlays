import { terminal as term } from 'terminal-kit';
import { logger as log, logDemo } from './loggyboi';
import * as helpers from './helpers';
import colors from './colors';
import { HueFacade } from './hue';
import { OverlayCommander } from './overlay';
import * as tmi from 'tmi.js';
import * as fs from 'fs';
import secrets from '../secrets';
import { default as cfg } from '../config';

// TODO: this is a mess
log.silly('BOOTING UP!');


/*********************************************************************************/
/******************************* socket.io server ********************************/
/*********************************************************************************/

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
    origin: '*',
    }
});
const port = process.env.PORT || 3000;
  
app.get('/', (req, res) => {
res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('message', msg => {
        io.emit('message', msg);
        log.silly(`msg rcvd: ${msg}`);
    });
});



http.listen({
    port: port,
    host: '0.0.0.0'
}, () => {
    console.log(`Socket.IO server running at http://0.0.0.0:${port}/`);
});



// create a poorly-performing facade
const facade = new HueFacade(secrets.hue.ip, secrets.hue.user, cfg.hue.groups.studio);
const overlay = new OverlayCommander(io);


/*********************************************************************************/
/***************************** twitch chat bot stuff *****************************/
/*********************************************************************************/


const commandDefinitions = {
    'help': helpCommand,
    'color': color,
    'idea': idea,
    'project': project,
    'drone': drone,
    'font': font,
};

const botState = {
    colorLock: false,
};

// connectyboi connects to the twitch chat
const client = new tmi.Client({
	options: { debug: true, messagesLogLevel: "debug" },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: cfg.twitch.botuser,
		password: secrets.twitch.authyboi
	},
	channels: [ cfg.twitch.channel ]
});
client.connect();  // DON'T ACCIDENTALLY REMOVE THIS


// listen for !commands
client.on('message', (channel, tags, message, self) => {
	if(self || !message.startsWith('!')) return;  // ignore self and non-commands

    // adds the stuff we need into a ctx object
    const ctx = {
        channel: channel,
        author: tags.username,
        client: client,
        args: message.slice(1).split(' '),
        tags: tags
    }
    ctx.command = ctx.args.shift().toLowerCase();
    ctx.message = ctx.args.join(' ');

    /** TAGS REFERENCE:
     * badge-info, badges, client-nonce, color, display-name, emotes, 
     * flags, id, mod, room-id, subscriber, tmi-sent-ts, turbo, 
     * user-id, user-type, emotes-raw, badge-info-raw, badges-raw, 
     * username, message-type
     */

    if(commandDefinitions[ctx.command]) {
        commandDefinitions[ctx.command](ctx);
    } else {
        // client.say(ctx.channel, 'that\'s not a command');
    }

});


/***************************** command functions *****************************/

function helpCommand(ctx) {
    // list commands to the channel
    const commands = Object.keys(commandDefinitions);
    const commandList = commands.map(c => `!${c}`);
    client.say(ctx.channel, `@${ctx.author}, Here are the commands: ${commandList.join(', ')}`);
}

function color(ctx) {
    
    // helper text stuff
    const helperText = `@${ctx.author}, please provide a color as an argument (using a name, hexcode, or rgb(r,g,b))`
    if (ctx.args.length === 0) { client.say(ctx.channel, helperText); return; }  // handle no args
    
    // handle color-lock to chill out color changes for a bit
    // TODO make this a mod-only thing (cuz right now any user can do it)
    if (ctx.args[0].toLowerCase() === 'lock') {
        botState.colorLock = !botState.colorLock;
        client.say(ctx.channel, `@${ctx.author}, colors are now ${botState.colorLock ? 'LOCKED.' : 'UNLOCKED.'}`);
        return;
    } else if (botState.colorLock) {
        // skip the color function if botstate.colorLock is true
        client.say(ctx.channel, `@${ctx.author}, colors are locked for now.`);
        return;
    }
    
    const colorRequested = ctx.args[0].toLowerCase();
    const rgbRegex = /^rgb\(\s*(\d|[1-9]\d|1\d{2}|2[0-5]{2})\s*,\s*(\d|[1-9]\d|1\d{2}|2[0-5]{2})\s*,\s*(\d|[1-9]\d|1\d{2}|2[0-5]{2})\s*\)$/
    
    // look at this beefy boi right here:
    if (colorRequested.match(/^#[0-9a-f]{6}$/i) || colorRequested.match(/^#[0-9a-f]{3}$/i)) {
        // it's a hex value
        let colorRGB = helpers.hexToRGB(colorRequested);
        let colorXy = helpers.RGBtoXY(...colorRGB);
        facade.changeColors(colorXy, 255);
        overlay.changeBorderColor(colorRGB);
    } else if (colorRequested.match(rgbRegex)) {
        // it's an rgb value
        let colorRGB = colorRequested.split('(')[1].split(')')[0].split(',');
        facade.changeColors(helpers.RGBtoXY(...colorRGB), 255);
        overlay.changeBorderColor(colorRGB);
    } else if (colorRequested === 'random') {
        let randomColor = helpers.hexToRGB(helpers.getRandomColor());
        log.info(`changing the lights to a random color: ${randomColor}`)
        facade.changeColors(helpers.RGBtoXY(...randomColor) , 255);
        overlay.changeBorderColor(randomColor);
        return;
    } else if (colors[colorRequested]) {
        // it's a named color
        if (colorRequested === 'black') { facade.setLightState(false); return;}  // handle black
        let colorRGB = helpers.hexToRGB(colors[colorRequested]);
        let colorXy = helpers.RGBtoXY(...colorRGB);
        facade.changeColors(colorXy, 255);
        overlay.changeBorderColor(colorRGB);
    } else {
        // something was wrong with the command
        client.say(ctx.channel, helperText);
    }
}

function idea(ctx) {
    const helperText = `@${ctx.author}, do you have an idea? Well use !idea followed by your idea to save for later!`
    if (ctx.args.length === 0) { client.say(ctx.channel, helperText); return; }
    
    // add the idea to a json file
    const now = new Date();
    const dateTime = now.toISOString();
    const idea = { [dateTime]: ctx.message };
    const ideas = JSON.parse(fs.readFileSync('src/data/ideas.json', 'utf8'));
    if (ideas.hasOwnProperty(ctx.author)) {
        ideas[ctx.author].push(idea);
    } else {
        ideas[ctx.author] = [idea];
    }
    fs.writeFileSync('src/data/ideas.json', JSON.stringify(ideas));
    log.info(`${ctx.author} added an idea: ${ctx.message}`);
    client.say(ctx.channel, `Thanks, @${ctx.author}. I added your idea to The List.`);
}

function project(ctx) {
    if (!checkPerms(ctx)) { return; }

    const helperText = `@${ctx.author}, you're doin ir wrong!!`
    if (ctx.args.length === 0) { client.say(ctx.channel, helperText); return; }

    const proj = ctx.message;
    overlay.updateProject(proj);
    client.say(ctx.channel, `@${ctx.author}, sent the project to the overlay!`);
}

function drone(ctx) {
    // if arg length is 0, send help message
    if (ctx.args.length === 0) {
        client.say(ctx.channel, 'gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned ');
        return;
    } else if (ctx.args.length === 1){
        const dronee = ctx.args[0];
        // check if starts with @, otherwise add it
        client.say(ctx.channel, `Hey, ${dronee}, GIT DRONED!!!... gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned gitDroned `);
    } else {
        // help text
        const helperText = `@${ctx.author}, you're doin ir wrong!! Format: !drone <user> || !drone`
        client.say(ctx.channel, helperText);
    }
}

// DANGER ZONE
function checkPerms(ctx) {
    if (ctx.tags.mod || ctx.tags['room-id'] === ctx.tags['user-id']) {
        return true;
    } else {
        log.debug('someone wasn\'t a mod');
        log.debug(`room-id: ${ctx.tags['room-id']}, user-id: ${ctx.tags['user-id']}`);
        client.say(ctx.channel, `@${ctx.author}, you don't have permission to use this command.`);
        return false;
    }
}

// DANGER IS MY MIDDLE NAME
function font(ctx) {
    client.say(ctx.channel, `@${ctx.author}, Bun's using JetbrainsMono (Nerd Font) w/Ligatures`);
}