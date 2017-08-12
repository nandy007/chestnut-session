const app = require("./app.mysql");

// 测试使用mysql数据库存储session
describe('server', function () {
    this.timeout(10*60*1000);
    it('server by mysql session should success', function (done) {
        app({
            storeConfig: {
                id: 'main',
                type: 'mysql',
                database: 'test',
                user: 'root',
                password: 'root',
                port: '3306',
                host: 'localhost'
            }
        }, function () {
            done();
        });
    });


});