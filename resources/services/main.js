/*
    Function to set up a system tray menu with options specific to the window mode.
    This function checks if the application is running in window mode, and if so,
    it defines the tray menu items and sets up the tray accordingly.
*/
function setTray() {
    // Tray menu is only available in window mode
    if(NL_MODE != "window") {
        console.log("INFO: Tray menu is only available in the window mode.");
        return;
    }

    // Define tray menu items
    let tray = {
        icon: "/resources/icons/favicon.ico",
        menuItems: [
            {id: "VERSION", text: "Get version"},
            {id: "SEP", text: "-"},
            {id: "QUIT", text: "Quit"}
        ]
    };

    // Set the tray menu
    Neutralino.os.setTray(tray);
}


//Function to handle the window close event by gracefully exiting the Neutralino application.
function onWindowClose() {
    Neutralino.debug.log("Application is sutting down...");
    Neutralino.app.exit();
}

// Initialize Neutralino
Neutralino.init();
Neutralino.debug.log("Application is starting up...");

// Register event listeners
Neutralino.events.on("windowClose", onWindowClose);

Neutralino.events.on('close', () => {
    Neutralino.app.exit();
});

// Conditional initialization: Set up system tray if not running on macOS
if(NL_OS != "Darwin") { 
    setTray();
}
