'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/libs/utils';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      `
        fixed top-0 right-0 z-100 flex max-h-screen w-full flex-col-reverse p-4
        sm:top-auto sm:bottom-0 sm:flex-col
        md:max-w-[546px]
      `,
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  `
    group pointer-events-auto relative flex w-full items-center space-x-2 overflow-hidden rounded-md border bg-white p-6
    text-sm text-weak transition-all
    after:absolute after:left-0 after:z-10 after:h-full after:w-1 after:rounded-md after:content-['']
    data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full
    data-[state=open]:animate-in data-[state=open]:slide-in-from-top-full
    data-[swipe=cancel]:translate-x-0
    data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) data-[swipe=end]:animate-out
    data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=move]:transition-none
    data-[state=open]:sm:slide-in-from-bottom-full
  `,
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive: `
          destructive group border-red-200 bg-[#FFF6F6]
          before:mt-1 before:mr-3 before:h-7 before:w-6 before:shrink-0 before:self-start
          before:bg-[url("/images/toast/states/icon-error.svg")] before:bg-no-repeat
          after:bg-red-800
        `,
        success: `
          success group border-green-200 bg-[#F3FCFA]
          before:mt-1 before:mr-3 before:h-7 before:w-6 before:shrink-0 before:self-start
          before:bg-[url("/images/toast/states/icon-success.svg")] before:bg-no-repeat
          after:bg-green-800
        `,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      `
        inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium
        transition-colors
        group-[.destructive]:border-muted/40
        hover:bg-secondary
        group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive
        group-[.destructive]:hover:text-destructive-foreground
        focus:ring-1 focus:ring-ring focus:outline-hidden
        group-[.destructive]:focus:ring-destructive
        disabled:pointer-events-none disabled:opacity-50
      `,
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'rounded-md',
      'p-1',
      'text-foreground/50',
      'opacity-0',
      'self-start',
      'transition-opacity',
      'hover:text-foreground',
      'focus:opacity-100',
      'focus:outline-hidden',
      'focus:ring-1',
      'absolute',
      'top-6',
      'right-6',
      'group-hover:opacity-100',
      'group-[.destructive]:text-red-800',
      'group-[.destructive]:hover:text-red-50',
      'group-[.destructive]:focus:ring-red-800',
      'group-[.destructive]:focus:ring-offset-red-1000',
      className,
    )}
    toast-close=""
    {...props}
  >
    <Cross2Icon className="size-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('h4 flex items-center justify-between font-semibold text-strong [&+div]:text-xs', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  Toast,
  ToastAction,
  type ToastActionElement,
  ToastClose,
  ToastDescription,
  type ToastProps,
  ToastProvider,
  ToastTitle,
  ToastViewport,
};
