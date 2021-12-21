/** @param {import(".").NS } ns */

const argsSchema = [
  ["width", 52],
  ["height", 20],
  ["timeSpanSecs", 47]
]
export async function autocomplete(data, args) {
  data.flags(argsSchema);
  return [];
}
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

function minMaxWhatever(array, miax, ns) {
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



export async function main(ns) {
  let options = ns.flags(argsSchema)
  ns.disableLog("sleep")
  if (options.timeSpanSecs < options.width - 6) {
    ns.tprint("The time can't be lower than " + (width - 5) + " seconds. Please use a higher time or lower width to " + options.timeSpanSecs)
    ns.exit()
  }
  if (options.width < 6 || options.height < 4) {
    ns.tprint("ERROR: Can't process a graph with too low width or height")
    ns.exit()
  }

  let emptyGraph = createEmpty2DArray(options.width - 6, options.height - 1)
  let interval = options.timeSpanSecs / options.width - 6 * 1000
  let moneyArray = []
  let timeArray = []
  while (true) {
    if (timeArray[timeArray.length - 1] + interval == Date.now || timeArray[0] == undefined) {
      ns.clearLog()
      let currentTime = Date.now()
      let player = ns.getPlayer()
      if (moneyArray.length > options.width - 6) {
        moneyArray.shift(0, 1)
        timeArray.splice(0, 1)
      }
      moneyArray.push(player.money)
      timeArray.push(currentTime)
      let heightMax = minMaxWhatever(moneyArray, "max", ns)
      let heightMin = minMaxWhatever(moneyArray, "min", ns)
      let heightSplit = (heightMax - heightMin) / (options.height - 1)
      let compiledLine = []
      let compiledBlock = []
      for (var horizontal in emptyGraph) {
        for (var vertical in horizontal) {
          for (var money in moneyArray) {
            if (vertical.length - money - 1 == vertical) {
              if (moneyArray[money] < (heightMax - (horizontal * heightSplit) && moneyArray[money] > (heightMax - ((horizontal + 1) * heightSplit)))) {
                if (money == 0) {
                  emptyGraph[horizontal][vertical] = "/"
                }
                if (emptyGraph[horizontal][vertical-1] == ('/'||'‾')){
                  emptyGraph[horizontal][vertical] = "‾"
                }
                else if (emptyGraph[horizontal][vertical-1] == ('\\'||'_')){
                  emptyGraph[horizontal][vertical] = "_"
                }
                else if (emptyGraph[horizontal] == " "){
                  emptyGraph[horizontal][vertical] = "/"
                }
                else if (moneyArray[vertical.length-money-2] > moneyArray[vertical.length-money-1]){
                  emptyGraph[horizontal][vertical] = "\\"
                }
                else if (moneyArray[vertical.length-money-2] < moneyArray[vertical.length-money-1]){
                  emptyGraph[horizontal][vertical] = "/"
                }
              }
            }
          }
        }
        compiledLine.push(emptyGraph[horizontal].join(""))
      }
    compiledBlock.push(emptyGraph.join("\n"))
    ns.print(compiledBlock[0])
    }
    await ns.sleep(10)
  }
}

// section for saving strings
/*
/  \ _ 
emptyGraph[horizontal][vertical-1]

*/