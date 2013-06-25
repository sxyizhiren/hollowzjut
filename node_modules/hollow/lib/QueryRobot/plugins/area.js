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
var UrlEncode=require('../lib/urlEncode.js');
var Step=require('step');

var thisREG=/(.+)((邮编)|(区号))/;
var PluginName='Plugin_Area';

function AREAER(){

}
AREAER.prototype={
    isMatch:function(str){
        return thisREG.test(str.trim());
    },
    getName:function(){
        return PluginName;
    }
    ,
    doing:function(item,cb){
        var regRet=thisREG.exec(item.comm.trim());
        var city;
        if(regRet){
            city=regRet[1].trim();
        }else{
            city='杭州';
        }
        Step(
            function(){
                //query
                //console.log('getArea:['+city+']');
                var url='http://www.ip138.com/post/search.asp?area='+UrlEncode.urlEncode(city)+'&action=area2zip';
                console.log(url);
                Request.get(url,null,null,item,'buf',this);
            },
            function(){
                //parse
                var gbkstr = iconv.decode(item.Content,'gb2312');
                var $=cheerio.load(gbkstr);

                var maxLines=2;
                var str='[';
                $('.tdc2').each(function(){
                    if(maxLines--){
                        str+=(this.text()).replace(/\s{1,}/g,' ').trim();
                    }else{
                        //退出循环
                        return false;
                    }
                });
                str+=']';
                if(str.indexOf(city) < 0){
                    str = 'Not Found!'
                }
                item.msg=str.replace('◎','');
                //console.log(str);
                //删掉没必要存在的html内容
                delete(item.Content);
                cb();
            }

        );

    }
};



exports.DEALER=AREAER;

