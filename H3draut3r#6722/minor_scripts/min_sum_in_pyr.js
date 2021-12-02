// Source: https://www.geeksforgeeks.org/minimum-sum-path-triangle/
let pyr = [
    [4],
    [8, 7],
    [9, 3, 4],
    [4, 6, 3, 9],
    [7, 2, 8, 9, 8],
    [8, 7, 7, 5, 6, 7],
    [4, 4, 6, 7, 6, 8, 1],
    [2, 9, 1, 3, 6, 4, 6, 9]
];
function minSumPath(A) {
    let memo = [];
    let n = A.length - 1;
    for (let i = 0; i < A[n].length; i++)
        memo[i] = A[n][i];
    for (let i = A.length - 2; i >= 0; i--)
        for (let j = 0;
            j < A[i].length; j++)
            memo[j] = A[i][j] +
                Math.min(memo[j],
                    memo[j + 1]);
    return memo[0];
}

console.log(minSumPath(pyr));