/** 
 * @param {import(".").NS } ns
 * @param {import(".").player } getPlayer 
 * @param {import(".").Server } values
 * @param {import(".").Server } getServer
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
  return allServers(ns).map(casm => { return { name: casm, rooted: ns.hasRootAccess(casm), maxRam: ns.getServerMaxRam(casm) } }).filter(casmf => casmf.rooted)
}

function updateRAM(script_servers, ns) {
  for (let server of script_servers) {
    if (server.name == "home") {
      server.usedRam = ns.getServerUsedRam(server.name) + options.keepHomeFreeRamGB
    }
    else {
      server.usedRam = ns.getServerUsedRam(server.name)
    }
    server.freeRam = server.maxRam - server.usedRam
  }
}

function updateProcessList(script_servers, ns) {
  for (let server of script_servers) {
    server.processList = ns.ps(server.name)
  }
}

function getTargetServer(player, ns) {
  let targetableServers = allServers(ns)
    .map(casm => { return { name: casm, values: ns.getServer(casm) } })
    .filter(casmf => casmf.values.moneyMax > 0 && casmf.values.hasAdminRights && ns.getWeakenTime(casmf.name) < 600000 && casmf.values.requiredHackingSkill <= player.hacking)
  return targetableServers.sort((a, b) => (a.values.moneyMax * ns.hackAnalyze(a.name) / weakenTime(a.name, ns)) - (b.values.moneyMax * ns.hackAnalyze(b.name) / weakenTime(b.name))).shift()
}

function player(ns) {
  return ns.getPlayer()
}

function server(ns) {
  return ns.getServer(ns)
}

function removeEntry(entry, array) {
  var index = array.map(a => a.name).indexOf(entry)
  if (index > -1) {
    array.splice(index, 1);
  }
}

let [growFileName, weakenFileName, hackFileName] = ["ctrl/grow_server.script", "ctrl/weaken_server.script", "ctrl/hack_server.script"]
export async function main(ns) {

  let options = ns.flags(argSchema)
  let [fluffyWeaken, fluffyGrow, fluffyHack] = [0, 0, 0]
  let currentServer = ns.getHostname()
  let targetAvailable = true
  let timing_array = allServers(ns)
  while (targetAvailable) {
    let oldServers = timing_array.map(tm => tm.name).filter(tf => !allServers(ns).find(af => tf == af))
    let newServers = allServers(ns).filter(af => !times.map(tm => tm.name).filter(tf => af == tf))
    newServers.map(nm => times.push({ name: nm }))
    oldServers.map(om => removeEntry(om, times))
    for (let t of timing_array) {
      if ((t.wstart && t.gstart && t.hstart) == undefined) {
        t.wstart = t.gstart = t.hstart = 0;
      }
    }

    await ctrl.distribute(ns, "https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/grow_server.script", currentServer, "/" + growFileName, script_servers(ns))
    await ctrl.distribute(ns, "https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/weaken_server.script", currentServer, "/" + weakenFileName, script_servers(ns))
    await ctrl.distribute(ns, "https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/hack_server.script", currentServer, "/" + hackFileName, script_servers(ns))
    if (getTargetServer(ns) != null) {
      for (let server of script_servers(ns)) {
        let target = [...getTargetServer(ns)]
        let timeTable = timing_array.filter(tf => tf.name == server.name)
        timeTable.htime = ns.getHackTime(target.name)
        [timeTable.wtime, timeTable.gtime] = [timeTable.htime*4, timeTable.htime*3.2]
        
      }
    }
    else {
      targetAvailable = false
      ns.tprint("No Target available... Please NUKE at least 1 Server, or start your AutoNuke");
      ns.exit()
    }
    await ns.sleep(0)
  }
}