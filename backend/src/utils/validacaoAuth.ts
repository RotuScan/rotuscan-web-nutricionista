
export function normalizarCRN(crn: string): string {
  const valor = crn.trim().toUpperCase().replace(/\s+/g, " ");

  const correspondencia = valor.match(
    /^CRN[-\s]?(\d{1,2})\s+(\d{3,10})$/
  );

  if (correspondencia) {
    return `CRN-${correspondencia[1]} ${correspondencia[2]}`;
  }

  return valor;
}

export function validarEmail(email: string): boolean {
  const emailLimpo = email.trim().toLowerCase();

  return (
    emailLimpo.length > 0 &&
    emailLimpo.length <= 255 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)
  );
}

export function validarSenha(senha: string): boolean {
  return senha.length >= 8 && senha.length <= 72;
}

export function validarCRN(crn: string): boolean {
  const crnLimpo = normalizarCRN(crn);

  return (
    crnLimpo.length <= 40 &&
    /^CRN[-\s]?\d{1,2}\s+\d{3,10}$/.test(crnLimpo)
  );
}

export function validarNome(nome: string): boolean {
  const nomeLimpo = nome.trim();

  return nomeLimpo.length > 0 && nomeLimpo.length <= 150;
}
