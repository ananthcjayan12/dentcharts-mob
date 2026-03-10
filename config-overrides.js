module.exports = function override(config) {
  const sourceMapRule = config.module.rules.find((rule) => {
    if (rule.enforce !== 'pre') {
      return false;
    }

    const uses = Array.isArray(rule.use) ? rule.use : rule.use ? [rule.use] : [];
    return uses.some((entry) => {
      if (typeof entry === 'string') {
        return entry.includes('source-map-loader');
      }
      return entry && typeof entry.loader === 'string' && entry.loader.includes('source-map-loader');
    });
  });

  if (sourceMapRule) {
    const exclusions = Array.isArray(sourceMapRule.exclude)
      ? sourceMapRule.exclude
      : sourceMapRule.exclude
        ? [sourceMapRule.exclude]
        : [];

    sourceMapRule.exclude = [...exclusions, /html2pdf\.js/];
  }

  return config;
};
