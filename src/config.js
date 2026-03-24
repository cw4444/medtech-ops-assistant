require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
};
