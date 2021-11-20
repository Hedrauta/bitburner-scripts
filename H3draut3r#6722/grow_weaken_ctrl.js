var depth = 15; // depth of scanning targetable servers

/** @param {NS} ns **/
export async function main(ns) {
  let use_servers = ["32TiB_1", "32TiB_2", "32TiB_3", "32TiB_4"]; // add servers hostname you want to use for running scripts on them
  let use_non_owned = true;  // use non-owned rooted servers with at least 2GB RAM

  if (use_non_owned) {
    nors().map(nm => use_servers.push(nm)) // nors is every non-owned rooted server, with ram >= 2GB. function is below
  }
  let script_servers = use_servers.map(us => { return { name: us } });
  // functions

  // get script_servers max and current ram
  function update_RAM() {
    for (var srv_key in script_servers) {
      let ramsrv = script_servers[srv_key];
      ramsrv.max_ram = ns.getServerMaxRam(ramsrv.name);
      ramsrv.cur_ram = ns.getServerUsedRam(ramsrv.name)
    }
  };
  // start fetching all Servers (Credits to skytos#2092)
  function allServers(ns) {
    const nodes = new Set
    function dfs(node) {
      nodes.add(node)
      for (const neighbor of ns.scan(node)) {
        if (!nodes.has(neighbor)) {
          dfs(neighbor)
        }
      }
    }
    dfs("home")
    return [...nodes]
  }

  // update script_servers process_list
  function update_process() {
    for (var srv of script_servers) {
      srv.process_list = ns.ps(srv.name);
    }
  };

  // filter for non-owned servers
  function nos() {
    let owned_servers = ["home", ns.getHostname()];
    ns.getPurchasedServers().map(gps => owned_servers.push(gps))
    return allServers(ns).filter(asf => ns.hasRootAccess(asf) && owned_servers.indexOf(asf) < 0)
  }

  // filter for non-owned servers with maxmoney > 0 ("target server")
  function nots() {
    return nos().filter(nf => ns.getServerMaxMoney(nf) > 0)
  }

  // another filter, non-owned, with ram >= 2, for use_non_owned
  function nors() {
    return nos().filter(nf => ns.getServerMaxRam(nf) >= 2)
  }
  // calculate  process_lists used threads for specific script and arguments, return it for further calculation
  function calculateThreads(sserv, script, arg) {
    if (sserv.length > 0) {
      return sserv.filter(sf => (sf.filename || "") != undefined && (sf.filename || "").indexOf(script) != -1 && (sf.args || []).indexOf(arg) !== -1)
            .reduce((a, b) => a + b.threads, 0)
    }
    else {return 0}
  }
  // check, if any process with same argument is running
  function threadSameArg(sserv, script, arg) {
    if (sserv.length > 0) {
      return sserv.some(sf => (sf.filename || "") != undefined && (sf.filename || "").indexOf(script) != -1 && (sf.args || []).indexOf(arg) !== -1)
    }
    else{return false}
  }
  // 
  function threadPossible(sserv, script) {
    let script_size = 1.75;
    if (script == shname) {
      script_size = 1.7
    }
    update_RAM();
    return ((sserv.max_ram - sserv.cur_ram) / script_size)
  }
  // execute script with threads (save some ram 😉)
  function start(script, host, threads, arg) {
    ns.exec(script, host, threads, arg)
  }

  //end of functions

  // copy grow/weaken-scripts on the working servers
  let gname = "ctrl/grow_server.script"; // for exec in loop
  let sgname = "/ctrl/grow_server.script"; // for scp/wget, bc i had to add a "/" ¯\_(ツ)_/¯
  let wname = "ctrl/weaken_server.script";
  let swname = "/ctrl/weaken_server.script";
  let hname = "ctrl/hack_server.script";
  let shname = "/ctrl/hack_server.script";
  await ns.wget("https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/grow_server.script", sgname, ns.gethostname);
  await ns.wget("https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/weaken_server.script", swname, ns.gethostname);
  await ns.wget("https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/hack_server.script", shname, ns.gethostname);
  for (var srvscp of script_servers) {
    await ns.scp([sgname, swname, shname], ns.getHostname(), srvscp.name)
  }
  // done copy ≡(▔﹏▔)≡

update_RAM(); // initial calls
update_process();

  // Script-part (in loop)
  while (1) {
    for (const tserv of nots()) {
      let cur_mon = ns.getServerMoneyAvailable(tserv);
      let max_mon = ns.getServerMaxMoney(tserv);
      let g_multi = Math.ceil(max_mon / (cur_mon + 0.001));
      let ng_threads = Math.ceil(ns.growthAnalyze(tserv, g_multi));
      if (max_mon * 0.99 >= cur_mon) { // grow with enough threads for MaxMoney on the Server
        let gsuccess = true;
        while (gsuccess) {
          for (const ssrv of script_servers) {
            update_process();
            let sgthreads = calculateThreads(script_servers.map(sm => sm.process_list).flat(), sgname, tserv);
            let cgprocsr = threadSameArg(ssrv.process_list, sgname, tserv);
            if (ng_threads > 0 && ng_threads - sgthreads > 0 && !cgprocsr) {
              update_RAM();
              if (threadPossible(ssrv, sgname) > ng_threads) {
                start(gname, ssrv.name, ng_threads, tserv);
                ng_threads = 0;
                gsuccess = false
              }
              else if (threadPossible(ssrv, sgname) > 1 && threadPossible(ssrv, sgname) < ng_threads) {
                start(gname, ssrv.name, threadPossible(ssrv, sgname), tserv);
                ng_threads -= threadPossible(ssrv, sgname)
              }
              else {
                ns.tprint("GWCTRL: How?") // you should'nt be here
              }
            }
            else if ((ng_threads - sgthreads) <= 0) {
              gsuccess = false // skip that targetserver
            }
            else {
              await ns.sleep(5000)
            }
          }
        }
      }
      else { // server reached 99% of MaxMoney else weaken with enough threads for HackCTRL (WIP)
        let nwthreads = Math.ceil((ns.getServerSecurityLevel(tserv) - ns.getServerMinSecurityLevel(tserv)) * 20);
        let wsuccess = true;
        while (wsuccess) {
          for (const ssrv of script_servers) {
            update_process();
            let swthreads = calculateThreads(script_servers.map(sm => sm.process_list).flat(), sgname, tserv);
            let cwprocsr = threadSameArg(ssrv.process_list, sgname, tserv);;
            if (nwthreads > 0 && nwthreads - swthreads > 0 && !cwprocsr) {
              update_RAM();
              if (threadPossible(ssrv, swname) > nwthreads) {
                start(wname, ssrv.name, nwthreads, tserv);
                nwthreads = 0;
                wsuccess = false // all threads used, end loop for targetserver
              }
              else if (threadPossible(ssrv, swname) > 1 && threadPossible(ssrv, swname) < nwthreads) {
                start(wname, ssrv.name, threadPossible(ssrv, swname), tserv);
                nwthreads -= ssrv.free_threads
              }
              else {
                ns.tprint("GWCTRL: Again?") // or here
              }
            }
            else if ((nwthreads - swthreads) <= 0) {
              wsuccess = false // skip that targetserver
            }
            else {
              await ns.sleep(5000)
            }
          }
        }
      }
    };
    await ns.sleep(15000)
  }
}