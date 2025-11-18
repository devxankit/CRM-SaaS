const mongoose = require('mongoose');

const paymentReceiptSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  amount: { type: Number, required: true, min: 0 },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  method: { type: String, enum: ['bank_transfer', 'upi', 'cash', 'other'], default: 'upi' },
  referenceId: { type: String, trim: true },
  notes: { type: String, trim: true, maxlength: 500 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Sales', required: true },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  verifiedAt: { type: Date }
}, { timestamps: true });

paymentReceiptSchema.index({ status: 1, createdAt: -1 });

// Post-save hook to update project financials and create finance transaction when PaymentReceipt is approved
paymentReceiptSchema.post('save', async function(doc) {
  // Only process if status is 'approved'
  if (doc.status === 'approved') {
    try {
      const Project = require('./Project');
      const project = await Project.findById(doc.project);
      
      if (project) {
        // Initialize financialDetails if not present
        if (!project.financialDetails) {
          project.financialDetails = {
            totalCost: project.budget || 0,
            advanceReceived: 0,
            includeGST: false,
            remainingAmount: project.budget || 0
          };
        }
        
        // Get total cost
        const totalCost = Number(project.financialDetails.totalCost || project.budget || 0);
        
        // Recalculate total received from all payment sources:
        // 1. Approved PaymentReceipts
        // 2. Paid installments from installmentPlan
        // 3. Initial advanceReceived (set during conversion)
        
        const PaymentReceipt = mongoose.model('PaymentReceipt');
        const allApprovedReceipts = await PaymentReceipt.find({
          project: doc.project,
          status: 'approved'
        }).select('amount');
        
        const totalApprovedPayments = allApprovedReceipts.reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);
        
        // Calculate paid installments
        const installmentPlan = project.installmentPlan || [];
        const paidInstallments = installmentPlan.filter(inst => inst.status === 'paid');
        const paidInstallmentAmount = paidInstallments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
        
        // Get current stored advance (might include initial advance)
        const currentStoredAdvance = Number(project.financialDetails.advanceReceived || 0);
        const totalFromReceiptsAndInstallments = totalApprovedPayments + paidInstallmentAmount;
        
        // Calculate total received correctly:
        // If stored advance > receipts+installments, stored includes initial advance, use it
        // If receipts+installments > stored AND stored > 0, stored is likely initial advance
        //   So we need to add: initial (stored) + receipts+installments
        // But wait - if stored was already updated by a previous receipt, it might include receipts
        // So we need to be careful: if this is the first receipt, stored = initial
        // Otherwise, stored might already include initial + previous receipts
        
        // Strategy: Check if this is likely the first receipt being approved
        const isFirstReceipt = allApprovedReceipts.length === 1;
        
        let totalReceived;
        if (currentStoredAdvance > totalFromReceiptsAndInstallments) {
          // Stored advance is greater - it includes initial advance that's not in receipts/installments
          totalReceived = currentStoredAdvance;
        } else if (totalFromReceiptsAndInstallments > currentStoredAdvance && currentStoredAdvance > 0 && isFirstReceipt) {
          // First receipt being approved, and initial advance exists
          // stored = initial advance, so total = initial + receipts + installments
          totalReceived = currentStoredAdvance + totalFromReceiptsAndInstallments;
        } else if (totalFromReceiptsAndInstallments > currentStoredAdvance) {
          // Multiple receipts or no initial advance - receipts+installments is the source of truth
          totalReceived = totalFromReceiptsAndInstallments;
        } else {
          // They're equal - use either
          totalReceived = totalFromReceiptsAndInstallments;
        }
        
        // Update project's advanceReceived and recalculate remainingAmount
        project.financialDetails.advanceReceived = totalReceived;
        
        // Recalculate remainingAmount
        const remainingAmount = Math.max(0, totalCost - totalReceived);
        project.financialDetails.remainingAmount = remainingAmount;
        
        // Save project (this will trigger the post-save hook for incentive movement if remainingAmount is 0)
        await project.save();
        console.log(`Updated project ${project._id} financials: advanceReceived=${totalReceived}, remainingAmount=${remainingAmount}`);
      }
      
      // Create finance transaction
      try {
        const { createIncomingTransaction } = require('../utils/financeTransactionHelper');
        const { mapPaymentReceiptMethodToFinance } = require('../utils/paymentMethodMapper');
        const AdminFinance = require('./AdminFinance');
        
        // Check if transaction already exists
        const existing = await AdminFinance.findOne({
          recordType: 'transaction',
          'metadata.sourceType': 'paymentReceipt',
          'metadata.sourceId': doc._id.toString()
        });
        
        if (!existing) {
          // Get project name for description
          const projectName = project ? project.name : 'Unknown Project';
          
          // Get Admin ID - use verifiedBy if available, otherwise find first admin
          const Admin = require('./Admin');
          let adminId = doc.verifiedBy;
          if (!adminId) {
            const admin = await Admin.findOne({ isActive: true }).select('_id');
            adminId = admin ? admin._id : null;
          }
          
          if (adminId) {
            await createIncomingTransaction({
              amount: doc.amount,
              category: 'Payment Receipt',
              transactionDate: doc.verifiedAt || new Date(),
              createdBy: adminId,
              client: doc.client,
              project: doc.project,
              account: doc.account,
              paymentMethod: mapPaymentReceiptMethodToFinance(doc.method),
              description: `Payment receipt approved for project "${projectName}" - ${doc.referenceId || 'N/A'}`,
              metadata: {
                sourceType: 'paymentReceipt',
                sourceId: doc._id.toString(),
                referenceId: doc.referenceId || null
              },
              checkDuplicate: true
            });
          }
        }
      } catch (error) {
        // Log error but don't fail the save
        console.error('Error creating finance transaction for payment receipt:', error);
      }
    } catch (error) {
      // Log error but don't fail the save
      console.error('Error updating project financials for payment receipt:', error);
    }
  }
});

module.exports = mongoose.model('PaymentReceipt', paymentReceiptSchema);


