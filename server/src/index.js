import { terminal as term } from 'terminal-kit';
import { logger as log, logDemo } from './loggyboi';
import * as helpers from './helpers';
import { v3 as hue } from 'node-hue-api';
import colors from './colors';
import { HueFacade } from './hue';
import { OverlayCommander } from './overlay';
import * as tmi from 'tmi.js';
import * as fs from 'fs';
import secrets from './secrets';

// TODO: this is a mess
log.silly('BOOTING UP!');

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
const overlay = new OverlayCommander(io);
// overlay.connect()

http.listen({
    port: port,
    host: '0.0.0.0'
}, () => {
    console.log(`Socket.IO server running at http://0.0.0.0:${port}/`);
});

// lights in the studio
const deskLight = 55; // 55 - Office - Bun; Desk
const rearLeft = 54;  // 54 - Office - Bun; Door
const rearRight = 56;  // 56 - Office - Bun; Closet
const studioLights = [ deskLight, rearLeft, rearRight ];

// create a poorly-performing facade
const facade = new HueFacade(secrets.hue.ip, secrets.hue.user, studioLights);


// connectyboi
const client = new tmi.Client({
	options: { debug: true, messagesLogLevel: "debug" },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: secrets.twitch.botName,
		password: secrets.twitch.authyboi
	},
	channels: [ secrets.twitch.channel ]
});

client.connect();  // DON'T ACCIDENTALLY REMOVE THIS

const botState = {
    colorLock: false,
}

const commandDefinitions = {
    'help': helpCommand,
    'color': color,
    'idea': idea,
    'project': project
};

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
    const idea = { [dateTime]: `@${ctx.author}: ${ctx.message}` };
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

    const helperText = `@${ctx.author}, you're doin ir wrong!!`
    if (ctx.args.length === 0) { client.say(ctx.channel, helperText); return; }

    const proj = ctx.message;

    // send the proj to the overlay via websocket
    // const ws = new WebSocket(`ws://${secrets.overlay.host}:${secrets.overlay.port}/`);
    
    // emit the proj as a ws event using socket.io and socket object
    socket.emit('project', proj);

    socket.on('project', function(msg) {
        log.silly('it happend');
        log.silly(msg);
    });

    client.say(ctx.channel, `@${ctx.author}, sent the project to the overlay!`);
}
