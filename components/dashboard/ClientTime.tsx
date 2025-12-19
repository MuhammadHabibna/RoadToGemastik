"use client"

import { useEffect, useState } from 'react'

export function ClientTime({ timestamp }: { timestamp: string }) {
    const [time, setTime] = useState<string>("")

    useEffect(() => {
        setTime(new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }, [timestamp])

    if (!time) return <span className="opacity-0">--:--</span>

    return <>{time}</>
}
