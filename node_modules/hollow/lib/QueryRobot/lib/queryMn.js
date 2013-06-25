/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-3-19
 * Time: 下午5:20
 * To change this template use File | Settings | File Templates.
 */

var Query=require('./query.js');
var commArray=[];
var siriArray=[];
var commplugins=[
    require('../plugins/default.js'),
    require('../plugins/area.js'),
    require('../plugins/pm2d5.js'),
    require('../plugins/tianqi.js'),
    require('../plugins/movie.js'),
    require('../plugins/baike.js'),
];
//var siri=require('../plugins/simsimi.js');
var siri=require('../plugins/xiaodou.js');
exports.pushMsg=pushMsg;

function pushMsg(msg,res){
    var dealer=getCommDealer(msg);
    if(dealer){
        commArray.push(new (Query.createQuery)(msg,dealer,res));
    }else{
        dealer=getSiriDealer(msg);
        siriArray.push(new (Query.createQuery)(msg,dealer,res));
    }
}

function getSiriDealer(msg){
    return new (siri.DEALER)();
}

function getCommDealer(msg){
    var L=commplugins.length;
    var i=0;
    for(i=0;i<L;i++){
        var plugin=new (commplugins[i].DEALER)();
        if(plugin.isMatch(msg)){
            return plugin;
        }
    }
    return null;
}

function allWatch(){
    watchArray(commArray,200,500);
    watchArray(siriArray,200,1000);
}

function watchArray(tArray,emptyTime,doingTime){
    var query=tArray[0];
    if(!query){
        /*
        if(Math.random()>0.95){
            //减少但不停止打印
            console.log('[-]');
        }
        */
        setTimeout(watchArray,emptyTime,tArray,emptyTime,doingTime);
    }else{
        console.log('['+tArray.length+']');
        tArray.splice(0,1);
        query.start();
        setTimeout(watchArray,doingTime,tArray,emptyTime,doingTime);
    }
}

allWatch();