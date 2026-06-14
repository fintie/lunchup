const api = require('../../utils/api')
const { formatDate } = require('../../utils/format')

Page({
  data: {
    city: '',
    events: [],
    loading: true,
    error: ''
  },

  onLoad() {
    this.loadEvents()
  },

  updateCity(event) {
    this.setData({ city: event.detail.value })
  },

  async loadEvents() {
    this.setData({ loading: true, error: '' })
    try {
      const query = this.data.city.trim() ? `?city=${encodeURIComponent(this.data.city.trim())}` : ''
      const response = await api.get(`/events${query}`)
      this.setData({
        events: (response.items || []).map((item) => ({
          ...item,
          categories: item.categoryJson?.categories || [],
          dateLabel: formatDate(item.startTime)
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
        wx.showToast({ title: '活动链接已复制', icon: 'success' })
      }
    })
  }
})
