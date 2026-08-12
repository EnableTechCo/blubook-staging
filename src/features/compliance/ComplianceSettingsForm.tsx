"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { saveComplianceSetting, type ComplianceSettingState } from "@/features/compliance/actions";
import type { MetricSetting } from "@/features/compliance/wcr";

export function ComplianceSettingRow({ setting }: { setting: MetricSetting }) {
  const [state, action, pending] = useActionState<ComplianceSettingState, FormData>(
    saveComplianceSetting,
    undefined,
  );
  const failed = state !== undefined && "error" in state;

  return (
    <li className="border-b border-r border-ink bg-paper p-5">
      <form action={action} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] sm:items-end">
        <input type="hidden" name="metricKey" value={setting.metric_key} />

        <div className="min-w-0">
          <p className="font-heading text-[1.2rem] leading-tight text-ink">{setting.label}</p>
          <p className="mt-1 text-[11px] text-ink/50">
            {setting.direction === "higher_is_better" ? "Higher is better" : "Lower is better"}
          </p>
        </div>

        <div className="sm:w-28">
          <label htmlFor={`weight-${setting.metric_key}`} className={labelStyles}>
            Weight
          </label>
          <input
            id={`weight-${setting.metric_key}`}
            name="weight"
            type="number"
            min="0"
            step="0.5"
            defaultValue={setting.weight}
            className={fieldStyles}
          />
        </div>

        <div className="sm:w-36">
          <label htmlFor={`threshold-${setting.metric_key}`} className={labelStyles}>
            {setting.direction === "higher_is_better" ? "At least" : "At most"}
          </label>
          <input
            id={`threshold-${setting.metric_key}`}
            name="threshold"
            type="number"
            step="0.01"
            defaultValue={setting.threshold}
            className={fieldStyles}
          />
        </div>

        <div className="sm:w-28">
          <label htmlFor={`active-${setting.metric_key}`} className={labelStyles}>
            Scored
          </label>
          <select
            id={`active-${setting.metric_key}`}
            name="active"
            defaultValue={String(setting.active)}
            className={fieldStyles}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>

      {failed ? (
        <p role="alert" className="mt-3 text-[12px] leading-5 text-clay">
          {state.error}
        </p>
      ) : null}
    </li>
  );
}
