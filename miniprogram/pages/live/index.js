const api = require('../../utils/api')
const { formatDate } = require('../../utils/format')
const { getUser, requireLogin } = require('../../utils/auth')

const scenes = [
  { id: 1, status: '正在午餐', place: 'Sydney CBD', topic: 'AI 产品与创业', people: 2 },
  { id: 2, status: '等待连接', place: 'Circular Quay', topic: '职业发展', people: 1 },
  { id: 3, status: '可以约饭', place: 'Surry Hills', topic: '设计与增长', people: 1 }
]

Page({
  data: {
    scenes,
    highlights: [],
    user: null,
    showComposer: false,
    highlightContent: '',
    loading: true,
    error: ''
  },

  onLoad() {
    this.loadHighlights()
  },

  onShow() {
    this.setData({ user: getUser() })
  },

  onPullDownRefresh() {
    this.loadHighlights().finally(() => wx.stopPullDownRefresh())
  },

  async loadHighlights() {
    this.setData({ loading: true, error: '' })
    try {
      const response = await api.get('/wechat-highlights?limit=20')
      this.setData({
        highlights: (response.items || []).map((item) => ({
          ...item,
          dateLabel: formatDate(item.messageTimestamp)
        }))
      })
    } catch (error) {
      this.setData({ error: error.message })
    } finally {
      this.setData({ loading: false })
    }
  },

  toggleComposer() {
    if (!requireLogin()) return
    this.setData({ showComposer: !this.data.showComposer })
  },

  updateHighlight(event) {
    this.setData({ highlightContent: event.detail.value })
  },

  pasteClipboard() {
    wx.getClipboardData({
      success: ({ data }) => this.setData({ highlightContent: data || '' })
    })
  },

  async submitHighlight() {
    const content = this.data.highlightContent.trim()
    if (!content) {
      wx.showToast({ title: '请先粘贴或输入亮点', icon: 'none' })
      return
    }

    try {
      await api.post('/wechat-highlights/submit', {
        roomName: 'AI Cafe',
        content
      }, { auth: true })
      wx.showToast({ title: '亮点已发布', icon: 'success' })
      this.setData({ showComposer: false, highlightContent: '' })
      this.loadHighlights()
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    }
  }
})
