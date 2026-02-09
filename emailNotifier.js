import nodemailer from 'nodemailer'
import 'dotenv/config'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.kiranimani@gmail.com,
    pass: process.env.xfwj npwu uxfj wgvw
  }
})

export async function sendTestEmail() {
  await transporter.sendMail({
    from: `"Job Bot" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: '✅ Email system working',
    text: 'If you received this, email notifications are set up correctly.'
  })

  console.log('📧 Test email sent successfully')
}
