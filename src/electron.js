var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var mainWindow = null;

function createWindow() {
  // Initialize the window to our specified dimensions
  mainWindow = new BrowserWindow({ width: 900, height: 900, titleBarStyle: 'hidden-inset' });

  // Tell Electron where to load the entry point from  
  mainWindow.loadURL('http://localhost:3000/dist/');


  // Clear out the main window when the app is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('window-all-closed', function () {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', createWindow);

app.on('activate', function (e) {
  if (mainWindow === null) {
    createWindow();
  }
})
