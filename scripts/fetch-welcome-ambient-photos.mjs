import fs from "node:fs/promises"
import path from "node:path"

const OUT_DIR = path.join(process.cwd(), "public", "assets", "welcome")

const photos = [
  // meetup
  ["meetup-01.jpg", "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["meetup-02.jpg", "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["meetup-03.jpg", "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["meetup-04.jpg", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["meetup-05.jpg", "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["meetup-06.jpg", "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["meetup-07.jpg", "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["meetup-08.jpg", "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["meetup-09.jpg", "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["meetup-10.jpg", "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["meetup-11.jpg", "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["meetup-12.jpg", "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["meetup-13.jpg", "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["meetup-14.jpg", "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["meetup-15.jpg", "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["meetup-16.jpg", "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&h=1200&q=80"],

  // fast-date (parejas/citas)
  ["fast-01.jpg", "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["fast-02.jpg", "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["fast-03.jpg", "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["fast-04.jpg", "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["fast-05.jpg", "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["fast-06.jpg", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["fast-07.jpg", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["fast-08.jpg", "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["fast-09.jpg", "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=900&h=1200&q=80"],

  // match
  ["match-01.jpg", "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["match-02.jpg", "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["match-03.jpg", "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["match-04.jpg", "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=900&h=1200&q=80"],

  // social
  ["social-01.jpg", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["social-02.jpg", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["social-03.jpg", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&h=1200&q=80"],
  ["social-04.jpg", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&h=1200&q=80"],
]

async function downloadOne([filename, url]) {
  const target = path.join(OUT_DIR, filename)
  try {
    await fs.access(target)
    return { filename, skipped: true }
  } catch {
    // continue
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error(`${filename}: HTTP ${res.status}`)
  const ab = await res.arrayBuffer()
  await fs.writeFile(target, Buffer.from(ab))
  return { filename, skipped: false }
}

await fs.mkdir(OUT_DIR, { recursive: true })
console.log(`Downloading ${photos.length} files to ${OUT_DIR}`)

let ok = 0
let skipped = 0
for (const item of photos) {
  const r = await downloadOne(item)
  if (r.skipped) skipped++
  else ok++
  process.stdout.write(r.skipped ? "." : "+")
}

console.log(`\nDone. downloaded=${ok} skipped=${skipped}`)
