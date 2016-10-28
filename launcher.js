// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var SupportMc = {};

var access_token  = getUrlParamByName('access_token'),
    refresh_token = getUrlParamByName('refresh_token'),
    userId        = getUrlParamByName('id');

var pjson = require('./package.json');

var alreadyInstalled = localStorage.getItem('alreadyInstalled');

var url = '';
console.log("access_token", access_token);
if (access_token) {
  if (!alreadyInstalled) {
    localStorage.setItem('forceOAuth', JSON.stringify({'access_token': access_token, 'refresh_token': refresh_token, 'id': userId, 'instance_url': getUrlParamByName('instance_url'),}));
    force.init({
      appId: "3MVG9Rd3qC6oMalWEuQby1hkUef0N2L7kTPExDjRAs1GH35ueKyc3q_D5NY0LLoLHnfwIr_Y8PyeRotaClrtZ",
        apiVersion: pjson.salesforceApiVersion,
        loginUrl: pjson.loginEndpoint,
        tokenStore : localStorage,
        oauthRedirectURL: 'http://localhost:3030/oauthcallback.html'
    });
    localStorage.setItem("alreadyInstalled", "true");

    SupportMc.constants = {
        buildVersion : '001',
        buildName : pjson.buildName,
        bootstrapPage : '/apex/mobilecaddy1__MobileCaddyBootstrap001_mc',
        offerLanguageChoice : true
    }

    var device={uuid:"c86d3e94574debug",name:"undefined",cordova:"3.9.2",platform:"iOS",version:"",model:""};

    // Get mills since the epoch
    var millsSinceEpoch = new Date().getTime();

    // Build up the start url for Salesforce boot page
    url =  getUrlParamByName('instance_url')+
    SupportMc.constants.bootstrapPage +
    '?deviceUuid=' + device.uuid +
    '&deviceName=' + device.name +
    '&deviceCordova=' + device.cordova +
    '&deviceVersion=' + device.version +
    '&deviceModel=' + device.model +
    '&buildName=' + SupportMc.constants.buildName +
    '&buildVersion=' + SupportMc.constants.buildVersion +
    '&buildOS=' + device.platform +
    '&orientation=' + 'landscape' +
    '&viewportWidth=' + '800' +
    '&viewportHeight=' + '800' +
    '&sessionType=New Install' + // will revisit when update code done
    '&connType=' + 'wifi' +
    '&millsFromEpoch=' + millsSinceEpoch +
    '&loginUrl=' + pjson.loginEndpoint +
    '&userLanguage=' + '';

    // Redirect to start url
    console.log('Redirecting to: ' + url);
    try {
      window.location.href = url;
    }
    catch (error) {
      console.error(error);
    }
  } else {
    console.log("alreadyInstalled, so need to get URL from AUD");
    if (localStorage.getItem("startPageUrl")) {
      redirectToStartPage();
    } else {
      // Already Installed - now need to get startup URL
      // Not we are only getting this once - this means at the moment that
      // Versioning will not work
      force.init({
        appId: "3MVG9Rd3qC6oMalWEuQby1hkUef0N2L7kTPExDjRAs1GH35ueKyc3q_D5NY0LLoLHnfwIr_Y8PyeRotaClrtZ",
          apiVersion: pjson.salesforceApiVersion,
          loginUrl: pjson.loginEndpoint,
          tokenStore : localStorage,
          oauthRedirectURL: 'http://localhost:3030/oauthcallback.html'
      });
      redirectToStartPage();
    }
  }


} else {
  console.log("no access_token yet");
}

/**
 * @function getUrlParamByName
 * @description Gets value from a querystring by name
 * @param  {string} name Name of the param to pluck out
 * @return {string}      The value
 */
function getUrlParamByName(name) {
  console.info('getUrlParamByName -> name = ' + name);
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  console.log('getUrlParamByName results -> ' + results);
  if(results === null) {
    return '';
  }
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}


/**
 * function redirectToStartPage
 * @description Requests the startpageUrl from the main process and redirects
 */
function redirectToStartPage() {
  var ipcRenderer = require('electron').ipcRenderer;
  var startPageUrl = ipcRenderer.sendSync('request-startPageUrl', '');
  console.log("startPageUrl", startPageUrl);
  try {
      window.location.href = startPageUrl;
    }
    catch (error) {
      console.error(error);
    }
}
