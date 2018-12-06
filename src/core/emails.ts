import crypto from 'crypto'
import sendgrid from '@sendgrid/mail'

/** Securely hash an email to be stored / checked */
export const hashEmail = (email: string) =>
  crypto
    .createHash('sha256')
    .update(email)
    .digest('base64')

/** Whether a string is an email */
export const isEmail = (value: string) => /^\S+@\S+$/i.test(value)

sendgrid.setApiKey(process.env.SENDGRID_API_KEY!)

export { sendgrid }
