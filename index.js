import matual from 'matual'
import { sendTestEmail } from './emailNotifier.js'

sendTestEmail()
  .catch(err => console.error('❌ Email failed:', err.message))
