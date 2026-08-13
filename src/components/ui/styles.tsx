import { cn } from '@/libs/utils';

export const inputStyle = cn(`
  flex w-full rounded-lg border border-input bg-white px-4 py-3 text-base text-gray-1000 ring-offset-0 transition-colors
  placeholder:text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden
  active:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-100
  aria-[invalid=true]:border-red-800 aria-[invalid=true]:bg-red-50 aria-[invalid=true]:outline-2
  aria-[invalid=true]:outline-red-800 aria-[invalid=true]:outline-solid
`);
