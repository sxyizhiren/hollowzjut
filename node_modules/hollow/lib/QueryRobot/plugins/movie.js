/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-2-25
 * Time: 下午10:47
 * To change this template use File | Settings | File Templates.
 */


var Request=require('node-request');
var iconv= require('iconv-lite');
var cheerio=require('cheerio');
var Step=require('step');

var thisREG=/(.+)电影/;
var PluginName='Plugin_Movie';

function MOVIER(){

}

MOVIER.prototype={
    isMatch:function(str){
        return thisREG.test(str.trim());
    },
    getName:function(){
        return PluginName;
    },
    doing:function(item,cb){
        Step(
            function(){
                var url='http://theater.mtime.com/China_Zhejiang_Province_Hangzhou/'
                console.log(url);
                Request.get(url,null,null,item,'txt',this);
            }
            ,function(){
                var gbkstr = iconv.decode(item.Content,'utf8');
                var $=cheerio.load(gbkstr);

                var str='Now:';
                var maxLines=10;
                $('.p15 .clearfix').each(function(){
                    if(maxLines--){
                        str+='['+this.text().replace(/\s{1,}/g,' ').trim()+']';
                    }
                });

                str+='  Will:'
                maxLines=5;
                $('.p15 .pl12').each(function(){
                    if(maxLines--){
                        var ptext=this.text().indexOf('上映');
                        if(ptext>=0){
                            str+='['+this.text().substring(0,ptext).replace(/\s{1,}/g,' ').trim()+']'
                        }
                    }else{
                        //退出循环
                        return false;
                    }
                });

                if(''==str){
                    str='查询失败~！';
                }

                item.msg=str.trim();
                //删掉没必要存在的html内容
                delete(item.Content);
                cb();
            }
        );


    }
};



exports.DEALER=MOVIER;










