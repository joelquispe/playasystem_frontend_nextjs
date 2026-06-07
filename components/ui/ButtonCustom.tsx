import { type ButtonHTMLAttributes } from 'react';

type ButtonCustomVariant = 'primary';

export interface ButtonCustomProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  variant?: ButtonCustomVariant;
}

const variantClasses: Record<ButtonCustomVariant, string> = {
  primary:
    'bg-[#1f3565] text-white hover:bg-[#172a52] disabled:cursor-not-allowed disabled:opacity-65',
};

export function ButtonCustom({
  fullWidth = false,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonCustomProps) {
  const classes = [
    'h-[52px] cursor-pointer rounded-[10px] border-none text-base font-medium transition-colors',
    fullWidth ? 'w-full' : '',
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button type={type} className={classes} {...props} />;
}
