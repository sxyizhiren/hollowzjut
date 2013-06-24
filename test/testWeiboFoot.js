var Request=require('node-request');
var Login=require('../lib/Foots/weiboLib/login');
var path=require('path');
var fs=require('fs');
var assert=require('assert');


var confPath='./conf';

var accountFile=path.join(confPath + '/weibo_account.json');
var account=JSON.parse(fs.readFileSync(accountFile,'utf8'));


var obj={};
var inst=new(Login.INST)();
inst.setAccount(account);
inst.onekeyLogin(function(err,logininfo){
    if(logininfo.logined){
        console.log('weibo Login Success！');

        var block={
            '_surl':'',
            '_t':0,
            'hottopicid':'',
            'location':'home',
            'module':'stissue',
            'pic_id':'',
            'rank':'0',
            'rankid':'',
            'text':'xxxxx'+Math.random()
        };

        var headers={
            'Referer':'http://weibo.com/'
            ,'Accept-Language': 'zh-cn'
            ,'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'
            ,'Connection': 'Keep-Alive'
            ,'Cache-Control': 'no-cache',
            'X-Requested-With':'XMLHttpRequest'
        };
        var postdata=require('querystring').stringify(block);

        var url='http://weibo.com/aj/mblog/add';
        Request.post(url,logininfo.Cookie,postdata,headers,obj,'json',function(){
            console.log(obj);
            assert('100000'==obj.Content.code);
        });
        //console.log(logininfo);
    }else{
        console.log('weibo Login Fail!');
    }
});

