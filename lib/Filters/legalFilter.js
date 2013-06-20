var commonTester=require('./commonTester');
var testList=commonTester.testList;

var Tools=require('../shareTool');
var msgType=Tools.messageType;


/**
 * 要过滤的关键字
 * @type {Array}
 */
var sensitiveWords = [
    'zjut_treehole' //防止浙工大树洞的自我宣传被我拷贝
    ,'12星座'         //星座话题过滤掉
    ,'张昭洪'      //这人老发寻人启事，
    ,'促销活动'     //广告啊
    ,'约炮'       //重口味
    ,'撸管'       //重口味
    ,'黑木耳'      //重口味
    ,'鲁哩噜'      //那个sb的口头禅
    ,'gay'      //gay话题过滤掉
    ,'不相信树洞'    //怎么可以不相信呢
    ,'香菇'   //唉，不要这么痴情，别人都听烦了
    ,'神男'   //唉，不要这么痴情，别人都听烦了
    ,'啪啪啪'//呵呵
    ,'操她'  //
    ,'被操'   //
    ,'做爱'    //
];

/**
 * 要过滤的模式
 * @type {Array}
 */
var sensitivePatterns=[
    /回复.{1,20}:/            //回复的内容不发表
    ,/喜欢.{1,8}请转发/     //求转发的过滤掉
    ,/上架.{1,6}商品/           //广告
    ,/搞大.{1,14}的肚子/         //
    ,/全家.{0,5}死光/        //骂人
    ,/发生.{0,5}关系/        //
    ,/(http:\/\/)?([\w]{1,10}\.){1,3}(com|net|cn|org)/gi    //外链禁止
];


/**
 * 是否包含违禁词或模式
 * @param str
 * @return {*}
 */
function test(str){
    return testList(str,sensitiveWords) || testList(str,sensitivePatterns);
}

/**
 * 是否字符串非法
 * @param str
 * @return {Boolean}
 */
function otherIllegal(str){
    return (typeof str !== 'string')
        || (str.length <= 8)
        || (str.indexOf('【') >=0 && str.indexOf('【') <= 8) ;
}

function filter(messageBody){
    if(messageBody.messageid === msgType.textType){
        if(otherIllegal(messageBody.message) || test(messageBody.message)){
            //直接当作错误处理掉
            messageBody.messageid=msgType.errorType;
        }
    }
    return messageBody;
}

exports.filter=filter;


