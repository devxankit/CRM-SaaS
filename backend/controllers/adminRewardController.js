const mongoose = require('mongoose');
const Reward = require('../models/Reward');
const RewardTag = require('../models/RewardTag');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

const buildRewardQuery = (filters = {}) => {
  const query = {};

  if (filters.team) {
    query.team = filters.team;
  }

  if (filters.status) {
    query.isActive = filters.status === 'active';
  }

  if (filters.tag && mongoose.Types.ObjectId.isValid(filters.tag)) {
    query.tags = filters.tag;
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    query.$or = [
      { name: searchRegex },
      { description: searchRegex }
    ];
  }

  return query;
};

exports.getRewards = asyncHandler(async (req, res) => {
  const { team, status, tag, search } = req.query;
  const filters = buildRewardQuery({ team, status, tag, search });

  const rewards = await Reward.find(filters)
    .populate('tags')
    .sort({ createdAt: -1 })
    .lean();

  const totals = {
    count: rewards.length,
    active: rewards.filter(reward => reward.isActive).length,
    inactive: rewards.filter(reward => !reward.isActive).length,
    budget: rewards.reduce((sum, reward) => sum + reward.amount, 0)
  };

  res.json({
    success: true,
    data: rewards,
    totals
  });
});

exports.getRewardById = asyncHandler(async (req, res, next) => {
  const reward = await Reward.findById(req.params.id).populate('tags');

  if (!reward) {
    return next(new ErrorResponse('Reward not found', 404));
  }

  res.json({
    success: true,
    data: reward
  });
});

exports.createReward = asyncHandler(async (req, res, next) => {
  const {
    name,
    description,
    amount,
    team,
    criteriaType,
    criteriaValue,
    criteriaDescription,
    tags = [],
    startsOn,
    endsOn
  } = req.body;

  if (!name || !amount || !team || !criteriaType) {
    return next(new ErrorResponse('Name, amount, team and criteriaType are required', 400));
  }

  if (!['dev', 'sales'].includes(team)) {
    return next(new ErrorResponse('Team must be either dev or sales', 400));
  }

  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    return next(new ErrorResponse('Amount must be a positive number', 400));
  }

  const criteria = {
    type: criteriaType,
    value: criteriaValue,
    description: criteriaDescription
  };

  if (tags.length > 0) {
    const validTagIds = tags.filter(tagId => mongoose.Types.ObjectId.isValid(tagId));
    if (validTagIds.length !== tags.length) {
      return next(new ErrorResponse('One or more tags are invalid', 400));
    }

    const existingTags = await RewardTag.find({ _id: { $in: validTagIds }, isActive: true }).select('_id');
    if (existingTags.length !== validTagIds.length) {
      return next(new ErrorResponse('One or more tags do not exist or are inactive', 400));
    }
  }

  const reward = await Reward.create({
    name,
    description,
    amount,
    team,
    criteria,
    tags,
    startsOn,
    endsOn
  });

  const populatedReward = await Reward.findById(reward._id).populate('tags');

  res.status(201).json({
    success: true,
    data: populatedReward
  });
});

exports.updateReward = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updates = { ...req.body };

  const reward = await Reward.findById(id);

  if (!reward) {
    return next(new ErrorResponse('Reward not found', 404));
  }

  if (updates.amount !== undefined) {
    if (typeof updates.amount !== 'number' || Number.isNaN(updates.amount) || updates.amount <= 0) {
      return next(new ErrorResponse('Amount must be a positive number', 400));
    }
  }

  if (updates.team && !['dev', 'sales'].includes(updates.team)) {
    return next(new ErrorResponse('Team must be either dev or sales', 400));
  }

  if (updates.criteriaType || updates.criteriaValue !== undefined || updates.criteriaDescription !== undefined) {
    reward.criteria = {
      type: updates.criteriaType || reward.criteria.type,
      value: updates.criteriaValue !== undefined ? updates.criteriaValue : reward.criteria.value,
      description: updates.criteriaDescription !== undefined ? updates.criteriaDescription : reward.criteria.description
    };

    delete updates.criteriaType;
    delete updates.criteriaValue;
    delete updates.criteriaDescription;
  }

  if (updates.tags) {
    const tags = Array.isArray(updates.tags) ? updates.tags : [];
    const validTagIds = tags.filter(tagId => mongoose.Types.ObjectId.isValid(tagId));
    if (validTagIds.length !== tags.length) {
      return next(new ErrorResponse('One or more tags are invalid', 400));
    }

    const existingTags = await RewardTag.find({ _id: { $in: validTagIds }, isActive: true }).select('_id');
    if (existingTags.length !== validTagIds.length) {
      return next(new ErrorResponse('One or more tags do not exist or are inactive', 400));
    }

    reward.tags = tags;
    delete updates.tags;
  }

  Object.assign(reward, updates);
  await reward.save();

  const populatedReward = await Reward.findById(id).populate('tags');

  res.json({
    success: true,
    data: populatedReward
  });
});

exports.toggleRewardStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const reward = await Reward.findById(id);

  if (!reward) {
    return next(new ErrorResponse('Reward not found', 404));
  }

  reward.isActive = !reward.isActive;
  await reward.save();

  res.json({
    success: true,
    data: reward
  });
});

exports.deleteReward = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const reward = await Reward.findById(id);

  if (!reward) {
    return next(new ErrorResponse('Reward not found', 404));
  }

  await reward.deleteOne();

  res.json({
    success: true,
    message: 'Reward deleted successfully'
  });
});

exports.getTags = asyncHandler(async (req, res) => {
  const tags = await RewardTag.find({}).sort({ name: 1 }).lean();

  res.json({
    success: true,
    data: tags
  });
});

exports.createTag = asyncHandler(async (req, res, next) => {
  const { name, description, color } = req.body;

  if (!name) {
    return next(new ErrorResponse('Tag name is required', 400));
  }

  const existing = await RewardTag.findOne({ name: name.trim() });
  if (existing) {
    return next(new ErrorResponse('Tag name already exists', 409));
  }

  const tag = await RewardTag.create({
    name: name.trim(),
    description,
    color
  });

  res.status(201).json({
    success: true,
    data: tag
  });
});

exports.deleteTag = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const tag = await RewardTag.findById(id);

  if (!tag) {
    return next(new ErrorResponse('Tag not found', 404));
  }

  const isTagUsed = await Reward.exists({ tags: id });
  if (isTagUsed) {
    return next(new ErrorResponse('Tag cannot be deleted while assigned to rewards', 400));
  }

  await tag.deleteOne();

  res.json({
    success: true,
    message: 'Tag deleted successfully'
  });
});

