"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const LoggedIn = () => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Already Logged In</CardTitle>
        <CardDescription>
          The current user is already logged in.
        </CardDescription>
      </CardHeader>
      <CardContent></CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" className="w-full">
          <Link href="/dashboard">To Dashboard</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LoggedIn;
