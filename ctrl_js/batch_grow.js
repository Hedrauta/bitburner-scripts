export async function main(ns) {
  let time = ns.getHackTime(ns.args[0])
  await ns.grow(ns.args[0])
  await ns.sleep(time)
}