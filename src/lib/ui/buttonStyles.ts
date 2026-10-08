// src/lib/ui/buttonStyles.ts
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md';

const variants: Record<ButtonVariant, string> = {
	primary:
		'border-transparent bg-brand text-on-brand hover:brightness-95 focus-visible:outline-brand disabled:bg-surface-strong disabled:text-on-surface-muted',
	secondary:
		'border-border bg-surface text-on-surface hover:border-border-strong hover:bg-surface-muted focus-visible:outline-brand',
	ghost:
		'border-transparent bg-transparent text-brand hover:bg-brand-container hover:text-on-brand-container focus-visible:outline-brand'
};

const sizes: Record<ButtonSize, string> = {
	sm: 'px-4 py-2 text-sm',
	md: 'px-5 py-3'
};

export function buttonClasses(variant: ButtonVariant, size: ButtonSize, className = '') {
	return `inline-flex items-center justify-center gap-2 rounded-xl border font-semibold shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant]} ${sizes[size]} ${className}`;
}
