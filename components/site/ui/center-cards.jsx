import React from "react"
import { DestWordmark } from "../icons"

function CardImageOnRight({ children }) {
  return (
    <div className="w-full h-dvh flex items-center justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] md:border md:rounded-4xl md:shadow-lg overflow-hidden max-w-3xl w-full h-dvh md:h-fit">
        <div className="p-8 flex flex-col items-center justify-center gap-6">
          <DestWordmark className="shrink-0 h-6 mt-5 text-foreground" />
          {children}
        </div>
        <div className="hidden lg:block relative md:border-l">
          <img
            src="https://assets.lummi.ai/assets/QmRmGJyqStvMNwj4vJRc5BeBUrbZFMfL9xdYthQyduDyNV?auto=format&w=512"
            alt="Card visual"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  )
}

function ContainerCenterCard({ className, children, sm }) {
  return (
    <div className="w-full h-dvh flex items-center justify-center">
      <div className={`w-full h-fit flex flex-col justify-center p-5 gap-6 overflow-y-auto overflow-x-hidden ${sm ? 'max-w-sm items-center' : '!h-dvh md:!h-fit max-w-xl justify-start items-start pt-10 md:pt-5'} ${className}`}>
        {sm && <DestWordmark className="shrink-0 h-6 mt-5 text-foreground" />}
        {children}
      </div>
    </div>
  )
}

export { CardImageOnRight, ContainerCenterCard }