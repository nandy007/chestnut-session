// 请勿修改
const Redis = require("ioredis");

class SessionStore {
	constructor(options) {
		this.redis = new Redis({
			port    : options.port,
			host    : options.host,
			password: options.password || ''
		});
	}

	async get(sid) {
		let data = await this.redis.get(`${sid}`);
		return JSON.parse(data);
	}

	async set(sid, session, ttl) {
		return await this.redis.set(`${sid}`, JSON.stringify(session), 'EX', ttl);
	}

	async destroy(sid) {
		return await this.redis.del(`${sid}`);
	}
}

module.exports = SessionStore;