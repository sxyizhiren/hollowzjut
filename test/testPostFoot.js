var renrenUtil=require('../lib/renrenUtil').INST;
var path=require('path');
var fs=require('fs');
var assert=require('assert');

var accountFile=path.join(__dirname +'/../conf/account.json');
var account=JSON.parse(fs.readFileSync(accountFile,'utf8'));

//通过修改代码传入错误的cookie，使不能发成功，以此来测试

var hands={
    state:{
        exec:require('../lib/Hands/stateHand').Hand,
        params:[
            {id:'601709198',copy:true,sofa:true}            //self
            ,{id:'430040464',copy:true,sofa:true}       //李洪波

        ]
    },
    gossip:{
        exec:require('../lib/Hands/gossipHand').Hand,
        params:[
            601004954,   //最潮物
            601709198   //self
        ]
    },
    notify:{
        exec:require('../lib/Hands/notifyHand').Hand,
        params:[
        ]
    }
};
var foots={
    post:{
        exec:require('../lib/Foots/postFoot').Foot,
        params:[]
    }
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