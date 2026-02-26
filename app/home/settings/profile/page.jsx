"use client";

import ImageVideoUpload from "@/components/site/ui/image-video-upload";
import PickupProfileImage from "@/components/site/ui/pickup-profile";
import { useSidebarStore } from "@/components/sidebar/sidebar-data";
import { SportSelector } from "@/components/site/ui/sport-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, MapPinned } from "lucide-react";
import { useRouter } from "next/navigation";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { TextEditor } from "@/components/site/ui/text-editor";
import { Loader } from "@/components/ui/loader";
import { updateUserData } from "@/lib/supabase";
import { toast } from "sonner";

const USER_TYPES = [
  { label: "Academy", value: "Academy" },
  { label: "GYM", value: "GYM" },
  { label: "Turf", value: "Turf" },
];

const INITIAL_ADDRESS = {
  street: "",
  landmark: "",
  city: "",
  state: "",
  pin: "",
  mapLink: "",
};

// Helper function to safely parse arrays from localStorage
const parseArrayField = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return field
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
    }
  }
  return [];
};

export default function Page() {
  const router = useRouter();
  const { setActiveSidebarItem, addBreadcrumbItem } = useSidebarStore();

  // Form state
  const [id, setId] = useState("");
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [about, setAbout] = useState("");
  const [address, setAddress] = useState(INITIAL_ADDRESS);
  const [selectedSports, setSelectedSports] = useState([]);
  const [gallery, setGallery] = useState([]);

  // Loading and change tracking state
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const initialValuesRef = useRef(null);

  // Memoized current form values for comparison
  const currentFormValues = useMemo(
    () => ({
      name,
      profileImage,
      about,
      address,
      selectedSports,
      gallery,
    }),
    [name, profileImage, about, address, selectedSports, gallery]
  );

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (!initialValuesRef.current) return false;
    return (
      JSON.stringify(currentFormValues) !==
      JSON.stringify(initialValuesRef.current)
    );
  }, [currentFormValues]);

  // Memoized address change handlers to prevent unnecessary re-renders
  const handleAddressChange = useCallback((field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Initialize form data from localStorage
  useEffect(() => {
    const initializeForm = () => {
      setActiveSidebarItem("settings");
      addBreadcrumbItem(<Badge variant="secondary">Profile</Badge>);

      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (!userInfo) {
          setIsLoading(false);
          return;
        }

        const data = userInfo;

        // Set form values
        setId(data.id || "");
        setRole(data.role || "");
        setName(data.name || "");
        setProfileImage(data.logo_image || "");
        setAbout(data.about || "");

        // Handle address
        const addressData = data.address || {};
        const newAddress = {
          street: addressData.street || "",
          landmark: addressData.landmark || "",
          city: addressData.city || "",
          state: addressData.state || "",
          pin: addressData.pin || "",
          mapLink: addressData.mapLink || "",
        };
        setAddress(newAddress);

        // Handle sports and gallery arrays
        const sportsArray = parseArrayField(data.sports);
        const galleryArray = parseArrayField(data.gallery);

        setSelectedSports(sportsArray);
        setGallery(galleryArray);

        // Store initial values for change detection
        initialValuesRef.current = {
          name: userInfo.name || "",
          profileImage: userInfo.logo_image || "",
          about: userInfo.about || "",
          address: newAddress,
          selectedSports: sportsArray,
          gallery: galleryArray,
        };
      } catch (error) {
        console.error("Error loading user info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeForm();
  }, [setActiveSidebarItem, addBreadcrumbItem]);

  // Save handler
  const handleSave = async () => {
    setSubmitting(true);
    try {
      if (hasChanges && id) {
        const userData = {
          name,
          logo_image: profileImage,
          about,
          address,
          sports: selectedSports,
          gallery,
        };
        const updatedUser = await updateUserData(id, userData);
        if (updatedUser) {
          toast.success("Profile updated successfully");
          initialValuesRef.current = { ...currentFormValues };
          localStorage.setItem(
            "userInfo",
            JSON.stringify({ ...updatedUser, gallery: [] })
          );
          setSubmitting(false);
        }
      } else if (!id) {
        router.replace("/login");
        toast.error("Something went wrong.");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Something went wrong.");
      setSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid gap-8 animate-pulse">
        <div className="w-full flex items-center justify-between">
          <div className="h-8 w-24 bg-muted rounded"></div>
        </div>
        <div className="grid gap-2">
          <div className="h-4 w-20 bg-muted rounded"></div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-muted rounded"></div>
            <div className="h-9 w-24 bg-muted rounded"></div>
            <div className="h-9 w-24 bg-muted rounded"></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-24 bg-muted rounded-full"></div>
          <div className="w-full grid gap-3">
            <div className="h-4 w-32 bg-muted rounded"></div>
            <div className="h-10 w-full bg-muted rounded"></div>
          </div>
        </div>
        <div className="grid gap-2">
          <div className="h-4 w-24 bg-muted rounded"></div>
          <div className="h-32 w-full bg-muted rounded"></div>
        </div>
        <div className="grid gap-2">
          <div className="h-4 w-16 bg-muted rounded"></div>
          <div className="space-y-3">
            <div className="h-10 w-full bg-muted rounded"></div>
            <div className="flex gap-3">
              <div className="h-10 flex-1 bg-muted rounded"></div>
              <div className="h-10 flex-1 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div className="w-full flex items-center justify-between">
        <h2>Profile</h2>
        {hasChanges && (
          <Button
            size="sm"
            disabled={!hasChanges && submitting}
            onClick={handleSave}
          >
            {submitting && <Loader />}
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>

      <div className="grid gap-2">
        <Label>Who are you?</Label>
        <div className="flex flex-wrap gap-2">
          {USER_TYPES.map((item) => (
            <Button
              key={item.value}
              size="sm"
              variant={role === item.value ? "default" : "outline"}
              disabled
            >
              {role === item.value && <Check className="w-4 h-4 mr-1" />}
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <PickupProfileImage
          value={profileImage}
          onChange={setProfileImage}
          disabled={submitting}
        />
        <div className="w-full grid gap-3">
          <Label>{role || "Business"} Name</Label>
          <Input
            placeholder={`Enter ${role?.toLowerCase() || "business"} name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>About {role || "Business"}</Label>
        <TextEditor value={about} onChange={setAbout} disabled={submitting} />
      </div>

      <div className="grid gap-2">
        <Label>Address</Label>
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Building No. or Street Address"
            value={address.street}
            onChange={(e) => handleAddressChange("street", e.target.value)}
            disabled={submitting}
          />
          <div className="flex gap-3">
            <Input
              placeholder="Landmark"
              value={address.landmark}
              onChange={(e) => handleAddressChange("landmark", e.target.value)}
              disabled={submitting}
            />
            <Input
              placeholder="City"
              value={address.city}
              onChange={(e) => handleAddressChange("city", e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="State"
              value={address.state}
              onChange={(e) => handleAddressChange("state", e.target.value)}
              disabled={submitting}
            />
            <Input
              type="number"
              placeholder="Pin Code"
              value={address.pin}
              onChange={(e) => handleAddressChange("pin", e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="relative">
            <Input
              className="pl-10"
              placeholder="Google Map Link"
              value={address.mapLink}
              onChange={(e) => handleAddressChange("mapLink", e.target.value)}
              disabled={submitting}
            />
            <MapPinned className="absolute size-5 top-2 left-3 stroke-1.5" />
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Select Your Sports</Label>
        <SportSelector
          selectedSports={selectedSports}
          onSportChange={setSelectedSports}
          disabled={submitting}
        />
        <p className="text-muted-foreground text-sm leading-normal">
          Search sports offered by your {role.toLowerCase()}. Start typing to
          search, use{" "}
          <span className="px-1 py-0.5 border rounded shadow hover:bg-accent">
            ↑
          </span>{" "}
          <span className="px-1 py-0.5 border rounded shadow hover:bg-accent">
            ↓
          </span>{" "}
          to browse, and press Enter to select.
        </p>
      </div>

      <div className="grid gap-2">
        <Label>Gallery</Label>
        <ImageVideoUpload
          initialFiles={gallery}
          onFileChange={setGallery}
          disabled={submitting}
        />
      </div>
    </div>
  );
}
