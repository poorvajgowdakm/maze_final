const { sendBookingConfirmation } = require('./src/services/emailService');

async function test() {
  console.log("Sending dummy email to puneet.gangur@gmail.com...");
  await sendBookingConfirmation('puneet.gangur@gmail.com', {
    title: 'System Integration Test',
    roomName: 'The Virtual Sandbox',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 3600000).toISOString(),
    priceNote: 'Free'
  });
  console.log("Done.");
}

test();
