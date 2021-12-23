/** @param {import(".").NS } ns */

const argsSchema = [
  ["breite", 46],
  ["hoehe", 21],
  ["timeSpanSecs", 46],
  ["debug", false]
]

export function autocomplete(data, args) {
  data.flags(argsSchema);
  return [];
}

function createEmptyArray(breite) {
  let array = []
  for (var i = 0; i < breite; i++) {
    array.push(" ")
  }
  return array
}

function createEmpty2DArray(breite, hoehe) {
  let array = []
  for (var i = 0; i < hoehe; i++) {
    array.push(createEmptyArray(breite))
  }
  return array
}

function minMaxWhatever(array, miax) {
  let hit = true
  let cache = 0

  for (var i = 0; hit; i++) {
    cache = Math.pow(10, i)
    if (miax == "min" && array.some(ms => cache * 10 > ms)) {
      hit = false
      return cache
    }
    if (miax == "max" && !array.some(ms => ms >= cache)) {
      hit = false
      return cache
    }
  }
}

function horizontalAdd(row, hoehe, hoeheMax, hoeheMin, ns) {
  if (parseInt(row) == 0) {
    return ns.nFormat(hoeheMax, "$0a").padStart(5, " ")
  }
  else if (parseInt(row) == hoehe) {
    return ns.nFormat(hoeheMin, "$0a").padStart(5, " ")
  }
  else {
    return "\|".padStart(5, " ")
  }
}

export async function main(ns) {
  let options = ns.flags(argsSchema)
  ns.disableLog("sleep")
  if (options.timeSpanSecs - options.breite < 0) {
    ns.tprint("The timespan per column can't be lower than 1 second. Please use a higher time or lower breite to " + options.timeSpanSecs)
    ns.print("The timespan per column can't be lower than 1 second. Please use a higher time or lower breite to " + options.timeSpanSecs)
    ns.exit()
  }
  if (options.breite < 1 || options.hoehe < 2) {
    ns.tprint("ERROR: Can't process a graph with too low breite or hoehe")
    ns.print("ERROR: Can't process a graph with too low breite or hoehe")
    ns.exit()
  }
  let interval = options.timeSpanSecs / options.breite * 1000
  let player = ns.getPlayer()
  let moneyArray = []
  moneyArray.push(parseInt(player.money))
  let lastTime = 0
  while (true) {
    let compiledBlock = []
    let compiledLine = []
    if (lastTime + interval <= Date.now()) {
      let emptyGraph = JSON.parse(JSON.stringify(createEmpty2DArray(options.breite, options.hoehe)))
      let currentTime = Date.now()
      lastTime = currentTime
      ns.clearLog()
      player = ns.getPlayer()
      if (moneyArray.length >= options.breite) {
        moneyArray.shift(0, 1)
      }
      moneyArray.push(parseInt(player.money))
      if (options.debug) { console.log(moneyArray) }
      let hoeheMax = minMaxWhatever(moneyArray, "max")
      let hoeheMin = minMaxWhatever(moneyArray, "min")
      let hoeheSplit = (hoeheMax - hoeheMin) / (options.hoehe)
      for (let horizontal in emptyGraph) {
        for (let vertical in emptyGraph[horizontal]) {
          for (let money in moneyArray) {
            if (emptyGraph[horizontal].length - (moneyArray.length - money) == vertical) {
              if (moneyArray[money] <= (hoeheMax - (parseInt(horizontal) * hoeheSplit)) && moneyArray[money] >= (hoeheMax - ((parseInt(horizontal) + 1) * hoeheSplit))) {
                if (parseInt(money) == 0) {
                  emptyGraph[horizontal][vertical] = "\/"
                }
                else if (moneyArray[money] >= moneyArray[money - 1] &&(emptyGraph[horizontal][vertical - 1] == '\/' || emptyGraph[horizontal][vertical - 1] == '\‾')) {
                  emptyGraph[horizontal][vertical] = "\‾"
                }
                else if (moneyArray[money] <= moneyArray[money - 1] && (emptyGraph[horizontal][vertical - 1] == '\\' || emptyGraph[horizontal][vertical - 1] == '\_')) {
                  emptyGraph[horizontal][vertical] = "\_"
                }
                else if (emptyGraph[horizontal][vertical - 1] == '\‾' && moneyArray[money] < moneyArray[money - 1]) {
                  emptyGraph[horizontal][vertical] = "\\"
                }
                else if (emptyGraph[horizontal][vertical - 1] == '\_' && moneyArray[money] > moneyArray[money - 1]) {
                  emptyGraph[horizontal][vertical] = "\/"
                }
                else if (moneyArray[money] <= moneyArray[money - 1]) {
                  emptyGraph[horizontal][vertical] = "\\"
                }
                else if (moneyArray[money] >= moneyArray[money - 1]) {
                  emptyGraph[horizontal][vertical] = "\/"
                }
              }
            }
          }
        }
        emptyGraph[horizontal].unshift(horizontalAdd(horizontal, (options.hoehe - 1), hoeheMax, hoeheMin, ns))
        compiledLine.push(emptyGraph[horizontal].join(""))
      }
      compiledBlock = compiledLine.join("\n")
      ns.print("\n" + compiledBlock)
    }
    await ns.sleep(10)
  }
}