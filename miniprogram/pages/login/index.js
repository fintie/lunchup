const api = require('../../utils/api')
const { saveSession } = require('../../utils/auth')

Page({
  data: {
    email: '',
    password: '',
    loading: false,
    error: ''
  },

  updateField(event) {
    this.setData({ [event.currentTarget.dataset.field]: event.detail.value })
  },

  async submit() {
    if (!this.data.email || !this.data.password) {
      this.setData({ error: '请输入邮箱和密码' })
      return
    }

    this.setData({ loading: true, error: '' })
    try {
      const session = await api.post('/auth/login', {
        email: this.data.email.trim(),
        password: this.data.password
      })
      saveSession(session)
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => wx.switchTab({ url: '/pages/profile/index' }), 400)
    } catch (error) {
      this.setData({ error: error.message })
    } finally {
      this.setData({ loading: false })
    }
  },

  openRegister() {
    wx.navigateTo({ url: '/pages/register/index' })
  }
})
