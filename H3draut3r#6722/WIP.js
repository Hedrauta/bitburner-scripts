/** @param {import(".").NS } ns */


const argsSchema = [
  ["width", 52],
  ["height", 20],
  ["timeSpanSecs", 47]
]
export async function autocomplete(data,args) {
  data.flags(argsSchema);
  return [];
}
function createEmptyArray (width){
  let array = []
  for ( var i = 0; i<= width; i++) {
    array.push(" ")
  }
  return array
}
function createEmpty2DArray (width, height) {
let array = []
for (var i = 0; i<=height; i++) {
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
      if (cache >= 1000) { cache = ns.nFormat(cache, "$0a") }
      hit = false
      return "$" + cache
    }
    if (miax == "max" && !array.some(ms => ms >= cache)) {
      if (cache >= 1000) { cache = ns.nFormat(cache, "$0a") }
      hit = false
      return cache
    }
  }
}



export async function main(ns) {
  options = ns.flags(argsSchema)
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
    if (timeArray[timeArray.length - 1] + interval == Date.now && timeArray[0] == undefined) {
      ns.clearLog()
      let currentTime = Date.now()
      let player = ns.getPlayer()
      if (moneyArray.length > options.width - 6) {
        moneyArray.shift(0, 1)
        timeArray.splice(0, 1)
      }
      moneyArray.push(player.money)
      timeArray.push(currentTime)
      let heightMax = minMaxWhatever(moneyArray, "max", ns).substring(1))
      let heightMin = minMaxWhatever(moneyArray, "min", ns)
      let heightSplit = (heightMax - heightMin) / (options.height - 1)
      for (var horizontal in emptyGraph) {
        for (var vertical in horizontal) {
          for (var money in moneyArray) {
            if (horizontal.length - money - 1 == vertical) {

            }
          }
        }
      }
        1 0
        0
    }
    await ns.sleep(10)
  }
}

/*
/ ˉ \ _ 

100m|
    |
    |
    |
    |
    |
    |
    |
    |
    |
    |                 
    |               /
    |     /\/\_/ˉˉˉˉ
    |    /       
    |   /
    |  /
    | /
    |/
 10m|
    ∟−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−

padstart 4 (showing money min/10 and max) 
drawing graph ( function, push in array, add \n on each line)
  left side | only  
  /
  \
  -
   
  bottom line _ only > 


2d graph array [
[" "]*width - 5
*
height
]




  interval timeSpanSecs / (width - 5) * 1000
  while ()
    if (any array.length > 47)
      shift each aray
    save player.money now if now > lastsave + interval 
    save current interval

  





*/