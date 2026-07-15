require('dotenv').config();

const app = require('./index');
const { startReminderCron } = require('./src/jobs/reminderJob');
const { startFlyerOffersCron } = require('./src/jobs/flyerOffersJob');
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  startReminderCron();
  startFlyerOffersCron();
});
