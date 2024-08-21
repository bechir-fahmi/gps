import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SecureStorageService {
  private secretKey = environment.secret_key;

  constructor() { }

  setEncryptedItem(key: string, value: any): void {
    const dataString = JSON.stringify(value);

    const encryptedData = CryptoJS.AES.encrypt(dataString, this.secretKey).toString();
    localStorage.setItem(key, encryptedData);
  }

  getDecryptedItem(key: string): any {
    const encryptedData = localStorage.getItem(key);
    if (encryptedData) {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      try {
        const parsedData = JSON.parse(decryptedData);
        return parsedData;
      } catch (e) {
        console.error('Error parsing decrypted data:', e);
        return null;
      }
    }
    return null;
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}
