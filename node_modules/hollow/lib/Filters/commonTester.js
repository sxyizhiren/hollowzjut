var Util=require('util');


/**
 * 判断str中是否含有regList列表中所列举的内容
 * @param str
 * @param regList
 * @return {Boolean}
 */
function testList(str,regList){
    if((typeof str === 'string') && Util.isArray(regList)){
        for (var i=0;i<regList.length;i++){
            var word=regList[i];
            if(Util.isRegExp(word)){
                word.lastIndex=0;
                if(word.test(str)){
                    return true;
                }
            }else if(typeof word === 'string'){
                if(str.indexOf(word) >= 0){
                    return true;
                }
            }
        }
    }
    return false;
}

exports.testList=testList;

