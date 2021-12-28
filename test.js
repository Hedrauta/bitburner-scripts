/** @param {import(".").NS } ns */

export async function main(ns) {
  ns.disableLog("sleep")
  let symbol = ns.stock.getSymbols()
  let stockob = symbol.map(sm => { return { sym: sm, minAsk: ns.stock.getAskPrice(sm) } })
  while (true) {
    ns.clearLog()
    for (var sob of stockob) {
      sob.currentAsk = ns.stock.getAskPrice(sob.sym)
      ns.print("Sym: " + sob.sym.padEnd(4, " ") + " MinAsk: " + sob.minAsk.toFixed(3).padEnd(15," ") + " CurrentAsk: " + sob.currentAsk.toFixed(3).padEnd(15," ") + "(Dif:" + (sob.minAsk - sob.currentAsk).toFixed(3) + ")")
      if (sob.minAsk > sob.currentAsk) {
        sob.minAsk = sob.currentAsk
      }
    }
    await ns.sleep(100)
  }
}