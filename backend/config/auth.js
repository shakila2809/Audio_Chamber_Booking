module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  jwtExpiration: '24h',
  bcryptSaltRounds: 10,
  
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
    redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:5000/api/auth/microsoft/callback',
    scopes: [
      'openid',
      'profile', 
      'email',
      'User.Read',
      'Calendars.ReadWrite',
      'Mail.Send'
    ]
  }
};