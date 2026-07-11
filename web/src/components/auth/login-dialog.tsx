import { useState } from "react";
import { KeyRound, LoaderCircle, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export function LoginDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { login } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password) return;
    setIsSubmitting(true);
    try {
      await login(password);
      await queryClient.invalidateQueries();
      toast.success(t("message.loginSuccess"));
      setPassword("");
      onOpenChange(false);
    } catch (error) {
      toast.error(t("message.loginFailed"), {
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-md border bg-muted text-primary">
              <KeyRound className="size-5" />
            </div>
            <DialogTitle>{t("auth.login")}</DialogTitle>
            <DialogDescription>{t("auth.description")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-5">
            <Label htmlFor="admin-password">{t("auth.password")}</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("action.cancel")}
            </Button>
            <Button type="submit" disabled={!password || isSubmitting}>
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <LogIn />
              )}
              {t("auth.login")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
