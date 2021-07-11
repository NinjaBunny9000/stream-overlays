import * as d3 from 'd3';
const io = require('socket.io-client');
addCss('style.css');

// cfg
const sock = io('http://192.168.36.131:3000');  // add 0.0.0.0 if hosting on localhost else the ip of the server


/*********************************************************************************/
/****************************** build the wrapper ********************************/
/*********************************************************************************/

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


// event functions

function changeBorderColor(color) {
    setTimeout(() => { border.style('color', `rgb(${color.join(',')})`); }, 500);
}

function updateProjectText(text) {
    d3.select('#project-text').remove();
    wrapper.append('div')
        .attr('id', 'project-text')
        .style('position', 'absolute')
        .text(text);
}

/*********************************************************************************/
/******************************* socket.io events ********************************/
/*********************************************************************************/

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

sock.emit('request-reset', this);


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