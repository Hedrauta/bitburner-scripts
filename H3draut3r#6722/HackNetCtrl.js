/** @param {NS} ns **/
export async function main(ns) {
	// basic buying first (if the cost doesn't exceed a set percentage amount of current money, do upgrade)

	let arg = ns.flags([ // options to add as a flag
		['use', 10], // if n % of players money doesnt exceed the cost of upgrading level/ram/cores, it will buy it
		// can be overwritten by --use n (n % of players money)
        ['debug', false] // for debug-use
	]);
	let nhn = ns.hacknet // saves Ram <.<
	//check if --use is not a invalid number (0 or >100) and do exit if so
	if (arg.use == 0 || arg.use > 100) {
		ns.tprint("--use can be oney a number above 0 or lower equals 100");
		ns.exit()
	}
	//now pack every call, that i will need, into functions, to return its value
    let player = ns.getPlayer(); // also for use in debug
	function umoney() {
		return (ns.getPlayer().money * (arg.use / 100))
	}
	function getRamCosts(index) {
		return nhn.getRamUpgradeCost(index, 1)
	}
	function getCoreCosts(index) {
		return nhn.getCoreUpgradeCost(index, 1)
	}
	function getLevelCosts(index) {
		return nhn.getLevelUpgradeCost(index, 1)
	}
	function getNodeCost() {
		return nhn.getPurchaseNodeCost()
	}
	function nodect() {
		return nhn.numNodes()
	}

	ns.disableLog("sleep"); // idc about sleep
	ns.tprint("Starting HackNetCtrl with "+arg.use+"%")
	while (1) { // yay, infinite run again!
        let index = 0
		if (arg.debug) {ns.print("Current money"+player.money)}
		
		if (getNodeCost() <= umoney()) {
			nhn.purchaseNode(); // buy a possible node before upgrading 😜
            ns.print("Bought a Node")
		}
		if (arg.debug) {
			ns.print(getNodeCost() <= umoney())
			ns.print("nodecost: "+getNodeCost()+"  umoney: "+umoney() )
			ns.print("Current count of nodes: "+(nodect()+1));
			ns.print(index)
		}
		
		for (; index < nodect(); index++) {
            let node_stat = nhn.getNodeStats(index);
            if (arg.debug) {ns.print("Check for buyable upgrades at "+node_stat.name+" with "+umoney()+" money")}
			
			if (getLevelCosts(index) <= umoney() && node_stat.level < 200) {
				nhn.upgradeLevel(index, 1);
                ns.print("Bought 1 Level at hacknet-node-"+index)
			}
			else if (getRamCosts(index) <= umoney() && node_stat.ram < 64) {
				nhn.upgradeRam(index, 1);
                ns.print("Bought 1 RAM at hacknet-node-"+index)
			}
			else if (getCoreCosts(index) <= umoney() && node_stat.cores < 16 ) {
				nhn.upgradeCore(index, 1);
                ns.print("Bought 1 Core at hacknet-node-"+index)
			}
		}
		await ns.sleep(20)
	}
}