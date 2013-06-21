/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-3-19
 * Time: 下午10:34
 * To change this template use File | Settings | File Templates.
 */
var Request=require('node-request');
var iconv= require('iconv-lite');
var cheerio=require('cheerio');
var Step=require('step');
var toughCookie=require('tough-cookie');
var CookieJar=toughCookie.CookieJar;


function XIAOIER(){

}
XIAOIER.prototype={
    isMatch:function(str){
        return true;
    },
    doing:function(item,cb){
        var msg=item.comm.trim();

        Step(
            function(){
                item.Cookie=new CookieJar();
                console.log('小i:%s ,start get cookie.',msg);
                var url='http://nlp.xiaoi.com/robot/demo/wap/wap-demo.action';
                console.log(url);
                Request.get(url,item.Cookie,null,item,'buf',this);
            },
            function(){
                if(200==item.Status){
                    var url='http://nlp.xiaoi.com/robot/demo/wap/wap-demo.action?requestContent='+encodeURIComponent(msg);
                    console.log(url);
                    item.Cookie.getCookieString(url, this);
                }else{
                    item.msg='- -';
                    cb();
                }
            },
            function(err,httpCookie){
                var xiaoiDocument={
                    cookie:httpCookie
                };
                _verify(xiaoiDocument);
                console.log('Cookie:'+xiaoiDocument.cookie);
                var url='http://nlp.xiaoi.com/robot/demo/wap/wap-demo.action?requestContent='+encodeURIComponent(msg);
                Request.get(url,xiaoiDocument.cookie,null,item,'buf',this);
            },
            function(){
                var gbkstr = iconv.decode(item.Content,'utf8');
                var $=cheerio.load(gbkstr);
                var maxLines=1;
                var str='';
                $('.wap_cn2').each(function(){
                    if(maxLines--){
                        str+=this.text().replace('小i机器人:','').replace(/小i/g,'树洞').replace(/\s{1,}/g,' ').trim();
                    }else{
                        //退出循环
                        return false;
                    }
                });
                if('[]'==str || ''==str){
                    str='--'
                }
                item.msg=str.trim();
                console.log('%s -> %s',item.comm,item.msg);
                //删掉没必要存在的html内容
                delete(item.Content);
                cb();
            }


        );

    },
    afterDoing:function(item){
        var gbkstr = item.Content.toString();
        //console.log(gbkstr);
        var $=cheerio.load(gbkstr);
        var i=0;
        var maxLines=1;
        var str='';
        $('.wap_cn2').each(function(){
            if(i<maxLines){
                i++;
                str+='['+this.text().replace('小i机器人:','').replace(/小i/g,'我').replace(/\s{1,}/g,' ').trim()+']';
            }
        });
        if('[]'==str || ''==str){
            str='不懂啊~！'
        }
        console.log(str);
        item.msg=str.trim();
    }
};


exports.DEALER=XIAOIER;

//test();
var testobj;
function test(){
    testobj={
        comm:'湿答答打扫打扫打扫三大'
    };
    var dealer=new XIAOIER();
    if(dealer.isMatch(testobj.comm)){
        dealer.doing(testobj,over);

    }else{
        console.log('正则不匹配！');
    }
}

function over(){
    console.log(testobj);
}



//testVerify();
function testVerify(){
    var doc={cookie:'nonce=12345;'}
    _verify(doc);
    console.log(doc);
}
//xiaoi的网页上执行验证的js文件，拷过来，稍微改了一下
var _verify = function(doc){
    var e=doc;
    function r() {
        return Math.PI + "I"
    }

    function c() {
        return"no"
    }

    function i(k) {
        return h(g(t(k)))
    }

    function g(N) {
        var K = N;
        var L = Array(80);
        var J = 1732584193;
        var I = -271733879;
        var H = -1732584194;
        var G = 271733878;
        var F = -1009589776;
        for (var C = 0; C < K.length; C += 16) {
            var E = J;
            var D = I;
            var B = H;
            var A = G;
            var k = F;
            for (var z = 0; z < 80; z++) {
                if (z < 16) {
                    L[z] = K[C + z]
                } else {
                    L[z] = o(L[z - 3] ^ L[z - 8] ^ L[z - 14] ^ L[z - 16], 1)
                }
                var M = u(u(o(J, 5), x(z, I, H, G)), u(u(F, L[z]), l(z)));
                F = G;
                G = H;
                H = o(I, 30);
                I = J;
                J = M
            }
            J = u(J, E);
            I = u(I, D);
            H = u(H, B);
            G = u(G, A);
            F = u(F, k)
        }
        return new Array(J, I, H, G, F)
    }

    function x(z, k, B, A) {
        if (z < 20) {
            return(k & B) | ((~k) & A)
        }
        if (z < 40) {
            return k ^ B ^ A
        }
        if (z < 60) {
            return(k & B) | (k & A) | (B & A)
        }
        return k ^ B ^ A
    }

    function l(k) {
        return(k < 20) ? 1518500249 : (k < 40) ? 1859775393 : (k < 60) ? -1894007588 : -899497514
    }

    function u(k, B) {
        var A = (k & 65535) + (B & 65535);
        var z = (k >> 16) + (B >> 16) + (A >> 16);
        return(z << 16) | (A & 65535)
    }

    function o(k, z) {
        return(k << z) | (k >>> (32 - z))
    }

    function t(A) {
        var k = ((A.length + 8) >> 6) + 1, B = new Array(k * 16);
        for (var z = 0; z < k * 16; z++) {
            B[z] = 0
        }
        for (z = 0; z < A.length; z++) {
            B[z >> 2] |= A.charCodeAt(z) << (24 - (z & 3) * 8)
        }
        B[z >> 2] |= 128 << (24 - (z & 3) * 8);
        B[k * 16 - 1] = A.length * 8;
        return B
    }

    function h(A) {
        var z = "0123456789abcdef";
        var B = "";
        for (var k = 0; k < A.length * 4; k++) {
            B += z.charAt((A[k >> 2] >> ((3 - k % 4) * 8 + 4)) & 15) + z.charAt((A[k >> 2] >> ((3 - k % 4) * 8)) & 15)
        }
        return B
    }

    function f(E) {
        var A, z, D, B = e.cookie.split(";");
        for (A = 0; A < B.length; A++) {
            var C = B[A];
            var k = C.indexOf("=");
            z = C.substr(0, k);
            D = C.substr(k + 1);
            z = z.replace(/^\s+|\s+$/g, "");
            if (z == E) {
                return unescape(D)
            }
        }
    }

    function b() {
        return"n"
    }

    function s(z, k) {
        e.cookie += z + "=" + escape(k)+';';
    }

    function a() {
        return"ce"
    }

    function m(z) {
        var B = "", C = r().substr(0, 7);
        for (var A = 0; A < C.length; A++) {
            var D = C.charAt(A);
            if (D != ".") {
                B = D + B
            }
        }
        return i(z + B)
    }

    function p() {
        return c() + b() + a()
    }

    var w = f(p());
    if (w) {
        var y = "" + (Math.ceil(Math.random() * 899999) + 100000);
        s("cnonce", y);
        s("sig", i(m(w) + y));
    }
    var q = f("cvisits");
    var d = new Date().getTime();
    var n = 0;
    var v = 0;
    if (q) {
        var j = q.split(",");
        v = parseInt(j[0]);
        n = parseInt(j[1]);
        if (d - n < 500) {
            v++
        } else {
            v = 0
        }
        if (v > 5) {
            window.top.location.href = "http://www.xiaoi.com"
        }
    }
    s("cvisits", v + "," + d)
};





