var assert=require('assert');
var GossipThief=require('./gossipSource.js').INST;
var Tools=require('../shareTool');
var redisClient=Tools.redisClient;
var msgType=Tools.messageType;
var commonTester=require('../Filters/commonTester');
var testList=commonTester.testList;
var excludeTester=require('../Filters/excludeTester');


var HandType='Gossip_Hand';
/**
 * 处理类
 * @constructor
 */
var Hand=function(){
    var LoginInfo;  //cookie等登录信息
    var PageList;   //要查询的留言板列表
    var callbackFn; //回调函数，有新留言时调用
    var gossipSourceMap;    //记录最新留言id的map
    ////////////////////
    var numPerGet=1;                    //每次获取条数
    var messageType=msgType.textType;             //新留言的类型
    var deleteGossip=msgType.deleteGossip;       //删除留言的类型
    var errorType=msgType.errorType;                //错误类型
    var hideCode=/#匿#|＃匿＃/g;          //用之前要把lastIndex置为0，不然第二次test或exec会失败
    var gossipIntevalTime = 5;          //扫描留言板的时间间隔
    var dropTag = '[[DROP]]';           //抛弃标记
    ///////////////////
    /**
     * 初始化，配置一些参数
     * @param loginInfo
     * @param pageList
     */
    this.init=function(loginInfo,pageList){
        assert(pageList instanceof Array);
        assert(typeof  loginInfo === 'object');
        LoginInfo=loginInfo;
        PageList=pageList;
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
        setGossipSource(PageList);
        getNewGossip();
    }
    /**
     * 获取用户id，在uname中的不是有用的id，
     * 这里先从home链接中提取，失败再从cookie中提取
     * @return {*}
     */
    var getUid=function(){
        return LoginInfo.uid;
    }
    /**
     * 设置要监视留言板的主页的id列表
     * @param gsList
     */
    var setGossipSource=function(gsList){
        var uid=getUid();
        gossipSourceMap={};
        if(gsList instanceof Array){
            for(var i=0;i<gsList.length;i++){
                var gs=gsList[i];
                gossipSourceMap[gs]={
                    lastReply:'0',
                    gsThief:new GossipThief()
                };
                if(gs == uid){
                    //自己留言板的信息防止丢掉
                    redisClient.get(gs, function(err, reply) {
                        // reply is null when the key is missing
                        console.log('>>>Err:'+err+'\n>>>reply:'+reply);
                        if((reply != null) && (parseInt(reply) > 0)){
                            console.log('Last Gossip ID:'+reply);
                            //这里虽然闭包，能取到gs值，但gs的值却是变了的，所以用uid
                            gossipSourceMap[uid].lastReply=reply;
                        }
                    });
                }

            }
        }
    }

    /**
     * 获取留言板留言信息，每次获取numPerGet条
     * @param pageid
     */
    var getNewGossip=function(pageid){
        if(!pageid){
            for(var i in gossipSourceMap){
                gossipSourceMap[i].gsThief.getGossipList(i,LoginInfo.Cookie,numPerGet,getGossipCallback);
            }
        }else{
            if(gossipSourceMap[pageid] && gossipSourceMap[pageid].gsThief ){
                gossipSourceMap[pageid].gsThief.getGossipList(pageid,LoginInfo.Cookie,numPerGet,getGossipCallback);
            }
        }
    }

    /**
     * 全局搜索的正则第二次exec和test之前要初始化lastIndex的值
     * @param regObj
     * @param str
     * @return {*}
     */
    var regTestAtBegin=function(regObj,str){
        if(regObj instanceof(RegExp)){
            if(typeof str == 'string'){
                regObj.lastIndex=0;
                return regObj.test(str);
            }
        }
        return false;
    }

    /**
     * 处理从留言板（自己或者别人的）读来的信息，合法的放到发送列表中
     * @param pageId
     * @param gsList
     */
    var getGossipCallback=function(pageId,gsList){
        if( gossipSourceMap[pageId] && (gsList instanceof Array) ){//返回的参数正常的话
            for(var i=gsList.length-1;i>=0;i--){    //遍历留言数组，从reply_id最小的开始，逆序遍历
                var k = gsList[i];
                if(k.replyid > gossipSourceMap[pageId].lastReply){//reply_id有增长，说明有新的reply
                    var uid=getUid();
                    var blIsUid=(uid == pageId);
                    var description='【From留言板】';
                    //自己的留言板直接发送，并把id保存到redis
                    //他人的留言板要过滤
                    if(!blIsUid){
                        var tmpMsg= k.msg;
                        k.msg = commFilter(k.msg);
                        if(gossipSourceMap[pageId].lastReply !== '0' ){
                            //其他主页每次启动后第一条忽略，不必做到一条不落
                            if(checkFilter(k.msg)){
                                //从其他主页copy留言时要额外检查内容
                                callbackFn(HandType,messageType,k.msg+description);
                            }else{
                                //过滤掉的以错误的形式发往外部
                                callbackFn(HandType,errorType,tmpMsg);
                            }
                        }
                    }else{
                        var tmpMsg=k.msg.replace(hideCode,'') + description;
                        callbackFn(HandType,messageType,tmpMsg);
                        //是自己的留言的话要记录到redis中去，下次启动要读取的
                        redisClient.set(pageId,k.replyid);
                    }

                    gossipSourceMap[pageId].lastReply= k.replyid;


                    if(blIsUid){
                        //自己的留言板
                        if(k.msg && regTestAtBegin(hideCode,k.msg)){
                            console.log('Delete gossip：'+ k.msg);
                            callbackFn(HandType,deleteGossip,k);
                        }
                    }
                }

            }

        }
        setTimeout(getNewGossip,gossipIntevalTime * 1000,pageId);
    }

    /**
     * 基本的过滤别的主页内容的函数
     * @param msg
     * @return {String|XML}
     */
    function commFilter(msg){
        return msg.replace(/树洞姐姐/g,'树洞爷爷')                        //性别矫正
            .replace(/http:\/\/rrurl\.cn\/[a-zA-Z0-9]*/g,dropTag)  //留言板中的连接，已被人人转成短域名的地址，禁止外链宣传
            ;
    }

    /**
     * 检查别的主页的内容是否符合要求
     * @param msg
     */
    function checkFilter(msg){
        if(typeof msg !== 'string'){
            return false;
        }
        //长度限制，来自别人的留言板，所以限制严一点
        if(msg.length <= 15){
            return false;
        }
        //禁止词列表
        var wordsList=[
            /by树洞[菌|君]/gi,
            /by主页[菌|君]/gi,
            '树洞秘密', //
            '秘密树洞',
            dropTag
        ];

        //检查是否包含列表中的禁止的词
        if(testList(msg,wordsList)){
            return false;
        }

        //检查地名，高中生等
        if(excludeTester.test(msg)){
            return false;
        }

        return true;
    }
}


exports.Hand=Hand;
