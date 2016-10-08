/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';
import Thing from '../api/thing/thing.model';
import User from '../api/user/user.model';

Thing.find({}).remove()
  .then(() => {
    Thing.create({
        name : "Security",
        keywords: ["secure","risk","management","porfolio"]
      },
      {
        name: "Application",
        keywords: ["future", "prediction", "propriatary", "algorithm"]
      },
      {
        name: "Health",
        keywords: ["bacteria", "antibacterial", "infection", "pathogen"]
      },
      {
        name : "Violence",
        keywords: ["hate", "victim", "terrorism", "rescue", "attack"]
      },
      {
        name: "Business",
        keywords: ["stock", "capital", "market", "profit"]
      }
  );
});

User.find({}).remove()
  .then(() => {
    User.create({
      provider: 'local',
      name: 'Test User',
      email: 'test@example.com',
      password: 'test'
    }, {
      provider: 'local',
      role: 'admin',
      name: 'Admin',
      email: 'admin@example.com',
      password: 'admin'
    })
    .then(() => {
      console.log('finished populating users');
    });
  });
