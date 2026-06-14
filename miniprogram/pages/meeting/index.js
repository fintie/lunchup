const api = require('../../utils/api')
const { getUser, requireLogin } = require('../../utils/auth')

Page({
  data: {
    user: null,
    meetings: [],
    loading: false,
    showForm: false,
    attendeeId: '',
    attendeeName: '',
    form: {
      date: '',
      time: '12:30',
      location: '',
      meetingPoint: '',
      topic: '',
      description: ''
    }
  },

  onLoad(options) {
    if (options.attendeeId) {
      this.setData({
        attendeeId: decodeURIComponent(options.attendeeId),
        attendeeName: decodeURIComponent(options.attendeeName || ''),
        showForm: true,
        'form.topic': `与 ${decodeURIComponent(options.attendeeName || 'LunchUp 好友')} 共进午餐`
      })
    }
  },

  onShow() {
    const user = getUser()
    this.setData({ user })
    if (user) this.loadMeetings()
  },

  async loadMeetings() {
    this.setData({ loading: true })
    try {
      const meetings = await api.get(`/meetings/user/${this.data.user.id}`, { auth: true })
      this.setData({ meetings: meetings || [] })
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  toggleForm() {
    if (!requireLogin()) return
    this.setData({ showForm: !this.data.showForm })
  },

  updateField(event) {
    this.setData({
      [`form.${event.currentTarget.dataset.field}`]: event.detail.value
    })
  },

  changeDate(event) {
    this.setData({ 'form.date': event.detail.value })
  },

  changeTime(event) {
    this.setData({ 'form.time': event.detail.value })
  },

  async submit() {
    const { form, attendeeId, user } = this.data
    if (!attendeeId) {
      wx.showToast({ title: '请先从匹配页选择邀约对象', icon: 'none' })
      return
    }
    if (!form.date || !form.meetingPoint || !form.topic) {
      wx.showToast({ title: '请填写日期、地点和话题', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      await api.post('/meetings', {
        hostId: user.id,
        attendees: [attendeeId],
        ...form
      }, { auth: true })
      wx.showToast({ title: '邀约已创建', icon: 'success' })
      this.setData({ showForm: false })
      this.loadMeetings()
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async updateStatus(event) {
    try {
      await api.put(`/meetings/${event.currentTarget.dataset.id}/status`, {
        status: event.currentTarget.dataset.status
      }, { auth: true })
      wx.showToast({ title: '状态已更新', icon: 'success' })
      this.loadMeetings()
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    }
  },

  goMatches() {
    wx.switchTab({ url: '/pages/matches/index' })
  },

  login() {
    wx.navigateTo({ url: '/pages/login/index' })
  }
})
