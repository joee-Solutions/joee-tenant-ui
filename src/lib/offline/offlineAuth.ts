import { db, OfflineCredentials } from './database';
import { offlineLogger } from './offlineLogger';
import CryptoJS from 'crypto-js';

/**
 * Offline Authentication Service
 * Allows users to login offline using cached credentials
 */

class OfflineAuthService {
  private static instance: OfflineAuthService;

  private constructor() {}

  static getInstance(): OfflineAuthService {
    if (!OfflineAuthService.instance) {
      OfflineAuthService.instance = new OfflineAuthService();
    }
    return OfflineAuthService.instance;
  }

  /**
   * Generate per-user encryption key
   * Uses email + hostname to create a unique key for each user
   * This ensures that each user's credentials are encrypted with a unique key
   */
  private getEncryptionKey(email: string): string {
    if (typeof window === 'undefined') {
      // SSR fallback - should not happen in practice
      return 'default-key-ssr';
    }
    // Generate per-user key based on email and hostname
    // This ensures each user has a unique encryption key
    const baseKey = `${email}-${window.location.hostname}`;
    const hashedKey = CryptoJS.SHA256(baseKey).toString();
    // Use first 32 characters as AES key (AES-256 requires 32 bytes)
    return hashedKey.substring(0, 32);
  }

  /**
   * Hash password for storage (one-way hash)
   */
  private hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  /**
   * Encrypt sensitive data with per-user key
   */
  private encrypt(data: string, email: string): string {
    const key = this.getEncryptionKey(email);
    return CryptoJS.AES.encrypt(data, key).toString();
  }

  /**
   * Decrypt sensitive data with per-user key
   */
  private decrypt(encryptedData: string, email: string): string {
    const key = this.getEncryptionKey(email);
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Store credentials for offline login (called after successful online login)
   */
  async storeCredentials(
    email: string,
    password: string,
    token: string,
    userData: any
  ): Promise<void> {
    try {
      const passwordHash = this.hashPassword(password);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      // Check if credentials already exist for this email
      const existing = await db.offlineCredentials
        .where('email')
        .equals(email)
        .first();

      const credentialData: OfflineCredentials = {
        email,
        passwordHash,
        token: this.encrypt(token, email),
        userData: this.encrypt(JSON.stringify(userData), email),
        lastLogin: new Date(),
        expiresAt,
      };

      if (existing) {
        await db.offlineCredentials.update(existing.id!, credentialData as any);
        offlineLogger.debug('Updated offline credentials for', { email });
      } else {
        await db.offlineCredentials.add(credentialData as any);
        offlineLogger.debug('Stored offline credentials for', { email });
      }
    } catch (error: any) {
      offlineLogger.error('Failed to store offline credentials', {
        error: error?.message,
      });
    }
  }

  /**
   * Verify credentials offline
   */
  async verifyCredentialsOffline(
    email: string,
    password: string
  ): Promise<{ success: boolean; token?: string; userData?: any }> {
    try {
      const credential = await db.offlineCredentials
        .where('email')
        .equals(email)
        .first();

      if (!credential) {
        offlineLogger.warn('No offline credentials found for', { email });
        return { success: false };
      }

      // Check if credentials expired
      if (new Date() > credential.expiresAt) {
        offlineLogger.warn('Offline credentials expired for', { email });
        await db.offlineCredentials.delete(credential.id!);
        return { success: false };
      }

      // Verify password hash
      const passwordHash = this.hashPassword(password);
      if (passwordHash !== credential.passwordHash) {
        offlineLogger.warn('Invalid password for offline login', { email });
        return { success: false };
      }

      // Decrypt token and user data using user's email for key generation
      const token = this.decrypt(credential.token!, email);
      const userData = JSON.parse(this.decrypt(credential.userData!, email));

      // Update last login
      await db.offlineCredentials.update(credential.id!, {
        lastLogin: new Date(),
      });

      offlineLogger.info('Offline login successful for', { email });
      return { success: true, token, userData };
    } catch (error: any) {
      offlineLogger.error('Failed to verify offline credentials', {
        error: error?.message,
      });
      return { success: false };
    }
  }

  /**
   * Clear stored credentials (called on logout)
   * @param email - Email to clear credentials for (optional, clears all if not provided)
   * @param keepForOffline - If true, keeps credentials for offline login even after logout (default: true)
   */
  async clearCredentials(email?: string, keepForOffline: boolean = true): Promise<void> {
    try {
      if (keepForOffline) {
        offlineLogger.debug('Keeping offline credentials for future offline login', { email });
        return; // Don't clear if user wants to keep for offline login
      }

      if (email) {
        const credential = await db.offlineCredentials
          .where('email')
          .equals(email)
          .first();
        if (credential) {
          await db.offlineCredentials.delete(credential.id!);
        }
      } else {
        // Clear all credentials
        await db.offlineCredentials.clear();
      }
      offlineLogger.debug('Cleared offline credentials', { email });
    } catch (error: any) {
      offlineLogger.error('Failed to clear offline credentials', {
        error: error?.message,
      });
    }
  }

  /**
   * Check if offline credentials exist for an email
   */
  async hasOfflineCredentials(email: string): Promise<boolean> {
    try {
      const credential = await db.offlineCredentials
        .where('email')
        .equals(email)
        .first();
      
      if (!credential) return false;
      
      // Check if expired
      if (new Date() > credential.expiresAt) {
        await db.offlineCredentials.delete(credential.id!);
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const offlineAuthService = OfflineAuthService.getInstance();

