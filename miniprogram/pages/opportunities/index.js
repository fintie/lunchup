const api = require('../../utils/api')
const { formatDate, normaliseTags } = require('../../utils/format')

Page({
  data: {
    loading: true,
    jobs: [],
    categories: ['全部', 'AI', 'Data', 'IT', 'Marketing'],
    category: '全部',
    error: ''
  },

  onLoad() {
    this.loadJobs()
  },

  async loadJobs() {
    this.setData({ loading: true, error: '' })
    try {
      const response = await api.get('/opportunities')
      const jobs = (response.items || []).map((item) => ({
        ...item,
        dateLabel: formatDate(item.publishedAt),
        displayTags: normaliseTags(item.tags)
      }))
      this.allJobs = jobs
      this.setData({ jobs })
    } catch (error) {
      this.setData({ error: error.message })
    } finally {
      this.setData({ loading: false })
    }
  },

  filter(event) {
    const category = event.currentTarget.dataset.category
    this.setData({
      category,
      jobs: category === '全部'
        ? this.allJobs
        : this.allJobs.filter((item) => item.category === category)
    })
  },

  copyLink(event) {
    wx.setClipboardData({
      data: event.currentTarget.dataset.url,
      success() {
        wx.showToast({ title: '申请链接已复制', icon: 'success' })
      }
    })
  }
})
