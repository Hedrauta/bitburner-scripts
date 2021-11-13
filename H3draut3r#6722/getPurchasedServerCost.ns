export async function main(ns) {
    if (ns.args[0] != null && Number.isInteger(ns.args[0]) && ns.args[0]%2==0) {
        ns.tprint("Costs for a new Server with "+ns.args[0]+"GB RAM: "+ns.getPurchasedServerCost(ns.args[0]));
    }
    else {
        ns.tprint("First Argument missing, or invalid. Use only an Integer at power of 2 (2,4,8,16...)");
    }
}