import { terminal as term } from 'terminal-kit';
import { logger as log, logDemo } from './loggyboi';
import * as helpers from './helpers';
import { v3 as hue } from 'node-hue-api';
// import colormap from './colormap';
import colors from './colors';
import * as huetools from './hue';
import * as tmi from 'tmi.js';

import * as fs from 'fs';

import secrets from '../secrets';

// const colors = colormap.colors;

// let colors={}
// colormap.colors.forEach(element => {
//     let c = { }
//     colors[element.name.toLowerCase()] = {
//         hex: element.hexString.toLowerCase(),
//         rgb: element.rgb
//     }
// });

// const storeData = (data, path) => {
//     try {
//       fs.writeFileSync(path, JSON.stringify(data))
//     } catch (err) {
//       log.error(err)
//     }
// }

// storeData(colors, './colors.json');

// process.exit();

const deskLight = 55;
const rearLeft = 54;
const rearRight = 56;
const studioLights = [ deskLight, rearLeft, rearRight ];

// log.debug(colors.length);

log.silly('BOOTING UP!');

// huetools.listLights(secrets.hue.ip, secrets.hue.user);

// lights in the studio
/**
 * STUDIO LIGHTS
 * 54 - Office - Bun; Door
 * 55 - Office - Bun; Desk
 * 56 - Office - Bun; Closet
*/

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

// listen for !commands
client.on('message', (channel, tags, message, self) => {
    log.info(message);
	if(self || !message.startsWith('!')) return;

    const ctx = {
        channel: channel,
        author: tags.username,
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
    log.info(Object.keys(ctx.tags));
    client.say(ctx.channel, `${Object.keys(ctx.tags)}`);
}

function helpCommand(ctx) {
    // TODO fill this in lmao
}

function color(ctx) {
    if(ctx.args.length == 0) {
        client.say(ctx.channel, `@${ctx.author}, please provide a color as an argument (using a name or hexcode)`);
    } else if (ctx.args.length > 1) {
        client.say(ctx.channel, `@${ctx.author}, provide only one color as an argument`);
    } else if (!(ctx.args[0].toLowerCase() in colors)) {
        client.say(ctx.channel, `@${ctx.author}, that color isn't in the list. You can specify the color as a hex if you want. (ie #696969)`);
    } else {
        let color = ctx.args[0].toLowerCase();
        log.info(`changing the color to ${color}`);
        if (color == 'random') {
            let randomColor = helpers.hexToRGB(getRandomColor());
            log.info(`changing the lights to a random color: ${randomColor}`)
            changeLightColor(studioLights, helpers.RGBtoXY(randomColor[0], randomColor[1], randomColor[2]) , 255, secrets.hue.ip, secrets.hue.user);
            // changeBorderColor(getRandomColor());
            return;
        }
        if (color === 'black') {
            // TODO: change the light state to off
            setLightState(studioLights, false, secrets.hue.ip, secrets.hue.user);
            return;
        }
        // TODO: make sure the light's turned on
        let colorRGB = helpers.hexToRGB(colors[color.toLowerCase()]);
        let colorXy = helpers.RGBtoXY(colorRGB[0], colorRGB[1], colorRGB[2]);
        log.debug(`color: ${color}\trgb: ${colors[color].rgb}\txy:${colorXy}`);
        log.debug(colors[color].rgb);
        let rgb = colors[color].rgb;
        changeLightColor(studioLights, helpers.RGBtoXY(rgb.r, rgb.g, rgb.b), 255, secrets.hue.ip, secrets.hue.user);
        // changeBorderColor(color);
    }
}

function getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

function getLightDetails(lightId, ip, user) {
    hue.api.createLocal(ip).connect(user)
        .then(api => {
            log.debug('Connected to Hue API');
            api.lights.getLight(lightId)
                .then(light => {  
                    log.debug(light.toStringDetailed());
                });
        });
}


function getLightState(lightId, ip, user) {
    hue.api.createLocal(ip).connect(user)
        .then(api => {
            log.debug('Connected to Hue API');
            api.lights.getLightState(lightId)
                .then(state => {  
                    log.debug(JSON.stringify(state, null, 2));
                });
        });
}

function setLightState(lightIds, stateBool, ip, user) {
    hue.api.createLocal(ip).connect(user)
        .then(api => {
            log.debug('Connected to Hue API');

            lightIds.forEach(light => {
                api.lights.setLightState(light, {on: stateBool})
                .then(result => {  
                    log.debug(`Was light ${light} changed successfully to ${stateBool}? ${result}`);
                });
                
            });

            
        });
}

function changeLightColor(lightIds, color, brightness, ip, user) {
    hue.api.createLocal(ip).connect(user)
        .then(api => {
            // for each light in lightIds, set the light state
            lightIds.forEach(light => {
                api.lights.setLightState(light, { on: true, brightness: brightness, xy: color })
                .then(result => {
                    log.debug(`Was state change successful? ${result}`)
                    });
                
            });
        });
}


// TODO make this default to a scene
changeLightColor(studioLights, helpers.RGBtoXY(255, 255, 255) , 255, secrets.hue.ip, secrets.hue.user);  // default to white



////////////////////// DEMO STUFF //////////////////////

// logDemo();

/** terminal-kit demo
 // term.grabInput( { mouse: 'button' } ) ;
term.on( 'key' , function( key , matches , data ) {

    switch ( key )
    {
        case 'UP' : term.up( 1 ) ; break ;
        case 'DOWN' : term.down( 1 ) ; break ;
        case 'LEFT' : term.left( 1 ) ; break ;
        case 'RIGHT' : term.right( 1 ) ; break ;
        case 'CTRL_C' : process.exit() ; break ;
        default:
            // Echo anything else
            term.noFormat(
                Buffer.isBuffer( data.code ) ?
                    data.code :
                    String.fromCharCode( data.code )
            ) ;
            break ;
    }
} ) ;

term.on( 'mouse' , function( name , data ) {
    term.moveTo( data.x , data.y ) ;
} ) ;
*/

// export default function hello(user = '    World') {
//   const u = user.trimStart().trimEnd();
//   return `Hello ${u}!\n`;
// }

// if (require.main === module) {
//   process.stdout.write(hello());
// }
