export async function main(ns) {
    if (ns.args[0] != null) {
        if (ns.args[1] != null && Number.isInteger(ns.args[1]) && ns.args[1]%2==0) {
            ns.purchaseServer(ns.args[0], ns.args[1]);
            ns.tprint("Purchased a new Server. Hostname: "+ns.args[0]+" and "+ns.args[1]+"GB RAM")
        }
        else {
            ns.tprint("Second Argument missing or wrong (Integer, Power of 2)");
            ns.tprint("Proper use of script: run purchaseServer.script %hostname %RAM");
        }
    }
    else {
        ns.tprint("First Argument missing, proper use of the script:");
        ns.tprint("run purchaseServer.script %hostname %RAM");
    }
}
