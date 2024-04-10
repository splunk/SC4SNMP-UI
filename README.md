# SC4SNMP-UI

## Installing `docker`, `python3`, `yarn` and `git`

Before running SC4SNMP-UI, `docker`, `python3`, `yarn` and `git` must be installed on the computer. 
To install `docker` on Mac visit this website https://docs.docker.com/desktop/install/mac-install/

The most convenient way to install rest of the packages on Mac is to use Homebrew packet manager (https://brew.sh/).
To install hombrew on your Mac computer open the terminal and run the following command:

```shell
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installing homebrew on your Mac, you can run following commands to install `python3` and `yarn`.

```shell
brew install python3  
brew install yarn  
```

It is also a good practice to create virtual environments for each python project. `virtualenv` is a
tool to create such environments. To install `virtualenv` run.

```shell
pip3 install virtualenv
```

To clone this GitHub repository to your local machine you will also need `git` installed locally. 
To do this run

```shell
brew install git
```

## Cloning the repository for testing UI

In terminal change directory to this one, where you want to install SC4SNMP-UI. For example,
if you want to clone this repository to your desktop run, first run the following command on Mac

```shell
cd ~/Desktop
```

Now you can clone the `UI-testing` branch of this repository by running:

```shell
git clone --branch UI-testing https://github.com/splunk/SC4SNMP-UI.git
```

Now if you run `ls` command in the terminal, one of the listed directories will be `SC4SNMP-UI`.
To move to this directory run:

```shell
cd SC4SNMP-UI
```

## Run flask backend

Make sure that you are in `SC4SNMP-UI` directory in the terminal (final step of the previous section).
Now create and start new `python3` environment by running:

```shell
virtualenv venv
source venv/bin/activate
```

Next step is to install required `python3` packages:

```shell
cd backend
pip3 install -r requirements.txt 
```

Run mongoDB in docker:

```shell
docker run --rm -d -p 27017:27017 --name example-mongo mongo:4.4.6
```

To start backend service run:

```yaml
flask run
```

## Run react frontend

Open new terminal window and navigate to `SC4SNMP-UI` directory and run the following commands:

```yaml
cd frontend
yarn install
yarn run build
cd packages/manager
yarn run start:demo
```

Those commands might take few minutes to run. When you finally see the output like this below enter 
`http://localhost:8080/` in your browser.

```shell
$ webpack-dev-server --config demo/webpack.standalone.config.js --port ${DEMO_PORT-8080}
ℹ ｢wds｣: Project is running at http://localhost:8080/
ℹ ｢wds｣: webpack output is served from /
ℹ ｢wds｣: Content not from webpack is served from /Users/wzya/Desktop/SC4SNMP-UI/frontend/packages/manager
ℹ ｢wdm｣: Hash: f81c1e4b7410f0993382
Version: webpack 4.46.0
Time: 1414ms
Built at: 09/30/2022 1:36:31 PM
                       Asset       Size  Chunks                         Chunk Names
                  index.html  424 bytes          [emitted]              
main.js?6954010fe1fe882d207d   11.4 MiB    main  [emitted] [immutable]  main
Entrypoint main = main.js?6954010fe1fe882d207d
[0] multi (webpack)-dev-server/client?http://localhost:8080 ./demo/demo 40 bytes {main} [built]
[../../node_modules/@splunk/splunk-utils/themes.js] /Users/wzya/Desktop/SC4SNMP-UI/frontend/node_modules/@splunk/splunk-utils/themes.js 3.37 KiB {main} [built]
[../../node_modules/@splunk/themes/index.js] /Users/wzya/Desktop/SC4SNMP-UI/frontend/node_modules/@splunk/themes/index.js 2.58 KiB {main} [built]
[../../node_modules/react-dom/index.js] /Users/wzya/Desktop/SC4SNMP-UI/frontend/node_modules/react-dom/index.js 1.33 KiB {main} [built]
[../../node_modules/react/index.js] /Users/wzya/Desktop/SC4SNMP-UI/frontend/node_modules/react/index.js 190 bytes {main} [built]
[../../node_modules/webpack-dev-server/client/index.js?http://localhost:8080] (webpack)-dev-server/client?http://localhost:8080 4.29 KiB {main} [built]
[../../node_modules/webpack-dev-server/client/overlay.js] (webpack)-dev-server/client/overlay.js 3.52 KiB {main} [built]
[../../node_modules/webpack-dev-server/client/socket.js] (webpack)-dev-server/client/socket.js 1.53 KiB {main} [built]
[../../node_modules/webpack-dev-server/client/utils/createSocketUrl.js] (webpack)-dev-server/client/utils/createSocketUrl.js 2.91 KiB {main} [built]
[../../node_modules/webpack-dev-server/client/utils/log.js] (webpack)-dev-server/client/utils/log.js 964 bytes {main} [built]
[../../node_modules/webpack-dev-server/client/utils/reloadApp.js] (webpack)-dev-server/client/utils/reloadApp.js 1.59 KiB {main} [built]
[../../node_modules/webpack-dev-server/client/utils/sendMessage.js] (webpack)-dev-server/client/utils/sendMessage.js 402 bytes {main} [built]
[../../node_modules/webpack-dev-server/node_modules/strip-ansi/index.js] (webpack)-dev-server/node_modules/strip-ansi/index.js 161 bytes {main} [built]
[../../node_modules/webpack/hot sync ^\.\/log$] (webpack)/hot sync nonrecursive ^\.\/log$ 170 bytes {main} [built]
[./demo/demo.jsx] 1.17 KiB {main} [built]
    + 395 hidden modules
Child html-webpack-plugin for "index.html":
     1 asset
    Entrypoint undefined = index.html
    [../../node_modules/html-webpack-plugin/lib/loader.js!./demo/standalone/index.html] /Users/wzya/Desktop/SC4SNMP-UI/frontend/node_modules/html-webpack-plugin/lib/loader.js!./demo/standalone/index.html 543 bytes {0} [built]
    [../../node_modules/lodash/lodash.js] /Users/wzya/Desktop/SC4SNMP-UI/frontend/node_modules/lodash/lodash.js 531 KiB {0} [built]
    [../../node_modules/webpack/buildin/global.js] (webpack)/buildin/global.js 472 bytes {0} [built]
    [../../node_modules/webpack/buildin/module.js] (webpack)/buildin/module.js 497 bytes {0} [built]
ℹ ｢wdm｣: Compiled successfully.
```
