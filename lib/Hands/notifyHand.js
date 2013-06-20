var assert=require('assert');
var NotifyMan=require('./notifyMan').INST;
var Request=require('node-request');
var cheerio=require('cheerio');
var path=require('path');
var fs=require('fs');
var Tools=require('../shareTool');
var msgType=Tools.messageType;
var addTryTimeAndWhetherFull=Tools.addTryTimeAndWhetherFull;//function

var HandType='Notify_Hand';

/**
 * 处理类
 * @constructor
 */
var Hand=function(){
    var LoginInfo;  //cookie等登录信息
    var callbackFn; //回调函数，有新留言时调用
    var messageParser;//专门处理站内信
    ////////////////////
    var numPerGet=1;                    //每次获取条数
    var messageType=msgType.textType;             //新留言的类型
    var clearNotifyBeforeListen;    //是否清除消息,不执行监听函数，调试时清除消息用
    var getNotifyTime=10;//获取新消息的时间
    var messageBlocks;  //站内信数组
    /**
     * 消息的类型
     * @type {Object}
     */
    var NOTIFY_TYPEID={
        MESSAGE:24,
        AT:196,
        WHISPER:14
    };

    ///////////////////
    /**
     * 初始化，配置一些参数
     * @param loginInfo
     * @param pageList
     */
    this.init=function(loginInfo,resv){
        assert(typeof  loginInfo === 'object');
        LoginInfo=loginInfo;
    }

    /**
     * 开始工作
     * @param callback
     */
    this.run=function(callback){
        assert(typeof callback === 'function');
        callbackFn=callback;
        messageParser = new MessageParser(LoginInfo,callbackFn);
        process.nextTick(Doing);
    }

    /**
     * 工作内容
     * @constructor
     */
    var Doing=function(){
        processNotify();
    }

    /**
     * 获取消息
     */
    var processNotify=function(){
        (new NotifyMan()).getNotifys(LoginInfo.Cookie,numPerGet,dispatchNotify);//一条一条地处理
    }

    /**
     * 分发消息给相应的回调函数，然后删除
     * @param msgList
     */
    var dispatchNotify=function(msgList){
        if( msgList instanceof Array){ //有消息的话
            for(var i=0;i<msgList.length;i++){  //遍历消息
                var notify=msgList[i];
                if(clearNotifyBeforeListen){
                    clearTheNotify(notify);//just clear it
                }else{
                    //console.log(notifyListeners);
                    if( (typeof notifyListeners === 'object') && (typeof notifyListeners[notify.type] === 'object') ){
                        //如果有listener的话
                        for(var fnIdx=0; fnIdx < notifyListeners[notify.type].length;fnIdx++){
                            var fn=notifyListeners[notify.type][fnIdx];
                            if(typeof(fn) == 'function'){        //这确实是一个函数
                                fn(notify);//把notify传给他
                            }
                        }
                    }
                    console.log(notify);
                    clearTheNotify(notify);//just clear it
                }

            }
        }
        setTimeout(processNotify , getNotifyTime * 1000);

    }

    /**
     * 清除一条消息
     * @param msg
     */
    var clearTheNotify=function(msg){
        if(typeof msg == 'object'){
            if(msg.removeUrl){
                console.log('clear:'+msg.removeUrl);
                Request.get(msg.removeUrl,LoginInfo.Cookie,null,{},'txt',function(){});
                //break;
            }
        }
    }

    /**
     * 站内信的回调函数
     * @param msg
     */
    var messageListener=function(msg){
        console.log('messageListener:');
        console.log(msg);
        if((typeof msg == 'object') && (msg.type == NOTIFY_TYPEID.MESSAGE)){
            if(!messageBlocks)
                messageBlocks={};
            if(!messageBlocks.oldMsg)
                messageBlocks.oldMsg={};
            if(!messageBlocks.oldMsg[msg.sourceID]){    //没处理过的消息
                messageParser.parse(msg);
                messageBlocks.oldMsg[msg.sourceID] = true;
            }
        }
    }

    /**
     * 悄悄话的回调函数
     * @param msg
     */
    var whisperListener=function(msg){
        console.log('whisperListener:');
        console.log(msg);
        if((typeof msg == 'object') && (msg.type == NOTIFY_TYPEID.WHISPER)){
            var comm = msg.comm;
            var description='【From悄悄话】';
            callbackFn(HandType,messageType,comm+description);
        }
    }

    /**
     * at消息的回调函数，直接构建文字或者图片信息推到相应待处理列表
     * @param msg
     */
    var stateAtListener=function(msg){
        console.log('stateAtListener:');
        console.log(msg);
        if((typeof msg == 'object') && (msg.type == NOTIFY_TYPEID.AT)){
            /**
             * {"source":"4818974917","owner":"430040464","from":"430040464","type":"196","from_name":"李宏波","doing_id":"4818974917","doing_content":"12345@秘密小纸条(601709198) 54321","notify_id":"43444027654"}
             */
            if((msg.doingID == msg.sourceID) && (msg.ownerID == msg.fromID)){
                //是状态而不是回复，是自己的状态而不是在别人的状态
                var fromName=msg.fromName;
                var fromID=msg.fromID;
                console.log('msg:'+msg.comm);
                var atReg=/@.{1,16}\(\d{7,11}\) /g;//匹配@树洞ZJUT(xxxxxx)
                var content=msg.comm.replace(atReg,'');
                var description='【From' + buildAtString(fromName ,fromID)+'】';
                callbackFn(HandType,messageType,content+description);
            }
        }
    }

    /**
     * 创建@的文字，发表出去后就是@的效果
     * @param name
     * @param id
     * @return {String}
     */
    var buildAtString=function(name , id){
        return '@' + name +'('+id+') ';//末尾有个空格的
    }

    /**
     * 新消息的回调函数列表
     * 放后面，不然引用不到函数
     * @type {Object}
     */
    var notifyListeners={
        24:[messageListener],  //MESSAGE
        196:[stateAtListener], //AT
        14:[whisperListener]   //WHISPER
    };
}

