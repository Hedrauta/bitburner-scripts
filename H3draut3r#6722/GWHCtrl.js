/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("scan"); // there are alot... and kind of annoying ;)


  let arg = ns.flags([ // options to add as a flag (--hack % , --use_home, --use_all_purchased , --use_non_owned , --ignore (special ussage) )
    ['hack', 5], // hack-percentage of targets server money, run with argument "--hack *integer*" (>=1 && <=100)
    ['ignore', []], // ingnored script servers, add for every purchased server "--ignore *hostname*" on run's argument
    ['use_home', false], // include home-server as a script-server
    ['use_non_owned', false], // use non-owned, rooted server as script-server, to enable, run with "--use_non_owned"
    ['use_all_purchased', true], // use of all purchased server (except ignored ones), to enable, run with "--use_all_purchased"
    // this will ignore --include
    ['grow_to', 100], // will grow the server to x% of targets max-money (for early-starts)
    ['debug', false]
  ]);
  let use_servers = [];
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
  let hperct = 0.05;
  if (arg.hack >= 1 && arg.hack <= 100) {
    hperct = arg.hack / 100
    // if there's a number set as first argument and in range, set hperct
  }
  let gperct = 1.00;
  if (arg.grow_to >= 1 && arg.grow_to <= 100) {
    gperct = arg.grow_to / 100
  }
  function upd_ussrvr() { // special function for special use
    if (arg.use_all_purchased) {
      // if true, use every purchased server (except home ofc)
      use_servers = ns.getPurchasedServers().filter(nsgf => arg.ignore.indexOf(nsgf) == -1)
    }
    if (arg.use_home) {
      use_servers.push("home")
    }
    if (arg.use_non_owned) {
      nors().map(nm => use_servers.push(nm)) // nors is every non-owned rooted server, with ram >= 2GB. function is below
    }
    return use_servers;
  }

  let script_servers = [];
  function upd_ssrvr() { // function for later use (if use_all_purchased_ps is set true)
    script_servers = upd_ussrvr().map(us => { return { name: us, values: ns.getServer(us) } });
  }
  upd_ssrvr(); // init call, because functions won't work for some reason 🤣


  // functions

  // get script_servers max and current ram (+ weaken-result for servers core)
  function update_RAM() {
    for (var ramsrv of script_servers) {
      if (ramsrv.name == "home") {
        ramsrv.cur_ram = ns.getServerUsedRam(ramsrv.name) + 16; // at least 16GB will be not used for home
      }
      else { ramsrv.cur_ram = ns.getServerUsedRam(ramsrv.name) };
      ramsrv.w_res = ns.weakenAnalyze(1, ramsrv.values.cpuCores)
    }
  };
  // start fetching all Servers (Credits to skytos#2092)
  function allServers(ns) {
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

  // update script_servers process_list
  function update_process() {
    for (var srv of script_servers) {
      srv.process_list = ns.ps(srv.name)
      if ((ssrv.wstart || ssrv.gstart || ssrv.wdur || ssrv.gdur) == (0 || null)) {
        ssrv.wstart = 0; // init
        ssrv.gstart = 0; // for use to "fasten" hack 
        ssrv.wdur = 0; // get duration of weaken and grow and run hack if
        ssrv.gdur = 0; // it's time will be executed after each of them will end
      }
    }
  };

  // filter for non-owned servers
  function nos() {
    let owned_servers = ["home", ns.getHostname];
    ns.getPurchasedServers().map(gps => owned_servers.push(gps));
    return allServers(ns).filter(asf => ns.hasRootAccess(asf) && owned_servers.indexOf(asf) < 0)
  }

  // filter for non-owned servers with maxmoney > 0 ("target server")
  function nots() {
    return nos().filter(nf => ns.getServerMaxMoney(nf) > 0)
      .map(nfm => { return { name: nfm, values: ns.getServer(nf), } })
  }

  // another filter, non-owned, with ram >= 2, for use in use_non_owned
  function nors() {
    return nos().filter(nf => ns.getServerMaxRam(nf) >= 2)
  }
  // calculate  process_lists used threads for specific script and arguments, return it for further calculation
  function calculateThreads(sservps, script, arg) {
    if (sservps.length > 0) {
      return sservps.process_list.filter(sf => sf.filename.indexOf(script) != -1 && sf.args.indexOf(arg) !== -1)
        .reduce((a, b) => a + (b.threads * sservps.values.cpuCores), 0)
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
    return Math.floor((sserv.values.maxRam - sserv.cur_ram) / script_size)
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
  let cur_host = ns.getHostname();
  await ns.wget("https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/grow_server.script", sgname, cur_host);
  await ns.wget("https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/weaken_server.script", swname, cur_host);
  await ns.wget("https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/hack_server.script", shname, cur_host);
  async function copy_files() {
    for (var srvscp of script_servers) {
      if (srvscp != cur_host) { // ignore current server for copy, bc scripts are already existent
        await ns.scp([sgname, swname, shname], cur_host, srvscp.name);
        await ns.sleep(10)
      }
    }
  }
  await copy_files();
  // done copy ≡(▔﹏▔)≡

  update_RAM(); // initial calls
  update_process();

  ns.tprint("Starting automatic Grow/Weaken/Hack");
  ns.tprint("Values set on startup: \n Hacking " + arg.hack + "% of targets Server money.\nUse non-owned rooted servers as a Script-Server (enable with --use_non_owned ): " + arg.use_non_owned);
  ns.tprint("Servers used for running scripts:");
  ns.tprint(use_servers)
  ns.tprint("if --use_all_purchased is set, list will grow for every purchased server afterwards, except --ignore ones (read first lines for instruction) ");
  ns.tprint("Currently targetable Server (you can still nuke and they will be added later in run):");
  ns.tprint(nots());
  ns.tprint("\n\n Starting GWHCTRL on " + cur_host + " !! Keep-alives will be send as toast (bottom right notification!)")

  if (!arg.debug) { // disable logging for certain functions (if debug is false), i do spam them alot 😂
    ns.disableLog("getServerUsedRam");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("sleep");
    ns.disableLog("getServerMinSecurityLevel");
    ns.disableLog("getServerSecurityLevel");
    ns.disableLog("getServerMaxMoney");
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("exec")
  }

  let times = allServers().map(am => { return { name: am, values: ns.getServer(am), } })

  // Script-part (in loop)
  while (1) {
    for (t of times) {
      if ((t.wstart && t.gstart) == undefined) {
        t.wstart = 0;
        t.havail = false
      }
      t.wtime = ns.getWeakenTime(t.name)
    }
    if (arg.use_non_owned) {
      upd_ussrvr(); // includes if --use_all_purchased is set
      upd_ssrvr();
      await copy_files();
      update_RAM();
      update_process()
    }
    for (const tserv of nots()) {
      // first of fetching data
      let cur_mon = tserv.values.moneyAvailable;
      let max_mon = tserv.values.moneyMax * gperct;
      let g_multi = Math.ceil(max_mon / (cur_mon + 0.001));
      let cur_sec = tserv.values.hackDifficulty;
      let min_sec = tserv.values.minDifficulty
      let sgthreads = calculateThreads(script_servers.flat(), sgname, tserv.name);
      let grow_sec = ns.growthAnalyzeSecurity(sgthreads);
      // run a few if's
      if ((cur_sec + grow_sec) > min_sec) { // weaken the servers security-level to minimum (before grow)
        let wsuccess = true;
        while (wsuccess) {
          for (const ssrv of script_servers) {
            cur_sec = ns.getServerSecurityLevel(tserv.name); // re-update security (maybe a script on another server has finised)
            let nwthreads1c = Math.ceil(((cur_sec - min_sec) / ssrv.w_res) * ssrv.values.cpuCores); // Single-core, needed threads
            var time_update = times.filter(tf => tf.name == tserv.name)
            time_update.gstart = Date.now();
            time_update.havail = false; let nwthreadscc = Math.ceil((cur_sec - min_sec) / ssrv.w_res); // (if multi-core, otherwise it's the same as single)
            update_process();
            update_RAM();
            let swthreads = calculateThreads(script_servers.flat(), swname, tserv.name);
            let cwprocsr = threadSameArg(ssrv.process_list, swname, tserv.name);
            let mwthreads = nwthreads1c - swthreads;
            if (arg.debug) {
              ns.tprint(script_servers.map(sm => sm.process_list));
              ns.tprint("action: weaken");
              ns.tprint("ssrv: " + ssrv.name);
              ns.tprint("tserv: " + tserv.name);
              ns.tprint("f threads: " + threadPossible(ssrv, swname));
              ns.tprint("s threads: " + swthreads);
              ns.tprint("c procsr: " + cwprocsr);
              ns.tprint("n threads: " + nwthreads1c);
              ns.tprint("tserv: " + tserv + "  Cur_sec: " + cur_sec + " Min_sec: " + min_sec + " Wres: " + ssrv.w_res);
              ns.tprint("ssrv-data:  ");
              ns.tprint(ssrv)
            }
            if (nwthreads1c > 0 && mwthreads > 0 && !cwprocsr) {
              if (threadPossible(ssrv, swname) >= nwthreadscc) {
                start(wname, ssrv.name, nwthreadscc, tserv.name);
                ns.print("exec weaken, arg " + tserv + ", threads " + nwthreadscc + ", @ " + ssrv.name);
                var time_update = times.filter(tf => tf.name == tserv.name)
                time_update.wstart = Date.now();
                time_update.havail = true;
                ssrv.process_list.wstart = Date.now();
                wsuccess = false;
                await ns.sleep(1) // all threads used, end loop for targetserver
              }
              else if (threadPossible(ssrv, swname) >= 1 && threadPossible(ssrv, swname) < nwthreadscc) {
                var threads_cache = threadPossible(ssrv, swname);
                start(wname, ssrv.name, threadPossible(ssrv, swname), tserv.name);
                var time_update = times.filter(tf => tf.name == tserv.name)
                time_update.wstart = Date.now();
                time_update.havail = true;
                nwthreads1c -= threadPossible(ssrv, swname);
                update_process();
                var sswthreads = calculateThreads(script_servers.flat(), swname, tserv.name);
                ns.print("exec weaken, arg " + tserv.name + ", threads " + threads_cache + ", left: " + (nwthreads1c - sswthreads) + ", @ " + ssrv.name);
                await ns.sleep(1)
              }
              else if (threadPossible(ssrv, swname) == 0) {
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
              await ns.sleep(500)
            }
          }
        }
      }
      else if (max_mon * 0.99 >= cur_mon) { // grow with enough threads for possible MaxMoney on the Server
        let gsuccess = true;
        while (gsuccess) {
          for (const ssrv of script_servers) {
            cur_mon = ns.getServerMoneyAvailable(tserv.name); // recall on every script-server
            g_multi = Math.ceil(max_mon / (cur_mon + 0.001));
            cur_sec = ns.getServerSecurityLevel(tserv.name); // do call again, maybe an other grow had finished
            let ngthreads1c = Math.ceil(ns.growthAnalyze(tserv.name, g_multi, 1));
            let ngthreads = Math.ceil(ngthreads1c / ssrv.values.cpuCores);
            update_process();
            update_RAM();
            sgthreads = calculateThreads(script_servers.flat(), sgname, tserv.name);
            let cgprocsr = threadSameArg(ssrv.process_list, sgname, tserv.name);
            let mgthreads = ngthreads1c - sgthreads;
            if (arg.debug) {
              ns.tprint(script_servers.map(sm => sm.process_list));
              ns.tprint("action: grow");
              ns.tprint("ssrv: " + ssrv.name);
              ns.tprint("tserv: " + tserv.name);
              ns.tprint("f threads: " + threadPossible(ssrv, sgname));
              ns.tprint("s threads: " + sgthreads);
              ns.tprint("c procsr: " + cgprocsr);
              ns.tprint("n threads: " + ngthreads);
              ns.tprint("tserv: " + tserv.name + "  Cur_mon: " + cur_mon + " Max_mon: " + max_mon + " Cur_sec: " + cur_sec);
              ns.tprint("ssrv-data:  ");
              ns.tprint(ssrv)
            }
            if (ngthreads > 0 && mgthreads > 0 && !cgprocsr) {
              if (cur_sec >= 60 || cur_mon >= (max_mon * 0.999)) {
                gsuccess = false // escape the grow, do some weaken before!
              }
              else if (threadPossible(ssrv, sgname) >= ngthreads) {
                start(gname, ssrv.name, ngthreads, tserv.name);
                var time_update = times.filter(tf => tf.name == tserv.name)
                time_update.havail = false;
                ns.print("exec grow, arg " + tserv.name + ", threads " + ngthreads + ", @ " + ssrv.name);
                ssrv.process_list.wstart = Date.now();
                gsuccess = false;
                await ns.sleep(20)
              }
              else if (threadPossible(ssrv, sgname) >= 1 && threadPossible(ssrv, sgname) < ngthreads) {
                var threads_cache = threadPossible(ssrv, sgname);
                start(gname, ssrv.name, threadPossible(ssrv, sgname), tserv.name);
                var time_update = times.filter(tf => tf.name == tserv.name)
                time_update.havail = false;
                ngthreads -= threadPossible(ssrv, sgname);
                update_process();
                var ssgthreads = calculateThreads(script_servers.flat(), sgname, tserv.name);
                ns.print("exec grow, arg " + tserv.name + ", threads " + threads_cache + ", left: " + (ngthreads1c - ssgthreads) + ", @ " + ssrv.name);
                await ns.sleep(20)
              }
              else if (threadPossible(ssrv, sgname) == 0) {
                await ns.sleep(1)// skip the current ssrv bc no free threads
              }
              else {
                ns.alert("Debug:\nYou should'nt be here. Try run again with argument --debug");
                ns.exit()
              }
            }
            else if (mgthreads <= 0) {
              gsuccess = false;
              await ns.sleep(1) // skip that targetserver
            }
            else {
              await ns.sleep(1)
            }
          }
        }
      }
      let current_time = Date.now();
      let times_server = times.filter(tf => tf.name == tserv.name);
      let hack_time = ns.getHackTime(tserv.name);
      if (times_server.havail == true && (current_time - hack_time) > times_server.wstart + times_server.wtime) { // run hack, if the highest timer will finish it's work
        let hsuccess = true;
        while (hsuccess) {
          for (const ssrv of script_servers) {
            let nhthreads = Math.ceil(ns.hackAnalyzeThreads(tserv.name, (cur_mon * hperct)));
            update_process();
            update_RAM();
            // magic hackmath!
            let shthreads = calculateThreads(script_servers.map(sm => sm.process_list).flat(), shname, tserv.name, ssrv);
            let chprocsr = threadSameArg(ssrv.process_list, shname, tserv.name);
            let mhthreads = nhthreads - shthreads;
            if (arg.debug) {
              ns.tprint(script_servers.map(sm => sm.process_list));
              ns.tprint("action: hack");
              ns.tprint("ssrv: " + ssrv.name);
              ns.tprint("tserv: " + tserv.name);
              ns.tprint("f threads: " + threadPossible(ssrv, shname));
              ns.tprint("s threads: " + shthreads);
              ns.tprint("c procsr: " + chprocsr);
              ns.tprint("n threads: " + nhthreads);
              ns.tprint("tserv: " + tserv.name + "\n sserv: ");
              ns.tprint(ssrv)
            }
            if (nhthreads > 0 && mhthreads > 0 && !chprocsr) {
              if (threadPossible(ssrv, shname) >= nhthreads) {
                start(hname, ssrv.name, nhthreads, tserv.name);
                ns.print("exec hack, arg " + tserv.name + ", threads " + nhthreads + ", @ " + ssrv.name);
                hsuccess = false;
                await ns.sleep(20)
              }
              else if (threadPossible(ssrv, shname) >= 1 && threadPossible(ssrv, shname) < nhthreads) {
                var threads_cache = threadPossible(ssrv, shname);
                start(hname, ssrv.name, threadPossible(ssrv, shname), tserv.name);
                nhthreads -= threadPossible(ssrv, shname);
                update_process();
                var sshthreads = calculateThreads(script_servers.map(sm => sm.process_list).flat(), shname, tserv.name, ssrv);
                ns.print("exec hack, arg " + tserv.name + ", threads " + threads_cache + ", left: " + (nhthreads - sshthreads) + ", @ " + ssrv.name);
                await ns.sleep(20)
              }
              else if (threadPossible(ssrv, shname) == 0) {
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
    await ns.sleep(10000); // wait 10 secs, before go through nots() again 😉
    ns.toast("GWHCtrl: Still alive!")
  }
}