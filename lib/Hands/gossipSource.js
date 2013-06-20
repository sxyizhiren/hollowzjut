/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-5-3
 * Time: 上午11:52
 * To change this template use File | Settings | File Templates.
 */

var Request=require('node-request');
var iconv= require('iconv-lite');
var cheerio=require('cheerio');

var GossipSource=function(){

    var maxMsgLen;

    var pageId;

    var cookie;

    var gossipHtml;

    var callbackfn;

    var msgList;

    this.getGossipList=function(pageid,cookieStr,maxLen,callback){
        maxMsgLen = maxLen;
        pageId=pageid;
        cookie=cookieStr;//实际上是一个cookie对象

        if(typeof callback == 'function'){
            callbackfn = callback;
        }

        if(pageId && cookie){
            gossipHtml={};
            console.log('get Gossip['+pageId+']');
            var url='http://page.renren.com/gossip/list?pid=' + pageId;
            Request.get(url,cookie,null,gossipHtml,'txt',washGossiphHtml);
        }
    }

    var washGossiphHtml=function(){
        msgList=[];
        if(gossipHtml.Content){
            var decStr = iconv.decode(gossipHtml.Content,'utf8');
            var $=cheerio.load(decStr);
            $('.clearfix .commentbox').each(function(){
                var replyid=this.parent().attr('name');
                var msg=this.children('.content').text().trim();
                var cid=this.children('.header').children('.poster').attr('cid');
                var replyidHeader = 'reply_';
                if(replyid.indexOf(replyidHeader) == 0){
                    replyid = replyid.substr(replyidHeader.length);
                }

                if(replyid && msg && cid){
                    var tmpObj={};
                    tmpObj.replyid=replyid;
                    tmpObj.msg=msg;
                    tmpObj.cid=cid;
                    msgList.push(tmpObj);
                }

                if(msgList.length >= maxMsgLen){
                    return false;//退出each
                }

            });
        }
        if(msgList.length <= 0){
            //便于查看是不是需要验证码什么的
            console.log(gossipHtml);
        }
        if(typeof callbackfn == 'function'){
            callbackfn(pageId,msgList);
        }
    }

}

exports.INST=GossipSource;