var MessageParser=function(loginInfo,callback){
    assert(typeof loginInfo === 'object');
    assert(typeof callback === 'function');
    var LoginInfo = loginInfo;
    var callbackFn = callback;
    var messageReadTime = 20;//读站内信的时间
    var imagePath=Tools.imgPath;
    var messageType=msgType.textType;             //新留言的类型
    var imageType=msgType.imageType;              //图片的类型

    this.parse=function(notify){
        assert(typeof notify === 'object');
        readMessage(notify);
    }

    /**
     * 读取站内信的html
     * @param msg
     */
    var readMessage=function(msg){
        console.log('readmessage:');
        assert(typeof msg === 'object');
        var sourceID=msg.sourceID;
        var url='http://msg.renren.com/message/read.do?id='+sourceID+'&f=0';
        console.log(url);
        var msgRead={};//msg可能会被多处listen，不改变他
        Request.get(url,LoginInfo.Cookie,null,msgRead,'txt',function(){
            parseMessage(msg,msgRead);
        });

    }

    /**
     * 解析站内信html，有2楼以上（说明不是新创建的站内信，是回复）就不处理了。有图片就传相册
     * @param msgHtml
     * @return {*}
     */
    var parseMessage=function(msg,msgHtml){
        var succRead = false;//上一步的读消息内容是否成功
        if((typeof msgHtml == 'object') && (typeof(msgHtml.Content) == 'string')){
            var $=cheerio.load(msgHtml.Content);
            var messages=$('[id^=msg_]');
            console.log('msg num:'+messages.length);
            if(messages.length > 0 ){
                succRead = true;//说明html返回正确,后面不改变succRead了
            }
            if(messages.length > 1){
                console.log('not first read! it has more than one floor!');
            }else if(messages.length == 1){
                //messages.length == 1
                var text=$('#msg_0 .text').text().replace(/\n/g,'');
                var picName;
                var fileAllow;
                var picLink;
                if($('[id^=attach_]').length > 0){
                    picName=$('#attach_0').find('.file-name').text();
                    picLink=$('#attach_0').find('.file-download').attr('href');
                    picLink = 'http://msg.renren.com'+picLink;

                    var fileType=picName.substr(-4).toLowerCase();
                    var fileAllow=false;
                    if(fileType == '.jpg' || fileType == '.png' || fileType == '.gif' || fileType == '.bmp'){
                        fileAllow = true;
                    }
                }
                console.log('text:'+text);
                console.log('picname:'+picName);
                console.log('piclink:'+picLink);

                var description='【From站内信】';
                if(picLink && fileAllow){
                    //图片
                    console.log('picture in message!');
                    var localpath = imagePath + Math.random()+fileType;//图片先保存到本地再上传
                    savePicture(msg,picLink,localpath,text+description);
                }else if(!picLink && text){
                    //只有文字
                    console.log('only text in message!');
                    callbackFn(HandType,messageType,text+description);
                }else{
                    //图片类型不符或者文字且太短不符合要求
                    console.log('not a good message!');
                }
            }
        }
        if(!succRead){
            messageWakeupAfterTryFail(msg);
        }
    }

    /**
     * 尝试处理一次站内信失败后，重试3次
     * @return {*}
     */
    var messageWakeupAfterTryFail=function(msg){
        if(addTryTimeAndWhetherFull(msg)){
            console.log('Try Fail finally!');
        }else{
            setTimeout(readMessage,messageReadTime * 1000,msg);
        }

    }

    /**
     * 保存从站内信读取的图片链接指向的图片，成功的话把图片本地地址推到图片发送列表。
     * @param linkUrl
     * @param localPath
     * @param description
     */
    var savePicture=function(msg,linkUrl,localPath,description){
        console.log('linkurl:'+linkUrl);
        console.log('localpath:'+localPath);
        console.log('description:'+description);
        var tmpPictureBuf={};
        Request.get(linkUrl,LoginInfo.Cookie,null,tmpPictureBuf,'buf',function(){
            try{
                fs.writeFileSync(localPath, tmpPictureBuf.Content, 'binary');
                callbackFn(HandType,imageType,{
                    localPath:localPath,
                    description:description
                });
            }catch(e){
                messageWakeupAfterTryFail(msg);
            }
        });
    }
}



exports.Hand=Hand;