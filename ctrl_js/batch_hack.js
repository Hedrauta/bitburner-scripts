export async function main(ns) {
  let time = ns.getHackTime(ns.args[0])
  await ns.hack(ns.args[0])
  await ns.sleep(time*4)
}