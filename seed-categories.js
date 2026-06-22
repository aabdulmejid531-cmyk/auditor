import { supabase } from "./src/integrations/supabase/client";

const categories = [
  { name: "Electronics", description: "Phones, Laptops, Gadgets", icon_url: "monitor" },
  { name: "Fashion", description: "Clothing, Shoes, Accessories", icon_url: "shirt" },
  { name: "Vehicles", description: "Cars, Bikes, Parts", icon_url: "car" },
  { name: "Real Estate", description: "Houses, Apartments, Land", icon_url: "home" },
  { name: "Furniture", description: "Home and Office furniture", icon_url: "sofa" },
  { name: "Jobs", description: "Full-time, Part-time, Remote", icon_url: "briefcase" },
  { name: "Services", description: "Cleaning, Repair, Legal", icon_url: "settings" },
  { name: "Food", description: "Groceries, Meals, Organic", icon_url: "utensils" },
];

async function seed() {
  console.log("Seeding categories...");
  for (const cat of categories) {
    const { error } = await supabase.from("categories").upsert(cat, { onConflict: "name" });
    if (error) {
      console.error(`Error seeding ${cat.name}:`, error.message);
    } else {
      console.log(`Seeded ${cat.name}`);
    }
  }
  console.log("Seeding complete!");
}

// Note: This script needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to be replaced
// Since we're in the sandbox, we can't easily run this with 'bun run' if it depends on env vars.
// However, the client.ts has the placeholders which get replaced at runtime.
// I'll skip the external script and just add a "Seed" button in the Market page for dev purposes
// or assume the user/admin will add them.
// Wait, I'll just put the seed logic in the Market page's useEffect but only if categories are empty.
