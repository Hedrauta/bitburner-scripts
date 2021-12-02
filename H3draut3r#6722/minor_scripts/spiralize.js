const { compileFunction } = require('vm');
let res = [];
const arr = [
    [36, 11, 41, 47, 22, 35, 6, 24, 8, 33, 30],
    [41, 17, 14, 30, 38, 4, 6, 15, 11, 14, 41],
    [29, 39, 19, 11, 33, 6, 19, 32, 30, 43, 46],
    [34, 13, 47, 33, 14, 41, 21, 3, 9, 39, 38],
    [38, 27, 2, 16, 4, 25, 39, 42, 47, 1, 39],
    [26, 40, 25, 50, 1, 32, 13, 44, 33, 24, 37],
    [40, 3, 12, 23, 31, 34, 18, 27, 42, 26, 8],
    [25, 24, 24, 26, 40, 12, 2, 27, 5, 14, 8],
    [10, 42, 41, 42, 17, 43, 26, 50, 33, 45, 44],
    [15, 29, 20, 44, 4, 30, 28, 26, 30, 22, 42],
    [7, 19, 38, 17, 39, 35, 40, 23, 22, 30, 4],
    [32, 3, 11, 16, 50, 22, 7, 13, 11, 11, 34],
    [26, 17, 26, 25, 31, 10, 7, 9, 8, 27, 10],
    [35, 25, 3, 41, 26, 8, 9, 35, 5, 14, 46]
];
let rotate = 11;
let index_heigth = 0;

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
console.log(res);
// run on VSCode with Extension `Code Runner`, ( Node.JS needed )