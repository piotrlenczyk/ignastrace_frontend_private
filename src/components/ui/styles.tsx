import { cn } from "@/libs/utils";

export const inputStyle = cn(`
  flex w-full rounded-lg
  text-gray-1000 text-base bg-white
  border border-input
  px-4 py-3  transition-colors
  ring-offset-0
  placeholder:text-gray-700 
  hover:bg-gray-50 
  active:bg-gray-100
  focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring 
  disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-100 disabled:border-currentcolor 
  aria-[invalid=true]:border-red-800 aria-[invalid=true]:bg-red-50 aria-[invalid=true]:outline-solid aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-red-800
`);
