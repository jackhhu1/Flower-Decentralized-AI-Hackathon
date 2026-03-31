import axios from 'axios';

// Configuration for the federated learning API
const API_BASE_URL = 'http://localhost:5000'; // Local ML service
const API_TIMEOUT = 30000; // 30 seconds timeout

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.status, error.message);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      switch (status) {
        case 400:
          return new Error('Invalid request. Please check your input.');
        case 401:
          return new Error('Authentication failed. Please try again.');
        case 403:
          return new Error('Access denied. You do not have permission.');
        case 404:
          return new Error('Service not found. Please try again later.');
        case 429:
          return new Error('Too many requests. Please wait and try again.');
        case 500:
          return new Error('Server error. Please try again later.');
        default:
          return new Error(data?.message || 'An unexpected error occurred.');
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your internet connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred.');
    }
  }

  /**
   * Analyze a skin image using the federated learning model
   * @param {Object} imageData - Processed image data
   * @param {string} imageData.base64 - Base64 encoded image
   * @param {number} imageData.width - Image width
   * @param {number} imageData.height - Image height
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeSkinImage(imageData) {
    try {
      const payload = {
        image: imageData.base64
      };

      const response = await this.client.post('/analyze', payload);
      return this.formatAnalysisResults(response.data);
    } catch (error) {
      console.error('Error analyzing skin image:', error);
      throw error;
    }
  }

  /**
   * Get model information and status
   * @returns {Promise<Object>} Model information
   */
  async getModelInfo() {
    try {
      const response = await this.client.get('/model/info');
      return response.data;
    } catch (error) {
      console.error('Error getting model info:', error);
      throw error;
    }
  }

  /**
   * Get federated learning statistics
   * @returns {Promise<Object>} FL statistics
   */
  async getFLStatistics() {
    try {
      const response = await this.client.get('/fl/statistics');
      return response.data;
    } catch (error) {
      console.error('Error getting FL statistics:', error);
      throw error;
    }
  }

  /**
   * Submit feedback for model improvement
   * @param {string} analysisId - Analysis ID
   * @param {Object} feedback - User feedback
   * @returns {Promise<Object>} Feedback submission result
   */
  async submitFeedback(analysisId, feedback) {
    try {
      const payload = {
        analysis_id: analysisId,
        feedback: {
          accuracy_rating: feedback.accuracyRating, // 1-5 scale
          correct_prediction: feedback.correctPrediction, // boolean
          actual_diagnosis: feedback.actualDiagnosis, // string
          comments: feedback.comments, // string
          user_experience: feedback.userExperience // 1-5 scale
        }
      };

      const response = await this.client.post('/feedback', payload);
      return response.data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Get analysis history for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Analysis history
   */
  async getAnalysisHistory(userId, options = {}) {
    try {
      const params = {
        user_id: userId,
        limit: options.limit || 50,
        offset: options.offset || 0,
        start_date: options.startDate,
        end_date: options.endDate
      };

      const response = await this.client.get('/analysis/history', { params });
      return response.data.analyses;
    } catch (error) {
      console.error('Error getting analysis history:', error);
      throw error;
    }
  }

  /**
   * Format analysis results from API response
   * @param {Object} apiResponse - Raw API response
   * @returns {Object} Formatted results
   */
  formatAnalysisResults(apiResponse) {
    const { predictions, topPrediction, confidence, modelVersion, modelAccuracy, processingTime, analysisTime } = apiResponse;

    return {
      predictions: predictions,
      topPrediction: topPrediction,
      analysisTime: analysisTime || new Date().toISOString(),
      modelVersion: modelVersion || 'federated-local-v1.0',
      modelAccuracy: modelAccuracy || 0.85,
      flRound: null, // Not applicable for local inference
      processingTime: processingTime || null,
      confidence: confidence || topPrediction?.confidence || 0
    };
  }

  /**
   * Simulate analysis for offline/demo mode
   * @param {Object} imageData - Processed image data
   * @returns {Promise<Object>} Simulated analysis results
   */
  async simulateAnalysis(imageData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate random but realistic probabilities
    const classNames = [
      'Actinic keratoses and intraepithelial carcinoma',
      'Basal cell carcinoma',
      'Benign keratosis-like lesions', 
      'Dermatofibroma',
      'Melanoma',
      'Melanocytic nevi',
      'Vascular lesions'
    ];
    
    // Generate probabilities that sum to 1
    const probabilities = classNames.map(() => Math.random());
    const total = probabilities.reduce((sum, prob) => sum + prob, 0);
    const normalizedProbs = probabilities.map(prob => prob / total);
    
    const predictions = classNames.map((className, index) => ({
      className,
      probability: normalizedProbs[index],
      confidence: Math.round(normalizedProbs[index] * 100),
      classIndex: index
    })).sort((a, b) => b.probability - a.probability);

    return {
      predictions,
      topPrediction: predictions[0],
      analysisTime: new Date().toISOString(),
      modelVersion: 'federated-demo-v1.0',
      modelAccuracy: 0.85,
      flRound: Math.floor(Math.random() * 100) + 1,
      processingTime: Math.floor(Math.random() * 1000) + 500,
      confidence: predictions[0].confidence
    };
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
