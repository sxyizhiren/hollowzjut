var Util=require('util');

/**
 * 把str中包含regList所列举的内容替换成mskChar
 * @param str
 * @param regList
 * @param mskChar
 * @return {*}
 */
function maskList(str,regList,mskChar){
    if((typeof str === 'string') && Util.isArray(regList)){
        if(!mskChar)mskChar='*';
        for(var i=0;i<regList.length;i++){
            var word=regList[i];
            if(Util.isRegExp(word)){
                str=str.replace(word,mskChar);
            }else if(typeof word === 'string'){
                str=str.replace(word,mskChar);
            }
        }
    }
    return str;
}


exports.maskList=maskList;

