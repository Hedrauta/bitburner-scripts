/** @param {NS} ns **/

let argsSchema = [ // options to add as a flag (--hack % , --useHome, --use_all_purchased , --useNonOwned , --ignore (special ussage) )
  ['hack', 1], // hack-percentage of targets server money, run with argument "--hack *integer*" (>=1 && <=100)
  ['ignore', []], // ingnored script servers, add for every purchased server "--ignore *hostname*" on run's argument
  ['useHome', false], // include home-server as a script-server
  ['useNonOwned', false], // use non-owned, rooted server as script-server, to enable, run with "--useNonOwned"
  ['usePurchased', true], // use of all purchased server (except ignored ones), to enable, run with "--use_all_purchased"
  // this will ignore --include
  ['useAll', false], // if true, it will override the previous use-flags
  ['growTo', 100], // will grow the server to x% of targets max-money (for early-starts)
  ['freeHome', 32], // how much free ram "home" will left of (so, at least n amount of RAMs GB will be keep free)
  ['debug', false]
]

export function autocomplete(data, args) {
  data.flags(argsSchema);
  return [];
}

export async function main(ns) {
  ns.disableLog("scan"); // there are alot... and kind of annoying ;)

  let arg = ns.flags(argsSchema);
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

  function doesExist(hostname, ns) {
    return ns.serverExists(hostname)
  }

  function upd_ussrvr(ns) { // special function for special use
    let use_servers = []
    if (arg.usePurchased || arg.useAll) {
      //   if true, use every purchased server (except home ofc)
      ns.getPurchasedServers().filter(nfg => arg.ignore.indexOf(nfg) == -1 && doesExist(nfg, ns)).map(ngfe => use_servers.push(ngfe))
    }
    if (arg.useHome || arg.useAll) {
      use_servers.push("home")
    }
    if (arg.useNonOwned || arg.useAll) {
      nors().map(nm => use_servers.push(nm)) // nors is every non-owned rooted server, with ram >= 2GB. function is below
    }
    return use_servers;
  }

  let script_servers = [];
  function upd_ssrvr(ns) { // function for later use (if use_all_purchased_ps is set true)
    script_servers = upd_ussrvr(ns).map(us => { return { name: us, values: ns.getServer(us) } });
  }
  upd_ssrvr(ns); // init call, because functions won't work for some reason 🤣

  // functions

  // get script_servers max and current ram (+ weaken-result for servers core)
  function update_RAM(ns) {
    for (var ramsrv of script_servers) {
      if (doesExist(ramsrv.name, ns)) {
        if (ramsrv.name == "home") {
          ramsrv.cur_ram = ns.getServerUsedRam(ramsrv.name) + arg.freeHome; // at least 25GB will be not used for home
        }
        else { ramsrv.cur_ram = ns.getServerUsedRam(ramsrv.name) };
        ramsrv.w_res = ns.weakenAnalyze(1, ramsrv.values.cpuCores)
      }
    }
    if (arg.debug) { console.log(script_servers) }
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
  function update_process(ns) {
    for (var srv of script_servers) {
      if (doesExist(srv.name, ns)) {
        srv.process_list = ns.ps(srv.name)
      }
    }
  };

  function rooted(hostname) {
    return ns.hasRootAccess(hostname)
  }

  // filter for non-owned servers
  function nos() {
    let owned_servers = ["home"];
    ns.getPurchasedServers().map(gps => owned_servers.push(gps));
    return allServers(ns).filter(asf => rooted(asf) && owned_servers.indexOf(asf) < 0)
  }

  // filter for non-owned servers with maxmoney > 0 ("target server")
  function nots() {
    return nos().filter(nf => (ns.getServerRequiredHackingLevel(nf) <= player(ns).hacking) && ns.getServerMaxMoney(nf) > 0)
      .map(nfm => { return { name: nfm, values: ns.getServer(nfm), } })
  }

  // another filter, non-owned, with ram >= 2, for use in useNonOwned
  function nors() {
    return nos().filter(nf => ns.getServerMaxRam(nf) >= 2)
  }

  // calculate  process_lists used threads for specific script and arguments, return it for further calculation
  function calculateThreads(sservps, script, arg) {
    let cTc = 0;
    for (let srv of sservps) {
      if (doesExist(srv.name, ns)) {
        let sp = srv.process_list;
        let sv = srv.values;
        if (sp.length > 0) {
          let ctThreads = sp.filter(spf => spf.filename.indexOf(script) != -1 && spf.args.indexOf(arg) != -1)
            .reduce((a, b) => a + b.threads, 0);
          ctThreads /= (1 + ((sv.cpuCores - 1) / 16));
          cTc += Math.ceil(ctThreads)
        }
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
  function threadPossible(sserv, script, ns) {
    if (arg.debug) { console.log(sserv, script) }
    let script_size = 1.75;
    if (script == shname) {
      script_size = 1.7
    }
    update_RAM(ns);
    return Math.floor((sserv.values.maxRam - sserv.cur_ram) / script_size)
  }
  // execute script with threads (save some ram 😉)
  function start(script, host, threads, arg, ns) {
    ns.exec(script, host, threads, arg)
  }
  // for .padStart on values in ns.print
  function pad(num, padlen, padchar) {
    var pad_char = typeof padchar !== 'undefined' ? padchar : ' ';
    var pad = new Array(1 + padlen).join(pad_char);
    return (pad + num).slice(-pad.length);
  }
  function player(ns) {
    return ns.getPlayer()
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

  update_RAM(ns); // initial calls
  update_process(ns);
  let on = "✅";
  let off = "⛔";
  function aSign(a) {
    if (a) {
      return on
    }
    else {
      return off
    }
  }
  ns.tprint("Starting automatic Grow/Weaken/Hack");
  ns.tprint("Values set on startup:" +
    "\n".padEnd(6) + aSign(arg.useHome || arg.useAll).padEnd(2) + "Use home as a Script-Server ( enable with --useHome )" +
    "\n".padEnd(6) + aSign(arg.useNonOwned || arg.useAll).padEnd(2) + "Use non-owned rooted servers as a Script-Server (enable with --useNonOwned ): " +
    "\n".padEnd(4) + "🔒🔽".padEnd(5) + "Always Weaken Target-Server to minimum Security" +
    "\n".padEnd(4) + "💰💹".padEnd(5) + "Grow up to " + arg.grow_to + "% of targets max money" +
    "\n".padEnd(6) + "💱".padEnd(3) + "Hacking " + arg.hack + "% of targets Server money.");
  ns.tprint("INFO: Starting GWHCTRL on " + cur_host)
  ns.disableLog("getServerUsedRam");
  ns.disableLog("getServerMaxRam");
  ns.disableLog("sleep");
  ns.disableLog("getServerMinSecurityLevel");
  ns.disableLog("getServerSecurityLevel");
  ns.disableLog("getServerMaxMoney");
  ns.disableLog("getServerMoneyAvailable");
  ns.disableLog("exec");
  ns.disableLog("scp");
  ns.disableLog("getServerRequiredHackingLevel")

  let times = allServers(ns).map(am => { return { name: am } });
  // Script-part (in loop)
  function removeEntry(entry, array) {
    var index = array.map(a=>a.name).indexOf(entry)
    if (index > -1) {
      array.splice(index, 1);
    }
  }
  while (true) {
    let oldServers = times.map(tm => tm.name).filter(tf => !allServers(ns).find(af => tf == af))
    let newServers = allServers(ns).filter(af => !times.map(tm => tm.name).filter(tf => af == tf))
    newServers.map(nm => times.push({name: nm}))
    oldServers.map(om => removeEntry(om, times))
    
    for (let t of times) {
      if ((t.wstart && t.gstart && t.hstart) == undefined) {
        t.wstart = t.gstart = t.hstart = 0;
        t.wavail = t.gavail = true
        t.havail = false
      }
      t.wtime = t.gtime = t.htime = 99999
      try {
      t.wtime = ns.getWeakenTime(t.name)
      t.gtime = ns.getGrowTime(t.name)
      t.htime = ns.getHackTime(t.name)
      } catch {}
    }
    upd_ussrvr(ns);
    upd_ssrvr(ns);
    await copy_files();
    for (let tserv of nots()) {
      let timing_array = times.filter(tf => tf.name == tserv.name)
      update_RAM(ns); // update RAM of script-server to sort them descending of free RAM
      script_servers.sort((a, b) => (b.values.maxRam - b.cur_ram) - (a.values.maxRam - a.cur_ram))
      for (let scsrv of script_servers) {
        // -.- .... it crashed... 🤔 i think, i have to check on almost everycall that  needs the scripts server... 🤔
        //init used variables ⤵
        let hcsctp, sctp, hackInProgressMoney, grwth_multi, grw_security, current_money, max_money, current_security, min_security, ncsgt, ncsht, ncswt, ncwt, ncgt, sht, sgt, swt, mht, mgt, mwt
        let sachpr, sacgpr, sacwpr
        // set init variables as 0
        hcsctp = ncsgt = sctp = hackInProgressMoney = grwth_multi = grw_security = current_money = max_money = current_security = min_security = ncsgt = ncsht = ncswt = ncwt = ncgt = sht = sgt = swt = mht = mgt = mwt = 0
        sachpr = sacgpr = sacwpr = true // set booleans, prevent on entering execution, will get updated
        try {
          update_RAM(ns)
          update_process(ns);
          //init-block ⤵
          
          current_money = ns.getServerMoneyAvailable(tserv.name); // Targets Server Current money 
          max_money = tserv.values.moneyMax * gperct; // Targets Server Maximum money * grow to X % ... fixed value * mult
          current_security = ns.getServerSecurityLevel(tserv.name); // Targets Server current security
          min_security = tserv.values.minDifficulty; // Targets Server minimum security ... fixed value
          sctp = threadPossible(scsrv, swname, ns); // script-servers possible threads for weaken/grow
          // values for hack ⤵
          sachpr = threadSameArg(scsrv.process_list, shname, tserv.name, ns); // same argument current hostname program running
          ncsht = Math.ceil(ns.hackAnalyzeThreads(tserv.name, (current_money * hperct))); // needed threads, for X% of targets server money
          sht = calculateThreads(script_servers, shname, tserv.name); // sum of hack threads on every server with same arg
          mht = ncsht - sht; // missing hack threads
          hcsctp = threadPossible(scsrv, shname, ns);
          // script-servers possible threads for for hack (it's 0.05GB less in size);
        if (arg.debug) { console.log("hack, +timing +sec + money", sachpr, timing_array, current_security, min_security, current_money, max_money) }
        // run hack, if its execution will end right after ending of last weaken and servers are already at grow-percentage
        if (!sachpr && ((timing_array.havail == true && (Date.now() >= (timing_array.wstart + timing_array.wtime - timing_array.htime))) || (current_security <= min_security && current_money >= max_money))) {
          // start if the targets money is at max and security at min, or time it by using the time_table
          if (hcsctp <= 0 || mht <= 0) {
            await ns.sleep(1)
          }
          else if (hcsctp >= mht) {
            start(hname, scsrv.name, mht, tserv.name, ns);
            ns.print("➡💱".padEnd(8) + "@" + scsrv.name + "\n" + "↪ 🔑:".padStart(10) + tserv.name.padEnd(20) + "📲:" + pad(mht, 5));
            timing_array.havail = false;
            timing_array.wavail = timing_array.gavail = true
            timing_array.hstart = Date.now() + 50
            await ns.sleep(1)
          }
          else if (mht > hcsctp) {
            start(hname, scsrv.name, hcsctp, tserv.name, ns);
            mht -= hcsctp
            ns.print("➡💱".padEnd(8) + "@" + scsrv.name + "\n" + "↪ 🔑:".padStart(10) + tserv.name.padEnd(20) + "📲:" + pad(hcsctp, 5) + " 📵:" + pad((mht), 5));
            await ns.sleep(1)
          }
        } // end if hack
          sctp = threadPossible(scsrv, swname, ns); // script-servers possible threads for weaken/grow
          let hackInProgressMoney = 0;
          if (sht > 0) {
            hackInProgressMoney = ns.hackAnalyze(tserv.name)
          }
          current_money = ns.getServerMoneyAvailable(tserv.name) - hackInProgressMoney; // Targets Server Current money 
          grwth_multi = Math.ceil(max_money / (current_money + 0.001)); // Targets Server 'Growth-multiplikator' 
          sgt = calculateThreads(script_servers, sgname, tserv.name); // sum of growing threads for argument of target server (single-core)
          sacgpr = threadSameArg(scsrv.process_list, sgname, tserv.name); // ...
          ncsgt = Math.ceil(ns.growthAnalyze(tserv.name, grwth_multi, scsrv.values.cpuCores)); // same as before, just for grow
          ncgt = Math.ceil(ncsgt / (1 + ((scsrv.values.cpuCores - 1) / 16))); //
          mgt = ncgt - sgt;

        if (arg.debug) { console.log("grow, Data: ", sctp, hackInProgressMoney, current_money, scsrv.max_money, grwth_multi, sgt, sacgpr, scsgt, ncgt, mgt) }
        // run grow if need to
        if (!sacgpr && (((timing_array.gavail && (Date.now() >= (timing_array.hstart + timing_array.htime - timing_array.gtime))) || (current_money < max_money && mgt > 0)))) {
          if (sctp <= 0 || mgt <= 0) {
            await ns.sleep(1) // 
          }
          else if (sctp >= mgt) {
            start(gname, scsrv.name, mgt, tserv.name, ns);
            ns.print("➡💰💹".padEnd(8) + "@" + scsrv.name + "\n" + "↪ 🔑:".padStart(10) + tserv.name.padEnd(20) + "📲:" + pad(mgt, 5));
            timing_array.gstart = Date.now() + 50
            timing_array.havail = timing_array.gavail = false;
            timing_array.wavail = true
            await ns.sleep(1)
          }
          else if (mgt > sctp) {
            start(gname, scsrv.name, sctp, tserv.name, ns);
            ncgt -= sctp
            ns.print("➡💰💹".padEnd(8) + "@" + scsrv.name + "\n" + "↪ 🔑:".padStart(10) + tserv.name.padEnd(20) + "📲:" + pad(sctp, 5) + " 📵:" + pad((mgt), 5));
            timing_array.havail = false;
            timing_array.wavail = true
            await ns.sleep(1)
          }
        } // end grow
          sctp = threadPossible(scsrv, swname, ns); // script-servers possible threads for weaken/grow  
          current_security = ns.getServerSecurityLevel(tserv.name); // Targets Server current security
          grw_security = 0; // init
          swt = calculateThreads(script_servers, swname, tserv.name); // sum of weakning threads "" ""
          if (sgt > 0) {  // if process_list isn't empty, calculate "grow of security"
            grw_security = ns.growthAnalyzeSecurity(sgt)
          }
          if (sht > 0) {
            grw_security += ns.hackAnalyzeThreads(scsrv.name, sht)
          }
          if (current_security + grw_security > 100) {
            current_security = 100
            grw_security = 0
          }
          sacwpr = threadSameArg(scsrv.process_list, swname, tserv.name); // *s*ame *a*rgument on *c*urrent servers *w*eaken *p*rocess *r*unning
          ncswt = Math.ceil((current_security - min_security) / scsrv.w_res); // needed current script-servers weaken-threads 
          ncwt = Math.ceil(ncswt / (1 + ((scsrv.values.cpuCores - 1) / 16))); // needed single-core threads (if purchased servers will ever get multicore)
          mwt = ncwt - swt; // missing weaken threads
        
        if (arg.debug) { console.log("weaken, Data: ", grw_security, swt, sacwpr, ncswt, ncwt, mwt) }
        // run weaken
        if (!sacwpr && ((timing_array.wavail && (Date.now >= timing_array.gstart + timing_array.gtime - timing_array.wtime)) || (current_security + grw_security) > min_security && mwt > 0)) {
          if (arg.debug) { console.log(sctp, mwt) }
          if (sctp <= 0 || mwt <= 0) {
            await ns.sleep(1) // do nothing, bc there are no free threads on the script-server
          }
          else if (sctp >= mwt) {
            start(wname, scsrv.name, mwt, tserv.name, ns);
            ns.print("➡🔒🔽".padEnd(8) + "@" + scsrv.name + "\n" + "↪ 🔑:".padStart(10) + tserv.name.padEnd(20) + "📲:" + pad(mwt, 5));
            timing_array.wstart = Date.now() + 50;
            timing_array.havail = true;
            await ns.sleep(1) // prevent freeze
          }
          else if (mwt > sctp) {
            start(wname, scsrv.name, sctp, tserv.name, ns);
            mwt -= sctp
            ns.print("➡🔒🔽".padEnd(8) + "@" + scsrv.name + "\n" + "↪ 🔑:".padStart(10) + tserv.name.padEnd(20) + "📲:" + pad(sctp, 5) + " 📵:" + pad((mwt), 5));
            await ns.sleep(1)
          }
        } // end for weaken 
        } // end of catch
        catch {ns.print("Server "+scsrv.name+" got removed when trying to run scripts on it")}
      } // end for scsrv
    } // end of tservd
    await ns.sleep(1) // bc no crash of while-loop, please!
  } // end while
} // EOL