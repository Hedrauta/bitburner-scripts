/** @param {NS} ns **/
export async function main(ns) {
  let use_servers = ["256TiB_1-0","256TiB_1","32TiB_1", "32TiB_2", "32TiB_3", "32TiB_4"]; 
  // add servers hostname you want to use for running scripts on them, if you want only run on this one
  let arg = ns.flags([
    ['hack', 5], // hack-percentage of targets server money, run with argument "--hack *integer*" (>=1 && <=100)
    ['ignore', []], // ingnored script servers, add for every purchased server "--ignore *hostname*" on run
    ['use_non_owned', false], // use non-owned, rooted server as script-server, to enable, run with "--use_non_owned"
    ['use_all', false], // use of all purchased server (except ignored ones), to enable, run with "--use_all"
    ['debug', false]
]);

  /* only enable with argument "--debug" if an alert occurs. Terminal will get spammed with alot of info, be sure max lenghts is high enough
   in debug, there will be several lines "spammed" in the terminal:
  > list of all script_servers process_list (idc the rest)
  > action (grow or weak)
  > sum of all threads running on that action and argument of target server
  > is there an process with same arg running?
  > sum of needed threads
  > target server
  if an alert is occuring, script does exits itself and contact me with the currents response on discord: H3draut3r#6722
  */

  function upd_ussrvr() { // special function for special use
  if ( arg.use_all ){
    // if true, use every purchased server (except home ofc)
    use_servers = ns.getPurchasedServers().filter(nsgf => arg.ignore.indexOf(nsgf) == -1)
  }
  if (arg.use_non_owned) {
    nors().map(nm => use_servers.push(nm)) // nors is every non-owned rooted server, with ram >= 2GB. function is below
  }
  }
    upd_ussrvr();
  
  let hperct = 5;
  if (arg.hack >= 1 && arg.hack <= 100 ) {
    hperct = arg.hack
    // if there's a number set as first argument and in range, set hperct
  }
  let script_servers = [];
  function upd_ssrvr(){ // function for later use (if use_all_ps is set true)
  script_servers = use_servers.map(us => { return { name: us } });
  }
  upd_ssrvr();


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
    else { return 0 }
  }
  // check, if any process with same argument is running
  function threadSameArg(sserv, script, arg) {
    if (sserv.length > 0) {
      return sserv.some(sf => sf.filename.indexOf(script) != -1 && sf.args.indexOf(arg) !== -1)
    }
    else { return false }
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
  async function copy_files(){
  for (var srvscp of script_servers) {
    await ns.scp([sgname, swname, shname], ns.getHostname(), srvscp.name);
    await ns.sleep(10)
  }}
  await copy_files();
  // done copy ≡(▔﹏▔)≡

  update_RAM(); // initial calls
  update_process();

  ns.tprint("Starting automatic Grow/Weaken/Hack");
  ns.tprint("Values set on startup: \n Hacking " + hperct + "% of targets Server money.\nUse non-owned rooted servers as a Script-Server (enable with --use_non_owned ): " + arg.use_non_owned);
  ns.tprint("Servers used for running scripts:");
  ns.tprint(use_servers)
  ns.tprint("if --use_all is set, list will grow for every purchased server afterwards, except --ignore ones (read first lines for instruction) ");
  ns.tprint("Currently targetable Server (you can still nuke and they will be added later in run):");
  ns.tprint(nots());
  ns.tprint("\n\n Starting GWHCTRL. Keep-alives will be send as toast (bottom right notification!")
  await ns.sleep(1000)

  // disable logging for certain functions (if debug is fals), i do spam them alot 😂
  if (!arg.debug){
    ns.disableLog("getServerUsedRam");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("sleep")
  }
  // Script-part (in loop)
  while (1) {
    if (arg.use_all) {
      upd_ussrvr();
      upd_ssrvr();
      await copy_files();
      update_RAM();
      update_process()
    }
    for (const tserv of nots()) {
      let cur_mon = ns.getServerMoneyAvailable(tserv);
      let max_mon = ns.getServerMaxMoney(tserv);
      let g_multi = Math.ceil(max_mon / (cur_mon + 0.001));
      let min_sec = ns.getServerMinSecurityLevel(tserv);
      let cur_sec = ns.getServerSecurityLevel(tserv);
      let wst_multi = ns.weakenAnalyze(1);
      if (cur_sec > (min_sec * 1.05)) { // weaken the servers security-level to minimum (before grow)
        let nwthreads = Math.ceil((cur_sec - min_sec) / wst_multi);
        let wsuccess = true;
        while (wsuccess) {
          for (const ssrv of script_servers) {
            update_process();
            update_RAM();
            let swthreads = calculateThreads(script_servers.map(sm => sm.process_list).flat(), swname, tserv);
            let cwprocsr = threadSameArg(ssrv.process_list, swname, tserv);
            let mwthreads = nwthreads - swthreads;
            if (arg.debug) {
              ns.tprint(script_servers.map(sm => sm.process_list));
              ns.tprint("action: weaken");
              ns.tprint("ssrv: " + ssrv.name);
              ns.tprint("tserv: " + tserv);
              ns.tprint("f threads: " + threadPossible(ssrv, swname));
              ns.tprint("s threads: " + swthreads);
              ns.tprint("c procsr: " + cwprocsr);
              ns.tprint("n threads: " + nwthreads);
              ns.tprint("tserv: " + tserv)
            }
            if (nwthreads > 0 && mwthreads > 0 && !cwprocsr) {
              if (threadPossible(ssrv, swname) >= nwthreads) {
                start(wname, ssrv.name, nwthreads, tserv);
                wsuccess = false;
                await ns.sleep(10) // all threads used, end loop for targetserver
              }
              else if (threadPossible(ssrv, swname) >= 1 && threadPossible(ssrv, swname) < nwthreads) {
                start(wname, ssrv.name, threadPossible(ssrv, swname), tserv);
                nwthreads -= threadPossible(ssrv, swname);
                await ns.sleep(10)
              }
              else if (threadPossible(ssrv, swname) == 0){
                await ns.sleep(1)// skip the current ssrv bc no free threads
              }
              else {
                ns.alert("Debug:\nYou should'nt be here. Try run again with argument --debug");
                ns.exit()
              }
            }
            else if (mwthreads <= 0) {
              wsuccess = false;
              await ns.sleep(1)// skip the current ssrv bc no free threads
            }
            else {
              await ns.sleep(1000)
            }
          }
        }
      }
      else if (max_mon * 0.99 >= cur_mon) { // grow with enough threads for possible MaxMoney on the Server
        let ngthreads = Math.ceil(ns.growthAnalyze(tserv, g_multi));
        let gsuccess = true;
        while (gsuccess) {
          for (const ssrv of script_servers) {
            update_process();
            update_RAM();
            let sgthreads = calculateThreads(script_servers.map(sm => sm.process_list).flat(), sgname, tserv);
            let cgprocsr = threadSameArg(ssrv.process_list, sgname, tserv);
            let mgthreads = ngthreads - sgthreads;
            if (arg.debug) {
              ns.tprint(script_servers.map(sm => sm.process_list));
              ns.tprint("action: grow");
              ns.tprint("ssrv: " + ssrv.name);
              ns.tprint("tserv: " + tserv);
              ns.tprint("f threads: " + threadPossible(ssrv, sgname));
              ns.tprint("s threads: " + sgthreads);
              ns.tprint("c procsr: " + cgprocsr);
              ns.tprint("n threads: " + ngthreads)
            }
            if (ngthreads > 0 && mgthreads > 0 && !cgprocsr) {
              if (cur_sec == 100){
                gsuccess = false // escape the grow, do some weaken before!
              }
              else if (threadPossible(ssrv, sgname) >= ngthreads) {
                start(gname, ssrv.name, ngthreads, tserv);
                gsuccess = false;
                await ns.sleep(10)
              }
              else if (threadPossible(ssrv, sgname) >= 1 && threadPossible(ssrv, sgname) < ngthreads) {
                start(gname, ssrv.name, threadPossible(ssrv, sgname), tserv);
                ngthreads -= threadPossible(ssrv, sgname);
                await ns.sleep(10)
              }
              else if (threadPossible(ssrv, sgname) == 0){
                await ns.sleep(1)// skip the current ssrv bc no free threads
              }
              else {
                ns.alert("Debug:\nYou should'nt be here. Try run again with argument --debug");
                ns.exit()
              }
            }
            else if (mgthreads <= 0) {
              gsuccess = false;
              await ns.sleep(10) // skip that targetserver
            }
            else {
              await ns.sleep(1000)
            }
          }
        }
      }
      else { // run hack, bc security is lowered and money is at max
        let hsuccess = true;
        let nhthreads = ns.hackAnalyzeThreads(tserv, (cur_mon * hperct / 100));
        while (hsuccess) {
          for (const ssrv of script_servers) {
            update_process();
            update_RAM();
            // some hackmath!
            let shthreads = calculateThreads(script_servers.map(sm => sm.process_list).flat(), shname, tserv);
            let chprocsr = threadSameArg(ssrv.process_list, shname, tserv);
            let mhthreads = nhthreads - shthreads;
            if (arg.debug) {
              ns.tprint(script_servers.map(sm => sm.process_list));
              ns.tprint("action: hack");
              ns.tprint("ssrv: " + ssrv.name);
              ns.tprint("tserv: " + tserv);
              ns.tprint("f threads: " + threadPossible(ssrv, shname));
              ns.tprint("s threads: " + shthreads);
              ns.tprint("c procsr: " + chprocsr);
              ns.tprint("n threads: " + nhthreads);
              ns.tprint("tserv: " + tserv)
            }
            if (nhthreads > 0 && mhthreads > 0 && !chprocsr) {
              if (threadPossible(ssrv, shname) >= nhthreads) {
                start(hname, ssrv.name, nhthreads, tserv);
                hsuccess = false;
                await ns.sleep(10)
              }
              else if (threadPossible(ssrv, shname) >= 1 && threadPossible(ssrv, shname) < nhthreads) {
                start(hname, ssrv.name, threadPossible(ssrv, shname), tserv);
                nhthreads -= threadPossible(ssrv, shname)
                await ns.sleep(10)
              }
              else if (threadPossible(ssrv, shname) == 0){
                await ns.sleep(1)// skip the current ssrv bc no free threads
              }
              else {
                ns.alert("Debug:\nYou should'nt be here. Try run again with argument --debug");
                ns.exit()
              }
            }
            else if (mhthreads <= 0) {
              hsuccess = false;
              await ns.sleep(10) // skip that targetserver
            }
            else {
              await ns.sleep(1000)
            }
          }
        }
      }
    };
    await ns.sleep(15000)
    ns.toast("GWHCtrl: Still alive!")
  }
}