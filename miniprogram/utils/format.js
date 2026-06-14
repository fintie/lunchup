const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const normaliseTags = (tags = []) => tags.flat(Infinity).filter(Boolean).slice(0, 5)

module.exports = {
  formatDate,
  normaliseTags
}
