/** @param {NS} ns **/
export async function main(ns) {
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
    // filter for non-owned ones
    function nos() { // ignore home and purchased server
        let owned_servers = ["home"];
        ns.getPurchasedServers().map(gps => owned_servers.push(gps)); 
        return allServers(ns).filter(asf => owned_servers.indexOf(asf) < 0)
    }

    // search on every server
    // first, empty entry for better clearance
    ns.tprint("");
    for (let server of nos()) {
        let server_ls = ns.ls(server, ".cct")
        if (server_ls.length >= 1) {
            ns.tprint("Found " + server_ls.length + " Coding Contracts on " + server + " : " + server_ls)
        }
    }
}