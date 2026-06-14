App({
  globalData: {
    apiBaseUrl: 'https://lunchup.onrender.com/api',
    user: null
  },

  onLaunch() {
    this.globalData.user = wx.getStorageSync('lunchup_user') || null
  }
})
