const Koa = require('koa');
const http = require('http');

const app = new Koa();

const session = require('../index');


let util = function (options, cb) {

    app.use(session(options));

    app.use(async function (ctx, next) {
        const username = ctx.session && ctx.session.username;
        if (username) {
            ctx.body = ctx.session.sid+':'+username;
            ctx.session = null;
            setTimeout(cb, 10 * 1000);
        } else {
            if (ctx.session) ctx.session.username = 'nandy';
            ctx.body = 'no session';
        }
    });
    http.createServer(app.callback()).listen(3001);
    console.log('请在浏览器上连续访问http://127.0.0.1:3001两次');
};

module.exports = util;