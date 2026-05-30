import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export const metadata = { title: "Contact | Arabian Food Subscription" };

export default function ContactPage() {
  const items = [
    { icon: Phone, label: "Phone", value: "+82 10-0000-0000" },
    { icon: Mail, label: "Email", value: "hello@arabian.kr" },
    { icon: MessageCircle, label: "KakaoTalk", value: "@arabianfood" },
    { icon: MapPin, label: "Service area", value: "Major cities across South Korea" },
  ];
  return (
    <div className="container-x py-16">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">Get in touch</p>
        <h1 className="mt-2 text-4xl font-bold md:text-5xl">Contact Us</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
          Questions about delivery, allergies or your subscription? Reach out — we
          reply in English, and we&apos;re happy to help.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.label} className="card flex items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-warm text-white">
              <it.icon size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gold">{it.label}</div>
              <div className="mt-0.5 text-ink-secondary">{it.value}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-ink-muted">
        For delivery support, log in to your dashboard and check your order status,
        or message us on KakaoTalk for the fastest reply.
      </p>
    </div>
  );
}
