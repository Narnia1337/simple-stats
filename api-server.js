import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import fs from "fs"
if (!(fs)._ghPatched) {
  const orig = fs.writeFileSync
  fs.writeFileSync = function (file, data, opts) {
    if (typeof file === "string" && file.endsWith(".itemsBackup.json")) return
    return orig.apply(this, arguments)
  }
  ;(fs)._ghPatched = true
}

import { ProfileNetworthCalculator } from "skyhelper-networth"

const KEY = process.env.HYPIXEL_API_KEY
const TIMEOUT = 10_000

let mojCnt = 0, hypCnt = 0,
    mojReset = Date.now() + 6e5,
    hypReset = Date.now() + 6e4

const wait = (ms) => new Promise(r => setTimeout(r, ms))
const canM = () => Date.now() > mojReset ? (mojReset = Date.now() + 6e5, mojCnt = 0, true) : mojCnt < 600
const canH = () => Date.now() > hypReset ? (hypReset = Date.now() + 6e4, hypCnt = 0, true) : hypCnt < 120

export const SKILL_NAMES = [
  "farming","mining","combat","foraging","fishing",
  "enchanting","alchemy","taming","carpentry","runecrafting","social",
]

export const CAP = {
  farming:60,mining:60,combat:60,foraging:50,fishing:50,
  enchanting:60,alchemy:50,taming:50,carpentry:50,runecrafting:25,social:25,
  catacombs:50,
}

export const SLAYER_NAMES = ["zombie","spider","wolf","enderman","blaze","vampire"]

export const SLAYER_XP = {
  zombie:   [0,5,15,200,1000,5000,20000,100000,400000,1000000],
  spider:   [0,5,25,200,1000,5000,20000,100000,400000,1000000],
  wolf:     [0,10,30,250,1500,5000,20000,100000,400000,1000000],
  enderman: [0,10,30,250,1500,5000,20000,100000,400000,1000000],
  blaze:    [0,10,30,250,1500,5000,20000,100000,400000,1000000],
  vampire:  [0,20,75,240,840,2400],
}

export const DUNGEON_XP = [
  0,
  50, 125, 235, 395, 625,
  955, 1425, 2095, 3045, 4385,
  6275, 8940, 12700, 17960, 25340,
  35640, 50040, 70040, 97640, 135640,
  188140, 259640, 356640, 488640, 668640,
  911640, 1239640, 1684640, 2284640, 3084640,
  4149640, 5559640, 7459640, 9959640, 13259640,
  17559640, 23159640, 30359640, 39559640, 51559640,
  66559640, 85559640, 109559640, 139559640, 177559640,
  225559640, 285559640, 360559640, 453559640, 569809640
]

export const SKILL_XP = [
  0,50,175,375,675,1175,1925,2925,4425,6425,
  9925,14925,22425,32425,47425,67425,97425,147425,222425,322425,
  522425,822425,1222425,1722425,2322425,3022425,3822425,4722425,5722425,
  6822425,8022425,9322425,10722425,12222425,13822425,15522425,17322425,
  19222425,21222425,23322425,25522425,27822425,30222425,32722425,35322425,
  38072425,40972425,44072425,47472425,51172425,55172425,59472425,64072425,
  68972425,74172425,79672425,85472425,91572425,97972425,104672425,111672425,
]

const fmt = (n) =>
  n >= 1e9 ? `${(n/1e9).toFixed(1)}B`
  : n >= 1e6 ? `${(n/1e6).toFixed(1)}M`
  : n >= 1e3 ? `${(n/1e3).toFixed(1)}K`
  : Math.floor(n).toString()

const lvl = (xp, tbl) => {
  let l = 0
  for (let i = 0; i < tbl.length; i++) if (xp >= tbl[i]) l = i
  return l
}
const skLvl = (name, xp) =>
  lvl(xp, SKILL_XP.slice(0, CAP[name] + 1))

const UUID = new Map()
const PROFILES = new Map()

async function uuid(ign) {
  const key = ign.toLowerCase()
  if (UUID.has(key)) return UUID.get(key)

  while (!canM()) await wait(1000)
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(
        `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(ign)}`,
        { headers: { "User-Agent": "Marketplace/1.0" } },
      )
      mojCnt++
      if (r.status === 429 || r.status === 403) throw 0
      if (!r.ok) throw r.status
      const { id } = (await r.json())
      UUID.set(key, id)
      return id
    } catch { await wait((a+1)*750) }
  }

  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(
        `https://playerdb.co/api/player/minecraft/${encodeURIComponent(ign)}`,
        { headers: { "User-Agent": "Marketplace/1.0" } },
      )
      if (!r.ok) throw r.status
      const d = await r.json()
      if (!(d.success && d.data?.player)) throw 0
      const id = d.data.player.raw_id
      UUID.set(key, id)
      return id
    } catch { await wait((a+1)*750) }
  }
  return null
}

