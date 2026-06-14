const api = require('../../utils/api')
const { clearSession, getUser } = require('../../utils/auth')

Page({
  data: {
    user: null,
    avatarLetter: '',
    profile: {},
    loading: false
  },

  onShow() {
    const user = getUser()
    this.setData({
      user,
      avatarLetter: user?.name ? user.name.charAt(0) : '',
      profile: {}
    })
    if (user) this.loadProfile()
  },

  async loadProfile() {
    this.setData({ loading: true })
    try {
      const profile = await api.get('/users/me', { auth: true })
      this.setData({ profile })
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  login() {
    wx.navigateTo({ url: '/pages/login/index' })
  },

  openMeetings() {
    wx.navigateTo({ url: '/pages/meeting/index' })
  },

  logout() {
    clearSession()
    this.setData({ user: null, profile: null })
    wx.showToast({ title: '已退出', icon: 'success' })
  }
})
