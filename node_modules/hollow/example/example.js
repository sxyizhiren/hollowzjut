var hollow=require('../core/main');
var path=require('path');

var rerenAccountFile=path.join(__dirname,'/renren.json');
var weiboAccountFile=path.join(__dirname,'/weibo.json');
var wechatInfo={        //微信公共主页的信息，都可在微信公共主页申请时进行设置，
    token:'hollowzjut', //微信公共主页的token
    url:'/wechat'       //微信接收消息的url，
};
hollow.work(rerenAccountFile,weiboAccountFile,wechatInfo,function(err,info){
    console.log(err);
    console.log(info);
});