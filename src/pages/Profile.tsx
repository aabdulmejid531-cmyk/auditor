import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Profile() {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-2xl font-bold">Profile page coming soon.</h1>
      <Link to="/dashboard">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
}
