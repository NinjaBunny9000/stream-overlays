console.log('LOADED');
import secrets from '../private/secrets';
import * as d3 from 'd3';
import * as tmi from 'tmi.js';
const io = require('socket.io-client');

const sock = io('http://192.168.36.131:3000');

// debug stuff (delet)

sock.on('message', function(msg) {
    console.log(msg);
});

addCss('style.css');

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

function updateProjectText(text) {
    d3.select('#project-text').remove();
    wrapper.append('div')
        .attr('id', 'project-text')
        .style('position', 'absolute')
        .text(text);
}


sock.on('color-change', (color) => {
    changeBorderColor(color);
});


sock.on('project-update', (proj) => {
    console.log(`recieving project: ${proj}`)
    updateProjectText(proj);
});

sock.on('overlay-reset', (msg) => {
    console.log(`resetting overlay`)
    updateProjectText(msg.proj);
    changeBorderColor(msg.border)
});

// sock.on('connection', (msg) => {
//     console.log(`connected to ${msg}`);
//     sock.emit('request-reset', {});
// });


sock.emit('request-reset', this);
// TODO on connect, request the current color of the border from the server
