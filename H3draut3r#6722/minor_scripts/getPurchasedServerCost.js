export async function main(ns) {
    function getLogBase(value, base) {
        return Math.log(value) / Math.log(base)
    }
    if (ns.args[0] != null && Number.isInteger(ns.args[0])&&ns.args[0]>=1) {
        let power = Math.pow(2, ns.args[0]);
        let cost = ns.getPurchasedServerCost(power); // add a M if over 1 mill
        
        let byte_arr = ["GB","TiB","PiB","EiB","ZiB","YiB"]; // Geopbibye.... 1024 Brontobyte
        let byte_math = Math.floor(getLogBase(power, 1024));
        if (byte_math >= 1) {
            power /= Math.pow(1024, byte_math)
        }
        let byte = byte_arr[byte_math];
        
        let como_arr = ["","k","m","b","t","q","Q","s"];
        let como_math = Math.floor(getLogBase(cost, 1000));
        if (como_math >= 1) {
            cost /= Math.pow(1000, como_math)
        } // a sextillion should be enough xD
        let como = como_arr[como_math];
        
        ns.tprint("Costs for a new Server with "+power+byte+" RAM: "+cost+como);
    }
    else {
        ns.tprint("First Argument missing");
        ns.tprint("Proper Use: run %filename %integer ");
        ns.tprint("% integer has to be the log of estimated size ((2^ >>5<< ) = 32GB) ")
    }
}