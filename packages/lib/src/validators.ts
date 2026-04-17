// Validador de CPF (algoritmo oficial)
export function cleanCpf(cpf: string): string {
  return (cpf ?? "").replace(/\D/g, "");
}

export function isValidCpf(cpf: string): boolean {
  const c = cleanCpf(cpf);
  if (c.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(c)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c[i], 10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(c[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c[i], 10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(c[10], 10);
}

export function maskCpf(cpf: string): string {
  const c = cleanCpf(cpf);
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

export function cleanPhone(phone: string): string {
  return (phone ?? "").replace(/\D/g, "");
}

export function isValidPhone(phone: string): boolean {
  const p = cleanPhone(phone);
  return p.length === 10 || p.length === 11;
}

export function maskPhone(phone: string): string {
  const p = cleanPhone(phone);
  if (p.length === 11) return `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}`;
  if (p.length === 10) return `(${p.slice(0, 2)}) ${p.slice(2, 6)}-${p.slice(6)}`;
  return phone;
}

export function cleanCep(cep: string): string {
  return (cep ?? "").replace(/\D/g, "");
}

export function isValidCep(cep: string): boolean {
  return cleanCep(cep).length === 8;
}

export function maskCep(cep: string): string {
  const c = cleanCep(cep);
  if (c.length !== 8) return cep;
  return `${c.slice(0, 5)}-${c.slice(5)}`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? "");
}
