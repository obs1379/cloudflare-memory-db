/**
 * 基于 Web Crypto API 的安全加解密模块
 * 适用于 Cloudflare Workers 环境
 */

// 将 Base64 字符串转换为 Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// 将 Uint8Array 转换为 Base64 字符串
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binaryString = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}

/**
 * 从主密码和盐值派生出 AES-GCM 密钥
 * 使用 PBKDF2 算法，迭代 100,000 次，确保抗暴力破解
 */
export async function deriveKey(password: string, saltHex: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // 将 hex salt 转换为 Uint8Array
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 使用 AES-256-GCM 加密字符串
 * 返回格式: base64(iv) + ":" + base64(ciphertext)
 */
export async function encryptText(text: string, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // GCM 推荐 12 字节 IV
  
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    enc.encode(text)
  );

  const ivBase64 = uint8ArrayToBase64(iv);
  const cipherBase64 = uint8ArrayToBase64(new Uint8Array(ciphertext));
  
  return `${ivBase64}:${cipherBase64}`;
}

/**
 * 解密 AES-256-GCM 字符串
 * 期望格式: base64(iv) + ":" + base64(ciphertext)
 */
export async function decryptText(encryptedData: string, key: CryptoKey): Promise<string> {
  const parts = encryptedData.split(':');
  if (parts.length !== 2) throw new Error('Invalid encrypted data format');

  const iv = base64ToUint8Array(parts[0]);
  const ciphertext = base64ToUint8Array(parts[1]);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

/**
 * 生成随机的 Hex 盐值 (用于新用户注册)
 */
export function generateSalt(bytes = 16): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
