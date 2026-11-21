import type { MailMessage } from './mailer';

/**
 * Plain-text, bilingual (Arabic first, then English) transactional emails.
 * Links point at the web app, which calls the API with the token.
 */

export function verificationEmail(to: string, username: string, link: string): MailMessage {
  return {
    to,
    subject: 'تأكيد بريدك الإلكتروني | Verify your email',
    text: [
      `مرحبًا ${username}،`,
      'لتأكيد بريدك الإلكتروني افتح الرابط التالي (صالح لمدة 24 ساعة):',
      link,
      'إذا لم تنشئ حسابًا، تجاهل هذه الرسالة.',
      '',
      '---',
      '',
      `Hi ${username},`,
      'Confirm your email address by opening this link (valid for 24 hours):',
      link,
      "If you didn't create an account, ignore this email.",
    ].join('\n'),
  };
}

export function passwordResetEmail(to: string, username: string, link: string): MailMessage {
  return {
    to,
    subject: 'إعادة تعيين كلمة المرور | Reset your password',
    text: [
      `مرحبًا ${username}،`,
      'طلبت إعادة تعيين كلمة المرور. افتح الرابط التالي (صالح لمدة 30 دقيقة):',
      link,
      'إذا لم تطلب ذلك، تجاهل هذه الرسالة؛ كلمة مرورك لم تتغير.',
      '',
      '---',
      '',
      `Hi ${username},`,
      'You asked to reset your password. Open this link (valid for 30 minutes):',
      link,
      "If you didn't ask for this, ignore this email; your password hasn't changed.",
    ].join('\n'),
  };
}
