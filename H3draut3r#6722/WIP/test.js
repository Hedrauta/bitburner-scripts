let testData = [158, 153, 33, 123, 81, 51, 112, 30, 116, 65, 81, 56, 189, 14, 41, 91, 17, 158, 107, 4, 75, 57, 17, 24, 104, 4, 121, 190, 177, 93, 93, 136, 103, 107, 38, 43, 147]

// at most two transactions.
function randomNumberPush(ammountOfNumbers) {
    let array = []
    for (i=0; i<ammountOfNumbers; i++) {
        let randomNumber = Math.round(Math.random()*5)
        array.push(randomNumber
            )
    }
    return array
}
let test1 = randomNumberPush(15)

function arrayJump(array) {
    let i,j;
    i=j=array.length-1
    j--
    while(array[j] != undefined) {
        if (array[j] >= (i-j)) {
            i = j
            if (i==0){
                return 1
            }
            j--
        }
        else {j--}
        if (array[j] == undefined) {
            return 0
        }
    }
}

console.log(test1)
console.log(arrayJump(test1)) 