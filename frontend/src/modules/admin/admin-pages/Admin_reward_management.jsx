import React, { useState, useEffect, useCallback, useRef } from 'react'
import Admin_navbar from '../admin-components/Admin_navbar'
import Admin_sidebar from '../admin-components/Admin_sidebar'
import Loading from '../../../components/ui/loading'
import { useToast } from '../../../contexts/ToastContext'
import { adminRewardService } from '../admin-services/adminRewardService'
import {
  FiGift,
  FiDollarSign,
  FiCheckCircle,
  FiTrendingUp,
  FiPlus,
  FiTag,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiCode,
  FiShoppingCart,
  FiToggleLeft,
  FiToggleRight,
  FiTrash2,
  FiCalendar
} from 'react-icons/fi'

const initialFilters = {
  team: 'all',
  status: 'all',
  tag: 'all',
  search: ''
}

const initialRewardForm = {
  name: '',
  description: '',
  amount: '',
  team: 'dev',
  criteriaType: 'points',
  criteriaValue: '',
  criteriaDescription: '',
  tags: [],
  startsOn: '',
  endsOn: ''
}

const initialTagForm = {
  name: '',
  description: '',
  color: '#2563eb'
}

const formatCurrency = (value = 0) => {
  const amount = Number(value) || 0
  return `₹${amount.toLocaleString('en-IN')}`
}

const formatDate = (value) => {
  if (!value) return null
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    return null
  }
}

const getTeamInfo = (team) => {
  if (team === 'sales') {
    return {
      label: 'Sales Team',
      icon: FiShoppingCart,
      badgeClasses: 'bg-amber-100 text-amber-700'
    }
  }

  return {
    label: 'Development Team',
    icon: FiCode,
    badgeClasses: 'bg-blue-100 text-blue-700'
  }
}

const describeCriteria = (reward) => {
  if (!reward?.criteria) {
    return 'No criteria configured'
  }

  const { type, value } = reward.criteria

  if (reward.team === 'dev') {
    return `Award when developer reaches ${value} points`
  }

  if (type === 'leadsConverted') {
    return `Award when ${value} leads are converted`
  }

  if (type === 'target') {
    return `Award when target of ${formatCurrency(value)} is achieved`
  }

  return 'Award criteria not specified'
}

