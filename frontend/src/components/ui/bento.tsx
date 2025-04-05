import type React from "react"
import { cn } from "../../lib/utils"

const BentoGrid = ({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) => {
  return (
    <div
      className={cn("mx-auto grid max-w-7xl grid-cols-1 gap-5 sm:gap-6 md:auto-rows-[20rem] md:grid-cols-3", className)}
    >
      {children}
    </div>
  )
}

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string
  title?: string | React.ReactNode
  description?: string | React.ReactNode
  header?: React.ReactNode
  icon?: React.ReactNode
}) => {
  return (
    <div
      className={cn(
        "group/bento shadow-lg row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-gray-800/40 bg-gray-900/60 p-6 transition-all duration-300 hover:border-gray-700/60 dark:shadow-none",
        className,
      )}
    >
      {header}
      <div className="transition duration-300 group-hover/bento:translate-x-2">
        {icon}
        <div className="mt-4 mb-3 font-sans font-bold text-xl text-white">{title}</div>
        <div className="font-sans text-sm font-normal text-gray-300 leading-relaxed">{description}</div>
      </div>
    </div>
  )
}

export default BentoGrid

