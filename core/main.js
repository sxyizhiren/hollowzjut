var renrenUtil=require('../lib/renrenUtil').INST;
var path=require('path');
var fs=require('fs');
var assert=require('assert');
var Tools=require('../lib/shareTool');

var accountFile=path.join(Tools.confPath + '/account.json');
var account=JSON.parse(fs.readFileSync(accountFile,'utf8'));

var hands={
    state:{
        exec:require('../lib/Hands/stateHand').Hand,
        params:[
            {id:'601715227',copy:true,sofa:true} //zjut表白墙,sofa是抢他沙发
            ,{id:'601698155',copy:true,sofa:false} //浙工大树洞,sofa是抢他沙发
        ]
    },
    gossip:{
        exec:require('../lib/Hands/gossipHand').Hand,
        params:[
            '601715540'    //树洞ZJUT
            ,'601662031'    //树洞秘密
        ]
    },
    notify:{
        exec:require('../lib/Hands/notifyHand').Hand,
        params:[
        ]
    },
    wechat:{
        exec:require('../lib/Hands/wechatHand').Hand,
        params:[
            'hollowzjut',
            '/wechat'
        ]
    }
};
var foots={
    log:{
        exec:require('../lib/Foots/logFoot').Foot,
        params:[]
    },
    post:{
        exec:require('../lib/Foots/postFoot').Foot,
        params:[]
    },
    imageUpload:{
        exec:require('../lib/Foots/imageUploadFoot').Foot,
        params:[
            874831347   //树洞zjut的相册id
        ]
    }
};

var filters=[
    function(messageBody){
        console.log(messageBody);;
        return messageBody;
    },
    require('../lib/Filters/eroticaFilter').filter,
    require('../lib/Filters/legalFilter').filter
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