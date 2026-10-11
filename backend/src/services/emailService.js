const { Resend } = require('resend');

// Using Resend API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

const sendBookingConfirmation = async (toEmail, meetingDetails) => {
  try {
    const startDate = new Date(meetingDetails.startTime);
    const endDate = new Date(meetingDetails.endTime);

    const dateStr = startDate.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const startTimeStr = startDate.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
    const endTimeStr = endDate.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const data = await resend.emails.send({
      from: 'MazeOut Bookings <bookings@maze.pabit.in>', 
      to: toEmail,
      subject: `✅ Booking Confirmed: ${meetingDetails.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #18181b; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background-color: #27272a; border-radius: 16px; overflow: hidden; border: 1px solid #3f3f46;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #9f1239 0%, #86198f 50%, #27272a 100%); padding: 32px 40px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td>
                            <span style="font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">📅 MazeOut</span>
                          </td>
                          <td align="right">
                            <span style="display: inline-block; background: rgba(255,255,255,0.15); color: #ffffff; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 20px; letter-spacing: 0.5px;">CONFIRMED</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 36px 40px;">
                      <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #fafafa;">Your room is booked! 🎉</h1>
                      <p style="margin: 0 0 28px; font-size: 15px; color: #a1a1aa; line-height: 1.5;">
                        Your meeting room has been successfully reserved. Here are the details:
                      </p>

                      <!-- Details Card -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #3f3f46; border-radius: 12px; overflow: hidden;">
                        <tr>
                          <td style="padding: 24px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                              
                              <!-- Meeting Title -->
                              <tr>
                                <td style="padding-bottom: 16px; border-bottom: 1px solid #52525b;">
                                  <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px;">Meeting</p>
                                  <p style="margin: 0; font-size: 18px; font-weight: 600; color: #fafafa;">${meetingDetails.title}</p>
                                </td>
                              </tr>

                              <!-- Room -->
                              <tr>
                                <td style="padding: 16px 0; border-bottom: 1px solid #52525b;">
                                  <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px;">Room</p>
                                  <p style="margin: 0; font-size: 16px; font-weight: 500; color: #e4e4e7;">🏢 ${meetingDetails.roomName}</p>
                                </td>
                              </tr>

                              <!-- Date & Time -->
                              <tr>
                                <td style="padding: 16px 0; border-bottom: 1px solid #52525b;">
                                  <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px;">Date & Time</p>
                                  <p style="margin: 0 0 2px; font-size: 16px; font-weight: 500; color: #e4e4e7;">🗓 ${dateStr}</p>
                                  <p style="margin: 0; font-size: 15px; color: #a1a1aa;">🕐 ${startTimeStr} — ${endTimeStr}</p>
                                </td>
                              </tr>

                              <!-- Pricing -->
                              <tr>
                                <td style="padding-top: 16px;">
                                  <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px;">Cost</p>
                                  <p style="margin: 0; font-size: 16px; font-weight: 600; color: #fb7185;">${meetingDetails.priceNote || 'Free'}</p>
                                </td>
                              </tr>
                              
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 28px;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0; font-size: 13px; color: #71717a; line-height: 1.6;">
                              Need to reschedule or cancel? Log in to your MazeOut dashboard to manage your bookings.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px; background-color: #1f1f23; border-top: 1px solid #3f3f46;">
                      <p style="margin: 0; font-size: 12px; color: #52525b; text-align: center;">
                        © ${new Date().getFullYear()} MazeOut — Smart Meeting Room Scheduling
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });
    console.log('✅ Confirmation email sent to', toEmail, ':', data);
    return data;
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
  }
};

module.exports = {
  sendBookingConfirmation
};
