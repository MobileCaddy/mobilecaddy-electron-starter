const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const {ipcMain} = require('electron')

const storage = require('electron-json-storage');

var querystring = require('query-string');

// Which tit named this... oh me
var queryString = "";

// Your SF Applications Credentials
var options = {
    client_id: '3MVG9Rd3qC6oMalWEuQby1hkUef0N2L7kTPExDjRAs1GH35ueKyc3q_D5NY0LLoLHnfwIr_Y8PyeRotaClrtZ'
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null

var cmdLineArgs = process.argv;
  console.log ("cmdLineArgs", cmdLineArgs);
if (cmdLineArgs[2] == "clear") {
  console.log ("Clearing stuff");
  storage.remove('alreadyLoggedIn');
  storage.remove('startPageUrl');
}

function createWindow () {

  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 800})

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  storage.has('alreadyLoggedIn', function(error, hasKey) {
    if (error) throw error;
    if (hasKey) {
      console.log('User has already logged in');
      storage.get('alreadyLoggedIn', function(error, data) {
        if (error) throw error;
        console.log(data);

        mainWindow.loadURL(`file://${__dirname}/index.html?` + data.queryString);
      });

    } else {

      var authShouldClose = false;

      // Build the OAuth consent page URL
      var authWindow = new BrowserWindow({ width: 600, height: 650, show: false, 'node-integration': false });
      var sfLoginUrl = 'https://login.salesforce.com';
      var authUrl = sfLoginUrl + '/services/oauth2/authorize?client_id=' + options.client_id + '&redirect_uri=' + 'http://localhost:3030/oauthcallback.html' + '&response_type=token';
      authWindow.loadURL(authUrl);
      authWindow.show();


      // Handle the oauth callback form Salesforce... we don't really have this page
      // so we listen this event to get our token
      authWindow.webContents.on('will-navigate', function(event, newUrl) {

        if (newUrl.indexOf("oauthcallback.html") > 0) {
          if (newUrl.indexOf("access_token=") > 0) {
              queryString = newUrl.substr(newUrl.indexOf('#') + 1);
              //obj = querystring.parse(queryString);
              // Close the browser if code found or error
              //authWindow.close();
          } else if (newUrl.indexOf("error=") > 0) {
              queryString = decodeURIComponent(newUrl.substring(newUrl.indexOf('?') + 1));
              obj = querystring.parse(queryString);
              authWindow.close();
          } else {
              if (loginErrorHandler) loginErrorHandler({status: 'access_denied'});
          }
        }
      });


      authWindow.webContents.on('did-finish-load', function(event, newUrl) {
        console.log("did-finish-load");
        if ( authShouldClose ) {
          authWindow.close();
          mainWindow.loadURL(`file://${__dirname}/index.html?` + queryString);
        }
      });
      authWindow.webContents.on('did-fail-load', function(event, newUrl) {
        console.log("did-fail-load", authWindow.webContents.getURL());
        if (authWindow.webContents.getURL().indexOf("localhost:3030") > 0 ) authShouldClose = true;
        //authWindow.close();
      });


      // Reset the authWindow on close
      authWindow.on('close', function() {
          console.log("queryString: " + queryString);
          if (queryString != "") {
            storage.set('alreadyLoggedIn', { 'queryString': queryString }, function(error) {
              if (error) throw error;
            });
          }
          authWindow = null;
      }, false);
    }
  });



  mainWindow.webContents.on('did-finish-load', function(event, newUrl) {
    console.log("mainWindow, did-finish-load", newUrl);
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// IPC - vfRemote is asking for our auth creds
ipcMain.on('request-creds', (event, arg) => {
  console.log('request-creds', arg)  // prints "ping"
  const org_id = getOrgIdFromQueryString();
  console.log("org_id", org_id);
  event.returnValue = queryString +
    '&client_id=' + options.client_id +
    '&org_id=' + org_id;
})

// IPC - local page is asking for the startPageUrl that we have stored.
ipcMain.on('request-startPageUrl', (event, arg) => {
  console.log('request-startPageUrl', arg)
  storage.get('startPageUrl', function(error, data) {
    if (error) throw error;
    console.log(data);
    event.returnValue = data.startPageUrl;
  });
})

// IPC - got startPageUrl from the vfRemotePage - store it for future startups
ipcMain.on('startPageUrl', (event, arg) => {
  console.log('startPageUrl', arg)
  storage.set('startPageUrl', { 'startPageUrl': arg });
})


function getOrgIdFromQueryString() {
  const id = getUrlParamByName('id', queryString);
  return id.split('/')[4];
}

function getUrlParamByName(name, qString) {
  console.info('getUrlParamByName -> name = ' + name);
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec('?' + qString);
  console.log('getUrlParamByName results -> ' + results);
  if(results === null) {
    return '';
  }
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
} // end getUrlParamByName