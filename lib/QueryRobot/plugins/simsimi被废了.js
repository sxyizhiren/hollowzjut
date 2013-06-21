var querystring=require('querystring');
var Request=require('../lib/request.js');
var DiyStep=require('../lib/diyStep.js');

//node对于simsimi返回的http头解析不了，所以采用socket连接，发送http头和数据的方式来做

var httpGetMoban='GET /func/req?++++++++++ HTTP/1.1\r\n';
httpGetMoban+='x-requested-with: XMLHttpRequest\r\n';
httpGetMoban+='Accept-Language: zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3\r\n';
httpGetMoban+='Referer: http://www.simsimi.com/talk.htm\r\n';
httpGetMoban+='Accept: application/json, text/javascript, */*; q=0.01\r\n';
httpGetMoban+='Content-Type: application/json; charset=utf-8\r\n';
httpGetMoban+='Accept-Encoding: gzip, deflate\r\n';
httpGetMoban+='Mozilla/5.0 (Windows NT 5.1; rv:19.0) Gecko/20100101 Firefox/19.0\r\n';
httpGetMoban+='Host: www.simsimi.com\r\n';
httpGetMoban+='Connection: Keep-Alive\r\n';
httpGetMoban+='Cookie: ==========\r\n';
httpGetMoban+='\r\n';


function SIMSIMIER(){
    this.msg='你好';
    this.itemX={};
    this.finalCB=function(){};
    var _this=this;
    var finishCB=function(){//Request.reponse不会产生error
        console.log('Queryed a Simsimi ['+_this.msg+']');
        _this.afterDoing(_this.itemX);
        _this.finalCB();
    };
    this.step2=function(e){
        if(e){
            console.log(e);
            _this.itemX.Content='';
            DiyStep.StepInc(_this.itemX);
            finishCB();
        }else{
            console.log('Simsimi getCookie:['+_this.itemX.Cookie+']');
            var queryStr=querystring.stringify({
                'lc':'zh',
                'msg':encodeURIComponent(_this.msg)
            });
            var sendHttp=httpGetMoban.replace('++++++++++',queryStr).replace('==========',_this.itemX.Cookie);
            //console.log(sendHttp);
            Request.reponse(sendHttp,{host:'www.simsimi.com',port:80},_this.itemX,'txt',finishCB);
        }

    }
}
SIMSIMIER.prototype={
    isMatch:function(str){
        return true;
    },
    beforeDoing:function(str){
       this.msg=(str || '你好').trim();
    },
    doing:function(item,cb){
        this.itemX=item;
        this.finalCB=cb;
        this.beforeDoing(item.comm);
        Request.get('http://www.simsimi.com/talk.htm',{Cookie:'sagree=true'},item,'txt',this.step2,0);
    },
    afterDoing:function(item){
        var httpBack=item.Content;
        if(!httpBack || ''==httpBack){
            item.msg='呵呵。';
        }else{
            var startPos=httpBack.indexOf('{');
            var endPos=httpBack.indexOf('}');
            var httpBody=httpBack.substring(startPos,endPos+1);
            try{
                var bodyJson=JSON.parse(httpBody);
                var talkBack=bodyJson.response || '呵呵。';
                item.msg=talkBack;
            }catch(e){
                console.log(e);
                item.msg='呵呵。'
            }
            console.log(item.msg);
        }

        //console.log(item);
    }
};

exports.DEALER=SIMSIMIER;

//test();
var testobj;
function test(){
    testobj={
        comm:'你是傻逼吗'
    };
    var dealer=new SIMSIMIER();
    if(dealer.isMatch(testobj.comm)){
        dealer.doing(testobj,over);

    }else{
        console.log('正则不匹配！');
    }
}

function over(){
    console.log(testobj);
}


