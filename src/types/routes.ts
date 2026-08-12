import type { ROUTES } from '@/constants/routes';

type Values<T> = T extends object ? Values<T[keyof T]> : T;

export type Route = Values<typeof ROUTES>;
