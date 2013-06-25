var assert=require('assert');
var Tools=require('../shareTool');
var msgType=Tools.messageType;
var app=Tools.app;
var wechat = require('wechat');
var path=require('path');
var fs=require('fs');
var Request=require('node-request');

var HandType='Wechat_Hand';


/**
 * 处理类
 * @constructor
 */
var Hand=function(){
    ///////////////////
    var token;  //wechat token
    var urlpath;    //wechat listen path
    var callbackFn; //callback
    /////////////////////
    var dftReply='报告主人，树洞收到(文字8-240个)！';
    var dftNotsupport='报告主人，我只能听懂图片和文字！';
    var messageType=msgType.textType;             //新留言的类型
    var imageType=msgType.imageType;              //图片的类型
    var imagePath=Tools.imgPath;


    /**
     * 初始化，配置一些参数
     * @param loginInfo
     * @param pageList
     */
    this.init=function(loginInfo,paramList){
        assert(paramList instanceof Array);
        token=paramList[0];
        urlpath=paramList[1];
        assert(typeof token === 'string');
        assert(typeof urlpath === 'string');
    }

    /**
     * 开始工作
     * @param callback
     */
    this.run=function(callback){
        assert(typeof callback === 'function');
        callbackFn=callback;
        process.nextTick(Doing);
    }

    /**
     * 工作内容
     * @constructor
     */
    var Doing=function(){
        wechatListen();
    }

    /**
     * 接收微信消息
     */
    var wechatListen=function(){
        app.use(urlpath, wechat(token, wechat.text(function (message, req, res, next) {
            res.reply(dftReply);
            console.log('username:'+message.FromUserName);
            var description='【From微信'+ (token || 'hollowZJUT') + '】';
            callbackFn(HandType,messageType,message.Content+description);

            // message为文本内容
            // { ToUserName: 'gh_d3e07d51b513',
            // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
            // CreateTime: '1359125035',
            // MsgType: 'text',
            // Content: 'http',
            // MsgId: '5837397576500011341' }
        }).image(function (message, req, res, next) {
            res.reply(dftReply);
            console.log('username:'+message.FromUserName);
            savePicture(message.PicUrl);
            // message为图片内容
            // { ToUserName: 'gh_d3e07d51b513',
            // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
            // CreateTime: '1359124971',
            // MsgType: 'image',
            // PicUrl: 'http://mmsns.qpic.cn/mmsns/bfc815ygvIWcaaZlEXJV7NzhmA3Y2fc4eBOxLjpPI60Q1Q6ibYicwg/0',
            // MsgId: '5837397301622104395' }
        }).location(function (message, req, res, next) {
            console.log(message);
            res.reply(dftNotsupport);
        }).voice(function (message, req, res, next) {
            console.log(message);
            res.reply(dftNotsupport);
        }).link(function (message, req, res, next) {
            console.log(message);
            res.reply(dftNotsupport);
        }).event(function (message, req, res, next) {
            console.log(message);
            res.reply(dftNotsupport);
        })));
    }

    /**
     * 保存图片
     * @param picUrl
     * @param callback
     */
    var savePicture=function(picUrl,times){
        if(typeof times == 'number' && times >= 3){
            //尝试n次还不行的话就放弃了
            return;
        }
        var localPath = imagePath + Math.random()+'_Wexin.jpg';//图片先保存到本地再上传
        console.log(localPath);
        console.log(picUrl);
        var tmpPictureBuf={};
        Request.get(picUrl,null,null,tmpPictureBuf,'buf',function(){
            try{
                fs.writeFileSync(localPath, tmpPictureBuf.Content, 'binary');
                var description='【From微信'+ (token || 'hollowZJUT') + '】';
                callbackFn(HandType,imageType,{
                    localPath:localPath,
                    description:description
                });

            }catch(e){
                console.log('pic save fail a time:'+picUrl);
                savePicture(picUrl,(times?times:0)+1);
            }
        });
    }

}


exports.Hand=Hand;


