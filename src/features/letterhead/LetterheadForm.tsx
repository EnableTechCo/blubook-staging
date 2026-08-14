"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import { saveLetterhead, type LetterheadState_ } from "@/features/company/actions";
import type { LetterheadSettings } from "@/features/letterhead/queries";

function Toggle({
  name, label, help, checked,
}: { name: string; label: string; help: string; checked: boolean }) {
  return (
    <label className="flex items-start gap-3 border border-ink/20 bg-paper px-4 py-3">
      <input type="checkbox" name={name} defaultChecked={checked} className="mt-1 size-4 accent-cobalt" />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="mt-0.5 block text-[12px] leading-5 text-ink/55">{help}</span>
      </span>
    </label>
  );
}

export function LetterheadForm({
  settings,
  gaps,
  ready,
}: {
  settings: LetterheadSettings | null;
  gaps: string[];
  ready: boolean;
}) {
  const [state, action, pending] = useActionState<LetterheadState_, FormData>(
    saveLetterhead,
    undefined,
  );

  return (
    <section className="border border-ink bg-paper-light px-5 py-5">
      <h2 className="font-heading text-2xl leading-none">Letterhead</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
        Your paper. Quotations and notices are printed onto it, so what you set here appears on
        everything you send. The details themselves come from your customer record and your banking
        details above — change one and the letterhead follows, rather than going stale.
      </p>

      {gaps.length > 0 ? (
        <div className="mt-4 border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-[13px] leading-6 text-ink">
          <p className="font-semibold">The letterhead will print without:</p>
          <ul className="mt-1 list-disc pl-5">
            {gaps.map((gap) => <li key={gap}>{gap}</li>)}
          </ul>
        </div>
      ) : null}

      <form action={action} className="mt-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Toggle name="showDirector" label="Director" help="The primary contact and job title from your record." checked={settings?.show_director ?? true} />
          <Toggle name="showRegistration" label="Registration & VAT" help="Company registration and VAT number." checked={settings?.show_registration ?? true} />
          <Toggle name="showBanking" label="Banking details" help="Bank, account and branch, in the footer. Filed copies of quotations can be read by BluBook staff, so turn this off to keep the account off them." checked={settings?.show_banking ?? true} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="contactEmail" className={labelStyles}>Public email <span className="font-normal text-ink/45">(optional)</span></label>
            <input id="contactEmail" name="contactEmail" type="email" defaultValue={settings?.contact_email ?? ""} className={fieldStyles} />
            <p className={helpTextStyles}>Blank uses nothing — your login email is never printed.</p>
          </div>
          <div>
            <label htmlFor="contactPhone" className={labelStyles}>Telephone <span className="font-normal text-ink/45">(optional)</span></label>
            <input id="contactPhone" name="contactPhone" defaultValue={settings?.contact_phone ?? ""} className={fieldStyles} />
            <p className={helpTextStyles}>Blank falls back to the number on your record.</p>
          </div>
          <div>
            <label htmlFor="website" className={labelStyles}>Website <span className="font-normal text-ink/45">(optional)</span></label>
            <input id="website" name="website" defaultValue={settings?.website ?? ""} className={fieldStyles} />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="footerNote" className={labelStyles}>Standing footer line <span className="font-normal text-ink/45">(optional)</span></label>
          <input id="footerNote" name="footerNote" maxLength={400} defaultValue={settings?.footer_note ?? ""} className={fieldStyles} />
          <p className={helpTextStyles}>Terms, a disclaimer, or anything that should appear at the foot of every document.</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-ink/30 pt-5">
          {state && "error" in state ? (
            <p role="alert" className="mr-auto text-[13px] leading-5 text-clay">{state.error}</p>
          ) : state && "ok" in state ? (
            <p role="status" className="mr-auto text-[13px] leading-5 text-teal">Saved.</p>
          ) : null}
          {ready ? (
            <a
              href="/api/letterhead"
              className="inline-flex min-h-10 items-center border border-cobalt px-4 py-2 text-xs font-semibold text-cobalt hover:bg-cobalt hover:text-paper"
            >
              Download the blank letterhead
            </a>
          ) : null}
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save letterhead"}</Button>
        </div>
      </form>
    </section>
  );
}
