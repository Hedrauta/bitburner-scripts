/** @param {NS} ns **/
/** @param {import(".").NS } ns */
const argsSchema = [
    ['useMoneyPercentage', 100],// ( --useMoney n ) how much n% money from players will be used to upgrade/buy a new server.
    ['maxServersAmount', 25],   // ( --maxAmount n ) buy up to n Servers
    ['namePrefix', 'pserv'],    // ( --namePreFix *any* ) prefix of the servers name
    ['startAtRam', 32],         // ( --startAt n ) starting with n GB RAM of purchasing servers
    ['maxToRam', 1048576]       // ( -- maxToRam n ) will buy to n GB of ram (i advice about 32TB, because 25 Servers with 4096GB sure cost alot 😂)
]

export function autocomplete(data, args) {
    data.flags(argsSchema);
    return [];
}

const byteFormat = ["GB", "TiB", "PiB"]

function logBaseValue(base, value) {
    return Math.floor(Math.log(value) / Math.log(base))
}
function formatNumber(base, value) {
    return value / Math.pow(base, logBaseValue(base, value))
}
function isZero(index) {
    if (index == 0) {
        return 1
    }
    else { return index }
}
function allAtMaxRam(servers, maxRam, ns) {
    let trutharray = []
    if (servers.length == 0) {
        trutharray.push(false)
    }
    for (var srvr of servers) {
        let curRam = ns.getServerMaxRam(srvr)
        trutharray.push(curRam >= maxRam)
    }
    return trutharray.some(a => a == false)
}

function infDivideByValue(num, value) {
    let numc = JSON.parse(JSON.stringify(num))
    while (numc >= 1) {
        numc /= value
    }
    return numc
}

export async function main(ns) {
    ns.disableLog("ALL")
    ns.enableLog("purchaseServer")
    ns.enableLog("deleteServer")
    let pservers, player, currentRam;
    let option = ns.flags(argsSchema);
    if (infDivideByValue(option.startAtRam, 2) != 0.5) {
        let cache = 0
        for (var i = 1; cache <= option.startAtRam; i++) {
            cache = Math.pow(2, i)
        }
        ns.tprint(option.startAtRam + " is not a power of 2 or at least 2GB. Starting at the next greater value: " + cache + "GB")
        option.startAtRam = cache
    }
    if (infDivideByValue(option.maxToRam, 2) != 0.5) {
        let cache = 0
        for (var i = 1; cache <= option.maxToRam; i++) {
            cache = Math.pow(2, i)
        }
        if (cache > 1048576) {
            cache = 1048576
        }
        ns.tprint(option.maxToRam + " is not a valid value or higher than 2^20. Buying servers until: " + cache + "GB")
        option.maxToRam = cache
    }
    let buyPerc = option.useMoneyPercentage / 100
    let doItTwice = 0
    do {
        for (var i = 0; i < option.maxServersAmount; i++) {
            pservers = ns.getPurchasedServers();
            let server = pservers[i]
            player = ns.getPlayer()
            if (server != undefined) {
                currentRam = JSON.parse(JSON.stringify(ns.getServerMaxRam(server)))
            }
            if (server == undefined && (pservers[isZero(i) - 1] != undefined || i == 0)) {
                let cost = ns.getPurchasedServerCost(option.startAtRam)
                if (player.money * buyPerc > cost) {
                    var t = ns.purchaseServer(option.namePrefix + "-" + option.startAtRam + "GB", option.startAtRam) // example of a "new" bought : pserv-0-32GB
                    if (t == "") {
                        ns.print("WARNING: Failed to buy a new Server, you may not have enough money")
                    }
                }
            }
            else {
                if (server == undefined) { }
                else {
                    let nextRam = currentRam * 2
                    let ramSuffix = byteFormat[0]
                    if (nextRam >= 1024) {
                        ramSuffix = byteFormat[logBaseValue(1024, nextRam)]
                        nextRam = formatNumber(1024, nextRam)
                    }
                    if (currentRam != Math.pow(2, 20)) {
                        let cost = ns.getPurchasedServerCost(currentRam * 2)
                        if (player.money * buyPerc > cost) {
                            ns.killall(server)
                            var t = ns.deleteServer(server)
                            if (t == false) {
                                ns.print("WARNING: Not able to delete Server " + server + "\n There may be still running scripts")
                                ns.killall(server)
                            }
                            if (t == true) {
                                var u = ns.purchaseServer(option.namePrefix + "-" + nextRam + ramSuffix, currentRam * 2)
                                if (u == "") {
                                    ns.print("WARNING: Failed to buy an upgrade for Server" + server + ", you may not had enough money" +
                                        "\nIt will get rebought at 32GB and upgraded again")
                                }
                            }
                        }
                    }
                }
            }
        }
        await ns.sleep(100)
    } while (allAtMaxRam(pservers, option.maxToRam, ns) || doItTwice++ == 0);
}