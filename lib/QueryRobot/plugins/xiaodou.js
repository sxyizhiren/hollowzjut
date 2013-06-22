/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-2-13
 * Time: 下午9:02
 * To change this template use File | Settings | File Templates.
 */


var Request=require('node-request');
var iconv= require('iconv-lite');
var cheerio=require('cheerio');
var Step=require('step');
var querystring=require('querystring');
var commonTester=require('../../Filters/commonTester');
var testList=commonTester.testList;

var PluginName='Plugin_Xiaodou';
function XIAODOU(){

}
XIAODOU.prototype={
    isMatch:function(str){
        return true;
    },
    getName:function(){
        return PluginName;
    },
    doing:function(item,cb){
        var msg= item.comm.trim();

        Step(
            function(){
                var url='http://xiao.douqq.com/bot/chat.php';
                var postData=querystring.stringify({
                    chat:msg
                });
                var headers={
                    'Referer':'http://xiao.douqq.com/'
                    ,'Accept-Language': 'zh-cn'
                    ,'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'
                    ,'Connection': 'Keep-Alive'
                    ,'Cache-Control': 'no-cache'
                };
                Request.post(url,null,postData,headers,item,'buf',this);
            },
            function(){
                //console.log(item);
                var msg = iconv.decode(item.Content,'utf8');
                msg = msg.replace(/小豆/g,'树洞').trim();
                var wordList=[
                    '这个真不好说',
                    '真的看不懂',
                    'Select Database Failed',
                    /^我也/
                ];

                if(testList(msg,wordList)){
                    //选择一个随机回复
                    var defaultReplyList=[
                        '树洞主人不在，这个问题我要问主人(bs)',
                        '树洞主人不在，这个问题我要问主人(by)',
                        '树洞主人不在，这个问题我要问主人(rs)',
                        '树洞主人不在，这个问题我要问主人(lt)',
                        '树洞主人不在，这个问题我要问主人(fz)',
                        '树洞主人不在，这个问题我要问主人(fog)',
                        '树洞主人不在，这个问题我要问主人(scb)'
                    ];
                    var idx=Math.floor(Math.random() * defaultReplyList.length);
                    msg = defaultReplyList[idx];
                }
                item.msg=msg;
                //删掉没必要存在的html内容
                delete(item.Content);
                cb();
            }
        );


    }
};



exports.DEALER=XIAODOU;

