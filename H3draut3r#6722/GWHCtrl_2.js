/** 
 * @param {import("./index").NS } ns
 * @param {import("./index").Server } values
 * @param {import("./index").Server } getServer
 * */

let argSchema = [
  ["hackPercent", 1], // Hack-Percentage in %
  ["growTo", 100], // Grow up to X %
  ["keepHomeFreeRamGB", 8], // Ram in GB, that home will kept free
  ["debug", false]
]
export function autocomplete(data, args) {
  data.flags(argSchema);
  return []
}



export async function distribute(ns, source, dest, fileName, script_servers) {
  await ns.wget(source, dest, fileName);
  for (let server of script_servers) {
    await ns.scp(fileName, dest, server.name)
  }
}

export function allServers(ns) {
  const nodes = new Set
  function dfs(node) {
    nodes.add(node);
    for (const neighbor of ns.scan(node)) {
      if (!nodes.has(neighbor)) {
        dfs(neighbor)
      }
    }
  }
  dfs("home")
  return [...nodes]
}

function script_servers(ns) {
  return allServers(ns).map(casm => { return { name: casm, rooted: ns.hasRootAccess(casm), maxRam: ns.getServerMaxRam(casm), securityPerThread: ns.weakenAnalyze(1) } }).filter(casmf => casmf.rooted)
}

function updateRAM(script_servers, ns) {
  for (let server of script_servers) {
    server.usedRam = ns.getServerUsedRam(server.name)
    if (server.name == "home") {
      server.usedRam = + options.keepHomeFreeRamGB
    }
    server.freeRam = server.maxRam - server.usedRam
  }
}

function updateProcessList(script_servers, ns) {
  for (let server of script_servers) {
    server.processList = ns.ps(server.name)
  }
}



function getTargetServer(playerHackingLevel, ns) {
  let targetableServers = allServers(ns)
    .map(casm => { return { name: casm, values: ns.getServer(casm), hackAnalyze: ns.hackAnalyze(casm), hackTime = ns.getHackTime(casm) } })
    .filter(casmf => casmf.values.moneyMax > 0 && casmf.values.hasAdminRights && casmf.hackTime * 4 < 100000 && casmf.values.requiredHackingSkill <= playerHackingLevel)
  return targetableServers.sort((a, b) => (a.values.moneyMax * a.hackAnalyze / a.hackTime * 4) - (b.values.moneyMax * b.hackAnalyze / b.hackTime * 4)).shift()
}

function playerHackingLevel(ns) {
  return ns.getPlayer()
}

function removeEntry(entry, array) {
  var index = array.map(a => a.name).indexOf(entry)
  if (index > -1) {
    array.splice(index, 1);
  }
}

function calculateThreads(script_servers, process, arg) {
  return script_servers.filter(sf => sf.processList.filename == process && arg.indexOf(sf.processList.args) >= 0)
    .reduce((a, b) => a.processList.threads + b.processList.threads, 0)
}

let [growFileName, weakenFileName, hackFileName] = ["ctrl/grow_server.script", "ctrl/weaken_server.script", "ctrl/hack_server.script"]

export async function main(ns) {

  let options = ns.flags(argSchema)
  let [fluffyWeaken, fluffyGrow, fluffyHack] = [0, 0, 0]
  let currentServer = ns.getHostname()
  let timing_array = allServers(ns)
  let targetChanged = false
  while (!targetChanged) {
    let oldServers = timing_array.map(tm => tm.name).filter(tf => !allServers(ns).find(af => tf == af))
    let newServers = allServers(ns).filter(af => !times.map(tm => tm.name).filter(tf => af == tf))
    newServers.map(nm => times.push({ name: nm }))
    oldServers.map(om => removeEntry(om, times))
    for (let t of timing_array) {
      if ((t.weakenStart && t.growStart && t.hackStart) == undefined) {
        t.weakenStart = t.growStart = t.hackStart = 0;
      }
    }
    let scriptServers = [...script_servers(ns)]
    await ctrl.distribute(ns, "https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/grow_server.script", currentServer, "/" + growFileName, script_servers(ns))
    await ctrl.distribute(ns, "https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/weaken_server.script", currentServer, "/" + weakenFileName, script_servers(ns))
    await ctrl.distribute(ns, "https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/hack_server.script", currentServer, "/" + hackFileName, script_servers(ns))
    for (server of scriptServers) {
      let timetabe = timing_array.filter(taf => taf.name == server.name)
      let target = getTargetServer(playerHackingLevel, ns)
      timetabe.hackTime = ns.getHackTime(target.name)
      updateRAM(scriptServers, ns)
      updateProcessList(scriptServers, ns)

      let sumSecurity, growthMult, hackMoney // init vars
      let neededHackThreads, neededWeakenThreads, neededGrowThreads  // grow and weaken based on hack
      let missingHackThreads, missingWeakenThreads, missingGrowThreads
      let runningHackThreads, runningWeakenThreads, runningGrowThreads  // with same fluf-arg

      // calculate Hack threads
      hackMoney = target.values.moneyMax / (options.hackPercent / target.hackAnalyze)
      neededHackThreads = Math.floor(ns.hackAnalyzeThreads(target.name, hackMoney))
      runningHackThreads = calculateThreads(scriptServers, "/"+hackFileName, fluffyHack)
      missingHackThreads = neededHackThreads - runningHackThreads
      
      // grow threads
      growthMult = target.moneyMax / (target.moneyMax - hackMoney)
      neededGrowThreads = Math.ceil(ns.growthAnalyze(target.name, growthMult))
      runningGrowThreads = calculateThreads(scriptServers, "/"+growFileName, fluffyGrow)
      missingGrowThreads = neededGrowThreads - runningGrowThread
      
      // weaken threads
      sumSecurity = ns.getServerSecurityLevel(target.name) + ns.hackAnalyzeSecurity(missingHackThreads) + ns.growthAnalyzeSecurity(missingGrowThreads)
      if (sumSecurity > 100) { sumSecurity = 100 }
      neededWeakenThreads = ( sumSecurity - target.minDifficulty ) / server.securityPerThread
      runningWeakenThreads = calculateThreads(scriptServers, "/"+weakenFileName, fluffyWeaken)
      missingWeakenThreads = neededWeakenThreads - runningWeakenThreads

      
    }
  }
}
main(ns)


/* 

Grow > weaken until max/min
>
timing, hack > grow right after hack
timing grow (hack) > weaken right after grow 
end of hack + 50 ms = end of weaken



*/