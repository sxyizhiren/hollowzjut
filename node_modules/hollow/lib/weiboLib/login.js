var fs=require('fs');
var http=require('http');
var path=require('path');
var querystring=require('querystring');
var Request=require('node-request');
var Step=require('step');
var toughCookie=require('tough-cookie');
var CookieJar=toughCookie.CookieJar;
var CookiePair=toughCookie.Cookie;
var assert=require('assert');
var sinassoEncoder=require('./sinaSSO').SSOEncoder;


var Login=function(){
    var accountInfo;    //账户信息
    var encryptkey;     //rsa加密参数
    var icode;          //验证码
    var loginInfo;      //登陆信息
    var callbackFn;     //登录后的回调函数
    var messagePage;        //判断cookie是否有效的页面


    /**
     * 把json形式的对象转成用toughCookie.Cookie表示的对象
     * @param storeIdx
     */
    var makeJsonToCookieObject=function(storeIdx){
        if(typeof storeIdx !== 'object'){
            storeIdx = {};
        }
        Object.keys(storeIdx).forEach(function(domain){
            var domainGroup=storeIdx[domain];
            Object.keys(domainGroup).forEach(function(path){
                var pathGroup=domainGroup[path];
                Object.keys(pathGroup).forEach(function(key){
                    var obj=pathGroup[key];
                    obj.expires=toughCookie.parseDate(obj.expires);
                    obj.creation=toughCookie.parseDate(obj.creation);
                    obj.lastAccessed=toughCookie.parseDate(obj.lastAccessed);
                    pathGroup[key]=new CookiePair(obj);
                });
            });
        });
    }

    /**
     * 尝试cookie是否有效
     */
    var testCookie=function(){
        //console.log('stepTestCookie');
        messagePage={};
        Step(
            function(){
                var url='http://weibo.com/messages';
                Request.get(url,accountInfo.Cookie,null,messagePage,'txt',this);
            },
            function(){
                var loginOk=false;
                if(messagePage.Status === 302){
                    console.log('weibo Cookie Invalid!');
                    loginOk = false;
                }else{
                    console.log('weibo Cookie is Healthy!');
                    loginOk = true;
                }
                if(loginOk){
                   accountInfo.logined=true;
                   callbackFn(null,accountInfo);
                }else{
                    //cookie无效，重新登录
                    accountInfo.logined=false;
                    ajaxLogin();
                }

            }
        );

    };

    /**
     * 设置登录的账户
     * @param account
     */
    this.setAccount=function(account){
        accountInfo={};
        accountInfo.email=account.email || '';
        accountInfo.passwd=account.passwd || '';
        accountInfo.Cookie=new CookieJar();
        //要么没cookie，要么有完整cookie对象
        assert(!account.Cookie || (account.userinfo && account.Cookie.store && account.Cookie.store.idx));
        if(account.Cookie){
            makeJsonToCookieObject(account.Cookie.store.idx);
            accountInfo.Cookie.store.idx=account.Cookie.store.idx;
            accountInfo.userinfo=account.userinfo;
        }
    }

    /**
     * base64加密
     * @param str
     * @return {String}
     */
    var base64Encode=function(str){
        return new Buffer(str).toString('base64');
    }

    /**
     *获取RSA加密用的参数，以及检查是否需要验证码
     */
    var getWeiboRsa=function(){
        var user=accountInfo.email;
        var userBase64=querystring.stringify({
            su:base64Encode(user)
        });
        var url='http://login.sina.com.cn/sso/prelogin.php?entry=weibo&callback=sinaSSOController.preloginCallBack&'+userBase64+'&rsakt=mod&checkpin=1&client=ssologin.js(v1.4.5)';
        encryptkey={};
        encryptkey.D = (new Date).getTime();//用来计算preit，encryptkey.E
        Request.get(url,null,null,encryptkey,'txt',this);
    }

    /**
     * servertime的时间更新
     */
    var incServertime=function(){
        encryptkey.Content.servertime++;
    }

    /**
     * 从html中匹配出RSA加密用的参数、是否需要验证码
     */
    var parseEncryptKey=function(){
        var reg=/\{.*\}/;
        try{
            var res=reg.exec(encryptkey.Content);
            var jsonEncrypt=JSON.parse(res[0]);
            encryptkey.Content=jsonEncrypt;
            encryptkey.intvalID=setInterval(incServertime,1000);
            encryptkey.E = (new Date).getTime() - encryptkey.D - (parseInt(jsonEncrypt.exectime, 10) || 0);
        }catch(e){
            encryptkey.Content=null;
        }
        assert(encryptkey.Content,'HTML return Fail,Because I parse it Failed!');
        this();
    }

    /**
     * 需要验证码的话获取验证码
     */
    var getPinImage=function(){
        icode={str:''};
        var __this=this;
        if(encryptkey.Content.showpin === 1){
            Step(
                function(){
                    var url='http://login.sina.com.cn/cgi/pin.php'+"?r=" + Math.floor(Math.random() * 1e8) + "&s=" + 0 +  "&p=" + encryptkey.Content.pcid;
                    Request.get(url,accountInfo.Cookie,null,icode,'buf',this);
                },
                function(){
                    fs.writeFile('pincode.png',icode.Content,'binary',this);
                },
                function(){
                    console.log('输入微博登录验证码，请看当前目录下的pincode.png');
                    getInputIcode(icode,__this);
                }

            );
        }else{
            __this();
        }
    }


    /**
     * 获取用户输入验证码
     * @param getter
     * @param callbackfn
     */
    function getInputIcode(getter,callbackfn){
        process.stdin.resume();
        process.stdin.setEncoding('utf8');

        process.stdin.on('data', function (chunk) {
            process.stdout.write('data: ' + chunk);
            getter.str=chunk.substring(0,chunk.indexOf('\r'));
            process.stdin.pause();
            callbackfn();
        });

        process.stdin.on('end', function () {
            process.stdout.write('end');
            process.stdin.pause();
        });

    }


    /**
     * 前期工作准备好后，提交登录信息
     */
    var login=function(){
        //console.log('stepLogin');
        var pass=accountInfo.passwd;
        //加密用到的参数集合到一起
        // 相同参数每次加密产生的结果都是不同的，这是正常现象，
        // 是rsa2的内部机制导致的，不影响解密
        var encParam={
            e:'10001',  //固定的
            n:encryptkey.Content.pubkey,    //公钥
            servertime:encryptkey.Content.servertime,   //加密用到的
            nonce:encryptkey.Content.nonce      //加密用到的随机数
        };
        //停止增加,释放资源
        clearInterval(encryptkey.intvalID);

        //rsa2加密sinassoEncoder来自新浪自己的加密文件经过修改而来
        var rsaKey=new sinassoEncoder.RSAKey();
        rsaKey.setPublic(encParam.n, encParam.e);
        pass = rsaKey.encrypt([encParam.servertime, encParam.nonce].join("\t") + "\n" + pass);

        //组装提交的参数
        var postBlock={
            'encoding':'UTF-8',
            'entry':'weibo',
            'from':'',
            'gateway':'1',
            'nonce':encParam.nonce,
            'pagerefer':'http://weibo.com/a/download',
            'prelt':encryptkey.E,
            'pwencode':'rsa2',
            'returntype':'META',
            'rsakv':encryptkey.Content.rsakv,
            'savestate':'7',
            'servertime':encParam.servertime,
            'service':'miniblog',
            'sp':pass,
            'su':base64Encode(accountInfo.email),
            'url':'http://weibo.com/ajaxlogin.php?framelogin=1&callback=parent.sinaSSOController.feedBackUrlCallBack',
            'useticket':'1',
            'vsnf':'1'
        };

        //和验证码相关的键值
        if(encryptkey.Content.showpin === 1){
            postBlock.door=icode.str;
            postBlock.pcid=encryptkey.Content.pcid;
        }

        var postData=querystring.stringify(postBlock);

        var url = 'http://login.sina.com.cn/sso/login.php?client=ssologin.js(v1.4.5)';
        var headers={
            'Referer':'http://weibo.com/?from=bp'
            ,'Accept-Language': 'zh-cn'
            ,'Content-Type':'application/x-www-form-urlencoded'
            ,'Connection': 'Keep-Alive'
        };

        //登录
        Request.post(url,accountInfo.Cookie,postData,headers,loginInfo,'txt',this);
    }

    /**
     * 检测登录是否成功，成功的话继续跳转获取用户信息
     */
    var loginJump=function(){
        var reg=/location.replace\("(.*)"\)/;
        var res=reg.exec(loginInfo.Content);
        assert(res,'Jump Page return Fail,Because I parse it Failed!');
        var url=res[1];
        var urlJson=querystring.parse(url);
        if(urlJson.retcode == '0'){
            accountInfo.logined=true;
            Request.get(url,accountInfo.Cookie,null,loginInfo,'txt',this);
        }else{
            accountInfo.logined=false;
            //登录失败，直接返回错误号
            callbackFn(urlJson.retcode,accountInfo);
        }



    }

    /**
     * 这是个跳转页面，直接跳到下一个页面
     */
    var loginGetUserInfo=function(){
        assert(loginInfo.Status == 302,'Check Jump Page,When retcode==0!');
        var url= loginInfo.Location
        Request.get(url,accountInfo.Cookie,null,loginInfo,'txt',this);
    }

    /**
     * 从html解析用户信息
     */
    var parseUserInfo=function(){
        var reg=/"userinfo":(\{.*?"\})/;
        var res=reg.exec(loginInfo.Content);
        assert(res,'userinfo Return Fail,Because I Parse it Failed!');
        var userinfo=JSON.parse(res[1]);
        //console.log(userinfo);
        accountInfo.userinfo=userinfo;
        callbackFn(null,accountInfo);
    }

    /**
     * 密码步骤步骤
     */
    var ajaxLogin=function(){
        Step(
            getWeiboRsa,
            parseEncryptKey,
            getPinImage,
            login,
            loginJump,
            loginGetUserInfo,
            parseUserInfo
        );
    }

    /**
     * 用cookie登录
     */
    var cookieLogin=function(){
        testCookie();
    }
    /**
     * 一键登录新浪微博
     * @param callback
     */
    this.onekeyLogin=function(callback){
        assert(typeof callback === 'function');
        callbackFn=callback;
        loginInfo={};   //初始化
        cookieLogin();
    }

}

module.exports.INST=Login;


