'use strict';

// Production specific configuration
// =================================
module.exports = {
  // Server IP
  ip:     process.env.OPENSHIFT_NODEJS_IP ||
          process.env.IP ||
          undefined,

  // Server port
  port:   process.env.OPENSHIFT_NODEJS_PORT ||
          process.env.PORT ||
          8080,

  // MongoDB connection options
  mongo: {
    uri:  process.env.MONGODB_URI ||
          process.env.MONGOHQ_URL ||
          process.env.OPENSHIFT_MONGODB_DB_URL +
          process.env.OPENSHIFT_APP_NAME ||
          '73.52.243.35'
  },


    TWITTER_CONSUMER_KEY: 'Tn7n4WqMYSiBiTDqHY8D5dn4b',
    TWITTER_CONSUMER_SECRET: 'jyRQ3iwNumAUjPgYNl8NP2Eb2FA9ZF5FflHjvLoiwtcjtmW2pJ',
    TWITTER_ACCESS_TOKEN_KEY: '737871388661420032-0PWhPU47yTjV7yeoDwWuI3jYfmPAlgC',
    TWITTER_ACCESS_TOKEN_SECRET: 'un4r2WqNIPEihkHtDfJnWhfNj1JwisQN2ArjWFK3JSMql'
};
