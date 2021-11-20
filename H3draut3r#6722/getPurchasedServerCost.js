export async function main(ns) {
    if (ns.args[0] != null && Number.isInteger(ns.args[0])&&ns.args[0]>=1) {
        let power = Math.pow(2, ns.args[0]);
        let byte = "GB";
        if (power >= 1024) {
            byte = "TiB";
            power /= 1024
        }
        let cost = ns.getPurchasedServerCost(power);
        let como = ""; // add a M if over 1 mill
        if (cost > 1000000) {
            cost /= 1000000;
            como = "M"
        }
        ns.tprint("Costs for a new Server with "+power+byte+" RAM: "+cost+como);
    }
    else {
        ns.tprint("First Argument missing");
        ns.tprint("Proper Use: run %filename %integer ");
        ns.tprint("% integer has to be the log of estimated size ((2^ >>5<< ) = 32GB) ")
    }
}