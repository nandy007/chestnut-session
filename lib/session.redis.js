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
		if(!data) return null;
		const {session, ttl} = JSON.parse(data);
		this.redis.expire(`${sid}`, ttl);
		return session;
	}

	async set(sid, session, ttl) {
		const data = {
			session: session,
			ttl: ttl
		}
		return await this.redis.set(`${sid}`, JSON.stringify(data), 'EX', ttl);
	}

	async destroy(sid) {
		return await this.redis.del(`${sid}`);
	}
}

module.exports = SessionStore;