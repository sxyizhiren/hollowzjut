
var PluginName='Plugin_Usage';

function DEFAULTER(){

}
DEFAULTER.prototype={
    isMatch:function(str){
        return ('usage'==str.trim().toLowerCase());
    },
    getName:function(){
        return PluginName;
    },
    doing:function(item,cb){
        console.log('Default Message!');
        item.msg='[什么是树洞][上海天气][绍兴pm2.5][最新电影][宁波区号][台州邮编]';
        cb();
    }
};



exports.DEALER=DEFAULTER;

