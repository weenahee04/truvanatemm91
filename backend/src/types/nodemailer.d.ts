declare module 'nodemailer' {
  export interface Transporter {
    sendMail(options: any): Promise<{ messageId?: string }>;
    verify(): Promise<void>;
  }
  export function createTransport(options: any): Transporter;
}
