export async function main(ns) {
  await ns.grow(ns.args[0])
  await ns.sleep(ns.getHackTime(ns.args[0]))
}