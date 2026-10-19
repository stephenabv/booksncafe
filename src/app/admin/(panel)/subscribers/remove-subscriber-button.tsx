"use client";

import { useRouter } from "next/navigation";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { deleteSubscriber } from "@/server/actions/admin";

export function RemoveSubscriberButton({ id, email }: { id: number; email: string }) {
  const router = useRouter();
  return (
    <ConfirmActionButton
      action={() => deleteSubscriber(id)}
      label="Remove"
      confirmTitle="Remove subscriber?"
      confirmBody={`${email} will no longer be on the newsletter list.`}
      className="text-sm font-semibold text-red-700 hover:underline"
      onDone={() => router.refresh()}
    />
  );
}
