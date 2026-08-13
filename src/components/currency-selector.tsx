import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AVAILABLE_CURRENCIES_DATA } from '@/constants/currencies';

export default function CurrencySelector({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1 p-2 text-right text-xs font-bold text-gray-700 uppercase"
          type="button"
        >
          <span>{value.toUpperCase()}</span>
          <Icon name="arrow-down" className="text-xs text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[4.5rem] grid-cols-1">
        <ScrollArea className="h-40 px-2">
          {Object.entries(AVAILABLE_CURRENCIES_DATA).map(([key, { symbol }]) => (
            <DropdownMenuItem className="justify-end" key={key} onSelect={() => onChange(key)}>
              {symbol} {key.toUpperCase()}
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
