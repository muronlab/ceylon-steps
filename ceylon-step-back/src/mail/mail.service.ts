import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { OnEvent } from '@nestjs/event-emitter';
import { OTP_TEMPLATE, WELCOME_TEMPLATE, compileTemplate } from './mail-templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendMail(to: string, subject: string, text: string, html?: string) {
    const host = (this.config.get<string>('SMTP_HOST') ?? '').trim();
    const from = (this.config.get<string>('SMTP_FROM') ?? '').trim();

    if (!host) {
      this.logger.warn(`SMTP_HOST not set; skipping email to ${to}. Subject: ${subject}`);
      return { ok: false, skipped: true };
    }

    const port = this.config.get<number>('SMTP_PORT') ?? 587;
    const user = this.config.get<string>('SMTP_USER') ?? '';
    const pass = this.config.get<string>('SMTP_PASS') ?? '';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    });

    await transporter.sendMail({
      to,
      from: from || user,
      subject,
      text,
      html,
    });

    return { ok: true };
  }

  @OnEvent('auth.otp.send')
  async handleSendOtpEmail(payload: { email: string; code: string }) {
    try {
      const html = compileTemplate(OTP_TEMPLATE, {
        code: payload.code,
        year: new Date().getFullYear(),
      });
      await this.sendMail(
        payload.email,
        'Your Verification Code - Ceylon Step',
        `Your code is ${payload.code}`,
        html,
      );
      this.logger.log(`OTP email sent to ${payload.email}`);
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${payload.email}`, err.stack);
    }
  }

  @OnEvent('auth.welcome.send')
  async handleSendWelcomeEmail(payload: { email: string; name: string }) {
    try {
      const html = compileTemplate(WELCOME_TEMPLATE, {
        name: payload.name,
        loginUrl: this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000',
        year: new Date().getFullYear(),
      });
      await this.sendMail(
        payload.email,
        'Welcome to Ceylon Step!',
        `Welcome ${payload.name}!`,
        html,
      );
      this.logger.log(`Welcome email sent to ${payload.email}`);
    } catch (err) {
      this.logger.error(`Failed to send welcome email to ${payload.email}`, err.stack);
    }
  }

  // Keep these for backward compatibility or direct calls if needed
  async sendOtpEmail(to: string, code: string) {
    return this.handleSendOtpEmail({ email: to, code });
  }

  async sendWelcomeEmail(to: string, name: string) {
    return this.handleSendWelcomeEmail({ email: to, name });
  }
}

