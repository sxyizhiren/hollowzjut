var express = require('express');
var app = express();
app.use(function(req, res, next){
    console.log('%s-%s', req.method, req.url);
    next();
});
var port=80;
//多次require只会被执行一次listen，而且先listen后续添加app.use也是可以生效的
app.listen(port);


var redis = require("redis");
var redisClient = redis.createClient();
redisClient.on("error", function (err) {
    console.log("redisClient Error " + err);
});

var messageType={
    textType:'text',            //文字信息
    deleteGossip:'delGossip',   //删除留言板留言
    sofaType:'sofa',                //抢沙发，即回复别人状态
    imageType:'image',              //传图片
    imgDespt:'imgDespt',            //发布图片描述信息+发布到新鲜事
    errorType:'error',              //错误信息，包括不合法的状态或留言
    ctrlType:'ctrlAction'     //控制命令
};


/**
 * 增加重试次数加1，返回是否满最大尝试次数
 * @param obj
 * @param maxTryTime
 * @return {Boolean}
 */
var addTryTimeAndWhetherFull=function(obj,maxTryTime){
    if(typeof obj != 'object'){
        return false;
    }
    if(typeof maxTryTime != 'number'){
        maxTryTime = 3;
    }
    if(!obj.tryTime){
        obj.tryTime = 1;
    }else{
        obj.tryTime ++;
    }
    if(obj.tryTime >= maxTryTime){
        return true;
    }
    return false;
}

var imgPath=require('path').join(__dirname,'../image/');
var confPath=require('path').join(__dirname,'../conf/');
var logPath=require('path').join(__dirname,'../log/');

exports.app=app;
exports.redisClient=redisClient;
exports.messageType=messageType;
exports.addTryTimeAndWhetherFull=addTryTimeAndWhetherFull;
exports.confPath=confPath;
exports.imgPath=imgPath;
exports.logPath=logPath;




