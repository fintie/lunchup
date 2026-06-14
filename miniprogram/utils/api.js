const getBaseUrl = () => getApp().globalData.apiBaseUrl

const request = ({ url, method = 'GET', data, auth = false }) => {
  const token = wx.getStorageSync('lunchup_token')
  const header = { 'content-type': 'application/json' }

  if (auth && token) {
    header.Authorization = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getBaseUrl()}${url}`,
      method,
      data,
      header,
      timeout: 15000,
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data)
          return
        }

        if (response.statusCode === 401) {
          wx.removeStorageSync('lunchup_token')
          wx.removeStorageSync('lunchup_user')
        }

        reject(new Error(response.data?.message || `请求失败（${response.statusCode}）`))
      },
      fail(error) {
        reject(new Error(error.errMsg || '网络连接失败'))
      }
    })
  })
}

module.exports = {
  get: (url, options = {}) => request({ url, auth: options.auth }),
  post: (url, data, options = {}) => request({
    url,
    method: 'POST',
    data,
    auth: options.auth
  }),
  put: (url, data, options = {}) => request({
    url,
    method: 'PUT',
    data,
    auth: options.auth
  })
}
