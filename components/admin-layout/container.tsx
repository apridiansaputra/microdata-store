import { cn } from '@/lib/utils'
import React from 'react'

export default function Container({children, className}: {children: React.ReactNode, className?: string}) {
  return (
	<div className={cn("w-full px-5 py-5", className)}>{children}</div>
  )
}
