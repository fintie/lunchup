const api = require('../../utils/api')
const { formatDate } = require('../../utils/format')

Page({
  data: {
    loading: true,
    news: [],
    error: ''
  },

  onLoad() {
    this.loadNews()
  },

  async loadNews() {
    try {
      const response = await api.get('/news')
      this.setData({
        news: (response.items || []).map((item) => ({
          ...item,
          dateLabel: formatDate(item.publishedAt)
        }))
      })
    } catch (error) {
      this.setData({ error: error.message })
    } finally {
      this.setData({ loading: false })
    }
  },

  copyLink(event) {
    wx.setClipboardData({
      data: event.currentTarget.dataset.url,
      success() {
        wx.showToast({ title: '新闻链接已复制', icon: 'success' })
      }
    })
  }
})
