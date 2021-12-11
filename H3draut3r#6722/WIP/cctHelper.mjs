export function generateIPs(data) {
    function checkOnlyZero(digit, length) { // to use, if the 0 is the only digit in the segment
        if (length > 1 && digit == 0) {
            return false;
        }
        return true
    }
    let dataArray = Array.from(String(data).padStart(4, 0), Number);
    let result = [];
    let i, j, k;
    i = j = k = 1; // for splicing segment 1-3
    let tempResult = [];  // save correct arrays here
    let tempCache = []; // for temporary check on result

    while (i < 4) {
        var tempData = JSON.parse(JSON.stringify(dataArray));
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
                        if (!(tempCache.some(a=> a<0 || a> 255))) { // any in array in range between 0-255
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
    return result
}

export function spiralizeMatrix(data) {
    let util = require('util')
    let res = [];
    let rotate = 11;
    let index_heigth = 0;
    let arr = data
    while (arr.flat().length > 0) {
        if (rotate === 11) { // go right
            if (Array.isArray(arr[index_heigth]) && arr[index_heigth].length) {
                var right = arr[index_heigth].shift();
                res.push(right)
            }
            else {
                rotate = 1;
                index_heigth++;
            }
        }
        else if (rotate === 1) { // go down
            if (Array.isArray(arr[index_heigth]) && arr[index_heigth].length) {
                var down = arr[index_heigth].pop();
                res.push(down);
                index_heigth++;
            }
            else {
                index_heigth--;
                rotate = 0
            }
        }
        else if (rotate === 0) { // go left
            if (Array.isArray(arr[index_heigth]) && arr[index_heigth].length) {
                var left = arr[index_heigth].pop();
                res.push(left)
            }
            else {
                index_heigth--;
                rotate = 10
            }
        }
        else if (rotate === 10) { // and up
            if (Array.isArray(arr[index_heigth]) && arr[index_heigth].length) {
                var up = arr[index_heigth].shift();
                res.push(up);
                index_heigth--
            }
            else {
                index_heigth++;
                rotate = 11
            }
        }
    }
    return util.inspect(res, { maxArrayLength: null })
}

export function uniquePaths1(array){
    let m = array[0];
    let n = array[1];
    const total = m + n - 2;
    let k = n - 1;
    if (k === 0) return 1;
    let top = 1;
    let bottom = 1;
    for (let i = 0; i < k; i++) {
        top *= total - i;
        bottom *= i + 1;
    }
    return top / bottom;
}

export function uniquePaths2(A) {

    let r = (A.length), c = (A[0].length);
    // create a 2D-matrix and initializing
    // with value 0
    let paths = new Array(r);
    for (let i = 0; i < r; i++) {
        paths[i] = new Array(c);
        for (let j = 0; j < c; j++) {
            paths[i][j] = 0;
        }
    }
    // Initializing the left corner if
    // no obstacle there
    if (A[0][0] == 0)
        paths[0][0] = 1;
    // Initializing first column of
    // the 2D matrix
    for (let i = 1; i < r; i++) {
        // If not obstacle
        if (A[i][0] == 0)
            paths[i][0] = paths[i - 1][0];
    }
    // Initializing first row of the 2D matrix
    for (let j = 1; j < c; j++) {
        // If not obstacle
        if (A[0][j] == 0)
            paths[0][j] = paths[0][j - 1];
    }
    for (let i = 1; i < r; i++) {
        for (let j = 1; j < c; j++) {
            // If current cell is not obstacle
            if (A[i][j] == 0)
                paths[i][j] = paths[i - 1][j] +
                    paths[i][j - 1];
        }
    }
    // Returning the corner value
    // of the matrix
    return paths[r - 1].pop();
}
