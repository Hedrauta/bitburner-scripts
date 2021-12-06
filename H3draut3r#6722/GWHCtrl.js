/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("scan"); // there are alot... and kind of annoying ;)


  let arg = ns.flags([ // options to add as a flag (--hack % , --use_home, --use_all_purchased , --use_non_owned , --ignore (special ussage) )
    ['hack', 1], // hack-percentage of targets server money, run with argument "--hack *integer*" (>=1 && <=100)
    ['ignore', []], // ingnored script servers, add for every purchased server "--ignore *hostname*" on run's argument
    ['use_home', false], // include home-server as a script-server
    ['use_non_owned', false], // use non-owned, rooted server as script-server, to enable, run with "--use_non_owned"
    ['use_all_purchased', true], // use of all purchased server (except ignored ones), to enable, run with "--use_all_purchased"
    // this will ignore --include
    ['grow_to', 100], // will grow the server to x% of targets max-money (for early-starts)
    ['debug', false]
  ]);
  let use_servers = [];


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
      use_servers = ns.getPurchasedServers().filter(ngf => arg.ignore.indexOf(ngf) == -1)
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
      .map(nfm => { return { name: nfm, values: ns.getServer(nfm), } })
  }

  // another filter, non-owned, with ram >= 2, for use in use_non_owned
  function nors() {
    return nos().filter(nf => ns.getServerMaxRam(nf) >= 2)
  }

  // calculate  process_lists used threads for specific script and arguments, return it for further calculation
  function calculateThreads(sservps, script, arg) {
    let cTc = 0;
    for (let srv of sservps) {
      let sp = srv.process_list;
      let sv = srv.values;
      if (sp.length > 0) {
        let ctThreads = sp.filter(spf => spf.filename.indexOf(script) != -1 && spf.args.indexOf(arg) != -1)
          .reduce((a, b) => a + b.threads, 0);
        ctThreads /= (1 + ((sv.cpuCores - 1) / 16));
        cTc += Math.ceil(ctThreads)
      }
    }
    return cTc
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
  // for .padStart on values in ns.print
  function pad(num, padlen, padchar) {
    var pad_char = typeof padchar !== 'undefined' ? padchar : ' ';
    var pad = new Array(1 + padlen).join(pad_char);
    return (pad + num).slice(-pad.length);
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
        await ns.sleep(1)
      }
    }
  }
  await copy_files();
  // done copy ≡(▔﹏▔)≡

  update_RAM(); // initial calls
  update_process();
  let on = "✅";
  let off = "⛔";
  function aSign (a){
    if (a){
      return on
    }
    else{
      return off
    }
  }
  ns.tprint("Starting automatic Grow/Weaken/Hack");
  ns.tprint("Values set on startup:"+
    "\n    Hacking " + arg.hack + "% of targets Server money."+
    "\n    Use home as a Script-Server ( enable with --use_home )" + aSign(arg.use_home) +
    "\n    Use non-owned rooted servers as a Script-Server (enable with --use_non_owned ): " + aSign(arg.use_non_owned) + 
    "\n    Grow up to " + arg.grow_to + "% of targets max money");
  ns.tprint("INFO: Starting GWHCTRL on " + cur_host)
  ns.disableLog("getServerUsedRam");
  if (!arg.debug) { // disable logging for certain functions (if debug is false), i do spam them alot 😂
    ns.disableLog("getServerMaxRam");
    ns.disableLog("sleep");
    ns.disableLog("getServerMinSecurityLevel");
    ns.disableLog("getServerSecurityLevel");
    ns.disableLog("getServerMaxMoney");
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("exec");
    ns.disableLog("scp")
  }

  let times = allServers(ns).map(am => { return { name: am } });
  // Script-part (in loop)
  while (1) {
    for (let t of times) {
      if ((t.wstart && t.gstart) == undefined) {
        t.wstart = 0;
        t.havail = false
      }
      t.wtime = ns.getWeakenTime(t.name)
    }
    upd_ussrvr(); // includes if --use_all_purchased or --use_non_owned is set
    upd_ssrvr();
    await copy_files();
    for (let tserv of nots()) {
      update_RAM();
      script_servers.sort((a,b)=> a.cur_ram - b.cur_ram)
      for (let scsrv of script_servers) {
        // updating script-servers
        update_process();

        // fetching a lot of data ++ redo on every script server
        let current_money = ns.getServerMoneyAvailable(tserv.name); // Targets Server Current money 
        let max_money = tserv.values.moneyMax * gperct; // Targets Server Maximum money * grow to X % ... fixed value * mult
        let grwth_multi = Math.ceil(max_money / (current_money + 0.001)); // Targets Server 'Growth-multiplikator' 
        let current_security = ns.getServerSecurityLevel(tserv.name); // Targets Server current security
        let min_security = tserv.values.minDifficulty; // Targets Server minimum security ... fixed value
        let grw_security = 0; // init
        let sgt = calculateThreads(script_servers, sgname, tserv.name); // sum of growing threads for argument of target server (single-core)
        let swt = calculateThreads(script_servers, swname, tserv.name); // sum of weakning threads "" ""
        let sht = calculateThreads(script_servers, shname, tserv.name); // sum of hack threads "" ""
        if (sgt > 0) {  // if process_list isn't empty, calculate "grow of security"
          grw_security = ns.growthAnalyzeSecurity(sgt)
        }
        let sacwpr = threadSameArg(scsrv.process_list, swname, tserv.name); // *s*ame *a*rgument on *c*urrent servers *w*eaken *p*rocess *r*unning
        let sacgpr = threadSameArg(scsrv.process_list, sgname, tserv.name); // ...
        let sachpr = threadSameArg(scsrv.process_list, shname, tserv.name); // ......
        let ncswt = Math.ceil((current_security - min_security) / scsrv.w_res); // needed current script-servers weaken-threads 
        let ncwt = Math.ceil(ncswt / (1 + ((scsrv.values.cpuCores - 1) / 16))); // needed single-core threads (if purchased servers will ever get multicore)
        let ncsgt = Math.ceil(ns.growthAnalyze(tserv.name, grwth_multi, scsrv.values.cpuCores)); // same as before, just for grow
        let ncgt = Math.ceil(ncsgt / (1 + ((scsrv.values.cpuCores - 1) / 16))); //
        let ncsht = Math.ceil(ns.hackAnalyzeThreads(tserv.name, (current_money * hperct))); // needed threads, for X% of targets server money
        let mwt = ncwt - swt; // missing weaken threads
        let mgt = ncgt - sgt;
        let mht = ncsht - sht;
        let sctp = threadPossible(scsrv, swname); // script-servers possible threads for weaken/grow
        let hcsctp = threadPossible(scsrv, shname); // "" for hack (it's 0.05GB less in size);
        let time_update = times.filter(tf => tf.name == tserv.name);
        // should be enough for now

        // run weaken first
        if ((current_security + grw_security) > min_security && mwt > 0 && !sacwpr) {
          if (sctp <= 0 || mwt <= 0) {
            await ns.sleep(1) // do nothing, bc there are no free threads on the script-server
          }
          else if (sctp >= mwt) {
            start(wname, scsrv.name, mwt, tserv.name);
            ns.print( "➡🔒🔽".padEnd(8) +"@" + scsrv.name + "\n 🔑:" + tserv.name.padEnd(20) + "📲:" + pad(mwt, 5));
            time_update.wstart = Date.now();
            time_update.havail = true;
            await ns.sleep(1) // prevent freeze
          }
          else if (mwt > sctp) {
            start(wname, scsrv.name, sctp, tserv.name);
            ns.print ("➡🔒🔽".padEnd(8) +"@" + scsrv.name + "\n 🔑:" + tserv.name.padEnd(20) + "📲:" + pad(sctp, 5) + " 📵:" + pad((ncwt - sctp), 5));
            await ns.sleep(1)
          }
          if (sctp > 0) {
            update_RAM(); // update ram & sctp for grow if we started any threads 
            sctp = threadPossible(scsrv, swname)
          }
        }

        // run grow if needed
        if (current_money < max_money && mgt > 0 && !sacgpr) {
          if (sctp <= 0 || mgt <= 0) {
            await ns.sleep(1) // 
          }
          else if (sctp >= mgt) {
            start(gname, scsrv.name, mgt, tserv.name);
            ns.print("➡💰💹".padEnd(8) + "@" + scsrv.name + "\n 🔑:" + tserv.name.padEnd(20) + "📲:" + pad(mgt, 5));
            time_update.havail = false;
            await ns.sleep(1)
          }
          else if (mgt > sctp) {
            start(gname, scsrv.name, sctp, tserv.name);
            ns.print("➡💰💹".padEnd(8) + "@" + scsrv.name + "\n 🔑:" + tserv.name.padEnd(20) + "📲:" + pad(sctp, 5) + " 📵:" + pad((ncgt - sctp), 5));
            time_update.havail = false;
            await ns.sleep(1)
          }
          if (sctp > 0) {
            update_RAM(); // update ram & sctp for hack if we started any threads 
            hcsctp = threadPossible(scsrv, shname); //  for hack (it's 0.05GB less in size);
          }
        }

        // get times asap, bc weaken/grow could cost some
        let current_time = Date.now();
        let hack_time = ns.getHackTime(tserv.name);
        // run hack, if its in time of ending grow or servers are already at grow-percentage
        if (!sachpr && ((time_update.havail == true && (current_time - hack_time) > time_update.wstart + time_update.wtime) || (current_security <= min_security && current_money >= max_money))) {
          if (hcsctp <= 0 || mht <= 0) {
            await ns.sleep(1)
          }
          else if (hcsctp >= mht) {
            start(hname, scsrv.name, mht, tserv.name);
            ns.print("➡💱".padEnd(8) + "@" + scsrv.name + "\n 🔑:" + tserv.name.padEnd(20) + "📲:" + pad(mht, 5));
            time_update.havail = false;
            await ns.sleep(1)
          }
          else if (mht > hcsctp) {
            start(hname, scsrv.name, hcsctp, tserv.name);
            ns.print("➡💱".padEnd(8) + "@" + scsrv.name + "\n 🔑:" + tserv.name.padEnd(20) + "📲:" + pad(hcsctp, 5) + " 📵:" + pad((ncsht - hcsctp),5));
            await ns.sleep(1)
          }
        } // end if hack
      } // end for scsrc
    } // end for tserv
    await ns.sleep(1) // go back to while-start asap
  } // end while
} // EOL