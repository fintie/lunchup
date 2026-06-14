const api = require('../../utils/api')
const { saveSession } = require('../../utils/auth')

Page({
  data: {
    form: {
      name: '',
      email: '',
      password: '',
      professionalBackground: '',
      skills: '',
      preferredTopics: '',
      preferredLocation: '',
      preferredMeetingPoint: '',
      rawInterestText: ''
    },
    loading: false,
    error: ''
  },

  updateField(event) {
    this.setData({
      [`form.${event.currentTarget.dataset.field}`]: event.detail.value
    })
  },

  async submit() {
    const form = this.data.form
    if (!form.name || !form.email || !form.password) {
      this.setData({ error: '请填写姓名、邮箱和密码' })
      return
    }

    this.setData({ loading: true, error: '' })
    try {
      const session = await api.post('/users/register', {
        ...form,
        skills: form.skills.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
        preferredTopics: form.preferredTopics.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
        eventInterests: form.rawInterestText.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
        eventNotificationFrequency: 'DAILY'
      })
      saveSession(session)
      wx.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => wx.switchTab({ url: '/pages/matches/index' }), 400)
    } catch (error) {
      this.setData({ error: error.message })
    } finally {
      this.setData({ loading: false })
    }
  }
})
