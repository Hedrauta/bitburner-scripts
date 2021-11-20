var depth = 15; // depth of scanning targetable servers

/** @param {NS} ns **/
export async function main(ns) {
  let use_servers = ["32TiB_1", "32TiB_2", "32TiB_3", "32TiB_4"]; // add servers hostname you want to use for running scripts on them
  let use_non_owned = true;  // use non-owned rooted servers with at least 2GB RAM
  let debug = false; // only set true for issues. Terminal will get spammed with alot of info, be sure max lenghts is high enough
  /* in debug, there will be several lines "spammed" in the terminal:
  > list of all script_servers process_list (idc the rest)
  > action (grow or weak)
  > sum of all threads running on that action and arg
  > is there an process with same arg running?
  > sum of needed threads
  > target server
  be ready to kill the script, if an alert is occured and contact me on discord: H3draut3r#6722
  */
  if (use_non_owned) {
    nors().map(nm => use_servers.push(nm)) // nors is every non-owned rooted server, with ram >= 2GB. function is below
  }
  let script_servers = use_servers.map(us => { return { name: us } });
  // functions

  // get script_servers max and current ram
  function update_RAM() {
    for (var ramsrv of script_servers) {
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
      return sserv.filter(sf => sf.filename.indexOf(script) != -1 && sf.args.indexOf(arg) !== -1)
            .reduce((a, b) => a + b.threads, 0)
    }
    else {return 0}
  }
  // check, if any process with same argument is running
  function threadSameArg(sserv, script, arg) {
    if (sserv.length > 0) {
      return sserv.some(sf => sf.filename.indexOf(script) != -1 && sf.args.indexOf(arg) !== -1)
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
    return Math.floor((sserv.max_ram - sserv.cur_ram) / script_size)
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
            update_RAM();
            let sgthreads = calculateThreads(script_servers.map(sm => sm.process_list).flat(), sgname, tserv);
            let cgprocsr = threadSameArg(ssrv.process_list, sgname, tserv);
            ng_threads -= sgthreads
            if (debug){ 
              ns.tprint(script_servers.map(sm=>sm.process_list).flat());
              ns.tprint("action: grow");
              ns.tprint("s threads: "+sgthreads);
              ns.tprint("c procsr: "+cgprocsr);
              ns.tprint("n threads: "+ng_threads);
              ns.tprint("tserv: "+tserv)
              }
            if (ng_threads > 0 && (ng_threads - sgthreads) > 0 && !cgprocsr) {
              if (threadPossible(ssrv, sgname) > ng_threads) {
                start(gname, ssrv.name, ng_threads, tserv);
                ng_threads = 0;
                gsuccess = false;
                await ns.sleep(50)
              }
              else if (threadPossible(ssrv, sgname) > 1 && threadPossible(ssrv, sgname) < ng_threads) {
                start(gname, ssrv.name, threadPossible(ssrv, sgname), tserv);
                ng_threads -= threadPossible(ssrv, sgname);
                await ns.sleep(50)
              }
              else {
                ns.alert("Debug:\nYou should'nt be here. Try set debug true and kill it, when this message occurs");
              }
            }
            else if ((ng_threads - sgthreads) <= 0) {
              gsuccess = false;
              await ns.sleep(50) // skip that targetserver
            }
            else {
              await ns.sleep(1000)
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
            update_RAM();
            let swthreads = calculateThreads(script_servers.map(sm => sm.process_list).flat(), swname, tserv);
            let cwprocsr = threadSameArg(ssrv.process_list, swname, tserv);
            nwthreads -= swthreads
            if (debug){ 
              ns.tprint(script_servers.map(sm=>sm.process_list).flat());
              ns.tprint("action: weaken");
              ns.tprint("s threads: "+swthreads);
              ns.tprint("c procsr: "+cwprocsr);
              ns.tprint("n threads: "+nwthreads);
              ns.tprint("tserv: "+tserv)
              }
            if (nwthreads > 0 && (nwthreads - swthreads) > 0 && !cwprocsr) {
              if (threadPossible(ssrv, swname) > nwthreads) {
                start(wname, ssrv.name, nwthreads, tserv);
                nwthreads = 0;
                wsuccess = false;
                await ns.sleep(50) // all threads used, end loop for targetserver
              }
              else if (threadPossible(ssrv, swname) > 1 && threadPossible(ssrv, swname) < nwthreads) {
                start(wname, ssrv.name, threadPossible(ssrv, swname), tserv);
                nwthreads -= threadPossible(ssrv, swname);
                await ns.sleep(50)
              }
              else {
                ns.alert("Debug:\nYou should'nt be here. Try set debug true and kill it, when this message occurs");
              }
            }
            else if ((nwthreads - swthreads) <= 0) {
              wsuccess = false;
              await ns.sleep(50) // skip that targetserver
            }
            else {
              await ns.sleep(1000)
            }
          }
        }
      }
    };
    await ns.sleep(15000)
  }
}