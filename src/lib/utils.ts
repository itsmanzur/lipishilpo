// Tailwind-এর cn() utility — WP plugin-এ ব্যবহার হয় না, stub রাখা হয়েছে
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}
