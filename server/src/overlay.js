import { logger as log } from './loggyboi';

class OverlayCommander {
    constructor(io) {
        this.io = io;
        this.state = { 
            border: [0, 0, 0],
            proj: ''
         }

         this.io.on("connection", (socket) => {
            this.resetOverlays(socket);
        });
    }

    // connect() {
    //     this.io.on("connection", (socket) => {
    //         log.silly('we got us here a connection');
    //         socket.emit('overlay-reset', this.state);
    //     });
    // }

    resetOverlays(socket) {
        // TODO push all the things that the overlay should b do
        socket.emit('overlay-reset', this.state);
    }

    changeBorderColor([r, g, b]) {
        // TODO: implement this method
        this.state.border = [r, g, b];
        this.io.emit("color-change", [r, g, b]);
    }

    updateProject(proj) {
        this.state.proj = proj;
        this.io.emit("project-update", proj);
    }


}

export { OverlayCommander };
