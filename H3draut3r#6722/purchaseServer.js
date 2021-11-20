export async function main(ns) {
    if (ns.args[0] != null) {
        if (ns.args[1] != null && Number.isInteger(ns.args[1]) && ns.args[1] >= 1) {
            const power = Math.pow(2, ns.args[1]);
            let byte = "GB";
            if (power >= 1024) {
                byte = "TiB";
                power /= 1024
            }
            ns.purchaseServer(ns.args[0], power);
            ns.tprint("Purchased a new Server. Hostname: " + ns.args[0] + " and " + power + byte+" RAM")
        }
        else {
            ns.tprint("Second Argument missing or wrong");
            ns.tprint("Proper Use: run %filename %hostname %integer ");
            ns.tprint("% integer has to be the log of estimated size ((2^ >>5<< ) = 32GB) ")
        }
    }
    else {
        ns.tprint("Arguments missing");
    }
}