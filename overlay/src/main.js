console.log('LOADED');
import secrets from '../private/secrets';
import * as d3 from 'd3';
import * as tmi from 'tmi.js';
const io = require('socket.io-client');

const sock = io('http://192.168.36.131:3000');

sock.emit('message', 'SOCKETIO TEST PASSED');

sock.on('message', function(msg) {
    console.log(msg);
});



addCss('style.css');

// // connectyboi
// const client = new tmi.Client({
// 	options: { debug: true, messagesLogLevel: "debug" },
// 	connection: {
// 		reconnect: true,
// 		secure: true
// 	},
// 	identity: {
// 		username: secrets.botName,
// 		password: secrets.authyboi
// 	},
// 	channels: [ secrets.channel ]
// });

// client.connect();  // DON'T ACCIDENTALLY REMOVE THIS

// client.on('join', (channel, tags, message, self) => {
//     console.log(`${tags.username} Connected to ${channel}`);
// });

// listen for !commands
// client.on('message', (channel, tags, message, self) => {
//     console.log(message);
// 	if(self || !message.startsWith('!')) return;

//     const ctx = {
//         channel: channel,
//         client: client,
//         args: message.slice(1).split(' '),
//         tags: tags
//     }
//     ctx.command = ctx.args.shift().toLowerCase();
//     ctx.message = ctx.args.join(' ');

//     /** TAGS
//      * badge-info, badges, client-nonce, color, display-name, emotes, 
//      * flags, id, mod, room-id, subscriber, tmi-sent-ts, turbo, 
//      * user-id, user-type, emotes-raw, badge-info-raw, badges-raw, 
//      * username, message-type
//      */ 

//     const commandDefinitions = {
//         'color': color,
//     };

//     if(commandDefinitions[ctx.command]) {
//         commandDefinitions[ctx.command](ctx);
//     } else {
//     }

// });

function getTags(ctx) {
    console.log(Object.keys(ctx.tags));
    client.say(ctx.channel, `${Object.keys(ctx.tags)}`);
}

function helpCommand(ctx) {
    // TODO fill this in lmao
}

function color(ctx) {
    // check if a string is in the form of an rgba color

    if ((ctx.args.length == 0 || ctx.args.length > 1) && !'/^rgba\(/)'.test(ctx.args)) {
    } else {
        let color = ctx.args[0];
        if(color == 'random') {
            changeBorderColor(getRandomColor());
            return;
        }
        changeBorderColor(color);
    }
}

function getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

const w = window,
      d = document,
      e = d.documentElement,
      g = d.getElementsByTagName('body')[0],
      x = w.innerWidth || e.clientWidth || g.clientWidth,
      y = w.innerHeight|| e.clientHeight|| g.clientHeight;

// make a border around the outside of the screen
const wrapper = d3.select('body')
    .append('div')
    .attr('class', 'overlay');

const border = wrapper.append('div')
    .attr('class', 'border');

function changeBorderColor(color) {
    setTimeout(() => { border.style('color', `rgb(${color.join(',')})`); }, 500);
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

sock.emit('message', 'PAGE LOADED END OF FILE');


sock.on('color-change', (color) => {
    changeBorderColor(color);
});
