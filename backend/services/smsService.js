const axios = require('axios');

class SMSService {
  constructor() {
    this.apiKey = process.env.SMS_INDIA_API_KEY;
    this.senderId = process.env.SMS_INDIA_SENDER_ID || 'APPZET';
    this.baseUrl = process.env.SMS_INDIA_BASE_URL || 'https://api.sms-india.in/api/v3';
    this.isEnabled = process.env.SMS_INDIA_ENABLED === 'true';
  }

  /**
   * Send OTP SMS to phone number
   * @param {string} phoneNumber - 10-digit phone number
   * @param {string} otp - 6-digit OTP
   * @param {string} templateId - SMS template ID (optional)
   * @returns {Promise<Object>} - SMS sending result
   */
  async sendOTP(phoneNumber, otp, templateId = null) {
    try {
      // For development, if SMS is not enabled, just log and return success
      if (!this.isEnabled) {
        console.log(`[SMS Service] Development Mode - OTP for ${phoneNumber}: ${otp}`);
        return {
          success: true,
          messageId: `dev_${Date.now()}`,
          message: 'OTP sent successfully (Development Mode)',
          phoneNumber: phoneNumber,
          otp: otp
        };
      }

      // Validate phone number
      if (!this.validatePhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      // Prepare SMS content
      const message = templateId 
        ? this.getTemplateMessage(templateId, otp)
        : `Your Appzeto OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`;

      // SMS India API payload
      const payload = {
        api_key: this.apiKey,
        to: phoneNumber,
        from: this.senderId,
        text: message,
        type: 'text',
        template_id: templateId
      };

      // Send SMS via SMS India API
      const response = await axios.post(`${this.baseUrl}/send`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      });

      if (response.data && response.data.status === 'success') {
        return {
          success: true,
          messageId: response.data.message_id || `sms_${Date.now()}`,
          message: 'OTP sent successfully',
          phoneNumber: phoneNumber,
          cost: response.data.cost || 0
        };
      } else {
        throw new Error(response.data.message || 'Failed to send SMS');
      }

    } catch (error) {
      console.error('SMS Service Error:', error.message);
      
      // For development, return success even if SMS fails
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SMS Service] Development Fallback - OTP for ${phoneNumber}: ${otp}`);
        return {
          success: true,
          messageId: `dev_fallback_${Date.now()}`,
          message: 'OTP sent successfully (Development Fallback)',
          phoneNumber: phoneNumber,
          otp: otp,
          error: error.message
        };
      }

      throw new Error(`SMS sending failed: ${error.message}`);
    }
  }

  /**
   * Send custom SMS message
   * @param {string} phoneNumber - 10-digit phone number
   * @param {string} message - SMS message content
   * @returns {Promise<Object>} - SMS sending result
   */
  async sendMessage(phoneNumber, message) {
    try {
      if (!this.isEnabled) {
        console.log(`[SMS Service] Development Mode - Message to ${phoneNumber}: ${message}`);
        return {
          success: true,
          messageId: `dev_${Date.now()}`,
          message: 'SMS sent successfully (Development Mode)',
          phoneNumber: phoneNumber
        };
      }

      if (!this.validatePhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      const payload = {
        api_key: this.apiKey,
        to: phoneNumber,
        from: this.senderId,
        text: message,
        type: 'text'
      };

      const response = await axios.post(`${this.baseUrl}/send`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.status === 'success') {
        return {
          success: true,
          messageId: response.data.message_id,
          message: 'SMS sent successfully',
          phoneNumber: phoneNumber,
          cost: response.data.cost || 0
        };
      } else {
        throw new Error(response.data.message || 'Failed to send SMS');
      }

    } catch (error) {
      console.error('SMS Service Error:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SMS Service] Development Fallback - Message to ${phoneNumber}: ${message}`);
        return {
          success: true,
          messageId: `dev_fallback_${Date.now()}`,
          message: 'SMS sent successfully (Development Fallback)',
          phoneNumber: phoneNumber,
          error: error.message
        };
      }

      throw new Error(`SMS sending failed: ${error.message}`);
    }
  }

  /**
   * Check SMS delivery status
   * @param {string} messageId - Message ID from send response
   * @returns {Promise<Object>} - Delivery status
   */
  async checkDeliveryStatus(messageId) {
    try {
      if (!this.isEnabled) {
        return {
          success: true,
          status: 'delivered',
          message: 'Development mode - assuming delivered'
        };
      }

      const response = await axios.get(`${this.baseUrl}/status`, {
        params: {
          api_key: this.apiKey,
          message_id: messageId
        },
        timeout: 5000
      });

      return {
        success: true,
        status: response.data.status,
        message: response.data.message
      };

    } catch (error) {
      console.error('SMS Status Check Error:', error.message);
      return {
        success: false,
        status: 'unknown',
        message: error.message
      };
    }
  }

  /**
   * Get account balance
   * @returns {Promise<Object>} - Account balance info
   */
  async getBalance() {
    try {
      if (!this.isEnabled) {
        return {
          success: true,
          balance: 1000,
          currency: 'INR',
          message: 'Development mode - mock balance'
        };
      }

      const response = await axios.get(`${this.baseUrl}/balance`, {
        params: {
          api_key: this.apiKey
        },
        timeout: 5000
      });

      return {
        success: true,
        balance: response.data.balance,
        currency: response.data.currency || 'INR',
        message: 'Balance retrieved successfully'
      };

    } catch (error) {
      console.error('SMS Balance Check Error:', error.message);
      return {
        success: false,
        balance: 0,
        currency: 'INR',
        message: error.message
      };
    }
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} - Validation result
   */
  validatePhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid 10-digit Indian mobile number
    return /^[6-9]\d{9}$/.test(cleanNumber);
  }

  /**
   * Get template message for OTP
   * @param {string} templateId - Template ID
   * @param {string} otp - OTP code
   * @returns {string} - Formatted message
   */
  getTemplateMessage(templateId, otp) {
    const templates = {
      'otp_login': `Your Appzeto login OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`,
      'otp_verification': `Your Appzeto verification code is ${otp}. Valid for 5 minutes.`,
      'otp_reset': `Your Appzeto password reset OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`
    };

    return templates[templateId] || `Your Appzeto OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`;
  }

  /**
   * Format phone number for SMS India API
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // If number starts with 0, remove it
    if (cleanNumber.startsWith('0')) {
      return cleanNumber.substring(1);
    }
    
    // If number starts with +91, remove it
    if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
      return cleanNumber.substring(2);
    }
    
    return cleanNumber;
  }
}

module.exports = new SMSService();
