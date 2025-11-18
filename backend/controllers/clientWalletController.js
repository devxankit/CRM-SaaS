const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

const toObjectId = (value) => {
  if (!value) return null;
  try {
    return new mongoose.Types.ObjectId(value);
  } catch (error) {
    return null;
  }
};

// @desc    Get wallet summary for the authenticated client
// @route   GET /api/client/wallet/summary
// @access  Client only
const getWalletSummary = asyncHandler(async (req, res, next) => {
  const clientId = req.client?.id || req.user?.id;
  const clientObjectId = toObjectId(clientId);

  if (!clientObjectId) {
    return next(new ErrorResponse('Client context not found', 401));
  }

  // Aggregate payment totals by status for the client
  const paymentStats = await Payment.aggregate([
    { $match: { client: clientObjectId } },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Aggregate payments per project (paid vs pending) to help build per-project view
  const projectPaymentStats = await Payment.aggregate([
    { $match: { client: clientObjectId } },
    {
      $group: {
        _id: '$project',
        paidAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0]
          }
        },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
          }
        },
        refundedAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0]
          }
        }
      }
    }
  ]);

  const paymentTotals = paymentStats.reduce(
    (acc, stat) => {
      acc.total += stat.totalAmount || 0;
      if (stat._id === 'completed') acc.paid += stat.totalAmount || 0;
      if (stat._id === 'pending') acc.pending += stat.totalAmount || 0;
      if (stat._id === 'failed') acc.failed += stat.totalAmount || 0;
      if (stat._id === 'refunded') acc.refunded += stat.totalAmount || 0;
      return acc;
    },
    { total: 0, paid: 0, pending: 0, failed: 0, refunded: 0 }
  );

  // Fetch projects for the client with minimal fields
  const projects = await Project.find({ client: clientObjectId })
    .select(
      'name status dueDate progress financialDetails.totalCost financialDetails.remainingAmount financialDetails.advanceReceived installmentPlan'
    )
    .lean();

  const paymentStatsByProject = projectPaymentStats.reduce((map, stat) => {
    if (!stat._id) return map;
    map.set(stat._id.toString(), {
      paidAmount: stat.paidAmount || 0,
      pendingAmount: stat.pendingAmount || 0,
      refundedAmount: stat.refundedAmount || 0
    });
    return map;
  }, new Map());

  // Fetch all approved PaymentReceipts for all projects upfront (outside the map)
  const PaymentReceipt = require('../models/PaymentReceipt');
  const projectIds = projects.map(p => p._id);
  const allApprovedReceipts = await PaymentReceipt.find({
    project: { $in: projectIds },
    status: 'approved'
  }).select('project amount').lean();
  
  // Create a map of projectId -> total approved receipts
  const receiptsByProject = allApprovedReceipts.reduce((map, receipt) => {
    const projectId = receipt.project?.toString();
    if (!projectId) return map;
    if (!map.has(projectId)) {
      map.set(projectId, 0);
    }
    map.set(projectId, map.get(projectId) + Number(receipt.amount || 0));
    return map;
  }, new Map());

  const projectSummaries = projects.map((project) => {
    const key = project._id.toString();
    const stats = paymentStatsByProject.get(key) || {
      paidAmount: 0,
      pendingAmount: 0,
      refundedAmount: 0
    };

    const totalCost = project.financialDetails?.totalCost || 0;
    const advanceReceived = project.financialDetails?.advanceReceived || 0;
    const installments = Array.isArray(project.installmentPlan)
      ? project.installmentPlan
      : [];

    const now = new Date();
    let totalInstallmentAmount = 0;
    let paidInstallmentAmount = 0;
    let pendingInstallmentAmount = 0;
    const pendingInstallments = [];

    installments.forEach((installment) => {
      const amount = Number(installment.amount) || 0;
      totalInstallmentAmount += amount;
      if (installment.status === 'paid') {
        paidInstallmentAmount += amount;
        return;
      }

      pendingInstallmentAmount += amount;

      const dueDate = installment.dueDate ? new Date(installment.dueDate) : null;
      const status =
        installment.status === 'paid'
          ? 'paid'
          : dueDate && dueDate < now
          ? 'overdue'
          : 'pending';

      pendingInstallments.push({
        ...installment,
        status
      });
    });

    pendingInstallments.sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return dateA - dateB;
    });

    const nextInstallment = pendingInstallments.length
      ? pendingInstallments[0]
      : null;

    // IMPORTANT: advanceReceived already includes:
    // - Initial advance (set during conversion)
    // - Approved PaymentReceipts (created by sales team)
    // - Paid installments (from installmentPlan)
    // So we should NOT add paidInstallmentAmount again to avoid double-counting
    
    // Get approved receipts for this project (from the pre-fetched map)
    const totalApprovedPayments = receiptsByProject.get(key) || 0;
    
    // Calculate what advanceReceived actually contains:
    // advanceReceived = initialAdvance + approvedReceipts + paidInstallments
    // So: initialAdvance + approvedReceipts = advanceReceived - paidInstallments
    const advanceAndReceipts = Math.max(0, advanceReceived - paidInstallmentAmount);
    
    // Payment records (from Payment model) are separate and should be added
    const paymentRecordsPaid = stats.paidAmount || 0;
    
    // Total paid = advanceReceived (which already includes installments) + payment records
    // OR: advanceAndReceipts + paidInstallments + paymentRecordsPaid
    // Both should give the same result since advanceReceived = advanceAndReceipts + paidInstallments
    const totalPaidAmount = advanceReceived + paymentRecordsPaid;
    
    // Calculate remaining amount
    const remainingAmount = Math.max(totalCost - totalPaidAmount, 0);

    return {
      id: project._id,
      name: project.name,
      status: project.status,
      dueDate: project.dueDate,
      progress: project.progress || 0,
      totalCost,
      paidAmount: totalPaidAmount, // advanceReceived (includes advance + receipts + installments) + payment records
      advanceReceived: advanceAndReceipts, // Initial advance + approved receipts (excluding installments for clarity)
      installmentPaidAmount: paidInstallmentAmount,
      paymentRecordsPaid: paymentRecordsPaid,
      pendingAmount: stats.pendingAmount,
      refundedAmount: stats.refundedAmount,
      remainingAmount,
      installmentPlan: installments.map((inst, idx) => ({
        _id: inst._id || `inst-${idx}`,
        amount: inst.amount || 0,
        dueDate: inst.dueDate,
        status: inst.status || 'pending',
        paidDate: inst.paidDate,
        notes: inst.notes,
        createdAt: inst.createdAt,
        updatedAt: inst.updatedAt,
        sequence: idx + 1
      })),
      installmentSummary: {
        totalInstallments: installments.length,
        pendingInstallments: installments.filter(
          (installment) => installment.status !== 'paid'
        ).length,
        paidInstallments: installments.filter(
          (installment) => installment.status === 'paid'
        ).length,
        overdueInstallments: installments.filter(
          (installment) => installment.status === 'overdue' || 
          (installment.status !== 'paid' && installment.dueDate && new Date(installment.dueDate) < now)
        ).length,
        totalAmount: totalInstallmentAmount,
        pendingAmount: pendingInstallmentAmount,
        paidAmount: paidInstallmentAmount,
        nextInstallment: nextInstallment
          ? {
              id: nextInstallment._id,
              amount: nextInstallment.amount,
              dueDate: nextInstallment.dueDate,
              status: nextInstallment.status
            }
          : null
      }
    };
  });

  const totalProjectCost = projectSummaries.reduce(
    (sum, project) => sum + (project.totalCost || 0),
    0
  );

  // Calculate totals - note: advanceReceived in projectSummaries is now advanceAndReceipts (excluding installments)
  const totalAdvanceAndReceipts = projectSummaries.reduce(
    (sum, project) => sum + (project.advanceReceived || 0),
    0
  );
  const totalInstallmentPaid = projectSummaries.reduce(
    (sum, project) => sum + (project.installmentPaidAmount || 0),
    0
  );
  const totalPaymentRecordsPaid = paymentTotals.paid || 0;
  // Total paid = advance + receipts + installments + payment records
  const totalPaid = totalAdvanceAndReceipts + totalInstallmentPaid + totalPaymentRecordsPaid;

  const currencyDoc = await Payment.findOne({ client: clientObjectId })
    .select('currency')
    .lean();
  const currency = currencyDoc?.currency || 'INR';

  res.status(200).json({
    success: true,
    data: {
      summary: {
        currency,
        totalCost: totalProjectCost,
        totalPaid: totalPaid, // advance + receipts + installments + payment records
        totalAdvanceReceived: totalAdvanceAndReceipts, // Initial advance + approved receipts (excluding installments)
        totalInstallmentPaid: totalInstallmentPaid,
        totalPaymentRecordsPaid: totalPaymentRecordsPaid,
        totalPending: paymentTotals.pending,
        totalRefunded: paymentTotals.refunded,
        totalFailed: paymentTotals.failed,
        totalOutstanding: Math.max(totalProjectCost - totalPaid, 0),
        totalProjects: projectSummaries.length
      },
      projects: projectSummaries
    }
  });
});

