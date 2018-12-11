/*
 *  Utilities to manage the sending and hashing of emails
 */

import crypto from 'crypto'
import sendgrid from '@sendgrid/mail'
import { MailData } from '@sendgrid/helpers/classes/mail'

/** Securely hash an email to be stored / checked */
export const hashEmail = (email: string) =>
  crypto
    .createHash('sha256')
    .update(email)
    .digest('base64')

/** Whether a string is an email */
export const isEmail = (value: string) => /^\S+@\S+$/i.test(value)

sendgrid.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendEmail(data: MailData): Promise<any> {
  if (process.env.NODE_ENV === 'testing') {
    return testEmails.add(data.to as string)
  } else {
    return sendgrid.send(data) as any
  }
}

export const testEmails = new Set<string>()
