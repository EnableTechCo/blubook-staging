"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import { startWorkGroupConversation } from "@/features/messages/groupActions";

// Clients address a work group rather than a person: the partner who picks it up
// is chosen for them, and never named.
export function NewWorkGroupConversation({
  workGroups,
}: {
  workGroups: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  if (workGroups.length === 0) return null;

  if (!open) {
    return (
      <div>
        <Button type="button" onClick={() => setOpen(true)}>
          Message a work group
        </Button>
      </div>
    );
  }

  return (
    <form action={startWorkGroupConversation} className="workspace-panel p-5">
      <h2 className="text-lg font-semibold text-ink">Message a work group</h2>
      <p className="mb-4 mt-1 text-xs leading-5 text-ink/60">
        Your message goes to the group, and one of its partners picks it up. You won&apos;t be told
        which — please don&apos;t share names or contact details.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="workGroupId" className={labelStyles}>
            Work group
          </label>
          <select id="workGroupId" name="workGroupId" required defaultValue="" className={fieldStyles}>
            <option value="" disabled>
              Choose a group…
            </option>
            {workGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="subject" className={labelStyles}>
            Subject
          </label>
          <input id="subject" name="subject" required maxLength={200} className={fieldStyles} />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="groupBody" className={labelStyles}>
          Message
        </label>
        <textarea
          id="groupBody"
          name="body"
          required
          rows={3}
          maxLength={2000}
          className="workspace-control mt-1.5 w-full resize-y rounded-md border border-ink/16 p-3 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-cobalt/60 focus:ring-[3px] focus:ring-cobalt/12"
        />
        <p className={helpTextStyles}>Keep names and contact details out of messages.</p>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Button type="submit">
          Send <span aria-hidden="true">→</span>
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-ink/55 hover:text-rust"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
