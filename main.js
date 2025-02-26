const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Create a new window
  const win = new BrowserWindow({
    width: 500,
    height: 600,
    webPreferences: {
      nodeIntegration: true , // Allow Node.js integration in the renderer process (useful for accessing npm packages)
      contextIsolation: false,
    }
  });

  // Load the HTML file in the window
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// Quit the app when all windows are closed (macOS specific)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
