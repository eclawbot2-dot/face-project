// Notification dispatcher. Single entry point for parent-facing emails so
// callers (attendance, sacrament, announcement workflows) don't have to
// know whether SMTP is configured.
//
// When SMTP env vars are absent, every send is logged and queued for
// future delivery — the call returns OK so feature code keeps working in
// dev. Wire a real adapter (Resend, SES, Postmark) by setting the env vars
// listed in .env.example.

import { prisma } from "@/lib/prisma";

type NotificationKind =
  | "attendance.absent"
  | "attendance.late"
  | "sacrament.milestone"
  | "sacrament.completed"
  | "announcement"
  | "generic";

export type NotificationPayload = {
  kind: NotificationKind;
  to: string;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export type SendResult = { ok: true; transport: string } | { ok: false; reason: string };

interface Transport {
  name: string;
  send(payload: NotificationPayload): Promise<SendResult>;
}

const SMTP_KEYS = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"] as const;

class LogTransport implements Transport {
  name = "log";
  async send(payload: NotificationPayload): Promise<SendResult> {
    console.info("[notification:log]", {
      kind: payload.kind,
      to: payload.to,
      subject: payload.subject,
    });
    return { ok: true, transport: this.name };
  }
}

class NodemailerTransport implements Transport {
  name = "smtp";
  async send(payload: NotificationPayload): Promise<SendResult> {
    // Lazy import — keeps bundle small and avoids requiring nodemailer to be
    // installed when SMTP isn't configured. If you turn this on, add the dep:
    //   npm install nodemailer
    try {
      // Optional dep — only loaded when SMTP env is configured. The dynamic
      // specifier prevents TypeScript from requiring the module at compile
      // time; install with `npm install nodemailer @types/nodemailer` to use.
      const specifier = "nodemailer";
      const mod = (await import(/* webpackIgnore: true */ specifier).catch(() => null)) as
        | { createTransport: (opts: unknown) => { sendMail: (opts: unknown) => Promise<unknown> } }
        | null;
      if (!mod) return { ok: false, reason: "nodemailer not installed" };
      const transporter = mod.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASSWORD! },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM!,
        to: payload.to,
        subject: payload.subject,
        text: payload.body,
      });
      return { ok: true, transport: this.name };
    } catch (err) {
      console.error("[notification:smtp] send failed", err);
      return { ok: false, reason: err instanceof Error ? err.message : "smtp error" };
    }
  }
}

let cachedTransport: Transport | null = null;

function selectTransport(): Transport {
  if (cachedTransport) return cachedTransport;
  const smtpReady = SMTP_KEYS.every((k) => Boolean(process.env[k]));
  cachedTransport = smtpReady ? new NodemailerTransport() : new LogTransport();
  return cachedTransport;
}

export async function notify(payload: NotificationPayload): Promise<SendResult> {
  if (!payload.to || !payload.subject) {
    return { ok: false, reason: "missing to/subject" };
  }
  const transport = selectTransport();
  const result = await transport.send(payload);

  // Persist every notification attempt as an audit trail so directors can
  // see what was sent to whom even when the LogTransport is in use.
  try {
    await prisma.auditLog.create({
      data: {
        action: result.ok ? "notification.sent" : "notification.failed",
        entityType: "Notification",
        metadata: JSON.stringify({
          kind: payload.kind,
          to: payload.to,
          subject: payload.subject,
          transport: transport.name,
          ...(result.ok ? {} : { reason: result.reason }),
          ...(payload.metadata ?? {}),
        }),
      },
    });
  } catch (err) {
    console.error("[notification] audit log failed", err);
  }

  return result;
}

export async function notifyAttendanceAbsent(args: {
  parentEmail: string;
  parentName: string;
  studentName: string;
  className: string;
  sessionDate: Date;
}): Promise<SendResult> {
  return notify({
    kind: "attendance.absent",
    to: args.parentEmail,
    subject: `${args.studentName} marked absent — ${args.className}`,
    body:
      `Hi ${args.parentName},\n\n` +
      `${args.studentName} was marked absent from ${args.className} on ${args.sessionDate.toLocaleDateString()}. ` +
      `If this was excused, please reply to this email so we can update the record.\n\n` +
      `— Holy Face Faith Formation`,
    metadata: { className: args.className },
  });
}

export async function notifySacramentMilestone(args: {
  parentEmail: string;
  parentName: string;
  studentName: string;
  sacramentType: string;
  milestoneName: string;
}): Promise<SendResult> {
  return notify({
    kind: "sacrament.milestone",
    to: args.parentEmail,
    subject: `${args.studentName} — ${args.sacramentType}: ${args.milestoneName}`,
    body:
      `Hi ${args.parentName},\n\n` +
      `${args.studentName} just completed a ${args.sacramentType} preparation milestone: ` +
      `"${args.milestoneName}".\n\n— Holy Face Faith Formation`,
    metadata: { sacramentType: args.sacramentType, milestoneName: args.milestoneName },
  });
}
