var Request=require('node-request');
var PinYin=require('../lib/pinyinEncode.js');
var iconv= require('iconv-lite');
var cheerio=require('cheerio');

var thisREG=/(.+)天气/;
var PluginName='Plugin_Tianqi';

function TIANQIER(){

}
TIANQIER.prototype={
    isMatch:function(str){
        return(thisREG.exec(str));
    },
    getName:function(){
        return PluginName;
    },
    doing:function(item,cb){
        var regRet=thisREG.exec(item.comm.trim());
        var city;
        if(regRet){
            city=regRet[1].trim();
        }else{
            city='杭州';
        }

        QUERY(city,item,cb);



    }
};

function QUERY(city,item,cb){
    var parse=function(){
        var gbkstr = iconv.decode(item.Content,'gbk');
        var $=cheerio.load(gbkstr);
        var maxLines=2;
        var str='';
        $('.tqshow1').each(function(){
            if(maxLines--){
                str+='['+this.text().replace(/\s{1,}/g,' ').trim()+']';
            }else{
                //退出循环
                return false;
            }
        });
        if(''==str){
            str='Not Found！';
        }

        item.msg=str.trim();
        //删掉没必要存在的html内容
        delete(item.Content);
        cb();
    }


    var jump301=function(){
        if(301==item.Status || 302==item.Status){
            console.log('direct to '+item.Location);
            var url=item.Location;
            Request.get(url,null,null,item,'buf',jump301);
        }else{
            parse();
        }
    }

    var query=function(){
        var url='http://'+PinYin.toPinYin(city)+'.tianqi.com';
        console.log(url);
        Request.get(url,null,null,item,'buf',jump301);
    }

    query();
}

exports.DEALER=TIANQIER;




