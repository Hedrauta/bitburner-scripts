const uniquePaths = (m, n) => {
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
};
console.log(uniquePaths(12,13))