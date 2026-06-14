const getUser = () => wx.getStorageSync('lunchup_user') || null

const saveSession = ({ token, user }) => {
  wx.setStorageSync('lunchup_token', token)
  wx.setStorageSync('lunchup_user', user)
  getApp().globalData.user = user
}

const clearSession = () => {
  wx.removeStorageSync('lunchup_token')
  wx.removeStorageSync('lunchup_user')
  getApp().globalData.user = null
}

const requireLogin = () => {
  if (getUser()) return true

  wx.navigateTo({ url: '/pages/login/index' })
  return false
}

module.exports = {
  clearSession,
  getUser,
  requireLogin,
  saveSession
}
