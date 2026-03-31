import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

/**
 * Local storage utilities for the DermaCheck app
 * Handles analysis history, user preferences, and cached data
 */

class StorageService {
  constructor() {
    this.keys = {
      ANALYSIS_HISTORY: 'analysis_history',
      USER_PREFERENCES: 'user_preferences',
      MODEL_CACHE: 'model_cache',
      APP_SETTINGS: 'app_settings',
      FEEDBACK_DATA: 'feedback_data'
    };
  }

  /**
   * Save analysis result to history
   * @param {Object} analysisResult - Analysis result to save
   * @returns {Promise<void>}
   */
  async saveAnalysisResult(analysisResult) {
    try {
      const history = await this.getAnalysisHistory();
      
      const newAnalysis = {
        id: this.generateAnalysisId(),
        timestamp: new Date().toISOString(),
        ...analysisResult,
        saved: true
      };

      history.unshift(newAnalysis); // Add to beginning of array
      
      // Keep only last 100 analyses to prevent storage bloat
      const trimmedHistory = history.slice(0, 100);
      
      await AsyncStorage.setItem(
        this.keys.ANALYSIS_HISTORY, 
        JSON.stringify(trimmedHistory)
      );
      
      console.log('Analysis result saved to history');
    } catch (error) {
      console.error('Error saving analysis result:', error);
      throw new Error(`Failed to save analysis: ${error.message}`);
    }
  }

  /**
   * Get analysis history
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Analysis history
   */
  async getAnalysisHistory(options = {}) {
    try {
      const historyJson = await AsyncStorage.getItem(this.keys.ANALYSIS_HISTORY);
      let history = historyJson ? JSON.parse(historyJson) : [];

      // Apply filters if provided
      if (options.limit) {
        history = history.slice(0, options.limit);
      }

      if (options.startDate) {
        const startDate = new Date(options.startDate);
        history = history.filter(item => new Date(item.timestamp) >= startDate);
      }

      if (options.endDate) {
        const endDate = new Date(options.endDate);
        history = history.filter(item => new Date(item.timestamp) <= endDate);
      }

      if (options.riskLevel) {
        history = history.filter(item => item.riskLevel === options.riskLevel);
      }

      return history;
    } catch (error) {
      console.error('Error getting analysis history:', error);
      return [];
    }
  }

  /**
   * Delete analysis from history
   * @param {string} analysisId - Analysis ID to delete
   * @returns {Promise<void>}
   */
  async deleteAnalysis(analysisId) {
    try {
      const history = await this.getAnalysisHistory();
      const filteredHistory = history.filter(item => item.id !== analysisId);
      
      await AsyncStorage.setItem(
        this.keys.ANALYSIS_HISTORY,
        JSON.stringify(filteredHistory)
      );
      
      console.log('Analysis deleted from history');
    } catch (error) {
      console.error('Error deleting analysis:', error);
      throw new Error(`Failed to delete analysis: ${error.message}`);
    }
  }

  /**
   * Clear all analysis history
   * @returns {Promise<void>}
   */
  async clearAnalysisHistory() {
    try {
      await AsyncStorage.removeItem(this.keys.ANALYSIS_HISTORY);
      console.log('Analysis history cleared');
    } catch (error) {
      console.error('Error clearing analysis history:', error);
      throw new Error(`Failed to clear history: ${error.message}`);
    }
  }

  /**
   * Overwrite analysis history with provided array
   * @param {Array} historyArray - Full analysis history to persist
   * @returns {Promise<void>}
   */
  async setAnalysisHistory(historyArray) {
    try {
      const normalized = Array.isArray(historyArray) ? historyArray : [];
      await AsyncStorage.setItem(
        this.keys.ANALYSIS_HISTORY,
        JSON.stringify(normalized)
      );
      console.log('Analysis history set');
    } catch (error) {
      console.error('Error setting analysis history:', error);
      throw new Error(`Failed to set history: ${error.message}`);
    }
  }

