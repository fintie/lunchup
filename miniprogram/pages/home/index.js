const api = require('../../utils/api')
const { getUser } = require('../../utils/auth')

Page({
  data: {
    user: null,
    loading: true,
    stats: {
      jobs: 0,
      news: 0,
      highlights: 0
    },
    latestNews: [],
    error: ''
  },

  onShow() {
    this.setData({ user: getUser() })
    this.loadDashboard()
  },

  async loadDashboard() {
    this.setData({ loading: true, error: '' })
    try {
      const [news, jobs, highlights] = await Promise.all([
        api.get('/news'),
        api.get('/opportunities'),
        api.get('/wechat-highlights?limit=3')
      ])

      this.setData({
        stats: {
          jobs: jobs.itemCount || jobs.items?.length || 0,
          news: news.itemCount || news.items?.length || 0,
          highlights: highlights.items?.length || 0
        },
        latestNews: (news.items || []).slice(0, 3)
      })
    } catch (error) {
      this.setData({ error: error.message })
    } finally {
      this.setData({ loading: false })
    }
  },

  openPage(event) {
    wx.navigateTo({ url: event.currentTarget.dataset.url })
  },

  switchTab(event) {
    wx.switchTab({ url: event.currentTarget.dataset.url })
  }
})
