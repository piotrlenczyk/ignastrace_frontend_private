import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CURRENCIES_DATA } from '@/constants/currencies';

/**
 * The currencies offered are the ones the caller was told are on sale, not the
 * ones this application knows how to render. A currency the catalogue publishes
 * and the symbol table does not is still offered, under its code — opening a
 * market is a catalogue change, and the selector must not be what holds it up.
 */
const currencySymbol = (currency: string) =>
  CURRENCIES_DATA[currency.toLowerCase() as keyof typeof CURRENCIES_DATA]?.symbol;

export default function CurrencySelector({
  value,
  currencies,
  onChange,
}: {
  value: string;
  currencies: string[];
  onChange: (c: string) => void;
}) {
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
          {currencies.map((currency) => (
            <DropdownMenuItem className="justify-end" key={currency} onSelect={() => onChange(currency)}>
              {currencySymbol(currency)} {currency.toUpperCase()}
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
