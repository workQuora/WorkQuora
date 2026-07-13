import { UserCheck, Lock, MessageCircle, Clock, Tag } from "lucide-react";
import { TRUST_ITEMS } from "@/lib/landingData";

const ICONS = { kyc: UserCheck, escrow: Lock, chat: MessageCircle, clock: Clock, fees: Tag };

export default function TrustPriority() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <h2 className="text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Your Trust is Our Priority
      </h2>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {TRUST_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <div key={item.title} className="rounded-2xl border border-border bg-surface p-6 text-center shadow-sm transition-shadow hover:shadow-md">
              <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5.5 w-5.5" />
              </span>
              <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
