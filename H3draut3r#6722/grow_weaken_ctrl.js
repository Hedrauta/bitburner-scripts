/** @param {NS} ns **/
export async function main(ns) {
  const script_servers = [
    {
      name: "32TiB_1",
      free_threads: 0 // init
    },
    {
      name: "32TiB_2",
      free_threads: 0 // init
    },
    {
      name: "32TiB_3",
      free_threads: 0 // init
    }
  ];
  // update ram & pos_threads
  const script_size = 1.75;
  for (var srv_key in script_servers) {
    const ramsrv = script_servers[srv_key];
    ramsrv.max_ram = ns.getServerMaxRam(ramsrv.name);
    ramsrv.pos_threads = Math.floor(ramsrv.max_ram / script_size)
  };

  // copy grow/weaken-scripts on the working servers
  await ns.wget("https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/grow_server.script", "/ctrl/grow_server.script", ns.gethostname);
  await ns.wget("https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/weaken_server.script", "/ctrl/weaken_server.script", ns.gethostname);
  for (var copy_key in script_servers) {
    const srvscp = script_servers[copy_key];
    await ns.scp(["/ctrl/grow_server.script", "/ctrl/weaken_server.script"], ns.getHostname(), srvscp.name)
  }
  // done copy ≡(▔﹏▔)≡


  // initialise servers which are not owned or "home" (credits to Pwnzerfaust, Azirale & Kozd)

  // start fetching all server in range of home. filter for owned ones, and do depth-scanning/filter
  const ignoredServers = ["home", "CSEC", "darkweb"]; // do not have money, will never generate
  const homeServers = ns.scan("home");
  const myServers = ns.getPurchasedServers();
  const D0Servers = homeServers.filter(hmuf => !myServers.includes(hmuf) && hmuf != "home" && hmuf != "CSEC" && hmuf != "darkweb");
  const targetServer = D0Servers; // list of "targetable" Servers
  const D1Servers = D0Servers.flatMap(d1uf => ns.scan(d1uf))
    .filter(d1f => !targetServer.includes(d1f) && d1f != "home" && d1f != "CSEC" && d1f != "darkweb");
  D1Servers.map(d1fs => targetServer.push(d1fs));
  const D2Servers = D1Servers.flatMap(d2uf => ns.scan(d2uf))
    .filter(d2f => !targetServer.includes(d2f) && d2f != "home" && d2f != "CSEC" && d2f != "darkweb");
  D2Servers.map(d2fs => targetServer.push(d2fs));



  async function update_servers() {
    for (var srv of script_servers) {
      srv.active_threads = 0;
      srv.process_list = ns.ps(srv.name)
      for (var i = 0; i < (srv.process_list.length - 1); i++) {
        srv.active_threads += srv.process_list[i].threads
      }
      srv.free_threads = srv.pos_threads - srv.active_threads
    }
  };

  update_servers();
  // Script-part (in loop)
  const gname = "ctrl/grow_server.script";
  const sgname = "/ctrl/grow_server.script";
  const wname = "ctrl/weaken_server.script";
  const swname = "/ctrl/weaken_server.script";
  while (1) {
    for (const tserv of targetServer) {
      if (ns.hasRootAccess(tserv)) {
        const cur_mon = ns.getServerMoneyAvailable(tserv);
        const max_mon = ns.getServerMaxMoney(tserv);
        const g_multi = Math.ceil(max_mon / (cur_mon + 0.01));
        let ng_threads = Math.ceil(ns.growthAnalyze(tserv, g_multi));
        if (max_mon * 0.99 >= cur_mon) { // grow with enough threads for MaxMoney on the Server
          let gsuccess = true;
          while (gsuccess) {
            for (const ssrv_key in script_servers) {
              const ssrv = script_servers[ssrv_key];
              const sprocs = script_servers.map(procs => procs.process_list);
              const sgthreads = sprocs.flat().filter(gpro => gpro.filename != undefined && (gpro.filename || "").indexOf(sgname) != -1 && (gpro.args || []).indexOf(tserv) !== -1)
                .reduce((a, b) => a + b.threads, 0);
              const cgprocsr = ssrv.process_list.some(gpro => gpro.filename != undefined && (gpro.filename || "").indexOf(sgname) != -1 && (gpro.args || []).indexOf(tserv) !== -1);
              if (ng_threads > 0 && ng_threads - sgthreads > 0 && !cgprocsr) {
                if (ssrv.free_threads > ng_threads) {
                  ns.exec(gname, ssrv.name, ng_threads, tserv);
                  ng_threads = 0;
                  await update_servers();
                  gsuccess = false
                }
                else if (ssrv.free_threads > 1 && ssrv.free_threads < ng_threads) {
                  ns.exec(gname, ssrv.name, ssrv.free_threads, tserv);
                  ng_threads -= ssrv.free_threads;
                  await update_servers()
                }
                else {
                  ns.tprint("GWCTRL: How?") // you should'nt be here
                }
              }
              else if ((ng_threads - sgthreads) <= 0) {
                gsuccess = false // skip that targetserver
              }
              else {
                ns.tprint("GWCTRL: Server" + ssrv.name + " not free to grow " + tserv + " . Updating Servers, try again");
                await ns.sleep(5000);
                await update_servers()
              }
            }
          }
        }
        else { // server reached 99% of MaxMoney else weaken with enough threads for HackCTRL (WIP)
          let nwthreads = Math.ceil((ns.getServerSecurityLevel(tserv) - ns.getServerMinSecurityLevel(tserv)) * 20);
          let wsuccess = true;
          while (wsuccess) {
            for (const ssrv_key in script_servers) {
              const ssrv = script_servers[ssrv_key];
              const sprocs = script_servers.map(procs => procs.process_list);
              const swthreads = sprocs.flat().filter(wpro => wpro.filename != undefined && (wpro.filename || "").indexOf(swname) != -1 && (wpro.args[0] || []).indexOf(tserv) != -1)
                .reduce((a, b) => a + b.threads, 0);
              const cwprocsr = ssrv.process_list.some(wpro => wpro.filename != undefined && (wpro.filename || "").indexOf(swname) != -1 && (wpro.args[0] || []).indexOf(tserv) != -1);
              if (nwthreads > 0 && nwthreads - swthreads > 0 && !cwprocsr) {
                if (ssrv.free_threads > nwthreads) {
                  ns.exec(wname, ssrv.name, nwthreads, tserv);
                  nwthreads = 0;
                  await update_servers();
                  wsuccess = false // all threads used, end loop for targetserver
                }
                else if (ssrv.free_threads > 1 && ssrv.free_threads < nwthreads) {
                  ns.exec(wname, ssrv.name, ssrv.free_threads, tserv);
                  nwthreads -= ssrv.free_threads;
                  await update_servers()
                }
                else {
                  ns.tprint("GWCTRL: Again?") // or here
                }
              }
              else if ((nwthreads - swthreads) <= 0) {
                wsuccess = false // skip that targetserver
              }
              else {
                ns.tprint("GWCTRL: Server" + ssrv.name + " not free to weaken " + tserv + " . Updating Servers and try again");
                await ns.sleep(5000);
                await update_servers()
              }
            }
          }
        }
      };
    }
    await ns.sleep(15000);
    ns.tprint("GWCTRL: Still alive!");
    await update_servers()
  }
}