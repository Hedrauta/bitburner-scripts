/** @param {NS} ns **/
export async function main(ns) {


    // functions!!
    function curhlvl() {
        return ns.getHackingLevel()
    }
    function progs() {
        return ns.ls("home", ".exe")
    }
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
    function nos() {
        let owned_servers = ["home"];
        ns.getPurchasedServers().map(gps => owned_servers.push(gps))
        return allServers(ns).filter(asf => owned_servers.indexOf(asf) < 0)
    }
    // end functions, now an array for use in loop
    const pr = ["BruteSSH.exe", "FTPCrack.exe", "HTTPWorm.exe", "SQLInject.exe", "relaySMTP.exe"];
    // and deactivate logging for a few functions
    ns.disableLog("getServerRequiredHackingLevel");
    ns.disableLog("getServerNumPortsRequired");
    ns.disableLog("scan");
    ns.disableLog("sleep");
    ns.disableLog("getHackingLevel");
    while (1) { // i do really love this one 😂
        for (const server of nos()) { // for every server in the nos()-result
            if (!ns.hasRootAccess(server)) { // ignore rooted servers. can't run backdoor. Do it on your own...
                let info = ns.getServer(server);
                let nhlvl = ns.getServerRequiredHackingLevel(server); // self-explained function
                let nports = ns.getServerNumPortsRequired(server); // also self-explained

                if (nhlvl <= curhlvl()) { // if needed hacklevel smaller or equals current hacklevel
                    if (nports >= 1 && progs().indexOf(pr[0]) >= 0 && !info.sshPortOpen) { 
                        ns.brutessh(server); 
                        ns.print("BruteSSH successful at "+server);
                        nports-- 
                    }
                    else if(info.sshPortOpen){nports--}
                    
                    if (nports >= 1 && progs().indexOf(pr[1]) >= 0 && !info.ftpPortOpen) { 
                        ns.ftpcrack(server); 
                        ns.print();
                        nports-- 
                    }
                    else if(info.ftpPortOpen){nports--}
                    
                    if (nports >= 1 && progs().indexOf(pr[2]) >= 0 && !info.httpPortOpen) { 
                        ns.httpworm(server); 
                        nports-- 
                    }
                    else if(info.httpPortOpen){nports--}
                    
                    if (nports >= 1 && progs().indexOf(pr[3]) >= 0 && !info.sqlPortOpen) { 
                        ns.sqlinject(server); 
                        nports--
                    }
                    else if(info.sqlPortOpen){nports--}
                    
                    if (nports >= 1 && progs().indexOf(pr[4]) >= 0 && !info.smtpPortOpen) { 
                        ns.relaysmtp(server); 
                        nports-- 
                    }
                    else if(info.smtpPortOpen){nports--}
                    
                    if (nports <= 0) {
                        ns.nuke(server) //if not owning the necessary apps or did not open enough ports, it will retry next loop
                        ns.print("Nuked "+server)
                    }
                    
                    await ns.sleep(1) // because!
                }
            }
        }
        await ns.sleep(5000) // wait 5 secs before trying again
    }
}