  /**
   * Save user preferences
   * @param {Object} preferences - User preferences to save
   * @returns {Promise<void>}
   */
  async saveUserPreferences(preferences) {
    try {
      const existingPrefs = await this.getUserPreferences();
      const updatedPrefs = { ...existingPrefs, ...preferences };
      
      await AsyncStorage.setItem(
        this.keys.USER_PREFERENCES,
        JSON.stringify(updatedPrefs)
      );
      
      console.log('User preferences saved');
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw new Error(`Failed to save preferences: ${error.message}`);
    }
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences() {
    try {
      const prefsJson = await AsyncStorage.getItem(this.keys.USER_PREFERENCES);
      return prefsJson ? JSON.parse(prefsJson) : this.getDefaultPreferences();
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Get default user preferences
   * @returns {Object} Default preferences
   */
  getDefaultPreferences() {
    return {
      notifications: {
        enabled: true,
        analysisComplete: true,
        reminders: false
      },
      privacy: {
        saveImages: true,
        shareAnalytics: false,
        dataRetention: 30 // days
      },
      analysis: {
        autoAnalyze: false,
        showConfidence: true,
        detailedResults: true
      },
      appearance: {
        theme: 'light',
        fontSize: 'medium',
        highContrast: false
      }
    };
  }

  /**
   * Save app settings
   * @param {Object} settings - App settings to save
   * @returns {Promise<void>}
   */
  async saveAppSettings(settings) {
    try {
      const existingSettings = await this.getAppSettings();
      const updatedSettings = { ...existingSettings, ...settings };
      
      await AsyncStorage.setItem(
        this.keys.APP_SETTINGS,
        JSON.stringify(updatedSettings)
      );
      
      console.log('App settings saved');
    } catch (error) {
      console.error('Error saving app settings:', error);
      throw new Error(`Failed to save settings: ${error.message}`);
    }
  }

  /**
   * Get app settings
   * @returns {Promise<Object>} App settings
   */
  async getAppSettings() {
    try {
      const settingsJson = await AsyncStorage.getItem(this.keys.APP_SETTINGS);
      return settingsJson ? JSON.parse(settingsJson) : this.getDefaultSettings();
    } catch (error) {
      console.error('Error getting app settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Get default app settings
   * @returns {Object} Default settings
   */
  getDefaultSettings() {
    return {
      firstLaunch: true,
      lastAppVersion: '1.0.0',
      analyticsEnabled: false,
      crashReportingEnabled: true,
      debugMode: false,
      apiEndpoint: 'https://your-federated-learning-api.com',
      offlineMode: false
    };
  }

  /**
   * Save feedback data
   * @param {Object} feedback - Feedback data to save
   * @returns {Promise<void>}
   */
  async saveFeedback(feedback) {
    try {
      const existingFeedback = await this.getFeedbackData();
      
      const newFeedback = {
        id: this.generateFeedbackId(),
        timestamp: new Date().toISOString(),
        ...feedback
      };

      existingFeedback.push(newFeedback);
      
      await AsyncStorage.setItem(
        this.keys.FEEDBACK_DATA,
        JSON.stringify(existingFeedback)
      );
      
      console.log('Feedback saved');
    } catch (error) {
      console.error('Error saving feedback:', error);
      throw new Error(`Failed to save feedback: ${error.message}`);
    }
  }

  /**
   * Get feedback data
   * @returns {Promise<Array>} Feedback data
   */
  async getFeedbackData() {
    try {
      const feedbackJson = await AsyncStorage.getItem(this.keys.FEEDBACK_DATA);
      return feedbackJson ? JSON.parse(feedbackJson) : [];
    } catch (error) {
      console.error('Error getting feedback data:', error);
      return [];
    }
  }

  /**
   * Save model cache data
   * @param {Object} cacheData - Model cache data
   * @returns {Promise<void>}
   */
  async saveModelCache(cacheData) {
    try {
      await AsyncStorage.setItem(
        this.keys.MODEL_CACHE,
        JSON.stringify(cacheData)
      );
      
      console.log('Model cache saved');
    } catch (error) {
      console.error('Error saving model cache:', error);
      throw new Error(`Failed to save model cache: ${error.message}`);
    }
  }

  /**
   * Get model cache data
   * @returns {Promise<Object|null>} Model cache data
   */
  async getModelCache() {
    try {
      const cacheJson = await AsyncStorage.getItem(this.keys.MODEL_CACHE);
      return cacheJson ? JSON.parse(cacheJson) : null;
    } catch (error) {
      console.error('Error getting model cache:', error);
      return null;
    }
  }

  /**
   * Clear all app data
   * @returns {Promise<void>}
   */
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        this.keys.ANALYSIS_HISTORY,
        this.keys.USER_PREFERENCES,
        this.keys.MODEL_CACHE,
        this.keys.APP_SETTINGS,
        this.keys.FEEDBACK_DATA
      ]);
      
      console.log('All app data cleared');
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw new Error(`Failed to clear all data: ${error.message}`);
    }
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stats = {
        totalKeys: keys.length,
        analysisHistoryCount: 0,
        feedbackCount: 0,
        totalSize: 0
      };

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          stats.totalSize += value.length;
          
          if (key === this.keys.ANALYSIS_HISTORY) {
            const history = JSON.parse(value);
            stats.analysisHistoryCount = history.length;
          } else if (key === this.keys.FEEDBACK_DATA) {
            const feedback = JSON.parse(value);
            stats.feedbackCount = feedback.length;
          }
        }
      }

      stats.totalSizeKB = Math.round(stats.totalSize / 1024);
      stats.totalSizeMB = Math.round(stats.totalSize / (1024 * 1024) * 100) / 100;

      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalKeys: 0,
        analysisHistoryCount: 0,
        feedbackCount: 0,
        totalSize: 0,
        totalSizeKB: 0,
        totalSizeMB: 0
      };
    }
  }

  /**
   * Generate unique analysis ID
   * @returns {string} Unique analysis identifier
   */
  generateAnalysisId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `analysis_${timestamp}_${random}`;
  }

  /**
   * Generate unique feedback ID
   * @returns {string} Unique feedback identifier
   */
  generateFeedbackId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `feedback_${timestamp}_${random}`;
  }
}

// Create and export a singleton instance
const storageService = new StorageService();
export default storageService;

