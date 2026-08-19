/* eslint-disable better-tailwindcss/no-unknown-classes */
'use client';

// Source: adapted from https://github.com/QR-CODE-App/payments-client-kickstart/ with modifications
import * as Dialog from '@radix-ui/react-dialog';
import { type ReactNode } from 'react';

export const Adyen3DsActionModal = ({
  children,
  isOpen,
  setIsOpen,
}: {
  children: ReactNode;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={`
            data-[state=closed]:animate-overlay-out
            data-[state=open]:animate-overlay-show
            fixed inset-0 z-50 bg-[rgba(40,40,40,0.75)]
          `}
        />
        <Dialog.Content
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center`}
          aria-describedby={undefined}
        >
          <div
            className={`
              shadow-overlay
              sm:bg-background-base
              relative h-[calc(100dvh-72px)] w-[calc(100dvw-20px)] rounded-lg bg-background-alternate
              sm:h-[min(600px,calc(100dvh/3*2))] sm:max-w-[min(400px,calc(100%-32px))] sm:rounded-sm
            `}
          >
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
