import { terminal as term } from 'terminal-kit';
import { logger as log, logDemo } from './loggyboi';
import * as helpers from './helpers';
import { v3 as hue } from 'node-hue-api';
import colors from './colors';
import { HueFacade } from './hue';
import * as tmi from 'tmi.js';
import * as fs from 'fs';
import secrets from './secrets';

// TODO: this is a mess
log.silly('BOOTING UP!');

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

const commandDefinitions = {
    'help': helpCommand,
    'color': color,
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
        client.say(ctx.channel, 'that\'s not a command');
    }

});

function helpCommand(ctx) {
    // list commands to the channel
    const commands = Object.keys(commandDefinitions);
    const commandList = commands.map(c => `!${c}`);
    client.say(ctx.channel, `@${ctx.author}, Here are the commands: ${commandList.join(', ')}`);
}

function color(ctx) {
    const helperText = `@${ctx.author}, please provide a color as an argument (using a name, hexcode, or rgb(r,g,b))`
    const rgbRegex = /^rgb\(\s*(\d|[1-9]\d|1\d{2}|2[0-5]{2})\s*,\s*(\d|[1-9]\d|1\d{2}|2[0-5]{2})\s*,\s*(\d|[1-9]\d|1\d{2}|2[0-5]{2})\s*\)$/

    if (ctx.args.length === 0) { client.say(ctx.channel, helperText); return; }  // handle no args

    const colorRequested = ctx.args[0].toLowerCase();

    if (colorRequested.match(/^#[0-9a-f]{6}$/i) || colorRequested.match(/^#[0-9a-f]{3}$/i)) {
        // it's a hex value
        let colorRGB = helpers.hexToRGB(ctx.args[0]);
        let colorXy = helpers.RGBtoXY(colorRGB[0], colorRGB[1], colorRGB[2]);
        facade.changeColors(colorXy, 255);
    } else if (colorRequested.match(rgbRegex)) {
        // it's an rgb value
        let colorRGB = colorRequested.split('(')[1].split(')')[0].split(',');
        log.silly(colorRGB);
        facade.changeColors(helpers.RGBtoXY(colorRGB[0], colorRGB[1], colorRGB[2]), 255);
    } else if (colorRequested === 'random') {
        let randomColor = helpers.hexToRGB(helpers.getRandomColor());
        log.info(`changing the lights to a random color: ${randomColor}`)
        facade.changeColors(helpers.RGBtoXY(randomColor[0], randomColor[1], randomColor[2]) , 255);
        return;
    } else if (colors[colorRequested]) {
        // it's a named color
        if (colorRequested === 'black') { facade.setLightState(false); return;}  // handle black
        let colorRGB = helpers.hexToRGB(colors[colorRequested]);
        let colorXy = helpers.RGBtoXY(colorRGB[0], colorRGB[1], colorRGB[2]);
        facade.changeColors(colorXy, 255);
    } else {
        // something was wrong with the command
        client.say(ctx.channel, helperText);
    }
}

// TODO make this default to a scene
// facade.changeColors(helpers.RGBtoXY(255, 0, 255) , 255);  // default to a color on start
