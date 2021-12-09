let result = []; // init
// functions
// if given string is 12 or 4 numbers long, the result is only 1 string
function singleresult(string, length) {
    let convertIncomplete = true;
    let tempResult = [];
    while (convertIncomplete) {
        let tempConcat = string.splice(0, length / 4).join("")
        tempConcat.concat(".");
        tempResult.push(tempConcat);
        if (string.length == 0) {
            convertIncomplete = false
        }
    }
    return tempResult.join(".")
}
// for possible multi-results 
function multipleResults(data) {
    let i, j, k;
    i = j = k = 1;
    let tempResult = [];  // save correct arrays here
    let tempCache = []; // for temporary check on result

    while (i < 4) {
        var tempData = JSON.parse(JSON.stringify(data));
        if (tempData.length - i > 9) {
            i++
        }
        if (tempData.length - i - j > 6) {
            j++
        }
        if (tempData.length - i - j - k > 3) {
            k++
        }
        else {
            let partString1 = tempData.splice(0, i).join("");
            if (tempData.length >= 3) {
                let partString2 = tempData.splice(0, j);
                if (partString2[0] != 0 && tempData.length >= 2) {
                    partString2 = partString2.join("")
                    let partString3 = tempData.splice(0, k);
                    if (partString3[0] != 0 && tempData.length >= 1) {
                        partString3 = partString3.join("");
                        if (tempData[0] != 0) {
                            let partString4 = tempData.join("");
                            if (partString1 >= 0 && partString1 <= 255) {
                                if (partString2 >= 0 && partString2 <= 255) {
                                    if (partString3 >= 0 && partString3 <= 255) {
                                        if (partString4 >= 0 && partString4 <= 255) {
                                            tempCache.push(partString1, partString2, partString3, partString4); // create an array of that result
                                            tempResult.push(tempCache); // save the current result into a bigger list
                                            tempCache = []
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            // increment group 1-3 from back to front (ending with increment to i==4, which ends the while-loop)
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
    for (var temp of tempResult) {
        result.push(temp.join("."))
    }
}

let data = 11111111; // <<<<<< DATA


let dataArray = Array.from(String(data), Number);

if (dataArray.length == 12 || dataArray.length == 4) {
    result.push(singleresult(dataArray, dataArray.length))
}
else {
    multipleResults(dataArray)
}
// run in node, or use Quokka.js on VSCODE
console.log(result)