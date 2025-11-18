const AdminFinance = require('../models/AdminFinance');

/**
 * Finance Transaction Helper Utility
 * Provides helper functions for creating finance transactions with duplicate prevention
 */

/**
 * Check if a transaction already exists for a given source
 * @param {Object} sourceInfo - Source information { sourceType, sourceId }
 * @returns {Promise<Object|null>} - Existing transaction or null
 */
const findExistingTransaction = async (sourceInfo) => {
  const { sourceType, sourceId } = sourceInfo;
  
  if (!sourceType || !sourceId) {
    return null;
  }

  try {
    const transaction = await AdminFinance.findOne({
      recordType: 'transaction',
      'metadata.sourceType': sourceType,
      'metadata.sourceId': sourceId.toString()
    });

    return transaction;
  } catch (error) {
    console.error('Error finding existing transaction:', error);
    return null;
  }
};

/**
 * Create an incoming finance transaction
 * @param {Object} options - Transaction options
 * @param {Number} options.amount - Transaction amount
 * @param {String} options.category - Transaction category
 * @param {Date} options.transactionDate - Transaction date
 * @param {ObjectId} options.createdBy - Admin ID who created the transaction
 * @param {ObjectId} options.client - Client ID (optional)
 * @param {ObjectId} options.project - Project ID (optional)
 * @param {ObjectId} options.account - Account ID (optional)
 * @param {String} options.paymentMethod - Payment method (optional)
 * @param {String} options.description - Description (optional)
 * @param {Object} options.metadata - Additional metadata (optional)
 * @param {Boolean} options.checkDuplicate - Whether to check for duplicates (default: true)
 * @returns {Promise<Object>} - Created transaction
 */
const createIncomingTransaction = async (options) => {
  const {
    amount,
    category,
    transactionDate,
    createdBy,
    client,
    project,
    account,
    paymentMethod,
    description,
    metadata = {},
    checkDuplicate = true
  } = options;

  if (!amount || !category || !transactionDate || !createdBy) {
    throw new Error('Missing required fields: amount, category, transactionDate, createdBy');
  }

  // Check for duplicate if metadata has source info
  if (checkDuplicate && metadata.sourceType && metadata.sourceId) {
    const existing = await findExistingTransaction({
      sourceType: metadata.sourceType,
      sourceId: metadata.sourceId
    });

    if (existing) {
      console.log(`Transaction already exists for ${metadata.sourceType}:${metadata.sourceId}`);
      return existing;
    }
  }

  const transactionData = {
    recordType: 'transaction',
    transactionType: 'incoming',
    category,
    amount,
    transactionDate,
    createdBy,
    status: 'completed',
    description: description || '',
    metadata: {
      ...metadata,
      createdAt: new Date()
    }
  };

  if (client) transactionData.client = client;
  if (project) transactionData.project = project;
  if (account) transactionData.account = account;
  if (paymentMethod) transactionData.paymentMethod = paymentMethod;

  try {
    const transaction = await AdminFinance.create(transactionData);
    return transaction;
  } catch (error) {
    console.error('Error creating incoming transaction:', error);
    throw error;
  }
};

/**
 * Create an outgoing finance transaction
 * @param {Object} options - Transaction options
 * @param {Number} options.amount - Transaction amount
 * @param {String} options.category - Transaction category
 * @param {Date} options.transactionDate - Transaction date
 * @param {ObjectId} options.createdBy - Admin ID who created the transaction
 * @param {ObjectId} options.employee - Employee ID (optional - can be Employee, Sales, or PM)
 * @param {String} options.vendor - Vendor name (optional)
 * @param {String} options.paymentMethod - Payment method (optional)
 * @param {String} options.description - Description (optional)
 * @param {Object} options.metadata - Additional metadata (optional)
 * @param {Boolean} options.checkDuplicate - Whether to check for duplicates (default: true)
 * @returns {Promise<Object>} - Created transaction
 */
const createOutgoingTransaction = async (options) => {
  const {
    amount,
    category,
    transactionDate,
    createdBy,
    employee,
    vendor,
    paymentMethod,
    description,
    metadata = {},
    checkDuplicate = true
  } = options;

  if (!amount || !category || !transactionDate || !createdBy) {
    throw new Error('Missing required fields: amount, category, transactionDate, createdBy');
  }

  // Check for duplicate if metadata has source info
  if (checkDuplicate && metadata.sourceType && metadata.sourceId) {
    const existing = await findExistingTransaction({
      sourceType: metadata.sourceType,
      sourceId: metadata.sourceId
    });

    if (existing) {
      console.log(`Transaction already exists for ${metadata.sourceType}:${metadata.sourceId}`);
      return existing;
    }
  }

  const transactionData = {
    recordType: 'transaction',
    transactionType: 'outgoing',
    category,
    amount,
    transactionDate,
    createdBy,
    status: 'completed',
    description: description || '',
    metadata: {
      ...metadata,
      createdAt: new Date()
    }
  };

  if (employee) transactionData.employee = employee;
  if (vendor) transactionData.vendor = vendor;
  if (paymentMethod) transactionData.paymentMethod = paymentMethod;

  try {
    const transaction = await AdminFinance.create(transactionData);
    return transaction;
  } catch (error) {
    console.error('Error creating outgoing transaction:', error);
    throw error;
  }
};

/**
 * Cancel or delete a transaction when source status is reversed
 * @param {Object} sourceInfo - Source information { sourceType, sourceId }
 * @param {String} action - 'cancel' or 'delete' (default: 'cancel')
 * @returns {Promise<Object|null>} - Updated or deleted transaction
 */
const cancelTransactionForSource = async (sourceInfo, action = 'cancel') => {
  const { sourceType, sourceId } = sourceInfo;
  
  if (!sourceType || !sourceId) {
    return null;
  }

  try {
    const transaction = await findExistingTransaction(sourceInfo);
    
    if (!transaction) {
      return null;
    }

    if (action === 'delete') {
      await AdminFinance.findByIdAndDelete(transaction._id);
      return { deleted: true };
    } else {
      // Cancel the transaction
      transaction.status = 'cancelled';
      await transaction.save();
      return transaction;
    }
  } catch (error) {
    console.error('Error canceling transaction:', error);
    return null;
  }
};

module.exports = {
  findExistingTransaction,
  createIncomingTransaction,
  createOutgoingTransaction,
  cancelTransactionForSource
};

