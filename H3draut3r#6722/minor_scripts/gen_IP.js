let result = []; // init
function checkOnlyZero(digit, length) { // to use, if the 0 is the only digit in the segment
    if (length > 1 && digit == 0) {
        return false;
    }
    return true
}
function arrayInRange(array) { // if any of tempCache is in range between 0-255, return true 
    // Source: https://www.codeproject.com/Questions/1252884/Javascript-how-to-check-if-arrays-numbers-is-in-a
    for (var i = 0; i < array.length; i++) {
        if (array[i] < 0 || array[i] > 255) {
            // Value is outside the range
            return false;
        }
    }
    // All values are inside the range
    return true;
}
function multipleResults(data) {
    let i, j, k;
    i = j = k = 1; // for splicing segment 1-3
    let tempResult = [];  // save correct arrays here
    let tempCache = []; // for temporary check on result

    while (i < 4) {
        var tempData = JSON.parse(JSON.stringify(data));
        if (tempData.length - i > 9) { // if rest is greater equals 10, than i has to be a higher value
            i++
        }
        if (tempData.length - i - j > 6) { // same as before
            j++
        }
        if (tempData.length - i - j - k > 3) { // same as before
            k++
        }
        else {
            let partString1 = tempData.splice(0, i).join(""); // splice and join the first segment.
            if (checkOnlyZero(tempData[0], j) && tempData.length > 2) { /*first number in the remaining array can't start with a 0, 
            if there are more than 2 numbers required. also need at least 3 entries remaining*/
                let partString2 = tempData.splice(0, j).join(""); // splice+join second segment
                if (checkOnlyZero(tempData[0], k) && tempData.length > 1) { // same as previous IF, just with at least 2 entries left
                    let partString3 = tempData.splice(0, k).join(""); // ""
                    if (checkOnlyZero(tempData[0], tempData.length) && tempData.length > 0) { // if last digit is solo and a 0 and at least 1 entry
                        let partString4 = tempData.join(""); //join the rest of the remaining entries
                        tempCache.push(partString1, partString2, partString3, partString4); // create an array of that result
                        if (arrayInRange(tempCache)) { // any in array in range between 0-255
                            tempResult.push(tempCache); // save the current result into a temporary result-list
                        }
                        tempCache = [] // forgot that one on previous version 😆
                    }
                }
            }
            // increment segments splice 1-3 from back to front (ending with increment to i==4, which ends the while-loop)
            if (k == 3) {
                if (j == 3) {
                    if (i == 3) {
                        i = 4
                    }
                    else {
                        i++;
                        j = 1;
                        k = 1
                    }
                }
                else {
                    j++
                    k = 1
                }
            }
            else {
                k++
            }
        }
    }
    for (var temp of tempResult) { // the "scan" is complete, now turn every subarray into a ip-adress-string
        result.push(temp.join(".")) 
    }
}

let data = 12221612029; // <<<<<< set data here
let dataArray = Array.from(String(data).padStart(4,0), Number); // .padStart if data is below 1k
multipleResults(dataArray)
// run in node, or use Quokka.js on VSCODE

console.log(result)