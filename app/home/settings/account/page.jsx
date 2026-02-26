"use client";

import { useSidebarStore } from "@/components/sidebar/sidebar-data";
import PhoneNumberInput from "@/components/site/ui/phone-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowUpRight,
  Check,
  CheckIcon,
  MinusIcon,
  Trash2,
} from "lucide-react";
import { updateUserData } from "@/lib/supabase";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

const items = [
  {
    value: "light",
    label: "Light",
    image: "https://coss.com/origin/ui-light.png",
  },
  {
    value: "dark",
    label: "Dark",
    image: "https://coss.com/origin/ui-dark.png",
  },
  {
    value: "system",
    label: "System",
    image: "https://coss.com/origin/ui-system.png",
  },
];

export default function HomeSettingsAccountPage() {
  const [publicId, setPublicId] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const setActiveSidebarItem = useSidebarStore(
    (state) => state.setActiveSidebarItem
  );
  const addBreadcrumbItem = useSidebarStore((state) => state.addBreadcrumbItem);

  useEffect(() => {
    // Load user data from localStorage
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo) {
      setPublicId(userInfo.public_id || "");
      setEmail(userInfo.email || "");
      setWhatsapp(userInfo.whatsapp || "");
      setWhatsappVerified(userInfo.whatsapp_verified || false);
    }
    setActiveSidebarItem("settings");
    addBreadcrumbItem(<Badge variant="secondary">Account</Badge>);
  }, []);

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    )
      return;

    setDeleting(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      await updateUserData(userInfo.id, { disabled: true });
      localStorage.removeItem("userInfo");
      toast.success("Account deleted successfully");
      router.replace("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      const errorMessage = error.message?.includes("column")
        ? "Database schema issue. Please ensure the 'disabled' column exists in the partners table."
        : "Failed to delete account. Please try again.";
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="grid gap-8">
      <div className="w-full flex items-center justify-between">
        <h2>Account</h2>
      </div>

      <div className="relative grid gap-2">
        <Label htmlFor="publicId">Public ID</Label>
        <Input
          className="pr-20 disabled:opacity-100"
          placeholder="Your public ID"
          value={publicId}
          disabled
        />
      </div>

      <div className="relative grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          className="pr-20 disabled:opacity-100"
          placeholder="Your email"
          value={email}
          disabled
        />
        <Badge
          variant="success"
          className="absolute bottom-[7px] right-2 stroke-1.5"
        >
          <Check /> Verified
        </Badge>
      </div>

      {whatsapp && (
        <div className="relative grid gap-2">
          <Label htmlFor="whatsapp">Whatsapp</Label>
          <PhoneNumberInput
            value={whatsapp}
            className="pr-20 disabled:opacity-100"
            disabled
          />
          {whatsappVerified && (
            <Badge
              variant="success"
              className="absolute bottom-[7px] right-2 stroke-1.5"
            >
              <Check /> Verified
            </Badge>
          )}
          {/* {!whatsappVerified && <p className="text-sm text-muted-foreground">Verify your whatsapp number right now. Click here <span className="text-blue-500 cursor-pointer hover:underline underline-offset-4" onClick={() => router.replace("/register/verify")}>Verify Now</span></p>} */}
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="theme">Theme</Label>
        <RadioGroup
          className="flex gap-3"
          defaultValue={theme}
          value={theme}
          onValueChange={setTheme}
        >
          {items.map((item) => (
            <label key={item.value}>
              <RadioGroupItem
                id={item.value}
                value={item.value}
                className="peer sr-only after:absolute after:inset-0"
              />
              <img
                src={item.image}
                alt={item.label}
                width={88}
                height={70}
                className="peer-focus-visible:ring-ring/50 peer-data-[state=checked]:border-ring peer-data-[state=checked]:bg-accent relative cursor-pointer overflow-hidden rounded-lg border shadow-xs transition-[color,box-shadow] outline-none peer-focus-visible:ring-[3px] peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-50"
              />
              <span className="group peer-data-[state=unchecked]:text-muted-foreground/70 mx-1 mt-2 flex items-center gap-1">
                <CheckIcon
                  size={16}
                  className="group-peer-data-[state=unchecked]:hidden"
                  aria-hidden="true"
                />
                <MinusIcon
                  size={16}
                  className="group-peer-data-[state=checked]:hidden"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium">{item.label}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Button
            variant="destructive"
            size="sm"
            className="w-fit"
            onClick={() =>
              router.push(`/forgot-password?change&&email=${email}`)
            }
          >
            Change Password <ArrowUpRight />
          </Button>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Danger</Label>
          <Button
            variant="destructive"
            size="sm"
            className="w-fit"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? (
              "Deleting..."
            ) : (
              <>
                <Trash2 /> Delete Account
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
