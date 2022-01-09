export async function main(ns) {
  await ns.hack(ns.args[0])
  await ns.sleep(ns.getHackTime(ns.args[0])*4)
}