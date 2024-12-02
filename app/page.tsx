'use client'
import { useEffect } from "react";
import { useRouter } from "next/navigation"; // Correct import for useRouter in app directory
import { useSession } from "next-auth/react"; // Assuming you are using next-auth for session management

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }
  console.log(session);
  return (
    <div>
      Welcome to the Home page
    </div>
  );
}