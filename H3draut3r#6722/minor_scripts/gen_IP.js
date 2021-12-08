let testString = 5476;
let stringArray = Array.from(String(testString), Number);
let result = [];


// if given string is 12 or 4 numbers long, the result is only 1 string
function singleresult (string, length) {
    let convertIncomplete = true;
    let tempResult = [];
    while (convertIncomplete) {
        let tempConcat = string.splice(0, length/4).join("")
        tempConcat.concat(".");
        tempResult.push(tempConcat);
        if (string.length == 0){
            convertIncomplete = false
        }
    }
    return tempResult.join(".")
}

// for possible multi-results 
function multipleResults (string){
    let i,j,k;
    i=j=k=1;
    let tempResult = [];  // save correct arrays here
    let tempCache = []; // for temporary check on result

    while (i<4) {
        let tempString = string; // edit only the temporary string
        let tryConvert = true;
        while (tryConvert){
            if (tempString.length - i >= 10){
                i++
            }
            if (tempString.length - i -j >= 7){
                j++
            }
            if (tempString.length - i - j - k >= 4){
                k++
            }
            else {
                
            }
        }
    }
}
if (stringArray.length == 12 || stringArray.length == 4) {
    result.push(singleresult(stringArray, stringArray.length))
}
else {
// else do scan for IPs ¯\_(ツ)_/¯ // TODO
}
console.log(result)