const Koa = require('koa');
const http = require('http');

const app = new Koa();

const session = require('../index');

let util = function (cb) {
    app.use(session());

    app.use(async function (ctx, next) {
        const username = ctx.session && ctx.session.username;
        if (username) {
            ctx.body = username;
            ctx.session = null;
            setTimeout(cb, 10 * 1000);
        } else {
            ctx.body = 'no session';
            if (ctx.session) ctx.session.username = 'nandy';
        }
    });

    http.createServer(app.callback()).listen(3000);


    console.log('请在浏览器上连续访问http://127.0.0.1:3000两次');

};

module.exports = util;