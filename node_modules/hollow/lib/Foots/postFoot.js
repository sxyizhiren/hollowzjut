var assert=require('assert');
var Tools=require('../shareTool');
var msgType=Tools.messageType;
var Step=require('step');
var querystring=require('querystring');
var Request=require('node-request');
var addTryTimeAndWhetherFull=Tools.addTryTimeAndWhetherFull;//function

var FootType='Post_Foot';
/**
 * 处理类
 * @constructor
 */
var Foot=function(){
    var LoginInfo;  //cookie等登录信息
    var token;  //page token
    var callbackFn;
    var postList;   //要post的对象
    ///////////////////
    var dftWaitTime=1000;   //默认轮训时间
    var lock;       //正在发送时上锁
    var visitPostTime=30;   //30s
    var refreshCookieExpireTime=30;//30s
    var unamePage;  //check cookie expire
    var ctrlType=msgType.ctrlType;

    /**
     * 状态列表的类型（起初只放状态，后来只要一次提交能完成的都放进去了），不通类型的提交返回的内容会不同
     * @type {Object}
     */
    var NOFYTYPE={
        NOFY_STATE:0,
        NOFY_STATE_REPLY:1,
        NOFY_GOSSIP:2,
        NOFY_PUBLISHSTATUS:3,
        NOFY_DELGOSSIP:4,
        NOFY_DESCRIPT_PICTURE:5,
        NOFY_USER_REPLY:6,
        NOFY_OTHER:100
    };
    //////////////
    /**
     * 初始化，配置一些参数
     * @param loginInfo
     */
    this.init=function(loginInfo,resv){
        assert(typeof loginInfo === 'object');
        LoginInfo=loginInfo;
        token=LoginInfo.token;
        postList=[];
        unamePage={
            expireTimes:0,
            maxExpireTime:3
        };//用于check cookie expire
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
     * 不停查询，有了就进行post
     * @return {Number}
     */
    var visitPostList=function(){
        if(lock || !postList || postList.length ==0){
            return setTimeout(visitPostList,dftWaitTime);
        }
        var postBlock=postList.shift();
        posttingBlock(postBlock);
        setTimeout(visitPostList,visitPostTime*1000);
    }

    /**
     * 尝试cookie是否有效
     */
    var refreshCookieExpire=function(){
        //console.log('stepCookieLogin');
        var uname={};
        Step(
            function(){
                var url='http://notify.renren.com/wpi/getonlinecount.do';
                Request.get(url,LoginInfo.Cookie,null,uname,'txt',this);
            },
            function(){
                try{
                    var tmpJson=JSON.parse(uname.Content.trim());
                    if(tmpJson.hostid){
                        unamePage.expireTimes=0;
                        //unamePage.expireTimes++;//for test
                    }else{
                        console.log('renren Cookie expire a Time!');
                        unamePage.expireTimes++;
                    }

                }catch(e){
                    console.log('renren Cookie expire a Time!');
                    unamePage.expireTimes++;
                }
                if(unamePage.expireTimes >= unamePage.maxExpireTime){
                    console.log('renren Cookie expired!');
                    //cookie失效，重启程序
                    callbackFn(FootType,ctrlType,{
                        info:'cookieExpire',
                        suggestAction:'restart'
                    });
                }
                setTimeout(refreshCookieExpire,refreshCookieExpireTime*1000);
            }
        );

    };


    /**
     * 根据提交的消息类型得到返回的是json还是html
     * @param postType
     * @return {String}
     */
    var getRetTypeByPostType=function(postType){
        var retType='txt';
        switch(postType){
            case NOFYTYPE.NOFY_PUBLISHSTATUS:
            case NOFYTYPE.NOFY_DELGOSSIP:
            case NOFYTYPE.NOFY_STATE_REPLY:
            case NOFYTYPE.NOFY_USER_REPLY:
                retType='json';
                break;
            default:
                retType='txt';
                break;
        }
        return retType;
    }

    /**
     * 检查一次post提交后的返回值是表示成功了还是失败了
     * @param msgblock
     * @return {Boolean}
     */
    var checkSimplePostHttpSucc=function(msgblock){
        var httpSucc = false;
        if(typeof(msgblock) == 'object'){
            if(msgblock.type == NOFYTYPE.NOFY_PUBLISHSTATUS){
                if(msgblock.parseStatus && (msgblock.Content.code == 0)){
                    httpSucc = true;
                }
            }else if(msgblock.type == NOFYTYPE.NOFY_DELGOSSIP){
                if(msgblock.parseStatus && msgblock.Content.status && (msgblock.Content.status.code == 1) ){
                    //http://page.renren.com/jomo/act/gossip/delete这个接口返回1是成功，他怎么不返回0，他是sb吗
                    httpSucc = true;
                }
            }else if(msgblock.type == NOFYTYPE.NOFY_DESCRIPT_PICTURE){
                if(msgblock.Location && (msgblock.Location.indexOf('http://photo.renren.com/photo/') >= 0)){
                    httpSucc = true;
                }
            }else if(msgblock.type == NOFYTYPE.NOFY_STATE_REPLY){
                if(msgblock.parseStatus && (msgblock.Content.code == 0)){
                    httpSucc = true;
                }
            }else if(msgblock.type == NOFYTYPE.NOFY_USER_REPLY){
                if(msgblock.parseStatus && (msgblock.Content.code == 0)){
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
                    'Referer':'www.renren.com'
                    ,'Accept-Language': 'zh-cn'
                    ,'Content-Type':'application/x-www-form-urlencoded'
                    ,'Connection': 'Keep-Alive'
                    ,'Cache-Control': 'no-cache'
                };

                var retType=getRetTypeByPostType(msgblock.type);
                Request.post(url,LoginInfo.Cookie,postData,headers,msgblock,retType,this);
                console.log('【posting an reply!】');
                console.log(postData);
            },
            function(){
                var httpSucc=false; //发送是否成功
                var clearBlock=false;   //是否清除消息，发送成功或者尝试3次后清除
                //console.log(msgblock);
                httpSucc=checkSimplePostHttpSucc(msgblock);
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
        }else if(messageid === msgType.deleteGossip){
            msgblock=buildOneDelGossipBlock(message);
        }else if(messageid === msgType.stateReply){
            msgblock=buildOneStateReplyBlock(message);
        }else if(messageid === msgType.userReply){
            msgblock=buildOneUserReplyBlock(message);
        }else if(messageid === msgType.imgDespt){
            msgblock=buildOneImgDesptBlock(message);
        }else{
            return;
        }
        postList.push(msgblock);
    }

    /**
     * 构建一条照片描述信息
     * @param picBlock
     */
    var buildOneImgDesptBlock=function(picBlock){
        var uid=LoginInfo.uid;
        var submitUrl='http://photo.renren.com/photo/'+uid+'/album-'+picBlock.albumId+'/relatives/edit';
        var msgblock={
            submit:submitUrl,
            parameter:{
                '_rtk':token._rtk,
                'requestToken':token.requestToken,
                'descriptions':picBlock.descriptions,
                'editUploadedPhotos':false,
                'id':picBlock.id,
                'ids':picBlock.ids,
                'largeUrls':picBlock.largeUrls,
                'title':picBlock.title,
                'x':36,//x,y应该是随机数吧，这里写死就行
                'y':28
            },
            type:NOFYTYPE.NOFY_DESCRIPT_PICTURE
        };

        if(msgblock.parameter.descriptions.length > 240){
            msgblock.parameter.descriptions=msgblock.parameter.descriptions.substr(0,240);
        }
        return msgblock;
    }

    /**
     * 构建一条状态回复信息，并非构建一般的回复消息
     * @param k
     * @return {Object}
     */
    var buildOneUserReplyBlock=function(item){
        var msgblock={
            removeUrl:item.removeUrl,
            submit:'http://status.renren.com/feedcommentreply.do',
            parameter:{
                't': 3,
                'rpLayer': 1,
                'source': item.doingID,
                'owner': item.ownerID,
                'replyTo': item.fromID,
                'replyName': item.fromName,
                'secondaryReplyId': item.replyID,
                'c': '回复'+item.fromName+'：'+item.replyMsg,
                '_rtk':token._rtk,
                'requestToken':token.requestToken
            },
            type:NOFYTYPE.NOFY_USER_REPLY
        };
        if(msgblock.parameter.c.length>240){
            msgblock.parameter.c=msgblock.parameter.c.substr(0,240);
        }
        return msgblock;
    }

    /**
     * 构建一条状态回复信息，并非构建一般的回复消息
     * @param k
     * @return {Object}
     */
    var buildOneStateReplyBlock=function(k){
        //k.id, k.owner
        var msgblock={
            submit:'http://status.renren.com/feedcommentreply.do',
            parameter:{
                't': 3,
                'rpLayer': 0,
                'replyref':'newsfeed',
                'source':k.id,      //doingID
                'owner':k.owner,    //ownerID
                'c':k.replyMsg,
                '_rtk':token._rtk,
                'requestToken':token.requestToken,
                'stype':'502'
            },
            type:NOFYTYPE.NOFY_STATE_REPLY
        };
        if(msgblock.parameter.c.length > 240){
            msgblock.parameter.c=msgblock.parameter.c.substr(0,240);
        }
        return msgblock;
    }

    /**
     * 构建删除留言的消息
     * @param k
     * @return {Object}
     */
    var buildOneDelGossipBlock=function(k){
        var uid=LoginInfo.uid;
        var msgblock={
            //submit:'http://page.renren.com/gossip/del',//这个也是删除留言的
            submit:'http://page.renren.com/jomo/act/gossip/delete',
            parameter:{
                'ban':'0',
                'aid':k.cid,
                'id':k.replyid,
                'pid':uid,
                '_rtk':token._rtk,
                'requestToken':token.requestToken
            },
            type:NOFYTYPE.NOFY_DELGOSSIP
        };
        return msgblock;
    }

    /**
     * 构建一个发表到状态的数据结构
     * @param msg
     * @return {Object}
     */
    var buildOneStateBlock=function(msg){
        var uid=LoginInfo.uid;
        var msgblock={
            submit:'http://shell.renren.com/'+uid+'/status',
            parameter:{
                'channel':'renren',
                'content':msg,
                'hostid':uid,
                '_rtk':token._rtk,
                'requestToken':token.requestToken
            },
            type:NOFYTYPE.NOFY_PUBLISHSTATUS
        };
        if(msgblock.parameter.content.length > 240){
            msgblock.parameter.content=msgblock.parameter.content.substr(0,240);
        }
        return msgblock;
    }
}


exports.Foot=Foot;