async function rawProfiles(id) {
  while (!canH()) await wait(1000)
  const url = `https://api.hypixel.net/v2/skyblock/profiles?key=${KEY}&uuid=${id}`
  for (let a=0; a<3; a++) {
    try {
      const ctl = new AbortController()
      const to = setTimeout(()=>ctl.abort(), TIMEOUT)
      const r = await fetch(url, {
        signal: ctl.signal, cache: "no-store",
        headers:{ "User-Agent":"Marketplace/1.0" },
      })
      clearTimeout(to); hypCnt++
      if (r.status === 429) throw 0
      if (!r.ok) throw r.status
      const d = await r.json()
      if (!d.success) throw d.cause
      return d.profiles || []
    } catch { await wait((a+1)*1500) }
  }
  return []
}

async function profiles(id, force=false) {
  const c = PROFILES.get(id)
  if (!force && c && Date.now()-c.ts < 55_000) return c.data
  const data = await rawProfiles(id)
  PROFILES.set(id,{ts:Date.now(),data})
  return data
}

let itemsReady = false
async function loadItemsOnce() {
  if (itemsReady) return
  try {
    itemsReady = true
  } catch {}
}

async function getPlayerStats(ign, force = false) {
  const id = await uuid(ign)
  if (!id) return null

  const ps = await profiles(id, force)
  if (!ps.length) return null

  const prof = ps.find((p) => p.selected) ??
               ps.reduce((b, p) =>
                 (p.members?.[id]?.last_save ?? 0) >
                 (b?.members?.[id]?.last_save ?? 0) ? p : b, ps[0])

  const m = prof.members?.[id]
  if (!m) return null

  const skills = {}
  for (const s of SKILL_NAMES) {
    const raw = m.player_data?.experience?.[`SKILL_${s.toUpperCase()}`] ??
                m[`experience_skill_${s}`] ?? 0
    skills[s] = skLvl(s, Number(raw))
  }
  skills.average = [
    "combat","mining","foraging","farming","fishing",
    "enchanting","alchemy","taming",
  ].reduce((a,k)=>a+(skills[k]??0),0)/8

  const slayers = { total:0 }
  
  const slayerData = m.player_data?.slayer?.slayer_bosses || 
                     m.player_data?.slayer_bosses || 
                     m.slayer?.slayer_bosses || 
                     m.slayer_bosses || 
                     {}
  
  for (const t of SLAYER_NAMES) {
    const boss = slayerData[t] || {}
    const xp = Number(
      boss.xp || 
      boss.experience || 
      boss.total_experience ||
      boss.boss_kills_tier_0 ||
      0
    )
    
    let level = 0
    if (xp > 0) {
      level = lvl(xp, SLAYER_XP[t])
    } else if (boss.boss_kills_tier_0 || boss.boss_kills_tier_1) {
      const hasKills = Object.keys(boss).some(k => k.startsWith('boss_kills_tier_') && boss[k] > 0)
      if (hasKills) level = 1
    }
    
    slayers[t] = level
    slayers.total += level
  }

  const purse = m.player_data?.currencies?.coin_purse ??
                m.currencies?.coin_purse ?? m.coin_purse ?? 0
  const bank = prof.banking?.balance ?? prof.bank_account?.balance ?? 0

  let net = 0
  try {
    await loadItemsOnce()
    const calculator = new ProfileNetworthCalculator(m, bank)
    const result = await calculator.getNetworth()
    net = result?.networth || result?.unsoulboundNetworth || result?.totalNetworth || 0
  } catch (error) {
    console.log('NetWorth calculation error:', error.message)
    net = 0
  }

  const catacombs = lvl(
    m.dungeons?.dungeon_types?.catacombs?.experience ?? 0,
    DUNGEON_XP,
  )

  const sbXP = m.leveling?.experience ?? prof.leveling?.experience ?? prof.player_data?.leveling?.experience ?? 0
  const skyblockLevel = Math.floor(Number(sbXP)/100)
  
  const fairySouls = m.fairy_souls_collected ?? 
                     m.fairy_souls?.total ?? 
                     m.fairy_exchange?.fairy_souls ?? 
                     m.player_data?.fairy_souls_collected ?? 
                     0

  return {
    skyblockLevel,
    netWorth: net,
    purse: Number(purse),
    bankBalance: bank,
    skills,
    slayers,
    catacombs,
    profileName: prof.cute_name ?? "Unknown",
    lastSave: m.last_save ?? 0,
    fairySouls,
    uuid: id,
  }
}

const app = express()
app.use(cors())
app.use(express.static(__dirname))

app.get('/api/stats/:username', async (req, res) => {
  try {
    const stats = await getPlayerStats(req.params.username)
    if (!stats) {
      return res.status(404).json({ error: 'Player not found' })
    }
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})