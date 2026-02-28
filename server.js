import express from "express";
import nodemailer from "nodemailer";

const app = express();
app.use(express.json({ limit: "1mb" }));

const SECRET = process.env.WEBHOOK_SECRET;

const transporter = nodemailer.createTransport({
  host: "smtp.dondominio.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

app.get("/", (req, res) => res.send("BETONIZA mailer OK"));

app.post("/order", async (req, res) => {
  try {
    if (SECRET && req.headers["x-betoniza-secret"] !== SECRET) {
      return res.status(401).send("Unauthorized");
    }

    const { email, order_number, amount, order_details, order_date } = req.body || {};
    if (!email) return res.status(400).send("No email");

    const safe = (s) => String(s ?? "").replace(/[<>]/g, "");

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial;max-width:640px;margin:0 auto;padding:24px;color:#111;">
        <div style="letter-spacing:.18em;font-size:13px;">BETONIZA</div>
        <div style="height:18px;"></div>

        <div style="font-size:22px;">Thank you — we’ve received your order.</div>
        <div style="height:14px;"></div>

        <div style="font-size:14px;line-height:1.7;">
          <div><b>Order:</b> ${safe(order_number)}</div>
          <div><b>Date:</b> ${safe(order_date)}</div>
          <div><b>Total:</b> ${safe(amount)}</div>
        </div>

        <div style="height:18px;"></div>
        <hr style="border:none;border-top:1px solid #eee;">
        <div style="height:12px;"></div>

        <div style="font-size:14px;line-height:1.7;white-space:pre-wrap;">
          ${safe(order_details)}
        </div>

        <div style="height:18px;"></div>
        <hr style="border:none;border-top:1px solid #eee;">
        <div style="height:14px;"></div>

        <div style="font-size:14px;line-height:1.7;">
          Production time: 2–4 business days.<br>
          Tracking will be emailed once your order ships.
        </div>

        <div style="height:26px;"></div>
        <div style="font-size:14px;">— BETONIZA<br>Granada, Spain</div>
      </div>
    `;

    await transporter.sendMail({
      from: `BETONIZA <${process.env.SMTP_USER}>`,
      to: email,
      subject: `BETONIZA — Order ${safe(order_number)}`,
      html
    });

    res.send("OK");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Server running")
);
