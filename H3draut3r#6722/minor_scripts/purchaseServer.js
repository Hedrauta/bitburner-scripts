export async function main(ns) {
    function getLogBase(value, base) {
        return Math.log(value) / Math.log(base)
    }
    if (ns.args[0] != null) {
        if (ns.args[1] != null && Number.isInteger(ns.args[1]) && ns.args[1] >= 1) {
            const power = Math.pow(2, ns.args[1]);
            ns.purchaseServer(ns.args[0], power);

            let byte_arr = ["GB","TiB","PiB"]; // Geopbibye.... 1024 Brontobyte
        let byte_math = Math.floor(getLogBase(power, 1024));
        let poweri = power;
        if (byte_math >= 1) {
            poweri = power / Math.pow(1024, byte_math)
        }
        let byte = byte_arr[byte_math];
            
            ns.tprint("Purchased a new Server. Hostname: " + ns.args[0] + " and " + poweri + byte+" RAM")
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