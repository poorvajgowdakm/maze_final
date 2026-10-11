const QRCode = require('qrcode');

const generateQR = async (meetingId, token) => {
  // Use frontend URL for the QR code
  const url = `http://localhost:3000/checkin/${token}`;
  try {
    const dataUrl = await QRCode.toDataURL(url, { width: 300 });
    return dataUrl;
  } catch (err) {
    console.error('QR Generate Error:', err);
    return null;
  }
};

module.exports = { generateQR };
