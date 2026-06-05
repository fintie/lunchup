function assignRole(skills) {
  const match = (keywords) =>
    keywords.some(kw => skills.some(s => s.toLowerCase().includes(kw)));

  if (match(['ml', 'ai', 'llm', 'machine learning', 'deep learning'])) return 'AI Engineer';
  if (match(['figma', 'design', 'ui', 'ux'])) return 'Designer';
  if (match(['product', 'strategy', 'business', 'pm'])) return 'Product Thinker';
  return 'Builder';
}

module.exports = { assignRole };