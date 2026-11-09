import type { HTMLAttributes, ReactNode } from 'react';
export interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
    children: ReactNode;
}
export declare function VisuallyHidden({ children, className, ...props }: VisuallyHiddenProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=visually-hidden.d.ts.map