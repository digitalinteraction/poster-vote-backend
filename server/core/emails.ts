import * as crypto from 'crypto'
import * as sendgrid from '@sendgrid/mail'

/** Securely hash an email to be stored / checked */
// export const hashEmail = (email: string) =>
//   crypto
//     .createHmac('sha256', process.env.HASH_SECRET!)
//     .update(email)
//     .digest('base64')

export const hashEmail = (email: string) =>
  crypto
    .createHash('sha256')
    .update(email)
    .digest('base64')

/** Whether a string is an email */
export const isEmail = (value: string) => /^\S+@\S+$/i.test(value)

sendgrid.setApiKey(process.env.SENDGRID_API_KEY!)

export { sendgrid }
