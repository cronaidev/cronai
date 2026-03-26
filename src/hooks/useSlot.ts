import { useEffect, useState } from 'react'
import { Connection } from '@solana/web3.js'

const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

let cachedSlot = 302_847_112
let listeners: Array<(slot: number) => void> = []
let subscriptionId: number | null = null

function subscribe() {
  if (subscriptionId !== null) return
  subscriptionId = connection.onSlotChange(info => {
    cachedSlot = info.slot
    listeners.forEach(fn => fn(info.slot))
  })
}

export function useSlot() {
  const [slot, setSlot] = useState(cachedSlot)

  useEffect(() => {
    listeners.push(setSlot)
    subscribe()
    return () => { listeners = listeners.filter(fn => fn !== setSlot) }
  }, [])

  return slot
}
