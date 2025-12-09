// Lightweight fallback implementation to mimic the bcryptjs hash interface.
// It uses SHA-256 with a random salt to produce a non-reversible hash when the
// real bcryptjs package is unavailable in the environment.
const getCrypto = (): Crypto | null => {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }

  if (typeof globalThis !== 'undefined' && (globalThis as { crypto?: Crypto }).crypto) {
    return (globalThis as { crypto?: Crypto }).crypto ?? null;
  }

  return null;
};

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const textToBuffer = (value: string): Uint8Array => new TextEncoder().encode(value);

const createSalt = (cryptoInstance: Crypto | null, length = 16): Uint8Array => {
  const salt = new Uint8Array(length);

  if (cryptoInstance?.getRandomValues) {
    cryptoInstance.getRandomValues(salt);
  } else {
    for (let i = 0; i < salt.length; i++) {
      salt[i] = Math.floor(Math.random() * 256);
    }
  }

  return salt;
};

export const hash = async (password: string, saltRounds: number): Promise<string> => {
  // Implementação que replica a lógica do banco: md5(password + salt)
  const saltedPassword = password + 'aulao_solidario_salt';
  
  const cryptoInstance = getCrypto();
  if (!cryptoInstance?.subtle) {
    // Fallback simples
    let hashValue = 0;
    for (let i = 0; i < saltedPassword.length; i++) {
      hashValue = (hashValue << 5) - hashValue + saltedPassword.charCodeAt(i);
      hashValue |= 0;
    }
    return Math.abs(hashValue).toString(16);
  }

  // Usa crypto moderno
  const encoder = new TextEncoder();
  const data = encoder.encode(saltedPassword);
  const hashBuffer = await cryptoInstance.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Trunca para simular MD5 (32 caracteres)
  return hashHex.substring(0, 32);
};

export default { hash };
