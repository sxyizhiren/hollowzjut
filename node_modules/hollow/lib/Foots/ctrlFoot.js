var assert=require('assert');
var Tools=require('../shareTool');
var msgType=Tools.messageType;
var Step=require('step');
var querystring=require('querystring');
var Request=require('node-request');
var path=require('path');
var Tracer=require('tracer');


var FootType='Log_Foot';
/**
 * 处理类
 * @constructor
 */
var Foot=function(){
    var LoginInfo;  //登录信息
    //////////////
    var restartAction;
    //////////
    /**
     * 初始化，配置一些参数
     * @param loginInfo
     */
    this.init=function(loginInfo,paramList){
        assert(typeof loginInfo === 'object');
        assert(paramList instanceof Array);
        restartAction=paramList[0];
        LoginInfo=loginInfo;
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
        //do nothing ,just wait......
    }

    /**
     *
     * @param handid
     * @param messageid
     */
    this.accept=function(handid,messageid,message){
        if(messageid === msgType.ctrlType){
            /*
             callbackFn(HandType,ctrlType,{
             info:'cookieExpire',
             suggestAction:'restart'
             });
             */
            if(message.suggestAction === 'restart'){
                console.log('To Restart Program From CtrlAction!');
                restartAction?restartAction():process.exit(0);

            }
        }else{
            //
        }
    }


}


exports.Foot=Foot;

