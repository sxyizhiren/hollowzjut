var assert=require('assert');
var path=require('path');
var fs=require('fs');
var Tools=require('../shareTool');
var msgType=Tools.messageType;
var confPath=Tools.confPath;
var Step=require('step');
var querystring=require('querystring');
var Request=require('node-request');
var addTryTimeAndWhetherFull=Tools.addTryTimeAndWhetherFull;//function


var FootType='Weibo_Foot';
/**
 * 处理类
 * @constructor
 */
var Foot=function(){
    var LoginInfo;  //cookie等登录信息
    var callbackFn;
    var postList;   //要post的对象
    ///////////////////
    var dftWaitTime=1000;   //默认轮训时间
    var lock;       //正在发送时上锁
    var visitPostTime=30;   //30s
    var refreshCookieExpireTime=30;//检查cookie失效的间隔时间

    //////////////////////
    var ctrlType=msgType.ctrlType;
    var messagePage;    //check cookie expire
    var NOFYTYPE={
        WEIBO_STATE:1
    };

    //////////////

    /**
     * 初始化，配置一些参数
     * @param loginInfo
     */
    this.init=function(resv0,paramList){
        assert(paramList instanceof Array);
        LoginInfo=paramList[0]
        messagePage={
            expireTimes:0,
            maxExpireTime:3
        };//用于check cookie expire
        postList=[];    //用于post message
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
        visitPostList();
        refreshCookieExpire();
    }

    /**
     * 定时检查weibo的cookie是否失效
     */
    var refreshCookieExpire=function(){

            Step(
                function(){
                    var url='http://weibo.com/messages';
                    Request.get(url,LoginInfo.Cookie,null,messagePage,'txt',this);
                },
                function(){
                    if(messagePage.Status === 302){
                        console.log('weibo Cookie Invalid a Time!');
                        messagePage.expireTimes ++;
                    }else{
                        //console.log('weibo Cookie is Healthy!');
                        messagePage.expireTimes=0;
                        //messagePage.expireTimes ++;
                    }

                    if(messagePage.expireTimes >= messagePage.maxExpireTime){
                        //cookie失效，重启程序
                        callbackFn(FootType,ctrlType,{
                            info:'cookieExpire',
                            suggestAction:'restart'
                        });
                    }

                    setTimeout(refreshCookieExpire,refreshCookieExpireTime*1000);

                }
            );


    }

    /**
     * 不停查询，有了就进行post
     * @return {Number}
     */
    var visitPostList=function(){
        if( lock || !postList || postList.length ==0){
            return setTimeout(visitPostList,dftWaitTime);
        }
        var postBlock=postList.shift();
        posttingBlock(postBlock);
        setTimeout(visitPostList,visitPostTime*1000);
    }

    /**
     * 检查一次post提交后的返回值是表示成功了还是失败了
     * @param msgblock
     * @return {Boolean}
     */
    var checkSimplePostHttpSucc=function(msgblock){
        var httpSucc = false;
        if(typeof(msgblock) == 'object'){
            if(msgblock.type == NOFYTYPE.WEIBO_STATE){
                if(msgblock.parseStatus && (msgblock.Content.code === '100000')){
                    httpSucc = true;
                }
            }
        }
        return httpSucc;
    }

    /**
     * post消息
     * @param msgblock
     */
    var posttingBlock=function(msgblock){
        lock = true;
        Step(
            function(){
                var postData=querystring.stringify(msgblock.parameter);
                var url=msgblock.submit;
                var headers={
                    'Referer':'http://weibo.com/'
                    ,'Accept-Language': 'zh-cn'
                    ,'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'
                    ,'Connection': 'Keep-Alive'
                    ,'Cache-Control': 'no-cache',
                    'X-Requested-With':'XMLHttpRequest'
                };

                var retType='json';
                Request.post(url,LoginInfo.Cookie,postData,headers,msgblock,retType,this);
                console.log('【posting Weibo Msg!】');
                console.log(postData);
            },
            function(){
                var httpSucc=checkSimplePostHttpSucc(msgblock);
                if(!httpSucc){
                    onPostFail(msgblock);
                }
                lock=false;
            }
        );
    }

    var onPostFail=function(msgblock){
        if(!addTryTimeAndWhetherFull(msgblock)){
            //塞回队列继续尝试
            postList.unshift(msgblock);
        }else{
            //出错通知外部
            callbackFn(FootType,msgType.errorType,msgblock);
        }
    }

    /**
     * 对外接收消息的接口
     * @param handid
     * @param messageid
     * @param message
     */
    this.accept=function(handid,messageid,message){
        var msgblock;

        if(messageid === msgType.textType){
            msgblock=buildOneStateBlock(message);
        }else{
            return;
        }
        postList.push(msgblock);
    }

    var buildOneStateBlock=function(msg){
        var msgblock={
            submit:'http://weibo.com/aj/mblog/add',
            parameter:{
                '_surl':'',
                '_t':0,
                'hottopicid':'',
                'location':'home',
                'module':'stissue',
                'pic_id':'',
                'rank':'0',
                'rankid':'',
                'text':msg
            },
            type:NOFYTYPE.WEIBO_STATE
        };
        if(msgblock.parameter.text.length > 140){
            msgblock.parameter.text=msgblock.parameter.text.substr(0,140);
        }

        return msgblock;
    }

}


exports.Foot=Foot;

