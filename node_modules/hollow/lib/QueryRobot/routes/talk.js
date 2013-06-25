var QueryManager=require('../lib/queryMn.js');

exports.ask = function(req, res){
    var msg=req.params.msg;
    console.log('Push a Query! '+msg);
    QueryManager.pushMsg(msg,res);

};

exports.default = function(req, res){
    var msg='......';
    console.log('Push a Query! '+msg);
    QueryManager.pushMsg(msg,res);
};