const Admin_reward_management = () => {
  const { toast } = useToast()
  const hasLoadedOnce = useRef(false)

  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingRewards, setLoadingRewards] = useState(false)
  const [submittingReward, setSubmittingReward] = useState(false)
  const [submittingTag, setSubmittingTag] = useState(false)

  const [rewards, setRewards] = useState([])
  const [tags, setTags] = useState([])
  const [totals, setTotals] = useState({
    count: 0,
    active: 0,
    inactive: 0,
    budget: 0
  })

  const [filters, setFilters] = useState(initialFilters)
  const [rewardForm, setRewardForm] = useState(initialRewardForm)
  const [tagForm, setTagForm] = useState(initialTagForm)

  const fetchTags = useCallback(async () => {
    try {
      const response = await adminRewardService.getTags()
      setTags(response.data || [])
    } catch (error) {
      const message = error.message || 'Failed to load tags'
      toast.error(message)
    }
  }, [toast])

  const fetchRewards = useCallback(async (currentFilters, showLoader = true) => {
    if (showLoader) {
      setLoadingRewards(true)
    }

    try {
      const normalizedFilters = {
        ...currentFilters,
        search: currentFilters.search?.trim() || ''
      }

      const response = await adminRewardService.getRewards(normalizedFilters)
      setRewards(response.data || [])
      setTotals(response.totals || {
        count: 0,
        active: 0,
        inactive: 0,
        budget: 0
      })
    } catch (error) {
      const message = error.message || 'Failed to load rewards'
      toast.error(message)
    } finally {
      if (showLoader) {
        setLoadingRewards(false)
      }
    }
  }, [toast])

  useEffect(() => {
    const loadInitialData = async () => {
      setInitialLoading(true)
      try {
        await Promise.all([
          fetchTags(),
          fetchRewards(initialFilters, false)
        ])
      } finally {
        setInitialLoading(false)
        hasLoadedOnce.current = true
      }
    }

    loadInitialData()
  }, [fetchRewards, fetchTags])

  useEffect(() => {
    if (!hasLoadedOnce.current) {
      return
    }
    fetchRewards(filters)
  }, [filters, fetchRewards])

  const handleRefresh = () => {
    fetchRewards(filters)
    fetchTags()
  }

  const handleRewardFormChange = (event) => {
    const { name, value } = event.target

    setRewardForm((prev) => {
      if (name === 'team') {
        const nextTeam = value
        return {
          ...prev,
          team: nextTeam,
          criteriaType: nextTeam === 'sales' ? 'leadsConverted' : 'points',
          criteriaValue: ''
        }
      }

      if (name === 'criteriaType') {
        return {
          ...prev,
          criteriaType: value,
          criteriaValue: ''
        }
      }

      return {
        ...prev,
        [name]: value
      }
    })
  }

  const toggleRewardTag = (tagId) => {
    setRewardForm((prev) => {
      const exists = prev.tags.includes(tagId)
      return {
        ...prev,
        tags: exists
          ? prev.tags.filter((id) => id !== tagId)
          : [...prev.tags, tagId]
      }
    })
  }

  const handleCreateReward = async (event) => {
    event.preventDefault()

    const trimmedName = rewardForm.name.trim()

    if (!trimmedName) {
      toast.error('Reward name is required')
      return
    }

    const amount = Number(rewardForm.amount)
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Reward amount must be a positive number')
      return
    }

    const criteriaValue = Number(rewardForm.criteriaValue)
    if (Number.isNaN(criteriaValue) || criteriaValue <= 0) {
      const message = rewardForm.team === 'dev'
        ? 'Please enter the points required'
        : rewardForm.criteriaType === 'target'
          ? 'Please enter the target amount'
          : 'Please enter the number of leads required'

      toast.error(message)
      return
    }

    const payload = {
      name: trimmedName,
      description: rewardForm.description.trim() || undefined,
      amount,
      team: rewardForm.team,
      criteriaType: rewardForm.team === 'dev' ? 'points' : rewardForm.criteriaType,
      criteriaValue,
      criteriaDescription: rewardForm.criteriaDescription.trim() || undefined,
      tags: rewardForm.tags,
      startsOn: rewardForm.startsOn || undefined,
      endsOn: rewardForm.endsOn || undefined
    }

    setSubmittingReward(true)
    try {
      await adminRewardService.createReward(payload)
      toast.success('Reward created successfully')
      setRewardForm((prev) => ({
        ...initialRewardForm,
        team: prev.team,
        criteriaType: prev.team === 'sales' ? 'leadsConverted' : 'points'
      }))
      fetchRewards(filters)
    } catch (error) {
      const message = error.message || 'Failed to create reward'
      toast.error(message)
    } finally {
      setSubmittingReward(false)
    }
  }

  const handleToggleStatus = async (rewardId) => {
    try {
      const response = await adminRewardService.toggleRewardStatus(rewardId)
      setRewards((prev) =>
        prev.map((reward) =>
          reward._id === rewardId ? response.data || reward : reward
        )
      )
      toast.success('Reward status updated')
      fetchRewards(filters, false)
    } catch (error) {
      const message = error.message || 'Failed to update reward status'
      toast.error(message)
    }
  }

  const handleDeleteReward = async (rewardId) => {
    const confirmed = window.confirm('Delete this reward permanently?')
    if (!confirmed) {
      return
    }

    try {
      await adminRewardService.deleteReward(rewardId)
      toast.success('Reward deleted')
      fetchRewards(filters)
    } catch (error) {
      const message = error.message || 'Failed to delete reward'
      toast.error(message)
    }
  }

  const handleCreateTag = async (event) => {
    event.preventDefault()

    const trimmedName = tagForm.name.trim()

    if (!trimmedName) {
      toast.error('Tag name is required')
      return
    }

    setSubmittingTag(true)
    try {
      const response = await adminRewardService.createTag({
        name: trimmedName,
        description: tagForm.description.trim() || undefined,
        color: tagForm.color
      })

      setTags((prev) => [...prev, response.data])
      toast.success('Tag created successfully')
      setTagForm(initialTagForm)
    } catch (error) {
      const message = error.message || 'Failed to create tag'
      toast.error(message)
    } finally {
      setSubmittingTag(false)
    }
  }

  const handleDeleteTag = async (tagId) => {
    const confirmed = window.confirm('Delete this tag? Tags used by rewards cannot be removed.')
    if (!confirmed) {
      return
    }

    try {
      await adminRewardService.deleteTag(tagId)
      setTags((prev) => prev.filter((tag) => tag._id !== tagId))
      setRewardForm((prev) => ({
        ...prev,
        tags: prev.tags.filter((id) => id !== tagId)
      }))
      toast.success('Tag deleted')
    } catch (error) {
      const message = error.message || 'Failed to delete tag'
      toast.error(message)
    }
  }

  const handleSearchChange = (event) => {
    const { value } = event.target
    setFilters((prev) => ({
      ...prev,
      search: value
    }))
  }

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Admin_navbar />
        <Admin_sidebar />
        <div className="ml-64 pt-20 p-8">
          <div className="max-w-6xl mx-auto">
            <Loading size="large" className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Admin_navbar />
      <Admin_sidebar />

      <div className="ml-64 pt-20 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reward Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Create monetary rewards for development and sales teams. Dev rewards trigger on points, sales rewards on conversions or targets.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                type="button"
              >
                <FiRefreshCw className="text-base" />
                Refresh
              </button>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <FiGift />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Total Rewards</p>
                  <p className="text-xl font-bold text-blue-900">{totals.count}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-green-100 bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <FiCheckCircle />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-green-600">Active Rewards</p>
                  <p className="text-xl font-bold text-green-900">{totals.active}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <FiDollarSign />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-purple-600">Total Budget</p>
                  <p className="text-xl font-bold text-purple-900">{formatCurrency(totals.budget)}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <form
              onSubmit={handleCreateReward}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-lg bg-blue-100 p-2 text-blue-600">
                  <FiDollarSign />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Create Reward</h2>
                  <p className="text-sm text-gray-500">Rewards are always monetary. Set the amount and criteria.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reward name</span>
                  <input
                    type="text"
                    name="name"
                    value={rewardForm.name}
                    onChange={handleRewardFormChange}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Eg. Sprint Performance Bonus"
                    required
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reward amount (₹)</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    name="amount"
                    value={rewardForm.amount}
                    onChange={handleRewardFormChange}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter amount"
                    required
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Team</span>
                  <select
                    name="team"
                    value={rewardForm.team}
                    onChange={handleRewardFormChange}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="dev">Development (points)</option>
                    <option value="sales">Sales (conversions / target)</option>
                  </select>
                </label>

                {rewardForm.team === 'sales' && (
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sales criteria</span>
                    <select
                      name="criteriaType"
                      value={rewardForm.criteriaType}
                      onChange={handleRewardFormChange}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="leadsConverted">Leads converted</option>
                      <option value="target">Target amount achieved</option>
                    </select>
                  </label>
                )}

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {rewardForm.team === 'dev'
                      ? 'Points required'
                      : rewardForm.criteriaType === 'target'
                        ? 'Target amount (₹)'
                        : 'Leads to convert'}
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    name="criteriaValue"
                    value={rewardForm.criteriaValue}
                    onChange={handleRewardFormChange}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder={rewardForm.team === 'dev' ? 'Eg. 200' : 'Eg. 10'}
                    required
                  />
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description (optional)</span>
                  <textarea
                    name="description"
                    value={rewardForm.description}
                    onChange={handleRewardFormChange}
                    rows={3}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Add additional details or guidelines"
                  />
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Criteria notes (optional)</span>
                  <textarea
                    name="criteriaDescription"
                    value={rewardForm.criteriaDescription}
                    onChange={handleRewardFormChange}
                    rows={2}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Outline how the reward is tracked"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Starts on</span>
                    <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
                      <FiCalendar className="text-gray-400" />
                      <input
                        type="date"
                        name="startsOn"
                        value={rewardForm.startsOn}
                        onChange={handleRewardFormChange}
                        className="w-full border-none bg-transparent text-sm focus:outline-none"
                      />
                    </div>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ends on</span>
                    <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
                      <FiCalendar className="text-gray-400" />
                      <input
                        type="date"
                        name="endsOn"
                        value={rewardForm.endsOn}
                        onChange={handleRewardFormChange}
                        className="w-full border-none bg-transparent text-sm focus:outline-none"
                      />
                    </div>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tags (optional)</span>
                  {tags.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">Create tags to categorise your rewards.</p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag._id}
                          type="button"
                          onClick={() => toggleRewardTag(tag._id)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                            rewardForm.tags.includes(tag._id)
                              ? 'border-transparent text-white'
                              : 'border-gray-300 text-gray-600 hover:border-gray-400'
                          }`}
                          style={{
                            backgroundColor: rewardForm.tags.includes(tag._id) ? tag.color : 'transparent'
                          }}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingReward}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  <FiPlus />
                  {submittingReward ? 'Creating...' : 'Create reward'}
                </button>
              </div>
            </form>

            <form
              onSubmit={handleCreateTag}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-lg bg-amber-100 p-2 text-amber-600">
                  <FiTag />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Create Tag</h2>
                  <p className="text-sm text-gray-500">Group rewards by purpose or goal.</p>
                </div>
              </div>

              <label className="mb-4 flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tag name</span>
                <input
                  type="text"
                  name="name"
                  value={tagForm.name}
                  onChange={(event) => setTagForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Eg. Sprint, Offer, Milestone"
                  required
                />
              </label>

              <label className="mb-4 flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description (optional)</span>
                <textarea
                  name="description"
                  value={tagForm.description}
                  onChange={(event) => setTagForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Explain how this tag should be used"
                />
              </label>

              <label className="mb-6 flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tag colour</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={tagForm.color}
                    onChange={(event) => setTagForm((prev) => ({ ...prev, color: event.target.value }))}
                    className="h-10 w-16 cursor-pointer rounded border border-gray-300"
                  />
                  <span className="text-sm text-gray-600">{tagForm.color}</span>
                </div>
              </label>

              <button
                type="submit"
                disabled={submittingTag}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
              >
                <FiPlus />
                {submittingTag ? 'Creating...' : 'Create tag'}
              </button>

              {tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">Existing tags</h3>
                  <div className="space-y-2">
                    {tags.map((tag) => (
                      <div
                        key={tag._id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <div>
                            <p className="font-medium text-gray-800">{tag.name}</p>
                            {tag.description && (
                              <p className="text-xs text-gray-500">{tag.description}</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteTag(tag._id)}
                          className="text-gray-400 transition hover:text-red-500"
                          title="Delete tag"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Rewards</h2>
                <p className="text-sm text-gray-500">Manage active monetary rewards for both teams.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-56">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={handleSearchChange}
                    placeholder="Search rewards"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-9 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <FiFilter className="text-gray-400" />
                    <select
                      name="team"
                      value={filters.team}
                      onChange={handleFilterChange}
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="all">All teams</option>
                      <option value="dev">Development</option>
                      <option value="sales">Sales</option>
                    </select>
                  </label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active only</option>
                    <option value="inactive">Inactive only</option>
                  </select>
                  <select
                    name="tag"
                    value={filters.tag}
                    onChange={handleFilterChange}
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">All tags</option>
                    {tags.map((tag) => (
                      <option key={tag._id} value={tag._id}>{tag.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {loadingRewards ? (
              <div className="mt-10 flex justify-center">
                <Loading size="medium" />
              </div>
            ) : rewards.length === 0 ? (
              <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <FiTrendingUp className="text-2xl" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-gray-700">No rewards found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Adjust your filters or create a reward to get started.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {rewards.map((reward) => {
                  const teamInfo = getTeamInfo(reward.team)
                  const TeamIcon = teamInfo.icon
                  const rewardTags = (reward.tags || [])
                    .map((tag) => (typeof tag === 'object' ? tag : tags.find((item) => item._id === tag)))
                    .filter(Boolean)

                  return (
                    <article
                      key={reward._id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${teamInfo.badgeClasses}`}>
                              <TeamIcon className="text-sm" />
                              {teamInfo.label}
                            </span>
                            <h3 className="text-lg font-semibold text-gray-900">{reward.name}</h3>
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                              {formatCurrency(reward.amount)}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${reward.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {reward.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {reward.description && (
                            <p className="text-sm text-gray-600">{reward.description}</p>
                          )}
                          <p className="text-sm font-medium text-gray-800">{describeCriteria(reward)}</p>
                          {reward.criteria?.description && (
                            <p className="text-xs text-gray-500">{reward.criteria.description}</p>
                          )}
                          {rewardTags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              {rewardTags.map((tag) => (
                                <span
                                  key={tag._id}
                                  className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                                  style={{ backgroundColor: tag.color }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {(reward.startsOn || reward.endsOn) && (
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                              {reward.startsOn && (
                                <div className="flex items-center gap-1">
                                  <FiCalendar />
                                  <span>Starts {formatDate(reward.startsOn)}</span>
                                </div>
                              )}
                              {reward.endsOn && (
                                <div className="flex items-center gap-1">
                                  <FiCalendar />
                                  <span>Ends {formatDate(reward.endsOn)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 md:flex-col md:items-end">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(reward._id)}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                              reward.isActive
                                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {reward.isActive ? <FiToggleRight className="text-lg" /> : <FiToggleLeft className="text-lg" />}
                            {reward.isActive ? 'Mark inactive' : 'Mark active'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReward(reward._id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                          >
                            <FiTrash2 />
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default Admin_reward_management

