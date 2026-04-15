#!/usr/bin/env node
/**
 * Custom dev server starter.
 * Runs Vite with --host, then detects and labels the correct
 * office WiFi IP so you know exactly which URL to share.
 *
 * Detection logic:
 *   - Skip 127.x.x.x (localhost)
 *   - Skip addresses ending in .1 (router/gateway)
 *   - Skip 100.x.x.x (Tailscale VPN)
 *   - Prefer 192.168.x.x (typical office WiFi subnet)
 */
import { createServer } from 'vite'
import os from 'os'

function getShareableIP() {
  const candidates = []
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const net of iface) {
      if (net.family !== 'IPv4' || net.internal) continue
      if (net.address.endsWith('.1'))    continue  // router / gateway
      if (net.address.startsWith('100.')) continue // Tailscale VPN
      candidates.push(net.address)
    }
  }
  // Prefer 192.168.x.x (standard office WiFi), fall back to first candidate
  return candidates.find(ip => ip.startsWith('192.168.')) ?? candidates[0] ?? null
}

const server = await createServer({ server: { host: true, port: 5173 } })
await server.listen()

// Print Vite's standard URL block
server.printUrls()

// Add the labelled share URL below it
const ip = getShareableIP()
const reset  = '\x1b[0m'
const green  = '\x1b[32m'
const bold   = '\x1b[1m'
const yellow = '\x1b[33m'

if (ip) {
  console.log('')
  console.log(`  ${green}➜${reset}  ${bold}Share with office team (WiFi):${reset}`)
  console.log(`     ${yellow}http://${ip}:5173/${reset}`)
  console.log('')
} else {
  console.log(`\n  ${yellow}⚠ Could not detect office WiFi IP automatically.${reset}\n`)
}
