var weiboLogin=require('./weiboLib/login').INST;
var path=require('path');
var fs=require('fs');
var assert=require('assert');



var weiboINST=function(){
    var LoginTool;
    var LoginInfo;


    this.Login=function(account,callback){
        LoginTool=new weiboLogin();
        assert(typeof callback === 'function');
        LoginTool.setAccount(account);
        LoginTool.onekeyLogin(function(err,loginInfo){
            LoginInfo=loginInfo;
            callback(err,loginInfo);
        });
    };

    this.getLoginInfo=function(){
        return LoginInfo;
    };

}

module.exports.INST=weiboINST;



