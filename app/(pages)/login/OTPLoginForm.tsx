"use client";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { LoginOTPAction, LoginResendOTPAction } from "@/app/actions/login";
import {
  LoginOTPValidationSchema,
  TypeLoginOTPValidationSchema,
} from "@/app/validation/login";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";

type Props = {
  verification_attempts: number;
  resend_remaining: number;
  lockdown: number | null;
  max_verification_attempts: number;
  max_otp_resends: number;
};

const OTPLoginForm = ({
  verification_attempts,
  resend_remaining,
  lockdown,
  max_otp_resends,
  max_verification_attempts,
}: Props) => {
  const [resendLoading, setResendLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(LoginOTPValidationSchema),
  });

  const router = useRouter();

  async function submit(data: TypeLoginOTPValidationSchema) {
    const { error } = await LoginOTPAction(data);
    setValue("otp", "");

    if (error) {
      toast.error(error, { position: "top-center" });
    } else {
      toast.success("Logged In", { position: "top-center" });
      router.push("/dashboard");
    }
  }

  async function resend() {
    setResendLoading(true);
    try {
      const { error } = await LoginResendOTPAction();

      if (error) {
        toast.error(error, { position: "top-center" });
      } else {
        toast.success("OTP Resent", { position: "top-center" });
      }
    } catch (error) {
      toast.error("Something went wrong", { position: "top-center" });
    } finally {
      setResendLoading(false);
    }
  }

  if (lockdown) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Account on Lockdown</CardTitle>
          <CardDescription onClick={() => resend()}>
            We have noticed too many failed attempts at logging in from this
            account.
          </CardDescription>
          <CardDescription onClick={() => resend()}>
            {`The account will be in lockdown till ${new Date(new Date().getTime() + lockdown).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <form
      className="flex items-center w-full justify-center"
      onSubmit={handleSubmit(submit)}
    >
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>OTP Sent on Registered Email</CardTitle>
          <CardDescription onClick={() => resend()}>
            Haven't received OTP yet?{" "}
            <span
              className={`underline ${resendLoading ? "pointer-events-none text-neutral-300 cursor-none" : "text-blue-600 cursor-pointer"}`}
            >
              {`Resend OTP ${resend_remaining}/${max_otp_resends}`}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="otp"
            render={({ field, fieldState }) => (
              <Field className="w-fit">
                <FieldLabel htmlFor="digits-only">6 Digit OTP</FieldLabel>
                <InputOTP
                  id="digits-only"
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={field.value}
                  onChange={(e) => field.onChange(e)}
                  aria-invalid={fieldState.error ? true : false}
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot
                      index={0}
                      className="rounded-md shadow-none border"
                    />
                    <InputOTPSlot
                      index={1}
                      className="rounded-md shadow-none border"
                    />
                    <InputOTPSlot
                      index={2}
                      className="rounded-md shadow-none border"
                    />
                    <InputOTPSlot
                      index={3}
                      className="rounded-md shadow-none border"
                    />
                    <InputOTPSlot
                      index={4}
                      className="rounded-md shadow-none border"
                    />
                    <InputOTPSlot
                      index={5}
                      className="rounded-md shadow-none border"
                    />
                  </InputOTPGroup>
                </InputOTP>
                <FieldDescription>
                  {`Verification Attempts : ${verification_attempts}/${max_verification_attempts}`}
                </FieldDescription>
                <FieldError>
                  {fieldState.error ? fieldState.error.message : ""}
                </FieldError>
              </Field>
            )}
          />
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            type="submit"
            className="w-full"
            disabled={
              verification_attempts === max_verification_attempts ||
              isSubmitting
            }
          >
            Login {isSubmitting ? <Spinner /> : <ArrowRight />}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default OTPLoginForm;
