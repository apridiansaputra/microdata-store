import { cn } from '@/lib/utils'
import React from 'react'

export default function Container({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("px-4 mx-auto md:px-20", className)}>{children}</div>
  )
}
