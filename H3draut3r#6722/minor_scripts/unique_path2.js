let a = [
        [0,0,1,0,1,1,1],
        [0,0,0,1,0,1,0],
        [1,0,0,0,0,0,0],
        [0,0,0,0,0,0,0],
        [0,1,0,0,0,1,0]
        ]
          
    function uniquePathsWithObstacles(A)
    {
 
      let r = (A.length), c = (A[0].length);
 
      // create a 2D-matrix and initializing
      // with value 0
      let paths = new Array(r);
      for(let i = 0; i < r; i++)
      {
          paths[i] = new Array(c);
        for(let j = 0; j < c; j++)
        {
          paths[i][j] = 0;
        }
      }
 
      // Initializing the left corner if
      // no obstacle there
      if (A[0][0] == 0)
        paths[0][0] = 1;
 
      // Initializing first column of
      // the 2D matrix
      for(let i = 1; i < r; i++)
      {
        // If not obstacle
        if (A[i][0] == 0)
          paths[i][0] = paths[i - 1][0];
      }
 
      // Initializing first row of the 2D matrix
      for(let j = 1; j < c; j++)
      {
 
        // If not obstacle
        if (A[0][j] == 0)
          paths[0][j] = paths[0][j - 1];
      } 
 
      for(let i = 1; i < r; i++)
      {
        for(let j = 1; j < c; j++)
        {
 
          // If current cell is not obstacle
          if (A[i][j] == 0)
            paths[i][j] = paths[i - 1][j] +
            paths[i][j - 1];
        }
      }
 
      // Returning the corner value
      // of the matrix
      return paths[r - 1];
    }
    console.log(uniquePathsWithObstacles(a));