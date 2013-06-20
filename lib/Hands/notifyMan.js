/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-5-9
 * Time: 下午9:13
 * To change this template use File | Settings | File Templates.
 */


var Request=require('node-request');

var NotifyMan=function(){

    var maxMsgLen;

    var cookie;

    var notifys;

    var callbackfn;

    var msgList;

    this.getNotifys=function(cookieStr,maxLen,callback){
        cookie=cookieStr;   //实际是一个cookie对象

        if(typeof maxLen == 'number'){
            maxMsgLen = Math.ceil(maxLen);//大于等于其数值的最小整数
        }

        if(typeof callback == 'function'){
            callbackfn = callback;
        }

        if(cookie && maxMsgLen){
            notifys={};
            console.log('get notifys');
            var url='http://notify.renren.com/rmessage/get?getbybigtype=1&bigtype=1&limit='+maxMsgLen+'&begin=0&view=17';
            Request.get(url,cookie,null,notifys,'json',washNotifys);
        }
    }

    var washNotifys=function(){
        msgList=[];
        if(notifys.parseStatus && typeof(notifys.Content)=='object'){
            for(i=0;i<notifys.Content.length;i++){
                var notify=notifys.Content[i];
                var type=parseInt(notify.type);
                var aNotify={};
                switch(type){
                    case 196:   //被@了
                        aNotify.type=type;
                        aNotify.ownerID=notify.owner;
                        aNotify.doingID=notify.doing_id;
                        aNotify.fromID=notify.from;
                        aNotify.fromName=notify.from_name;
                        aNotify.comm=notify.doing_content;
                        aNotify.sourceID=notify.source;
                        aNotify.removeUrl='http://notify.renren.com/rmessage/remove?nl='+notify.notify_id;
                        msgList.push(aNotify);
                        break;
                    case 16:    //被回复了
                        aNotify.type=type;
                        aNotify.ownerID=notify.owner;
                        aNotify.doingID=notify.doing_id;
                        aNotify.fromID=notify.from;
                        aNotify.fromName=notify.from_name;
                        aNotify.replyID=notify.replied_id;
                        aNotify.comm=notify.reply_content;
                        aNotify.removeUrl='http://notify.renren.com/rmessage/remove?nl='+notify.notify_id;
                        msgList.push(aNotify);
                        break;
                    case 14:    //新的留言，主页不回收到这类信息
                        aNotify.type=type;
                        aNotify.ownerID=notify.owner;
                        aNotify.fromID=notify.from;
                        aNotify.fromName=notify.from_name;
                        aNotify.whisper=notify.whisper=='&whisper=1'?1:0;
                        aNotify.comm=notify.msg_context;
                        aNotify.removeUrl='http://notify.renren.com/rmessage/remove?nl='+notify.notify_id;
                        msgList.push(aNotify);
                        break;
                    case 24:    //新的站内信
                        aNotify.type=type;
                        aNotify.ownerID=notify.owner;
                        aNotify.fromID=notify.from;
                        aNotify.fromName=notify.from_name;
                        aNotify.comm=notify.msg_context;//永远是''
                        aNotify.sourceID=notify.source;//站内信的id标志这一封站内信
                        aNotify.removeUrl='http://notify.renren.com/rmessage/remove?nl='+notify.notify_id;
                        msgList.push(aNotify);
                        break;
                    default:
                        aNotify.type=type;
                        aNotify.removeUrl='http://notify.renren.com/rmessage/remove?nl='+notify.notify_id;
                        msgList.push(aNotify);
                        break;
                }

            }
        }
        if(typeof callbackfn == 'function'){
            callbackfn(msgList);
        }
    }

}

exports.INST=NotifyMan;


