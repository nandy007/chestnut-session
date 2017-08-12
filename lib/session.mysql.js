// 请勿修改

'use strict';
const db = require('chestnut-utils').db;

const CREATE_STATEMENT = 'CREATE  TABLE IF NOT EXISTS `_mysql_session_store` (`id` VARCHAR(255) NOT NULL, `expires` BIGINT NULL, `data` TEXT NULL, PRIMARY KEY (`id`));'
    , GET_STATEMENT = 'SELECT * FROM `_mysql_session_store` WHERE id  = ?'
    , SET_STATEMENT = 'INSERT INTO _mysql_session_store(id, expires, data) VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE expires=?, data =?'
    , DELETE_STATEMENT = 'DELETE FROM `_mysql_session_store` WHERE id  = ?'
    , CLEANUP_STATEMENT = 'DELETE FROM `_mysql_session_store` WHERE id IN (?)'
    , EXPIRES_STATEMENT = 'SELECT id FROM `_mysql_session_store` WHERE expires  < ?';

const FORTY_FIVE_MINUTES = 45 * 60 * 1000;

let getExpiresOn = function (session, ttl) {
    let expiresOn = null;
    ttl = ttl || FORTY_FIVE_MINUTES

    if (session && session.cookie && session.cookie.expires) {
        if (session.cookie.expires instanceof Date) {
            expiresOn = session.cookie.expires
        } else {
            expiresOn = new Date(session.cookie.expires)
        }
    } else {
        let now = new Date();
        expiresOn = new Date(now.getTime() + ttl);
    }
    return expiresOn
}


class SessionStore {
    // options为session配置参数
    constructor(options) {
        this.connection = db(options);
        this.init();
    };

    cleanup(callback) {
        let now = (new Date()).valueOf();
        const connection = this.connection;
        connection.query(EXPIRES_STATEMENT, [now])
            .then(function(rs){      
                if(rs.length===0)  return;
                for(let i=0, len=rs.length;i<len;i++){
                    rs[i] = rs[i].id;
                }
                callback&&callback(rs);
                connection.query(CLEANUP_STATEMENT, [rs]);
            }); 
    };

    init(){
        this.connection.query(CREATE_STATEMENT);
    }

    // 必须实现，并且必须是async、promise或者iterator之一
    async get(sid) {
        let results = await this.connection.query(GET_STATEMENT, [sid]);
        let session = null;
        if (results && results[0] && results[0].data) {
            session = JSON.parse(results[0].data);
        }
        return session;
    };
    // 必须实现，并且必须是async、promise或者iterator之一
    async set (sid, session, ttl) {
        let expires = getExpiresOn(session, ttl).valueOf();
        let data = JSON.stringify(session);
        let results = this.connection.query(SET_STATEMENT, [sid, expires, data, expires, data]);
        return results;
    };
    // 必须实现，并且必须是async、promise或者iterator之一
    async destroy (sid) {
        let results = this.connection.query(DELETE_STATEMENT, [sid]);
    };

}

module.exports = SessionStore;