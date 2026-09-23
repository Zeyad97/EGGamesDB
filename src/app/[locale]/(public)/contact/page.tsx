"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { AtSign, Code2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Link } from "@/i18n/navigation";
import { useAuthStore } from "@/store/auth";
import { createClient } from "@/lib/supabase/client";

const channels = [
  {
    icon: Mail,
    labelKey: "channels.email",
    value: "hello@eggamedb.com",
    href: "mailto:hello@eggamedb.com",
  },
  {
    icon: Code2,
    labelKey: "channels.github",
    value: "github.com/Zeyad97/EGGamesDB",
    href: "https://github.com/Zeyad97/EGGamesDB",
  },
  {
    icon: AtSign,
    labelKey: "channels.twitter",
    value: "@eggamedb",
    href: "https://twitter.com/eggamedb",
  },
] as const;

export default function ContactPage() {
  const t = useTranslations("contact");
  const { profile, loading } = useAuthStore();
  const supabase = createClient();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(profile?.display_name || profile?.username || "");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile) {
      toast.error(t("login_toast"));
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      user_id: profile.id,
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: "new",
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t("success_toast"));
    setSubject("");
    setMessage("");
  };

  return (
    <div className="pb-4">
      <div className="store-container pt-5">
        <h1 className="text-xl font-semibold text-eg-heading">{t("title")}</h1>
        <p className="mt-1 text-xs text-eg-muted">{t("subtitle")}</p>

        <ul className="mt-5 divide-y divide-eg-border border-y border-eg-border">
          {channels.map((channel) => (
            <li key={channel.labelKey}>
              <a
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 py-2.5 transition-colors hover:text-eg-blue"
              >
                <channel.icon size={14} className="text-eg-muted" aria-hidden="true" />
                <span className="w-24 shrink-0 text-xs text-eg-muted">{t(channel.labelKey)}</span>
                <span className="text-[13px] text-eg-text-sub">{channel.value}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-6 max-w-2xl border border-eg-border bg-eg-card p-4">
          <h2 className="mb-4 text-[13px] font-semibold text-eg-heading">{t("form_title")}</h2>

          {!loading && !profile && (
            <div className="mb-4 border border-eg-border bg-eg-surface p-3">
              <p className="flex items-center gap-2 text-xs text-eg-text-sub">
                <Lock size={13} className="text-eg-muted" aria-hidden="true" />
                {t("login_notice")}
              </p>
              <Link
                href="/login"
                className="mt-2.5 inline-flex h-8 items-center rounded-sm bg-eg-blue px-3 text-xs font-medium text-[#0f1a24] transition-colors hover:bg-[#8bd2fa]"
              >
                {t("login_cta")}
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={t("name")}
                placeholder={t("name_placeholder")}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={!profile}
              />
              <Input
                label={t("email")}
                type="email"
                placeholder={t("email_placeholder")}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={!profile}
              />
            </div>
            <Input
              label={t("subject")}
              placeholder={t("subject_placeholder")}
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              disabled={!profile}
            />
            <Textarea
              label={t("message")}
              rows={5}
              placeholder={t("message_placeholder")}
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={!profile}
            />
            <Button type="submit" loading={submitting} disabled={!profile}>
              {t("send")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
