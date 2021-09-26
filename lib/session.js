// 请勿修改

const koaSession = require('koa-session-minimal');
const uid = require('uid-safe');


let cache = {};// 缓存销毁会话后的回调方法
// 执行缓存中的回调方法
let handlerCallback = function (sids) {
    for (let k in cache) {
        cache[k](sids);
    }
};

// 定义清除过期会话的周期
const CLEANUP_INTERVAL = 15 * 60 * 1000;

/**
  * 获取cookie函数
  * @param   {Object}      opts         [cookie配置]
  * @param   {Object}      ctx          [Koa上下文对象]
  * @return  {Object}      cookie配置
  */
const getCookie = function (opts, ctx) {
    const cookie = opts.cookie;
    const obj = cookie instanceof Function ? cookie(ctx) : cookie;
    const options = Object.assign({
        maxAge: 0,
        path: '/',
        httpOnly: true
    }, obj || {}, {
            overwrite: true,
            signed: false
        });
    if (!(opts.maxAge >= 0)) opts.maxAge = 0;
    return options;
};

/**
  * koaSession中间件的store规范格式化处理函数
  * @param   {Object}      options         [session配置]
  * @return  {Object}      koaSession中间件的store规范格式化对象
  */
let store = function (options) {
    // 获取sessionstore处理类，根据type区分
    const SessionStore = require('./session.' + (options.type||'redis'));
    // 定义实例化对象
    const _sessionStore = new SessionStore(options);

    // 定时清理过期会话
    store.setCleanup(_sessionStore);

    // 比如符合{get, set, destory}
    return {
        get: async function (sid) {
            return _sessionStore.get(sid);
        },
        set: async function (sid, session, ttl) {
            // session.sid为当没有cookie的时候自动生成的，当自动生成时以自动生成的为准
            if (session.sid && session.sid !== sid) sid = session.sid;
            _sessionStore.set(sid, session, ttl);
        },
        destroy: function (sid) {
            // 当有会话销毁的时候通知回调
            handlerCallback([sid]);
            _sessionStore.destroy(sid);
        }
    };
};

/**
  * 设置定时器定时删除过期会话函数
  * @param   {Object}      sessionStore         [SessionStore的实例化对象]
  */
store.setCleanup = function (sessionStore) {
    if (!sessionStore.cleanup) return;
    sessionStore.cleanup(handlerCallback);
    setInterval(function () {
        sessionStore.cleanup(handlerCallback);
    }, CLEANUP_INTERVAL);
};

/**
  * 创建session对象函数
  * @param   {Object}      obj           [session对象]
  * @param   {Object}      oldSession    [老的会话对象]
  * @return  {Object}      session对象
  */
store.createSessionObject = function (obj, oldSession) {
    let session = obj || {};
    oldSession = oldSession || {};
    let _sid = oldSession.sid || '';
    let _custom = oldSession.custom || {};

    // 设置不可遍历属性
    const props = [{ name: 'sid', val: _sid }, { name: 'custom', val: _custom }];
    for (let prop of props) {
        Object.defineProperty(session, prop.name, {
            configurable: true,
            enumerable: false,
            get: function () {
                return prop.val;
            },
            set: function (newVal) {
                prop.val = newVal;
            }
        });
    }
    
    // 提供hasData属性判断session是否有设置
    Object.defineProperty(session, 'hasData', {
        configurable: true,
        enumerable: false,
        get: function () {
            return Object.keys(session || {}).length > 0;
        }
    });

    return session;
};


/**
  * session中间件函数
  * @param   {Object}      options         [session配置]
  * @return  {Function}    符合Koa中间件处理函数
  */
let middleware = function (options) {
    options = options||{};
    // 如果没有设置key则使用SEESIONID作为key
    if (!options.key) options.key = 'SESSIONID';

    // 获取koasession要求的store格式
    if(typeof options.storeConfig==='object') options.store = store(options.storeConfig);

    const koaSessionMiddleware = koaSession(options);

    return async function (ctx, next) {
        // 设置session对象
        let _session = store.createSessionObject();
        // 监听session的设置与获取
        Object.defineProperty(ctx, 'session', {
            get: function () {
                return _session;
            },
            set: function (newVal) {
                _session = store.createSessionObject(newVal, _session);
            }
        });
        // 从cookie中获取sessionId
        const sessionId = ctx.cookies.get(options.key);
        let id;// 新的session分配
        // 如果cookie不存在则创建并跳转，但是并未入库！！！
        // 执行koasession
        await koaSessionMiddleware(ctx, function () {
            let sid;
            // 如果cookie不存在的时候自动生成sid
            if (!sessionId) {
                id = uid.sync(24);
                ctx.session = {};
            } else {
                id = sessionId;
            }
            sid = options.key + ':' + id;
            ctx.session.sid = sid;
            return next();
        });
        // 如果cookie不存在的时候自动创建cookie，以覆盖koa-session-minimal生成的cookie
        const cookie = getCookie(options, ctx);
        // 重新将生成的sid设置到cookie中
        ctx.cookies.set(options.key, id, cookie);
    };
};

// 会话destory时的回调处理
middleware.callback = {
    // 添加回调
    add: function (k, func) {
        cache[k] = func;
    },
    // 删除回调
    remove: function (k) {
        delete cache[k];
    },
    // 清空所有回调
    clear: function () {
        cache = {};
    }
};

module.exports = middleware;