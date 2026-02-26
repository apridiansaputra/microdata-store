import { cn } from '@/lib/utils'
import React from 'react'

export default function Container({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("px-4 max-w-7xl mx-auto md:px-0", className)}>{children}</div>
  )
}
