'use strict';
var tcpServer = require('./app/server/tcpserver')

class AppBootHook {
    constructor(app) {
        this.app = app;
    }

    async didReady() {
        tcpServer();
        console.log('启动了tcp服务')
    }
}

module.exports = AppBootHook;