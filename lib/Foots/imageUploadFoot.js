var assert=require('assert');
var Tools=require('../shareTool');
var msgType=Tools.messageType;
var Step=require('step');
var querystring=require('querystring');
var Request=require('node-request');
var addTryTimeAndWhetherFull=Tools.addTryTimeAndWhetherFull;//function
var cheerio=require('cheerio');

var FootType='ImageUpload_Foot';
/**
 * 处理类
 * @constructor
 */
var Foot=function(){
    var LoginInfo;  //cookie等登录信息
    var token;  //page  token
    var callbackFn;
    var postList;   //要post的对象
    var albumID;    //相册ID
    ///////////////////
    var dftWaitTime=1000;   //默认轮训时间
    var lock;       //正在发送时上锁
    var visitPostTime=30;   //30s

    //////////////
    /**
     * 初始化，配置一些参数
     * @param loginInfo
     */
    this.init=function(loginInfo,params){
        assert(typeof loginInfo === 'object');
        assert(params instanceof Array);
        LoginInfo=loginInfo;
        token=LoginInfo.token;
        albumID=params[0];
        assert(typeof albumID === 'number');
        postList=[];
    }

    /**
     * 开始工作
     * @param callback
     */
    this.run=function(callback){
        assert(typeof callback === 'function');
        callbackFn=callback;
        process.nextTick(Doing);
    }

    /**
     * 工作内容
     * @constructor
     */
    var Doing=function(){
        visitPostList();
    }

    /**
     * 不停查询，有了就进行post
     * @return {Number}
     */
    var visitPostList=function(){
        if(lock || !postList || postList.length ==0){
            return setTimeout(visitPostList,dftWaitTime);
        }
        var postBlock=postList.shift();
        posttingBlock(postBlock);
        setTimeout(visitPostList,visitPostTime*1000);
    }

    /**
     * 上传失败，解锁，并塞回队列
     * @param picBlock
     */
    var onPostFail=function(picBlock){
        if(!addTryTimeAndWhetherFull(picBlock)){
            //塞回队列继续尝试
            postList.unshift(picBlock);
        }else{
            //出错通知外部
            callbackFn(FootType,msgType.errorType,picBlock);
        }

    }

    /**
     * post消息
     * @param msgblock
     */
    var posttingBlock=function(picBlock){
        lock = true;
        Step(
            function(){
                var url='http://upload.renren.com/uploadservice.fcgi?pagetype=addPhotoPlain';
                /*
                 {
                 albumId:albumID,             //相册id
                 picturePath:message.localPath,    //图片本地存放绝对路径
                 descriptions:message.description || '-'   //图片描述
                 }
                 */
                var fields=buildFileField(picBlock.albumId,picBlock.picturePath);
                Request.postfile(url,LoginInfo.Cookie,fields,null,picBlock,'txt',this);
            },
            function(){
                var editUrlReg=/<script>\nwindow\.location=\"(.+)\";\n<\/script>/;
                var regRet;
                regRet=editUrlReg.exec(picBlock.Content);

                if(regRet){
                    var url=regRet[1];
                    console.log(url);
                    picBlock.stepUpload=true;//上传没出错，但是还需要后面确认是否成功
                    Request.get(url,LoginInfo.Cookie,null,picBlock,'txt',this);
                }else{
                    //这里只要网络正常，即使cookie填错也不会出错，cookie填错会在下面一步中检测到
                    console.log('upload picture fail @ addPhotoPlain!');
                    onPostFail(picBlock);
                    lock = false;
                    //这里失败就不用调用this去执行下一个step了
                }
            },
            function(){
                if(picBlock.stepUpload && (typeof(picBlock.Content) === 'string') && (picBlock.Content.indexOf('设为封面') > 0)){
                    //确认成功上传，但还没有发布到新鲜事中，所以推到stateBlock中等待发送到新鲜事（不是发到状态）
                    var $=cheerio.load(picBlock.Content);
                    var ids=$('input[name=ids]').attr('value');
                    var title=$('input[name=title]').attr('value');
                    var id=$('input[name=id]').attr('value');
                    var largeUrls=$('input[name=largeUrls]').attr('value');
                    /*//接收方代码
                     var uid=LoginInfo.uid;
                     var submitUrl='http://photo.renren.com/photo/'+uid+'/album-'+picBlock.albumId+'/relatives/edit';
                     var msgblock={
                     submit:submitUrl,
                     parameter:{
                     '_rtk':token._rtk,
                     'requestToken':token.requestToken,
                     'descriptions':picBlock.descriptions,
                     'editUploadedPhotos':false,
                     'id':picBlock.id,
                     'ids':picBlock.ids,
                     'largeUrls':picBlock.largeUrls,
                     'title':picBlock.title,
                     'x':36,//x,y应该是随机数吧，这里写死就行
                     'y':28
                     },
                     type:NOFYTYPE.NOFY_DESCRIPT_PICTURE
                     };

                     */
                    var message={
                        albumId:picBlock.albumId,
                        descriptions:picBlock.descriptions,
                        id:id,
                        ids:ids,
                        largeUrls:largeUrls,
                        title:title
                    };
                    callbackFn(FootType,msgType.imgDespt,message);
                    console.log('upload image success!');
                }else{
                    //上传没成功
                    console.log('upload picture fail @ check upload!');
                    onPostFail(picBlock);
                }
                lock = false;
            }

        );
    }

    /**
     * 构建图片发送的multi-part结构
     * @param albumId
     * @param picturePath
     * @return {Array}
     */
    var buildFileField=function(albumId,picturePath){
        var fields=[];
        var field={
            name:'id',
            value:albumId
        };
        fields.push(field);

        field={
            filename:picturePath,
            name:'photo1',
            value:''
        }
        fields.push(field);

        return fields;
    }

    /**
     * 对外接收消息的接口
     * @param handid
     * @param messageid
     * @param message
     */
    this.accept=function(handid,messageid,message){
        /*
         var messageType={
         textType:'text',
         deleteGossip:'delGossip',
         sofaType:'sofa',
         imageType:'image',
         imgDespt:'imgDespt'
         };
         */
        if(messageid === msgType.imageType){
            assert(typeof message === 'object');
            //检测相册id是否有效和相册是否已经满，满了要新建。这部分逻辑
            //这部分逻辑看起来很复杂的样子，照片不多的话还是不做了，简单才是王道
            if((typeof albumID == 'number') && (typeof message.localPath == 'string') ){
                /*
                message:
                 {
                 localPath:localPath,
                 description:description
                 }
                 */
                var msgblock={
                    albumId:albumID,             //相册id
                    picturePath:message.localPath,    //图片本地存放绝对路径
                    descriptions:message.description || '-'   //图片描述
                };
                postList.push(msgblock);
            }
        }else{
            return;
        }

    }


}


exports.Foot=Foot;

