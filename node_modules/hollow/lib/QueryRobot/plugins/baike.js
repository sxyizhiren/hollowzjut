/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-3-13
 * Time: 下午12:53
 * To change this template use File | Settings | File Templates.
 */

var Request=require('node-request');
var iconv= require('iconv-lite');
var cheerio=require('cheerio');
var UrlEncode=require('../lib/urlEncode.js');
var Step=require('step');


var thisREG=/什么是(.+)/;
var PluginName='Plugin_Baike';

function BAIKER(){

}

BAIKER.prototype={
    isMatch:function(str){
        return thisREG.test(str.trim());
    },
    getName:function(){
        return PluginName;
    },
    beforeDoing:function(str){

    },
    doing:function(item,cb){
        var regRet=thisREG.exec(item.comm.trim());
        var name;
        if(regRet){
            name=regRet[1].trim();
        }else{
            name='牛逼';
        }

        Step(
            function(){
                //console.log('name:['+name+']');
                var url='http://baike.baidu.com/search/word?pic=1&sug=1&enc=GBK&word='+UrlEncode.urlEncode(name);
                //console.log(url);
                Request.get(url,null,null,item,'txt',this);
            },
            function(){
                if(301==item.Status || 302==item.Status){
                    //console.log('direct to '+item.Location);
                    var url='http://baike.baidu.com'+item.Location;
                    console.log(url);
                    Request.get(url,null,null,item,'buf',this);
                }else{
                    this();
                }
            },
            function(){
                var gbkstr = iconv.decode(item.Content,'utf8');
                var $=cheerio.load(gbkstr);
                var str='';
                var maxLines=1;
                $('.para').each(function(){
                    if(maxLines--){
                        str+=this.text().replace(/\s{1,}/g,' ').trim();
                    }else{
                        //退出循环
                        return false;
                    }
                });

                if(''==str){
                    str='Not Found!';
                }else{
                    //第一个句号的位置
                    var oPlace=str.indexOf('。');
                    if(oPlace > 0){
                        //第二个句号的位置
                        oPlace=str.indexOf('。',oPlace+1);
                    }
                    if(oPlace >=0){
                        //截取到句号为止的文本
                        str=str.substring(0,oPlace+1);
                    }
                    str='['+str+']';
                }
                //console.log(str);
                item.msg=str.trim();
                //删掉没必要存在的html内容
                delete(item.Content);
                cb();
            }
        );


    }
};



exports.DEALER=BAIKER;













