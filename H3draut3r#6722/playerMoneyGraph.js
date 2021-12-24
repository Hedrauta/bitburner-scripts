/** @param {import(".").NS } ns */

const argsSchema = [
  ["breite", 45],
  ["hoehe", 21],
  ["timeSpanSecs", 45],
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

function minMaxWhatever(array) {
  var clone = [...array]
  clone.sort((a,b) => a-b)
  return [clone[0], clone[clone.length-1]]

}
let moneySuffix = ["k", "m", "b", "t", "q", "Q", "s", "S", "o", "n"]
function logBaseValue(base, value) {
  return Math.floor(Math.log(value) / Math.log(base))
}
function formatNumber(base, value) {
  return value / Math.pow(base, logBaseValue(base, value))
}


function horizontalAdd(row, hoehe, hoeheMax, hoeheMin) {
  let suf_min, suf_max, conv_min, conv_max
  if (hoeheMin >= 1000){
    suf_min = moneySuffix[logBaseValue(1000, hoeheMin)-1]
    var temp = formatNumber(1000, hoeheMin)
    console.log(temp, 100> temp >=10)
    if (temp >= 100) {
      conv_min = temp.toFixed(0)
    }
    else if (100 > temp && temp >= 10) {
      conv_min = temp.toFixed(1)
    }
    else {conv_min = temp.toFixed(2)}
  }
  else {
    suf_min = "|"
    if (hoeheMin >= 100) {
      conv_min = hoeheMin.toFixed(0)
    }
    else if (100 > hoeheMin && hoeheMin >= 10) {
      conv_min = hoeheMin.toFixed(1)
    }
    else {conv_min = hoeheMin.toFixed(2)}
  }
  if (hoeheMax >= 1000) {
    suf_max = moneySuffix[logBaseValue(1000, hoeheMax)-1]
    var temp = formatNumber(1000, hoeheMax)
    if (temp >= 100) {
      conv_max = temp.toFixed(0)
    }
    else if (100 > temp && temp >= 10) {
      conv_max = temp.toFixed(1)
    }
    else {conv_max = temp.toFixed(2)}
  }
  else {
    suf_max = "|"
    if (hoeheMax >= 100) {
      conv_max = hoeheMax.toFixed(0)
    }
    else if (100 > hoeheMax && hoeheMax >= 10) {
      conv_max = hoeheMax.toFixed(1)
    }
    else {conv_max = hoeheMax.toFixed(2)}
  }
  if (parseInt(row) == 0) {
    return ("$"+conv_max+suf_max).padStart(6, " ")
  }
  else if (parseInt(row) == hoehe) {
    return ("$"+conv_min+suf_min).padStart(6, " ")
  }else {
    return "\|".padStart(6, " ")
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
      let [hoeheMin, hoeheMax] = minMaxWhatever(moneyArray)
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
              else if (horizontal > 0 && (emptyGraph[horizontal-1][vertical] != " " || emptyGraph[horizontal-1][vertical] == "\║")) {
                emptyGraph[horizontal][vertical] = "\║"
              }
            }
          }
        }
        compiledLine.push([horizontalAdd(horizontal, (options.hoehe - 1), hoeheMax, hoeheMin, ns), ...emptyGraph[horizontal]].join(""))
      }
      compiledBlock = compiledLine.join("\n")
      ns.print("\n" + compiledBlock)
    }
    await ns.sleep(10)
  }
}