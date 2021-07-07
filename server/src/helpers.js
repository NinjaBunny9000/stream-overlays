// This is based on original code from http://stackoverflow.com/a/22649803
// with special credit to error454's Python adaptation: https://gist.github.com/error454/6b94c46d1f7512ffe5ee

function EnhanceColor(normalized) {
    if (normalized > 0.04045) {
        return Math.pow( (normalized + 0.055) / (1.0 + 0.055), 2.4);
    }
    else { return normalized / 12.92; }
        
}

function RGBtoXY(r, g, b) {
    let rNorm = r / 255.0;
    let gNorm = g / 255.0;
    let bNorm = b / 255.0;

    let rFinal = EnhanceColor(rNorm);
    let gFinal = EnhanceColor(gNorm);
    let bFinal = EnhanceColor(bNorm);

    let X = rFinal * 0.649926 + gFinal * 0.103455 + bFinal * 0.197109;
    let Y = rFinal * 0.234327 + gFinal * 0.743075 + bFinal * 0.022598;
    let Z = rFinal * 0.000000 + gFinal * 0.053077 + bFinal * 1.035763;

    if ( X + Y + Z === 0) {
        return [0,0];
    } else {
        let xFinal = X / (X + Y + Z);
        let yFinal = Y / (X + Y + Z);
    
        return [xFinal, yFinal];
    }

};

function hexToRGB(h) {
    let r = 0, g = 0, b = 0;
  
    // 3 digits
    if (h.length === 4) {
      r = "0x" + h[1] + h[1];
      g = "0x" + h[2] + h[2];
      b = "0x" + h[3] + h[3];
  
    // 6 digits
    } else if (h.length === 7) {
      r = "0x" + h[1] + h[2];
      g = "0x" + h[3] + h[4];
      b = "0x" + h[5] + h[6];
    }

    return [parseInt(r), parseInt(g), parseInt(b)];
  }

function getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}


export {
    EnhanceColor,
    RGBtoXY,
    hexToRGB,
    getRandomColor
};