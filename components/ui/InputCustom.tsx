import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputCustomProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: ReactNode;
  containerClassName?: string;
}

export const InputCustom = forwardRef<HTMLInputElement, InputCustomProps>(
  ({ label, error, suffix, id, className = '', containerClassName = '', ...props }, ref) => {
    const inputClasses = [
      'input-custom h-12 w-full rounded-[10px] border-none bg-white px-4 text-[15px] font-medium text-gray-800 outline-none transition-shadow',
      'placeholder:font-medium placeholder:text-gray-400',
      'focus:bg-white focus:shadow-[0_0_0_2px_rgba(31,53,101,0.15)]',
      error ? 'shadow-[0_0_0_2px_rgba(220,38,38,0.25)]' : '',
      suffix ? 'pr-11' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={containerClassName}>
        {label && (
          <label
            htmlFor={id}
            className="mb-2 block text-[11px] font-medium uppercase tracking-[0.08em] text-black"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input ref={ref} id={id} className={inputClasses} {...props} />
          {suffix && (
            <div className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center justify-center">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  },
);

InputCustom.displayName = 'InputCustom';
