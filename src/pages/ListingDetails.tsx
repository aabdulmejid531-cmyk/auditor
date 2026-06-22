import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ListingDetails() {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-2xl font-bold">This page is no longer in use.</h1>
      <Link to="/dashboard">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
}
