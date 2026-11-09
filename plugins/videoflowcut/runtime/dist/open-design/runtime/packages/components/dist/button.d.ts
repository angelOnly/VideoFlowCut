import type { ButtonHTMLAttributes } from 'react';
export type ButtonVariant = 'default' | 'primary' | 'primary-ghost' | 'ghost' | 'subtle' | 'secondary';
export type ButtonSize = 'default' | 'icon' | 'sm';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}
export declare const Button: import("react").ForwardRefExoticComponent<ButtonProps & import("react").RefAttributes<HTMLButtonElement>>;
//# sourceMappingURL=button.d.ts.map