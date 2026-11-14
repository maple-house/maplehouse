"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LoginEmailValidationSchema,
  TypeLoginEmailValidationSchema,
} from "../../validation/login";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { ArrowRight } from "lucide-react";
import { LoginEmailAction } from "../../actions/login";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const EmailLoginForm = () => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(LoginEmailValidationSchema),
  });

  async function submit(data: TypeLoginEmailValidationSchema) {
    const { error } = await LoginEmailAction(data);

    if (error) {
      toast.error(error, { position: "top-center" });
    } else {
      toast.success("OTP Sent", { position: "top-center" });
    }
  }

  return (
    <form
      className="flex items-center w-full justify-center"
      onSubmit={handleSubmit(submit)}
    >
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Don't have an account yet ?{" "}
            <span className="text-blue-600 underline cursor-pointer">
              Sign Up.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="email-login">Email</FieldLabel>
                <Input
                  aria-invalid={fieldState.error ? true : false}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  id="email-login"
                  placeholder="youremail@example.com"
                  required
                />
                <FieldError>
                  {fieldState.error ? fieldState.error.message : ""}
                </FieldError>
              </Field>
            )}
          />
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            Login {isSubmitting ? <Spinner /> : <ArrowRight />}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default EmailLoginForm;
