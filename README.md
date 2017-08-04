# chestnut-session Koa2会话处理

配合[chestnut-app](https://github.com/nandy007/chestnut-app)使用，也可单独在Koa2中使用

## 用法

app.js

```javascript

const Koa = require('koa');

const session = require('chestnut-session');

const app = new Koa();

// session配置
const config = {
	key: 'SESSIONID',// 配置会话id前缀
	storeConfig: {
    	id: 'main',
    	type: 'mysql',
    	database: 'test',
    	user: 'root',
    	password: 'root',
    	port: '3306',
    	host: 'localhost'
  	} // 必须，session存储配置，为数据库信息;
};

app.use(session(config));

```

## 静态方法

提供当session销毁的时候的回调处理，会传递会话id

```javascript

const session = require('chestnut-session');

// 有的时候会获取cookie信息来绑定一些逻辑并缓存起来，当需要在cookie不存在的时候销毁缓存可以添加处理函数
session.callback.add('custom key', function(sids){
	// 跟sids做一些销毁操作，sids为一个sid的数组，每个数组元素为都是会话id
});

```