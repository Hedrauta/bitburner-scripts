/** @param {NS} ns **/
await wget() // download helper.js before import.
import * as cct from "./ctrl_helper.mjs";
export async function main(ns) {
    let cct_servers = cct.allServers(ns).map(am => { return { name: am, ccts: ns.ls(am, ".cct") } })

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