// @desc    Get wallet transactions for the authenticated client
// @route   GET /api/client/wallet/transactions
// @access  Client only
const getWalletTransactions = asyncHandler(async (req, res, next) => {
  const clientId = req.client?.id || req.user?.id;
  const clientObjectId = toObjectId(clientId);

  if (!clientObjectId) {
    return next(new ErrorResponse('Client context not found', 401));
  }

  const { page = 1, limit = 20, status, paymentType } = req.query;

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = { client: clientObjectId };
  if (status) {
    filter.status = status;
  }
  if (paymentType) {
    filter.paymentType = paymentType;
  }

  const [transactions, total] = await Promise.all([
    Payment.find(filter)
      .populate('project', 'name status')
      .populate('milestone', 'title dueDate status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    Payment.countDocuments(filter)
  ]);

  const mappedTransactions = transactions.map((payment) => ({
    id: payment._id,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    paymentType: payment.paymentType,
    transactionId: payment.transactionId,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    project: payment.project
      ? { id: payment.project._id, name: payment.project.name, status: payment.project.status }
      : null,
    milestone: payment.milestone
      ? {
          id: payment.milestone._id,
          title: payment.milestone.title,
          dueDate: payment.milestone.dueDate,
          status: payment.milestone.status
        }
      : null,
    notes: payment.notes || null
  }));

  res.status(200).json({
    success: true,
    data: mappedTransactions,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages: Math.ceil(total / parsedLimit)
    }
  });
});

