var renrenUtil=require('../lib/renrenUtil').INST;
var path=require('path');
var fs=require('fs');
var assert=require('assert');

var accountFile=path.join(__dirname +'/../conf/account.json');
var account=JSON.parse(fs.readFileSync(accountFile,'utf8'));

var hands={
    gossip:{
        exec:require('../lib/Hands/wechatHand').Hand,
        params:[
           'hollowzjut',
            '/wechat'
        ]
    }
};
var foots={

};

var filters=[
    function(handid,id,me){
        console.log(handid);
        console.log(id);
        console.log(me);
        return me;
    }
];

var renren=new renrenUtil();
renren.Login(account,function(err,loginInfo){
    if(loginInfo.logined){
        saveAccount(loginInfo);
        console.log('Login Succ!!!');
        renren.Start(hands,foots,filters,function(){

        });
    }else{
        console.log('Login Fail!!!');
    }
});

function saveAccount(logininfo){
    //JSON.stringify(value [, replacer] [, space]),replacer是过滤器，函数或者数组，space分隔符或缩进数
    //只保存email，passwd和cookie3个字段，缩进4个空格
    fs.writeFileSync(accountFile,JSON.stringify(logininfo,null,4), 'utf8');
}