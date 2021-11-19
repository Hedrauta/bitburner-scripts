var depth = 15; // depth of scanning targetable servers

/** @param {NS} ns **/
export async function main(ns) {
  let script_servers = [
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
  let script_size = 1.75;
  for (var srv_key in script_servers) {
    let ramsrv = script_servers[srv_key];
    ramsrv.max_ram = ns.getServerMaxRam(ramsrv.name);
    ramsrv.pos_threads = Math.floor(ramsrv.max_ram / script_size)
  };

  // copy grow/weaken-scripts on the working servers
  await ns.wget("https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/grow_server.script", "/ctrl/grow_server.script", ns.gethostname);
  await ns.wget("https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/weaken_server.script", "/ctrl/weaken_server.script", ns.gethostname);
  for (var copy_key in script_servers) {
    let srvscp = script_servers[copy_key];
    await ns.scp(["/ctrl/grow_server.script", "/ctrl/weaken_server.script"], ns.getHostname(), srvscp.name)
  }
  // done copy ≡(▔﹏▔)≡


  // initialise servers which are not owned or "home" (credits to Pwnzerfaust, Azirale & Kozd)

  // start fetching all server in range of home. filter for owned ones, and do depth-scanning/filter
  let ignoredServers = ["home", "CSEC", "darkweb"]; // rethink this one

  async function depthscan(scanlist, targetlist) {
    let depthlf = scanlist.flatMap(dssl => ns.scan(dssl))
                    .filter(dsufl => !targetlist.includes(dsufl) && ignoredServers.indexOf(dsufl) == -1 && ns.getServerMaxMoney(dsufl) > 0);
    depthlf.map(dsfl => targetlist.push(dsfl));
    scanlist = depthlf
  }
  
  let homeServers = ns.scan("home"); //init scan + 3
  let myServers = ns.getPurchasedServers();
  let D0Servers = homeServers.filter(hmuf => !myServers.includes(hmuf) && ignoredServers.indexOf(hmuf) == -1);
  let targetServer = D0Servers; // initialised list of "targetable" Servers at Depth0, now do depth-scan until depth ..... 15?
  for (i=0; i=depth; i++) {
    await depthscan(targetServer, targetServer)
  }
  

  

  
  let D1Servers = D0Servers.flatMap(d1uf => ns.scan(d1uf))
    .filter(d1f => !targetServer.includes(d1f) && d1f != "home" && d1f != "CSEC" && d1f != "darkweb");
  D1Servers.map(d1fs => targetServer.push(d1fs));
  let D2Servers = D1Servers.flatMap(d2uf => ns.scan(d2uf))
    .filter(d2f => !targetServer.includes(d2f) && d2f != "home" && d2f != "CSEC" && d2f != "darkweb");
  D2Servers.map(d2fs => targetServer.push(d2fs));

  async function update_servers() {
    for (var srv of script_servers) {
      srv.process_list = ns.ps(srv.name);
      srv.active_threads = srv.process_list.reduce((a, b) => a + b.threads, 0);
      srv.free_threads = srv.pos_threads - srv.active_threads
    }
  };
y
 update_servers();

  // Script-part (in loop)
  let gname = "ctrl/grow_server.script";
  let sgname = "/ctrl/grow_server.script";
  let wname = "ctrl/weaken_server.script";
  let swname = "/ctrl/weaken_server.script";
  while (1) {
    for (const tserv of targetServer) {
      if (ns.hasRootAccess(tserv)) {
        let cur_mon = ns.getServerMoneyAvailable(tserv);
        let max_mon = ns.getServerMaxMoney(tserv);
        let g_multi = Math.ceil(max_mon / (cur_mon + 0.001));
        let ng_threads = Math.ceil(ns.growthAnalyze(tserv, g_multi));
        if (max_mon * 0.99 >= cur_mon) { // grow with enough threads for MaxMoney on the Server
          let gsuccess = true;
          while (gsuccess) {
            for (const ssrv_key in script_servers) {
              let ssrv = script_servers[ssrv_key];
              let sprocs = script_servers.map(procs => procs.process_list);
              let sgthreads = sprocs.flat().filter(gpro => gpro.filename != undefined && (gpro.filename || "").indexOf(sgname) != -1 && (gpro.args || []).indexOf(tserv) !== -1)
                .reduce((a, b) => a + b.threads, 0);
              let cgprocsr = ssrv.process_list.some(gpro => gpro.filename != undefined && (gpro.filename || "").indexOf(sgname) != -1 && (gpro.args || []).indexOf(tserv) !== -1);
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
            for (const ssrv of script_servers) {
              let sprocs = script_servers.map(procs => procs.process_list);
              let swthreads = sprocs.flat().filter(wpro => wpro.filename != undefined && (wpro.filename || "").indexOf(swname) != -1 && (wpro.args[0] || []).indexOf(tserv) != -1)
                .reduce((a, b) => a + b.threads, 0);
              let cwprocsr = ssrv.process_list.some(wpro => wpro.filename != undefined && (wpro.filename || "").indexOf(swname) != -1 && (wpro.args[0] || []).indexOf(tserv) != -1);
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
                await ns.sleep(5000);
                await update_servers()
              }
            }
          }
        }
      };
    }
    await ns.sleep(15000);
    await update_servers()
  }
}