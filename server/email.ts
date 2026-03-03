import sgMail from "@sendgrid/mail";

const NOTIFICATION_RECIPIENTS = [
  "sherelle.li@oceanveo.ai",
  "jessie.jia@oceanveo.ai",
  "andrew.marvel@oceanveo.ai",
  "roger@oceanveo.ai",
];

const FROM_EMAIL = "noreply@oceanveo.ai";

export async function sendContactNotification(contact: {
  name: string;
  email: string;
  company?: string;
  message: string;
}) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn("SENDGRID_API_KEY not set — skipping email notification");
    return;
  }

  sgMail.setApiKey(apiKey);

  const msg = {
    to: NOTIFICATION_RECIPIENTS,
    from: FROM_EMAIL,
    subject: `New Contact Form Submission from ${contact.name}`,
    text: `New contact form submission:\n\nName: ${contact.name}\nEmail: ${contact.email}\nCompany: ${contact.company || "N/A"}\n\nMessage:\n${contact.message}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a1628; color: #ffffff; border-radius: 12px;">
        <h2 style="color: #8bdaef; margin-bottom: 24px;">New Contact Form Submission</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; color: #8bdaef; font-weight: 600; width: 100px;">Name</td>
            <td style="padding: 12px 0; color: #ffffff;">${contact.name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #8bdaef; font-weight: 600;">Email</td>
            <td style="padding: 12px 0; color: #ffffff;"><a href="mailto:${contact.email}" style="color: #8bdaef;">${contact.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #8bdaef; font-weight: 600;">Company</td>
            <td style="padding: 12px 0; color: #ffffff;">${contact.company || "N/A"}</td>
          </tr>
        </table>
        <div style="margin-top: 24px; padding: 16px; background: #06152e; border-radius: 8px; border-left: 3px solid #8bdaef;">
          <p style="color: #8bdaef; font-weight: 600; margin: 0 0 8px 0;">Message</p>
          <p style="color: #ffffff; margin: 0; line-height: 1.6;">${contact.message}</p>
        </div>
        <p style="margin-top: 32px; font-size: 12px; color: #475569;">This email was sent from the Oceanveo contact form.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("Contact notification emails sent successfully");
  } catch (error: any) {
    console.error("Failed to send contact notification:", error?.response?.body || error.message);
  }
}
