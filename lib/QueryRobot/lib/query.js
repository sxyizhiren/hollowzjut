/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-3-19
 * Time: 下午5:28
 * To change this template use File | Settings | File Templates.
 */

function httpCode2code(httpCode){
    var map={
        500:1,
        200:0
    };
    var code=map[httpCode];
    if(undefined != typeof(code)){
        return code;
    }else{
        return 4;
    }
}


function Query(msg,dealer,res){
    this.talking={
        comm:msg
    };
    this.dealer=dealer;
    this.res=res;
    var _this=this;
    this.endWith=function(){
        var retJson={
            msg:_this.talking.msg,
            code:httpCode2code(_this.talking.Status)
        };
        delete _this.talking;
        _this.res.send(retJson);
    };
}



Query.prototype={
    start:function(){
        console.log('Query.start()');
        console.log(this.talking);
        this.dealer.doing(this.talking,this.endWith);
    }
};

exports.createQuery=Query;
