# stream-tech


there are two parts to this thing..

1. the front end (overlay)
2. the server (incl. chat bot)

the server communicates with chat and twitch's api, then forwards respective actions to HUE api and the overlay.

the overlay listens for server's requests via websockets (socket.io) and forwards obs events it detects back to the server (via ws as well).

the server is a node app hosting the websocket server over http as an express app

the overlay is hosted via webpack

you will need to install and run these two parts separately but concurrently.

### installing
**./overlay**
`npm install`

**./server**
`npm install`

press big button (sync) on hue bridge then...
`npm run setup`

copy hue bridge IP and light ID's for the lights you want to use into `config.js`
and add the user and key values to `secrets.js`

update both `config.js` and `secrets.js` with your twitch bot's/app's info as well


### running
ensure secrets and config parameters are set


**./server**
`npm run dev`

**./overlay**
`npm run dev`

add `http://0.0.0.0:6969` as a browser source in obs

send `!help` in chat to test if the bot's connected

use `!color <color>` in chat to test hue and overlay integration


