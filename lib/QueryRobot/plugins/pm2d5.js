var Request=require('node-request');
var PinYin=require('../lib/pinyinEncode.js');
var iconv= require('iconv-lite');
var cheerio=require('cheerio');
var fs=require('fs');
var Step=require('step');

var kqREG=/(.+)pm2\.5/;
var PluginName='Plugin_Pm2d5';

function KONGQIER(){

}
KONGQIER.prototype={
    isMatch:function(str){
        return(kqREG.test(str.trim()));
    },
    getName:function(){
        return PluginName;
    },
    doing:function(item,cb){
        var regRet=kqREG.exec(item.comm.trim());
        var city;
        if(regRet){
            city=regRet[1].trim();
        }else{
            city='杭州';
        }

        QUERY(city,item,cb);

        /*  is old url format
        var pyStr=PinYin.toPinYin(this.city);
        if(pyStr.length>1){
            var str1=pyStr.substr(0,1).toUpperCase();
            var str2=pyStr.substr(1).toLowerCase();
            pyStr=str1+str2;
        }
        var url='http://www.aqicn.info/?lang=cn&city='+pyStr;
        */

    }
};

function QUERY(city,item,cb){
    var parse=function(){
        var utf8str = iconv.decode(item.Content,'utf8');
        var $=cheerio.load(utf8str);
        var str='';

        $('.aqivalue').each(function(){
            str+=('['+this.text()).replace(/\s{1,}/g,' ');
            this.parent().siblings().each(function(){
                //console.log(this.text());
                str +=this.text()+' ';
            })
            str+=']';
            str=str.replace('更新时间','  数据采自').replace(/\n/g,'').replace(/\s{1,}/g,' ').replace(/\(.*\)/,'').trim();

            return false;//退出each
        });
        if(''==str){
            str='Not Found!';
        }
        //console.log(str);
        item.msg=str.trim();
        //删掉没必要存在的html内容
        delete(item.Content);
        cb();
    }


    var jump302=function(){
        if(301==item.Status || 302==item.Status){
            console.log('direct to '+item.Location);
            var url=item.Location;
            if(url.indexOf('http:') == -1){
                url='http://aqicn.org/'+url;
            }
            Request.get(url,null,null,item,'buf',jump302);
        }else{
            parse();
        }
    }

    var query=function(){
        var pyStr=PinYin.toPinYin(city).toLowerCase();
        var url='http://aqicn.info/city/'+pyStr+'/cn/'
        console.log(url);
        Request.get(url,null,null,item,'buf',jump302);
    }

    query();
}


exports.DEALER=KONGQIER;




