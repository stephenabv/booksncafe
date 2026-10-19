"use client";

import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { deleteRecordAction } from "@/server/actions/admin";

export function DeleteRecordButton({ resourceKey, id, title, singular }: { resourceKey: string; id: number; title: string; singular: string }) {
  return (
    <ConfirmActionButton
      action={() => deleteRecordAction(resourceKey, id)}
      label={`Delete ${singular.toLowerCase()}`}
      confirmTitle={`Delete “${title}”?`}
      confirmBody="This permanently removes it from the website and can’t be undone. To hide it temporarily, untick “Published” instead."
    />
  );
}
