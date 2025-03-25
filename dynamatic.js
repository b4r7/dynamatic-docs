let baseUrl = "http://192.168.1.113";

const wireFeed = async (length) => {
    await sendCommand(`G91\nG0 X${length}\nG90`);
}

const clampOpen = async (length) => {
    await sendCommand(`G0 Z0`);
}

const clampClose = async (length) => {
    await sendCommand(`G0 Z1`);
}


const makeFormData = (length, filename) => {

    var path = "/";

    var formData = new FormData();
    var textBlob = new Blob([templateMakeWire(length)], {type: "text"});

    formData.append('myfile[]', textBlob, path + filename + ".g");

    formData.append('path', path);
    return formData;
}

const makeWire = async (length) => {
    
    const formData = makeFormData(length, "wire.g");

    const reqUrl = baseUrl+"/upload";

    console.info("Uploading Gcode file to ", reqUrl)

    await fetch(reqUrl, {
        method: "POST",
        mode: "no-cors",   
        body: formData        
    })

    await sendCommandSilent("M23 /WIREG~1.G\nM24")
    
}



const sendCommand = async (command) => {
    
    const reqUrl = encodeURI(`${baseUrl}/command?commandText=${command}`);

    console.info("Requesting", reqUrl)
  
    await fetch(reqUrl, {
        method: "GET", 
        mode: "no-cors"
    });

}

const sendCommandSilent = async (command) => {

    const reqUrl = encodeURI(`${baseUrl}/command_silent?commandText=${command}`);
    console.info("Requesting", reqUrl)

  
    await fetch(reqUrl, {
        method: "GET", 
        mode: "no-cors"
    });

}


const templateMakeWire = (wireLength) => {
    
    return `M150 S0 R255 U255 B255 ; Set all lights to white
M150 I0 R255 U255 B255 ; Set backlight color

;First, make sure the clamp is open
;The clamp motor is on the Z axis, and it's coordinates are defined as 2 for a whole rotation. That way, 0 is open (disengaged), and 1 is closed (engaged).
G90 ;Absolute movement mode
G0 Z0 F1000


;10mm is the width of the clamp, and this amount of thread is lost in the melting process.
;The "X${wireLength}" part is what will need to be set by whatever program is sending this gcode file to the machine.
G91 ;Relative movement mode
G0 X${wireLength} F5000 ; X110 -> Move X axis ${wireLength}. 


; Engage the clamp
G90 ;Absolute movement mode
G0 Z1 F1000


M150 I0 R255 U0 B0 ; Set backlight color to red

M150 I1 R255 U100 B0 ; Set button leds
M150 I2 R255 U100 B0 ; Set button leds
M0 Click to open clamp ; Pauses the program, shows "Click to open clamp" on display, and continues when button is pressed.
M150 S0 R255 U255 B255 ; Set all lights to white


; Disengage the clamp
G90 ;Absolute movement mode
G0 Z0 F1000
M17 Z
`
}