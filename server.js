// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Increase JSON body size limit (for large certificate attachments)
app.use(bodyParser.json({ limit: '10mb' }));

// Configure your email transporter (using Gmail as an example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'youmail@example.com',       // Replace with your email
    pass: 'Your Pass'                // Replace with your email password or app password
  }
});

// Endpoint to send certificate email
app.post('/send-certificate', async (req, res) => {
  try {
    const { email, certificateData, filename } = req.body;
    // Remove the data URL prefix (e.g., "data:image/png;base64,")
    const base64Data = certificateData.split('base64,')[1];
    const mailOptions = {
      from: 'youmail@example.com',    // Your email address
      to: email,                       // Recipient email address
      subject: 'Your Certificate',
      text: 'Please find attached your certificate.',
      attachments: [{
        filename: filename || 'certificate.png',
        content: base64Data,
        encoding: 'base64'
      }]
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    res.json({ message: 'Email sent successfully', info });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