// @desc    Get upcoming payments (pending) for the authenticated client
// @route   GET /api/client/wallet/upcoming
// @access  Client only
const getUpcomingPayments = asyncHandler(async (req, res, next) => {
  const clientId = req.client?.id || req.user?.id;
  const clientObjectId = toObjectId(clientId);

  if (!clientObjectId) {
    return next(new ErrorResponse('Client context not found', 401));
  }

  const { limit = 10 } = req.query;
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

  const pendingPayments = await Payment.find({
    client: clientObjectId,
    status: 'pending'
  })
    .populate('project', 'name status')
    .populate('milestone', 'title dueDate status')
    .sort({ createdAt: -1 })
    .limit(parsedLimit)
    .lean();

  const upcomingPayments = pendingPayments.map((payment) => ({
    id: payment._id,
    project: payment.project
      ? { id: payment.project._id, name: payment.project.name, status: payment.project.status }
      : null,
    milestone: payment.milestone
      ? {
          id: payment.milestone._id,
          title: payment.milestone.title,
          dueDate: payment.milestone.dueDate,
          status: payment.milestone.status
        }
      : null,
    amount: payment.amount,
    currency: payment.currency,
    paymentType: payment.paymentType,
    createdAt: payment.createdAt,
    dueDate: payment.milestone?.dueDate || null,
    status: payment.status,
    type: 'payment',
    notes: payment.notes || null
  }));

  const projectsWithInstallments = await Project.find({
    client: clientObjectId,
    'installmentPlan.0': { $exists: true }
  })
    .select('name status installmentPlan')
    .lean();

  const now = new Date();
  const installmentEntries = [];

  projectsWithInstallments.forEach((project) => {
    const installments = Array.isArray(project.installmentPlan)
      ? project.installmentPlan
      : [];

    installments.forEach((installment) => {
      const amount = Number(installment.amount) || 0;
      if (amount <= 0) {
        return;
      }

      const dueDate = installment.dueDate ? new Date(installment.dueDate) : null;
      const status =
        installment.status === 'paid'
          ? 'paid'
          : dueDate && dueDate < now
          ? 'overdue'
          : 'pending';

      if (status === 'paid') {
        return;
      }

      installmentEntries.push({
        id: installment._id,
        project: {
          id: project._id,
          name: project.name,
          status: project.status
        },
        milestone: null,
        amount,
        currency: 'INR',
        paymentType: 'installment',
        createdAt: installment.createdAt || installment.updatedAt || null,
        dueDate: installment.dueDate || null,
        status,
        type: 'installment',
        notes: installment.notes || null
      });
    });
  });

  const combinedUpcoming = [...upcomingPayments, ...installmentEntries]
    .sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.createdAt || Date.now()).getTime();
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.createdAt || Date.now()).getTime();
      return dateA - dateB;
    })
    .slice(0, parsedLimit);

  res.status(200).json({
    success: true,
    data: combinedUpcoming
  });
});

// @desc    Get overdue installments count for the authenticated client
// @route   GET /api/client/wallet/overdue-count
// @access  Client only
const getOverdueInstallmentsCount = asyncHandler(async (req, res, next) => {
  const clientId = req.client?.id || req.user?.id;
  const clientObjectId = toObjectId(clientId);

  if (!clientObjectId) {
    return next(new ErrorResponse('Client context not found', 401));
  }

  const projectsWithInstallments = await Project.find({
    client: clientObjectId,
    'installmentPlan.0': { $exists: true }
  })
    .select('name status installmentPlan')
    .lean();

  const now = new Date();
  let overdueCount = 0;
  let totalOverdueAmount = 0;

  projectsWithInstallments.forEach((project) => {
    const installments = Array.isArray(project.installmentPlan)
      ? project.installmentPlan
      : [];

    installments.forEach((installment) => {
      const amount = Number(installment.amount) || 0;
      if (amount <= 0) {
        return;
      }

      // Check if installment is overdue
      // An installment is overdue if:
      // 1. It's explicitly marked as 'overdue' by admin, OR
      // 2. It's not paid and the due date has passed
      const dueDate = installment.dueDate ? new Date(installment.dueDate) : null;
      const isOverdue = 
        installment.status === 'overdue' ||
        (installment.status !== 'paid' && dueDate && dueDate < now);

      if (isOverdue) {
        overdueCount++;
        totalOverdueAmount += amount;
      }
    });
  });

  res.status(200).json({
    success: true,
    data: {
      count: overdueCount,
      totalAmount: totalOverdueAmount,
      hasOverdue: overdueCount > 0
    }
  });
});

module.exports = {
  getWalletSummary,
  getWalletTransactions,
  getUpcomingPayments,
  getOverdueInstallmentsCount
};

