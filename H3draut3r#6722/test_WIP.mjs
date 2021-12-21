function minMaxWhatever(array, miax) {
  let hit = true
  let cache = 0

  for (var i = 0; hit && i < 20; i++) {
    cache = Math.pow(10, i)
    if (miax == "min" && array.some(ms => cache >= ms)) {
      hit = false
      return cache
    }
    if (miax == "max" && !array.some(ms => ms >= cache)) {
      hit = false
      return cache
    }
  }
}
let options = { width: 52, height: 21, timeSpanSecs: 47 }
function createEmptyArray(width) {
  let array = []
  for (var i = 0; i <= width; i++) {
    array.push(" ")
  }
  return array
}
function createEmpty2DArray(width, height) {
  let array = []
  for (var i = 0; i <= height; i++) {
    array.push(createEmptyArray(width))
  }
  return array
}
function Sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
function randomMoney(max, count) {
  var cache = []
  for (var i = 0; i < count; i++) {
    cache.push(Math.round(Math.random() * max))
  }
  return cache
}

async function main() {

  let moneyArray = JSON.parse(JSON.stringify(randomMoney(50000, 5)))
  console.log(moneyArray)
  let interval = options.timeSpanSecs / options.width - 6 * 1000
  let lastTime = 0
  let compiledLine = []
  let compiledBlock = []
  let ctd = 0
  while (ctd == 0) {
    if (lastTime + interval <= Date.now() || moneyArray[0] == undefined) {
      let emptyGraph = JSON.parse(JSON.stringify(createEmpty2DArray(options.width - 6, options.height - 1)))
      let currentTime = Date.now()
      lastTime = currentTime
      //ns.clearLog()
      //let player = ns.getPlayer()
      //if (moneyArray.length > options.width - 6) {
      //  moneyArray.shift(0, 1)
      // }
      //moneyArray.push(player.money)

      let heightMax = minMaxWhatever(moneyArray, "max")
      let heightMin = minMaxWhatever(moneyArray, "min")
      let heightSplit = (heightMax - heightMin) / (options.height - 1)
      for (let horizontal in emptyGraph) {
        for (let vertical in emptyGraph[horizontal]) {
          for (let money in moneyArray) {
            if (emptyGraph[horizontal].length - money - 1 == vertical) {
              if (moneyArray[money] < (heightMax - (parseInt(horizontal) * heightSplit)) && moneyArray[money] > (heightMax - ((parseInt(horizontal) + 1) * heightSplit))) {
                if (parseInt(money) == 0) {1
                  emptyGraph[horizontal][vertical] = "/"
                }
                else if (emptyGraph[horizontal][vertical - 1] == ('/' || '‾')) {
                  emptyGraph[horizontal][vertical] = "‾"
                }
                else if (emptyGraph[horizontal][vertical - 1] == ('\\' || '_')) {
                  emptyGraph[horizontal][vertical] = "_"
                }
                else if (emptyGraph[horizontal] == " ") {
                  emptyGraph[horizontal][vertical] = "/"
                }
                else if (moneyArray[vertical.length - money - 2] > moneyArray[vertical.length - money - 1]) {
                  emptyGraph[horizontal][vertical] = "\\"
                }
                else if (moneyArray[vertical.length - money - 2] < moneyArray[vertical.length - money - 1]) {
                  emptyGraph[horizontal][vertical] = "/"
                }
              }
            }
          }
        }
        compiledLine.push(emptyGraph[horizontal].join(""))
      }
    }
    compiledBlock = compiledLine.join("\n")
    console.log(compiledBlock)
    await Sleep(100)
    ctd++
  }
}
main()