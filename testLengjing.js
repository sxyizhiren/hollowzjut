var lengjingFilter=require('hollow/lib/Filters/lengjingFilter');
var lengjingFoot=require('hollow/lib/Foots/lengjingFoot').Foot;
var assert=require('assert');
var renrenUtil=require('hollow/lib/renrenUtil').INST;

var messageType={
    textType:'text',            //文字信息
    deleteGossip:'delGossip',   //删除留言板留言
    stateReply:'stateReply',      //抢沙发，即回复别人状态
    userReply:'userReply',     //回复评论列表中的某个用户
    imageType:'image',              //传图片
    imgDespt:'imgDespt',            //发布图片描述信息+发布到新鲜事
    errorType:'error',              //错误信息，包括不合法的状态或留言
    ctrlType:'ctrlAction',     //控制命令
    watchType:'watchState'      //监视状态
};

var tobeFilter={
	messageid:messageType.textType,
	message:123456
};

var filtered=lengjingFilter.filter(tobeFilter);
console.log(filtered);

tobeFilter.messageid=messageType.textType;
tobeFilter.message='#棱镜#123456954#';
var filtered=lengjingFilter.filter(tobeFilter);
assert(filtered.messageid==messageType.watchType);

tobeFilter.messageid=messageType.textType;
tobeFilter.message='#棱镜＃123456954#';
var filtered=lengjingFilter.filter(tobeFilter);
assert(filtered.message==='123456954');


var renren=new renrenUtil();
var account={
    "email": "15858178942",
    "passwd": "ihateu91",   
    "isPage": "false"   
};
renren.Login(account,function(err,loginInfo){
	console.log('##Login:'+loginInfo.logined);
	console.log('##uid:'+loginInfo.uid);
	var footinst=new lengjingFoot();
	footinst.init(loginInfo);
	footinst.run(function(handid,messageid,message){
        var MeggageBody={
            handid:handid,
            messageid:messageid,
            message:message
        };
		console.log("get a new state!");
		console.log(MeggageBody);
	});
	
	setTimeout(footinst.accept,3000,'XX_HAND',messageType.watchType,'123456789');
	setTimeout(footinst.accept,6000,'XX_HAND',messageType.watchType,'430040464');//李洪波的id
	setTimeout(footinst.accept,9000,'XX_HAND',messageType.watchType,'601715540');//李洪波的id 
		
});












