const api = require('../../utils/api')
const { getUser, requireLogin } = require('../../utils/auth')

const samples = [
  {
    _id: 'sample-1',
    name: 'Emma Wilson',
    avatarLetter: 'E',
    professionalBackground: 'Canva 产品设计师',
    skills: ['UX 设计', 'Figma', '产品策略'],
    preferredTopics: ['创业', '设计思维'],
    preferredLocation: 'Melbourne CBD',
    matchScore: 95
  },
  {
    _id: 'sample-2',
    name: 'Liam Chen',
    avatarLetter: 'L',
    professionalBackground: 'Atlassian 软件工程师',
    skills: ['React', 'Java', '敏捷开发'],
    preferredTopics: ['AI', '职业发展'],
    preferredLocation: 'Sydney CBD',
    matchScore: 88
  },
  {
    _id: 'sample-3',
    name: 'Olivia Martinez',
    avatarLetter: 'O',
    professionalBackground: 'REA Group 市场经理',
    skills: ['品牌', 'SEO', '增长'],
    preferredTopics: ['市场创新', '人脉'],
    preferredLocation: 'Melbourne Fitzroy',
    matchScore: 82
  }
]

Page({
  data: {
    query: '',
    loading: true,
    matches: [],
    loggedIn: false,
    error: ''
  },

  onShow() {
    this.setData({ loggedIn: Boolean(getUser()) })
    this.loadMatches()
  },

  updateQuery(event) {
    this.setData({ query: event.detail.value })
  },

  async loadMatches() {
    const user = getUser()
    if (!user) {
      this.setData({ loading: true, error: '' })
      try {
        const users = await api.get('/users/featured')
        const matches = (users || []).map((item, index) => ({
          ...item,
          avatarLetter: item.name ? item.name.charAt(0) : 'L',
          matchScore: item.matchScore || Math.max(58, 96 - index * 3)
        }))
        this.setData({ matches: matches.length ? matches : samples })
      } catch (error) {
        this.setData({ matches: samples })
      } finally {
        this.setData({ loading: false })
      }
      return
    }

    this.setData({ loading: true, error: '' })
    try {
      const users = await api.get('/users', { auth: true })
      const matches = (users || []).map((item, index) => ({
        ...item,
        avatarLetter: item.name ? item.name.charAt(0) : 'L',
        matchScore: Math.max(58, 96 - index * 3)
      }))
      this.setData({ matches })
    } catch (error) {
      this.setData({ error: error.message, matches: samples })
    } finally {
      this.setData({ loading: false })
    }
  },

  async search() {
    if (!this.data.query.trim()) {
      this.loadMatches()
      return
    }

    this.setData({ loading: true, error: '' })
    try {
      const users = await api.post('/match/search', { query: this.data.query.trim() })
      this.setData({
        matches: (users || []).map((item) => ({
          ...item,
          avatarLetter: item.name ? item.name.charAt(0) : 'L',
          matchScore: 80
        }))
      })
    } catch (error) {
      this.setData({ error: error.message })
    } finally {
      this.setData({ loading: false })
    }
  },

  book(event) {
    if (!requireLogin()) return
    const { id, name } = event.currentTarget.dataset
    if (String(id).startsWith('sample-')) {
      wx.showToast({ title: '请从登录后的真实匹配中发起邀约', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/meeting/index?attendeeId=${encodeURIComponent(id)}&attendeeName=${encodeURIComponent(name)}`
    })
  }
})
