/** @param {NS} ns **/
export async function main(ns) {
	const own_servers = ns.getPurchasedServers();
    if (ns.args[0]!= null && own_servers.includes(ns.args[0])) {
		ns.killall(ns.args[0]);
		ns.deleteServer(ns.args[0]);
		ns.tprint("Successfully removed Server: "+ns.args[0])
	}
	else {
		ns.tprint("No Name or name not in list of bought server")
	}
}