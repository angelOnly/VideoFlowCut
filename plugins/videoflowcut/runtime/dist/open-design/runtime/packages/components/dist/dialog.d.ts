import { type ComponentPropsWithoutRef, type FormEventHandler, type ReactNode } from 'react';
type DialogTag = 'div' | 'form';
type DialogLayout = 'default' | 'sectioned';
export interface DialogProps {
    children: ReactNode;
    onClose?: () => void;
    className?: string;
    backdropClassName?: string;
    includeChromeClassName?: boolean;
    id?: string;
    role?: 'dialog' | 'alertdialog';
    ariaLabel?: string;
    ariaLabelledBy?: string;
    ariaDescribedBy?: string;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    layout?: DialogLayout;
    as?: DialogTag;
    onSubmit?: FormEventHandler<HTMLFormElement>;
    [key: `data-${string}`]: string | number | undefined;
}
type DialogSectionProps = ComponentPropsWithoutRef<'div'>;
type DialogHeadingProps = ComponentPropsWithoutRef<'h2'>;
type DialogDescriptionProps = ComponentPropsWithoutRef<'p'>;
export declare function Dialog({ children, onClose, className, backdropClassName, includeChromeClassName, id, role, ariaLabel, ariaLabelledBy, ariaDescribedBy, closeOnBackdrop, closeOnEscape, layout, as, onSubmit, ...dataAttributes }: DialogProps): import("react/jsx-runtime").JSX.Element;
export declare function DialogHeader({ className, ...props }: DialogSectionProps): import("react/jsx-runtime").JSX.Element;
export declare function DialogBody({ className, ...props }: DialogSectionProps): import("react/jsx-runtime").JSX.Element;
export declare function DialogFooter({ className, ...props }: DialogSectionProps): import("react/jsx-runtime").JSX.Element;
export declare function DialogTitle({ className, ...props }: DialogHeadingProps): import("react/jsx-runtime").JSX.Element;
export declare function DialogDescription({ className, ...props }: DialogDescriptionProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=dialog.d.ts.map