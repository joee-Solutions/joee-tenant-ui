import { db, OfflineCredentials } from './database';
import { offlineLogger } from './offlineLogger';
import CryptoJS from 'crypto-js';

/**
 * Offline Authentication Service
 * Allows users to login offline using cached credentials
 */

const ENCRYPTION_KEY = 'joee-offline-auth-key'; // In production, use a more secure key

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
   * Hash password for storage (one-way hash)
   */
  private hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
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
        token: this.encrypt(token),
        userData: this.encrypt(JSON.stringify(userData)),
        lastLogin: new Date(),
        expiresAt,
      };

      if (existing) {
        await db.offlineCredentials.update(existing.id!, credentialData);
        offlineLogger.debug('Updated offline credentials for', { email });
      } else {
        await db.offlineCredentials.add(credentialData);
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

      // Decrypt token and user data
      const token = this.decrypt(credential.token!);
      const userData = JSON.parse(this.decrypt(credential.userData!));

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

