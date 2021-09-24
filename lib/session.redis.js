// 请勿修改
const Redis = require("ioredis");

class SessionStore {
	constructor(options) {
		// 如果参数为数组则使用集群模式
		if(!(options instanceof Array)){
			options = [options];
		}
		this.redis = options.length>1 ? new Redis.Cluster(options) : new Redis(options[0]);
	}

	async get(sid) {
		let data = await this.redis.get(sid);
		if(!data) return null;
		const {session, ttl} = JSON.parse(data);
		await this.touch(sid, ttl);
		return session;
	}

	async set(sid, session, ttl) {
		const data = {
			session: session,
			ttl: ttl
		}
		return await this.redis.set(sid, JSON.stringify(data), 'PX', ttl);
	}

	async destroy(sid) {
		return await this.redis.del(sid);
	}

	async touch(sid, ttl){
		await this.redis.pexpire(sid, ttl);
	}
}

module.exports = SessionStore;