let testString = 5476;
let stringArray = Array.from(String(testString), Number);
let result = [];

function singleresult (string, length) {
    let temp = true;
    let tempResult = [];
    while (temp) {
        let tempConcat = string.splice(0, length/4).join("")
        tempConcat.concat(".");
        tempResult.push(tempConcat);
        if (string.length == 0){
            temp = false
        }
    }
    return tempResult.join(".")
}
if (stringArray.length == 12 || stringArray.length == 4) {
    result.push(singleresult(stringArray, stringArray.length))
}
else {
// else do scan for IPs ¯\_(ツ)_/¯ // TODO
}
console.log(result)