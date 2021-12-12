/** @param {NS} ns **/

import * as ccHelper from "./ctrl_helper.js";
// as long as i don't have a solution for everything, i need to define the current solutions
let solveable = ['Generate IP Addresses', 'Spiralize Matrix', 'Unique Paths in a Grid I', 'Unique Paths in a Grid II', 'Minimum Path Sum in a Triangle']
export async function main(ns) {
    let cc_servers = ccHelper.allServers(ns).map(am => { return { name: am, ccLs: ns.ls(am, ".cct") } });
    let fail = false;
    while (!fail) {
        for (var ccServer of cc_servers) {
            if (ccServer.ccLs.length > 0) {
                for (var ccFile of ccServer.ccLs) {
                    let ccType = ns.codingcontract.getContractType(ccFile, ccServer.name);
                    let ccData = ns.codingcontract.getData(ccFile, ccServer.name);
                    let ccResult;
                    if (solveable.some(t => t = ccType)) {
                        if (ccType = solveable[0]) {
                            ccResult = ccHelper.generateIPs(ccData);
                        }
                        if (ccType = solveable[1]) {
                            ccResult = ccHelper.spiralizeMatrix(ccData)
                        }
                        if (ccType = solveable[2]) {
                            ccResult = ccHelper.uniquePaths1(ccData)
                        }
                        if (ccType = solveable[3]) {
                            ccResult = ccHelper.uniquePaths2(ccData)
                        }
                        if (ccType = solveable[4]) {
                            ccResult = ccHelper.minSumPath(ccData)
                        }
                        let ccTry = ns.codingcontract.attempt(ccResult, ccFile, ccServer.name, { returnReward: true });
                        if (ccTry == null || ccTry == "") {
                            fail = true;
                            ns.tprint("WARNING: Failed Contract Type: " + ccType + " @" + ccServer.name +
                                "\nData from Contract: " + ccData +
                                "\nResult from Solver: " + ccResult)
                        }
                        else {
                            ns.tprint("INFO: @" + ccServer.name + " Contract successful." +
                                "\n Reward: " + ccTry)
                        }
                    }
                }
            }
        }
        await ns.sleep(1000);
    }
}