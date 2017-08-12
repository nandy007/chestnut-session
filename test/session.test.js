const app = require("./app");


// 测试使用默认方式存储session
describe('server', function () {
    this.timeout(10*60*1000);
    it('server by session should success', function (done) {
        app(function(){
            done();
        });
    });
});