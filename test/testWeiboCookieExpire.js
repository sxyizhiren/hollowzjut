/**
 *
 *
 *
 *
 * 把weiboFoot.js中refreshCookieExpire函数的这一行的注释打开
 *
 *
 *  function(){
                    if(messagePage.Status === 302){
                        console.log('weibo Cookie Invalid a Time!');
                        messagePage.expireTimes ++;
                    }else{
                        //console.log('weibo Cookie is Healthy!');//把这一行打开
                        messagePage.expireTimes=0;  //把这一行注掉
                        //messagePage.expireTimes ++;//把这一行打开
                    }

    跑一遍程序看是否能成功重启，

 *
 */
