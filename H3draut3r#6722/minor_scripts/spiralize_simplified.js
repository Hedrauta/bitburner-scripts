let res = [];
let arr = [[1, 2, 3], [8, 9, 3], [6, 5, 4]];
let fwd = true;
let down = true;
let index_height = 0;

while (arr.flat() != "") {
    if (fwd == true && down == true) {
        if (arr[index_height][0] != "") {
            res.push(arr[index_height].shift())
        }
        else {
            fwd = false;
            index_height++
        }

    }
    else if (fwd = false && down == true) {
        if (arr[index_height][0] != ("" || undefined)) {
            res.push(arr[index_height].pop());
            index_height++
        }
        else {
            index_height--;
            down = false

        }
    }
    else if (fwd = false && down == false) {
        if (arr[index_height] != "") {
            res.push(arr[index_height].pop())
        }
        else {
            index_height--;
            fwd = true
        }
    }
    else if (fwd = true && down == false) {
        if (arr[index_height][0] != "") {
            res.push(arr[index_height].shift());
            index_height--
        }
        else {
            index_height++;
            down = false
        }
    }
}
console.log(res)