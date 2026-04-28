import * as functions from 'firebase-functions';
import sgMail = require('@sendgrid/mail');
import { config } from '../shared/validateEnv';
import type {
  CreditPurchasedData,
  CreditRefundedData,
  EmailNotificationData,
  EmailTemplate,
  MessageAcceptedData,
  MessageReceivedData,
  MessageRejectedData,
} from './types';

sgMail.setApiKey(config.SENDGRID_KEY);

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? '';
const FROM_NAME = process.env.SENDGRID_FROM_NAME ?? 'Your App';

const log = (msg: string, data?: object) =>
  functions.logger.info(`[emailNotification] ${msg}`, data ?? {});

// ─── Templates ────────────────────────────────────────────────────────────────

function buildTemplate(data: EmailNotificationData): EmailTemplate {
  switch (data.type) {
    case 'message_received':
      return messageReceived(data);
    case 'message_accepted':
      return messageAccepted(data);
    case 'message_rejected':
      return messageRejected(data);
    case 'credit_purchased':
      return creditPurchased(data);
    case 'credit_refunded':
      return creditRefunded(data);
  }
}

function messageReceived(d: MessageReceivedData): EmailTemplate {
  return {
    subject: `New message request from ${d.senderName}`,
    text:
      `Hi ${d.displayName},\n\n` +
      `You have a new message request from ${d.senderName}.\n\n` +
      `Message ID: ${d.messageId}\n\n` +
      'Log in to your inbox to review and respond.\n' +
      'This message will expire in 7 days if not viewed.\n\n' +
      `${FROM_NAME}`,
  };
}

function messageAccepted(d: MessageAcceptedData): EmailTemplate {
  return {
    subject: 'Your message was accepted — chat is now open!',
    text:
      `Hi ${d.displayName},\n\n` +
      `Great news! ${d.employerName} has accepted your message request.\n\n` +
      'Your chat is now open for 30 days. Log in to continue the conversation.\n\n' +
      `Message ID: ${d.messageId}\n\n` +
      `${FROM_NAME}`,
  };
}

function messageRejected(d: MessageRejectedData): EmailTemplate {
  return {
    subject: 'Your message request was declined',
    text:
      `Hi ${d.displayName},\n\n` +
      'Unfortunately, your message request has been declined by the recruiter.\n\n' +
      `Reason: ${d.reason}\n\n` +
      'You can explore other opportunities on the platform.\n\n' +
      `Message ID: ${d.messageId}\n\n` +
      `${FROM_NAME}`,
  };
}

function creditPurchased(d: CreditPurchasedData): EmailTemplate {
  const amount = (d.amountPaid / 100).toFixed(2);
  const currency = d.currency.toUpperCase();
  return {
    subject: `Receipt — ${d.credits} credits added to your account`,
    text:
      `Hi ${d.displayName},\n\n` +
      'Thank you for your purchase!\n\n' +
      `Plan: ${d.plan}\n` +
      `Credits added: ${d.credits}\n` +
      `Amount charged: ${currency} ${amount}\n` +
      `Payment ID: ${d.paymentId}\n\n` +
      'Your credits are now available in your account.\n\n' +
      `${FROM_NAME}`,
  };
}

function creditRefunded(d: CreditRefundedData): EmailTemplate {
  return {
    subject: `Credit refunded — ${d.credits} credit${d.credits !== 1 ? 's' : ''} returned to your account`,
    text:
      `Hi ${d.displayName},\n\n` +
      `We've refunded ${d.credits} credit${d.credits !== 1 ? 's' : ''} to your account.\n\n` +
      `Reason: ${d.reason}\n\n` +
      'Your credits are ready to use on your next opportunity.\n\n' +
      `${FROM_NAME}`,
  };
}

// ─── Send ─────────────────────────────────────────────────────────────────────

export async function sendEmailNotification(data: EmailNotificationData): Promise<void> {
  if (!FROM_EMAIL) {
    throw new Error('SENDGRID_FROM_EMAIL environment variable is not set.');
  }

  const template = buildTemplate(data);

  log('Sending email', { type: data.type, to: data.toEmail });

  try {
    await sgMail.send({
      to: data.toEmail,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: template.subject,
      text: template.text,
    });
    log('Email sent', { type: data.type, to: data.toEmail });
  } catch (err: unknown) {
    const sgError = err as { response?: { body?: unknown }; message?: string };
    functions.logger.error('[emailNotification] SendGrid error', {
      type: data.type,
      to: data.toEmail,
      message: sgError?.message,
      body: sgError?.response?.body,
    });
    throw new Error(`Failed to send ${data.type} email to ${data.toEmail}: ${sgError?.message ?? 'unknown error'}`);
  }
}
