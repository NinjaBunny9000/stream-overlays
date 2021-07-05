console.log('LOADED');
import secrets from '../private/secrets';
import * as d3 from 'd3';
import * as tmi from 'tmi.js';

addCss('style.css');

// connectyboi
const client = new tmi.Client({
	options: { debug: true, messagesLogLevel: "debug" },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: secrets.botName,
		password: secrets.authyboi
	},
	channels: [ secrets.channel ]
});

client.connect();  // DON'T ACCIDENTALLY REMOVE THIS

client.on('join', (channel, tags, message, self) => {
    console.log(`${tags.username} Connected to ${channel}`);
});

// listen for !commands
client.on('message', (channel, tags, message, self) => {
    console.log(message);
	if(self || !message.startsWith('!')) return;

    const ctx = {
        channel: channel,
        client: client,
        args: message.slice(1).split(' '),
        tags: tags
    }
    ctx.command = ctx.args.shift().toLowerCase();
    ctx.message = ctx.args.join(' ');

    /** TAGS
     * badge-info, badges, client-nonce, color, display-name, emotes, 
     * flags, id, mod, room-id, subscriber, tmi-sent-ts, turbo, 
     * user-id, user-type, emotes-raw, badge-info-raw, badges-raw, 
     * username, message-type
     */ 

    const commandDefinitions = {
        'tags': getTags,
        'help': helpCommand,
        'color': color,
    };

    if(commandDefinitions[ctx.command]) {
        commandDefinitions[ctx.command](ctx);
    } else {
        client.say(ctx.channel, 'that\'s not a command');
    }

});


function getTags(ctx) {
    console.log(Object.keys(ctx.tags));
    client.say(ctx.channel, `${Object.keys(ctx.tags)}`);
}

function helpCommand(ctx) {
    // TODO fill this in lmao
}

function color(ctx) {
    if(ctx.args.length == 0) {
        client.say(ctx.channel, 'Provide a color as an argument');
    } else if (ctx.args.length > 1) {
        client.say(ctx.channel, 'Provide only one color as an argument');
    } else {
        let color = ctx.args[0];
        if(color == 'random') {
            changeBorderColor(getRandomColor());
            return;
        }
        changeBorderColor(color);
    }
}

const w = window,
      d = document,
      e = d.documentElement,
      g = d.getElementsByTagName('body')[0],
    //   x = window.outerWidth,
    //   y = window.outerHeight;
      x = w.innerWidth || e.clientWidth || g.clientWidth,
      y = w.innerHeight|| e.clientHeight|| g.clientHeight;

// make a border around the outside of the screen
const wrapper = d3.select('body')
    .append('div')
    .attr('class', 'overlay');

const border = wrapper.append('div')
    .attr('class', 'border');

function changeBorderColor(color) {

    const colorMap = {
        'black': '#000000',
        'white': '#FFFFFF',
        'red': '#FF0000',
        'green': '#00FF00',
        'blue': '#0000FF',
        'yellow': '#FFFF00',
        'cyan': '#00FFFF',
        'magenta': '#FF00FF',
        'gray': '#808080',
        'lightgray': '#C0C0C0',
        'darkgray': '#A0A0A0',
        'lightred': '#FFB0B0',
        'lightgreen': '#B0FFB0',
        'lightblue': '#B0BFFF',
        'lightyellow': '#FFFFB0',
        'lightcyan': '#B0FFFF',
        'lightmagenta': '#FFB0FF',
        'transparent': 'transparent',
    }

    if(colorMap[color]) {
        border.style('outline-color', colorMap[color]);
    } else {
        border.style('outline-color', color);
    }
}

////////////// HELPER FUNCTIONS //////////////

// helper functions
function addCss(fileName) {
    let head = document.head;
    let link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = fileName;
    head.appendChild(link);
}

function addSrc(fileName) {
    let head = document.head;
    let script = document.createElement("script");
    script.setAttribute("src", fileName);
    script.setAttribute("crossorigin", 'anonymous');
    head.appendChild(script);
}