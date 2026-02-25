import { cn } from '@/lib/utils'
import React from 'react'

export default function Container({children, className}: {children: React.ReactNode, className?: string}) {
  return (
    <div className={cn("max-w-screen-xl mx-auto m-5", className)}>{children}</div>
  )
}
