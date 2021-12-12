/** @param {NS} ns **/
let scchelperfile = "/ctrl/ctrl_helper.js"
export async function startup(ns) {
    let cur_host = ns.getHostname();
    await ns.wget("https://raw.githubusercontent.com/Hedrauta/bitburner-scripts/master/H3draut3r%236722/weaken_grow_ctrl_scripts/ctrl_helper.js", scchelperfile, cur_host)
}
startup();
import * as ccHelper from scchelperfile;
// as long as i don't have a solution for everything, i need to define the current solutions
let solveable = ['Generate IP Addresses','Spiralize Matrix','Unique Paths in a Grid I','Unique Paths in a Grid II','Minimum Path Sum in a Triangle']
export async function main(ns) {
    let cc_servers = ccHelper.allServers(ns).map(am => { return { name: am, ccLs: ns.ls(am, ".cct") } });
    let fail = false;
    while (!fail) {
        for (var ccServer of cc_servers) {
            if (ccServer.ccLs.length > 0) {
                for (ccFile of ccServer.ccLs) {
                    let ccType = ns.codingcontract.getContractType(ccFile, ccServer);
                    let ccData = ns.codingcontract.getData(ccFile, ccServer);
                    if (solveable.some(t => t = ccType)) {
                        if(ccType = solveable[0]) {
                            let ccResult = ccHelper.generateIPs(ccData);
                            let ccTry = ns.codingcontract.attempt(ccResult, ccFile, ccServer, {returnReward: true});
                            if (ccTry == null || ccTry =="") {
                                fail = true;
                                ns.tprint("WARNING: Failed Contract Type: "+ccType+" @"+ccServer+
                                "\nData from Contract: "+ccData+
                                "\nResult from Solver: "+ccResult)
                            }
                            else {
                                ns.tprint("INFO: @"+ccServer+" Contract successful."+
                                "\n Reward: "+ccTry)
                            }
                        }
                    }
                }
            }
        }
    }

}
/* list of fetched types on my game
[ 'Algorithmic Stock Trader II',
 'Algorithmic Stock Trader III',
 'Algorithmic Stock Trader IV',
 'Array Jumping Game',
 'Find All Valid Math Expressions',
 'Find Largest Prime Factor',
 'Generate IP Addresses',
 'Merge Overlapping Intervals',
 'Minimum Path Sum in a Triangle',
 'Sanitize Parentheses in Expression',
 'Spiralize Matrix',
 'Subarray with Maximum Sum',
 'Total Ways to Sum',
 'Unique Paths in a Grid I',
 'Unique Paths in a Grid II' ]
 */