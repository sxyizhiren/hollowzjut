var assert=require('assert');
var StateThief=require('./stateSource.js').INST;
var Tools=require('../shareTool');
var msgType=Tools.messageType;
var commonTester=require('../Filters/commonTester');
var testList=commonTester.testList;

var HandType='State_Hand';
/**
 * 处理类
 * @constructor
 */
var Hand=function(){
    var LoginInfo;  //cookie等登录信息
    var PageList;   //要查询的留言板列表
    var callbackFn; //回调函数，有新留言时调用
    var stateSourceMap;    //记录最新状态id的map
    ////////////////////
    var numPerGet=1;                    //每次获取条数
    var messageType=msgType.textType;             //新留言的类型
    var sofaType=msgType.stateReply;                 //沙发
    var errorType=msgType.errorType;               //不符合不发送的状态标记为error传出外部去
    var ctrlType=msgType.ctrlType;                  //向外发送控制命令
    var stateIntervalTime = 20;         //扫描状态的时间间隔
    var dropTag = '[[DROP]]';           //抛弃标记
    var cookieExpireTimes;              //cookie失效次数，到达一定次数就要发送失效消息出去
    var autoReplyList=[
        '(rs)在一起让我做你的空调'
        ,'(rs)100次沙发~我来了'
        ,'(rs)因为你，我会记住这一刻，每年的这一时都会记起'

    ];

    ///////////////////
    /**
     * 初始化，配置一些参数
     * @param loginInfo
     * @param pageList
     */
    this.init=function(loginInfo,pageList){
        assert(pageList instanceof Array);
        assert(pageList.length > 0);
        assert(typeof loginInfo === 'object');
        LoginInfo=loginInfo;
        PageList=pageList;
        cookieExpireTimes=0;
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
        setStateSource(PageList);
        getNewState();
    }

    /**
     * 设置要监视状态的主页的id列表
     * @param gsList
     */
    var setStateSource=function(gsList){
        stateSourceMap={};
        if(gsList instanceof Array){
            for(var i=0;i<gsList.length;i++){
                var gs=gsList[i];
                stateSourceMap[gs.id]={
                    lastId:0,
                    gsThief:new StateThief(),
                    copy:gs.copy,   //是否拷贝状态
                    sofa:gs.sofa    //是否抢沙发
                };
            }
        }
    }
    /**
     * 从用户的状态中读取状态
     * @param pageid
     */
    var getNewState=function(pageid){
        if(!pageid){
            for(var i in stateSourceMap){
                stateSourceMap[i].gsThief.getStateList(i,LoginInfo.Cookie,numPerGet,getStateCallback);
            }
        }else{
            stateSourceMap[pageid].gsThief.getStateList(pageid,LoginInfo.Cookie,numPerGet,getStateCallback);
        }
    }

    var countExpire=function(gsList){
        //gsList=[];//用于测试该功能
        if(0 == gsList.length){
            console.log('cookie invalid a time!');
            cookieExpireTimes ++;
        }else{
            cookieExpireTimes = 0;
        }
        if(cookieExpireTimes > PageList.length *2){
            //平均每个页面连着两次失效就判定为cookie失效了
            callbackFn(HandType,ctrlType,{
                info:'cookieExpire',
                suggestAction:'restart'
            });
        }
    }

    /**
     * 处理从状态（只读别人的）中读来的信息，符合要求就放到发送列表中
     * @param pageId
     * @param gsList
     */
    var getStateCallback=function(pageId,gsList){
        if(stateSourceMap[pageId] && (gsList instanceof Array)){//返回的参数正常的话
            countExpire(gsList);
            for(var i=gsList.length-1;i>=0;i--){    //遍历留言数组，从id最小的开始，逆序遍历
                var k = gsList[i]   //数组的某一项
                if(k.id > stateSourceMap[pageId].lastId){//id有增长，说明有新的state
                    var description='【From -】';
                    if(stateSourceMap[pageId].lastId === 0){
                        //0是初始化时的lastId
                        //第一条不处理了，简化逻辑
                    }else{
                        //抢沙发放在拷贝状态之前
                        if(stateSourceMap[pageId].sofa){
                            var idx=Math.floor(Math.random() * autoReplyList.length);
                            var timeTail='【'+Date().replace(/.*?(2013 .*?) .*/,'$1') + '记】';
                            var replyMsg = autoReplyList[idx] + timeTail;
                            k.replyMsg=replyMsg;
                            callbackFn(HandType,sofaType,k);
                        }
                        if(stateSourceMap[pageId].copy){
                            var tmpContent=k.content;
                            k.content=commFilter(k.content,pageId);
                            if(checkFilter(k.content)){
                                callbackFn(HandType,messageType,k.content+description);
                            }else{
                                callbackFn(HandType,errorType,tmpContent);
                            }
                        }

                    }
                    stateSourceMap[pageId].lastId= k.id;
                }

            }

        }
        setTimeout(getNewState,stateIntervalTime * 1000,pageId);
    }
    /**
     * 基本的过滤别的主页内容的函数
     * @param msg
     * @return {String|XML}
     */
    function commFilter(msg,pageid){
        msg= msg.replace(/树洞姐姐/g,'树洞爷爷')                        //性别矫正
            .replace(/<img .+?\/>/g,'')                                     //状态中的表情过滤，
            .replace(/<a href=.+?<\/a>/g,dropTag)                           //一般是状态中的@了别人，标记出来
            ;
        if('601698155'==pageid){
            //浙工大树洞，抄一把，只抄它的微信
            if(msg.indexOf('——微信zjut_treehole') > 0){
                //只抄他微信的，其他可能是他的主观发言，不要
                msg=msg.replace(/——微信zjut_treehole/g,'').replace(/——微信/g,'').replace(/——树洞/g,'').replace(/——匿名/g,'');
            }else{
                //其他的抛弃掉
                msg + msg + dropTag;
            }

        };
        return msg;
    }

    /**
     * 检查是否符合要求
     * @param msg
     */
    function checkFilter(msg){
        if(typeof msg !== 'string'){
            return false;
        }
        //长度限制，状态栏来自别人的状态，所以限制严一点
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

        return true;
    }
}


exports.Hand=Hand;
