# MobileCaddy Electron Wrapper Starter

A basic app that uses [MobileCaddy](https://mobliecaddy.net) to run fully offline, customisable Salesforce desktop apps.

# Files needed
A basic application needs just additions:

## package.json
- add the `mobilecaddy-electron` dependency
- Our file also needs these config items defined;
```json
  "name": "mobilecaddy-desktop",
  "productName": "mobilecaddy-desktop",
  "buildName" : "BIZ001",
  "loginEndpoint": "https://login.salesforce.com",
  "salesforceApiVersion" : "v30.0"
```
- `buildName` should be set to match your MobileCaddy app as per the Salesforce config
- `loginEndpoint` can be set matched your environment (e.g. *test.salesforce.com* for a sandbox)

## config.json

This file contains some config settings for our app. Supported items are as per this example;

```
{
  "mainWindowWidth": 800,
  "mainWindowHeight": 800,
  "mainWindowMinWidth":800,
  "mainWindowMinHeight": 600
}
```


## config-priv.json
Note this file is ignored by git, by default. This is done as it contains the Salesforce Connected app Consumer Key. You should create a file that looks like the following;
```
{
  "prodBuild": true,
  "debug": false,
	"salesforce_consumer_key" : "<YOUR_CONNECTED_APP_CONSUMER_KEY>",
  "callbackUrl": <YOUR_CONNECTED_APP_CALLBACK_URL>
}
```
The publicly known *SalesforceMobileSDK Sample App* consumer key and callback URL can be used during development, and so your *config-priv.json* would look like this;
```
{
  "prodBuild": true,
  "debug": false,
	"salesforce_consumer_key" : "3MVG9Iu66FKeHhINkB1l7xt7kR8czFcCTUhgoA8Ol2Ltf1eYHOU4SqQRSEitYFDUpqRWcoQ2.dBv_a1Dyu5xa",
  "callbackUrl": "testsfdc:///mobilesdk/detect/oauth/done"
}
```

You **should** replace thhis with a real key for your own connected app. When configuring your connected app you must specify the callback URL to be *testsfdc:///mobilesdk/detect/oauth/done*.

This file can also optionally take a `prodBuild` item that should be set to true when building for packaging. This affects internal paths and should be set to `false` when running from the command line.

It is possible to turn "debug" on (i.e. open dev tools on the main window) by setting the `debug` argument in the config-priv.json file. This defaults to `false`.


## main.js
- Add the the following. This kicks off authentication to Salesforce on the first run up
```javascript
  const mobilecaddy = require('mobilecaddy-electron')
```

## launcher.html

- This file is needed by the MobileCaddy libs. It's used as a springboard/root for our remote SPA
- Needs these lines in the `head`
```html
  <script src="node_modules/mobilecaddy-electron/lib/force.js"></script>
  <script src="node_modules/mobilecaddy-electron/lib/launcher.js"></script>
```


# To Use

Fork the repo, or download the zip. Install deps

```bash
# Install dependencies
npm install
```

We need to run some steps to build the SQLite DB. Note, these are WIP;

### Win (10)

These steps only need to be done once.

First install the tools needed to build SQLite (python, c++ compilers, etc) . Note, this can take many minutes (I have experienced 20+).

```
npm install --global --production windows-build-tools
```

Build the native modules
```
.\node_modules\.bin\electron-rebuild.cmd
```

This gives us a `node_modules\sqlite3\lib\binding\{some-placeholder-name}\node_sqlite3.node`, this needs to be renamed as required (e.g. `node_modules\sqlite3\lib/binding\electron-v1.4-win32-x86\node_sqlite3.node
`).

### Linux

This will, based on default config, build a .deb

```
npm run rebuild
```


***

Once we have this prepared we can run in dev mode from the command line like this;

```

# Normal run
npm start

# Or run with debug
npm start dbg

# Or clear all saved data - This will run, clear and quit
npm start clear
```


# Packaging

Packaging is handled by the [Electron Builder](https://github.com/electron-userland/electron-builder) package.

## Options

Several options can be configured in the `package.json`. Further info can be found on their wiki, but key items are listed here, and *should* be set specifically for each product

| Name |Description|
| --- | --- |
| version ||
| description||
| buildName | Should match the *Device App Name* as specified on Salesforce for the Mobile Application |
| build.appId| The application id. Used as [CFBundleIdentifier](https://developer.apple.com/library/ios/documentation/General/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html#//apple_ref/doc/uid/20001431-102070) for MacOS and as [Application User Model ID](https://msdn.microsoft.com/en-us/library/windows/desktop/dd378459(v=vs.85).aspx) for Windows (NSIS target only, Squirrel.Windows not supported). Defaults to com.electron.${name}. It is strongly recommended that an explicit ID be set.|
| build.copyright | The human-readable copyright line for the app. Defaults to `Copyright © year author`.|
| build.productName | See [Electron Builder docs](https://github.com/electron-userland/electron-builder/wiki/Options#AppMetadata-productName)|
| build.win.icon | A .ico file |
| legalTrademark | Legal Trademark text, such as `MobileCaddy is a legal trademark of MobileCaddy`|

A EULA License placeholder is included by default in in the `build/license.txt` file, or can be configured further as per the  [Electron Builder docs](https://github.com/electron-userland/electron-builder/wiki/Options). This *should be* modified or removed before publication|


## Build our Installable

This will, based on default config, build a .deb for Linux or a NSIS for Windows. The taget can be picked by adding a flag to the `dist` item in the package.json. E.g. `"dist": "build --win"`

If you have mobilecaddy-cli v2 installed you can use the following, where DEPLOY_ENV matches a name fom the `deployEnvs` attribute in the package.json

```
mobilecaddy desktop-build <DEPLOY_ENV>
```

```
npm run dist
```

If you have a `build\exemsi.xml` and you're building for Windows then add the `<VERSION>` and `<DEPLOY-ENV>` placeholders in (and remove the output file attribute from .xml file), and you can then build with `mobilecaddy desktop-msi`

# Post Install Running Options

Command line args can be provided to run in debug mode (open devTools) and for setiing the login Endpoint.

Note these are pretty crud and must be supplied in order

* Arg 1 - CmdLine Args "d"
* Arg 2 - Debug/Clear swicth : "clear" | "dbg"
* Arg 3 - Sandox or custom endpoint : "sandbox" | "custom"
* Arg 4 - Custom login endpoint URL

## Windows

```
// run in debug
MobileCaddy.exe d dbg

// run against a sandbox (https://test.salesfoce.com)
MobileCaddy.exe d false sandbox

// run against a custom endpoint
MobileCaddy.exe d false custom https://mycustomdomain.salesforce.com
```