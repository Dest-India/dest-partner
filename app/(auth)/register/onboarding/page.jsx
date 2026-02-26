// Combined Onboarding Multi-Step Form

"use client";

import PhoneNumberInput from '@/components/site/ui/phone-input'
import PickupProfileImage from '@/components/site/ui/pickup-profile'
import { ContainerCenterCard } from '@/components/site/ui/center-cards'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { MapPinned, Radius, ChevronRight, ChevronLeft } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import ImageVideoUpload from '@/components/site/ui/image-video-upload'
import { SportSelector } from '@/components/site/ui/sport-selector'
import { toast } from 'sonner'
import { TextEditor } from '@/components/site/ui/text-editor';
import { updateUserData } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader } from '@/components/ui/loader';
import { DestWordmark } from '@/components/site/icons';

const UserType = [
  {
    label: "Academy",
    value: "Academy"
  },
  {
    label: "GYM",
    value: "GYM"
  },
  {
    label: "Turf",
    value: "Turf"
  }
]

export default function RegisterOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  // Step 1 data
  const [role, setRole] = useState("")
  const [profileImage, setProfileImage] = useState("")
  const [name, setName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  // Step 2 data
  const [about, setAbout] = useState("")
  const [address, setAddress] = useState({
    street: "",
    landmark: "",
    city: "",
    state: "",
    pin: "",
    mapLink: ""
  })
  // Step 3 data
  const [selectedSports, setSelectedSports] = useState([])
  const [gallery, setGallery] = useState([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      try {
        if (typeof window !== 'undefined') {
          const storedInfo = localStorage.getItem('userInfo');
          if (!storedInfo) {
            router.replace('/register');
            toast.error("Some error occurred, please login or register again !");
            return
          }

          const userInfo = JSON.parse(storedInfo);
          if (userInfo && userInfo.email && userInfo.id) {
            if (userInfo.name && userInfo.verified) {
              router.replace('/home');
              toast.info("Welcome back !");
            } else if (userInfo.name && !userInfo.verified) {
              router.replace('/register/wait');
            } else {
              setLoading(false);
            }
          } else {
            localStorage.removeItem('userInfo');
            router.replace('/register');
            toast.error("Some error occurred, please login or register again !");
          }
        }
      } catch (error) {
        console.error("Error checking user:", error);
        router.replace('/register');
      }
    };
    checkUser();
  }, [router]);

  const validateStep1 = () => {
    if (!role) {
      toast.error("Please select your role", { id: "onboarding-empty" })
      return false
    }

    const nameWords = name.trim().split(/\s+/).filter(word => word.length > 0)
    if (nameWords.length < 2) {
      toast.error(`Please enter your full ${role} name`, { id: "onboarding-empty" })
      return false
    }

    if (!profileImage) {
      toast.error("Please upload your profile image", { id: "onboarding-empty" })
      return false
    }

    if (!whatsapp || whatsapp.length < 10) {
      toast.error("Please enter a valid WhatsApp number", { id: "onboarding-empty" })
      return false
    }

    return true
  }

  const validateStep2 = () => {
    if (!about.trim() || about.trim().length < 30) {
      toast.error("Please enter about information", { id: "onboarding-empty" })
      return false
    }

    if (!address.street.trim()) {
      toast.error("Please enter your street address", { id: "onboarding-empty" })
      return false
    }

    if (!address.city.trim()) {
      toast.error("Please enter your city", { id: "onboarding-empty" })
      return false
    }

    if (!address.state.trim()) {
      toast.error("Please enter your state", { id: "onboarding-empty" })
      return false
    }

    if (!address.pin.trim()) {
      toast.error("Please enter your pin code", { id: "onboarding-empty" })
      return false
    }

    if (!address.mapLink.trim() || !address.mapLink.trim().startsWith('https://')) {
      toast.error("Please enter a valid Google Map link", { id: "onboarding-empty" })
      return false
    }

    return true
  }

  const validateStep3 = () => {
    if (selectedSports.length === 0) {
      toast.error("Please select at least one sport", { id: "onboarding-empty" })
      return false
    }

    return true
  }

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  function publicId() {
    let pre;
    switch (role) {
      case 'Academy':
        pre = 'ACD'
        break;
      case 'GYM':
        pre = 'GYM'
        break;
      case 'Turf':
        pre = 'TUF'
        break;
      default:
        pre = 'UNK'
    }

    return `${pre}-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${new Date().toTimeString().slice(0, 5).replace(/:/g, '')}-${name.trim().split(/\s+/).map(word => word.charAt(0)).join('').toUpperCase()}`;
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    if (validateStep1() && validateStep2() && validateStep3()) {
      const formData = {
        role,
        logo_image: profileImage,
        name: name.trim(),
        whatsapp,
        about: about.trim(),
        address,
        sports: selectedSports,
        gallery,
        public_id: publicId()
      }
      try {
        const userInfo = localStorage.getItem('userInfo')
        if (!userInfo) {
          router.replace('/login')
          toast.error("No user information found, please login again!")
          return
        }

        const user = JSON.parse(userInfo)
        if (user && user.id) {
          const updatedUser = await updateUserData(user.id, formData)
          if (updatedUser) {
            localStorage.removeItem('userInfo')
            const userToStore = { ...updatedUser };
            delete userToStore.gallery;
            localStorage.setItem('userInfo', JSON.stringify(userToStore));
            toast.success("Onboarding completed successfully !")
            router.replace('/register/wait')
            setSubmitting(false)
          }
        } else {
          router.replace('/login')
          toast.error("Invalid user information, please login again!")
        }
      } catch (error) {
        console.error('Error parsing user info:', error)
        router.replace('/login')
        toast.error("Some error occurred, please login again!")
      }
    } else {
      setCurrentStep(1)
      toast.error("Please fill all the required fields", { id: "onboarding-empty" })
      setSubmitting(false)
    }
  }

  const renderStep1 = () => (
    <>
      <div className="grid gap-2">
        <Label>Who are you ?</Label>
        <RadioGroup className="flex flex-wrap gap-2" value={role} onValueChange={(value) => setRole(value)} disabled={submitting}>
          {UserType.map((item) => (
            <div
              key={item.value}
              className="border-input has-data-[state=checked]:border-primary/50 relative h-9 flex flex-col items-start justify-center gap-4 rounded-md border p-3 shadow-xs outline-none hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  id={item.value}
                  value={item.value}
                  className="after:absolute after:inset-0 !size-3.5"
                />
                <Label htmlFor={item.value}>{item.label}</Label>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>
      <div className="flex items-center gap-3">
        <PickupProfileImage value={profileImage} onChange={setProfileImage} disabled={submitting} />
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
      <div className="w-full grid gap-3">
        <Label>WhatsApp Number</Label>
        <PhoneNumberInput value={whatsapp} onChange={setWhatsapp} disabled={submitting} />
      </div>
    </>
  )

  const renderStep2 = () => (
    <>
      <div className="grid gap-2">
        <Label>About {role || "Academy"}</Label>
        <TextEditor value={about} onChange={setAbout} disabled={submitting} />
        <p className="text-sm text-muted-foreground">
          Minimum 30 characters
        </p>
      </div>
      <div className="grid gap-2">
        <Label>Address</Label>
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Building No. or Street Address"
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
            disabled={submitting}
          />
          <div className="flex gap-3">
            <Input
              placeholder="Landmark"
              value={address.landmark}
              onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
              disabled={submitting}
            />
            <Input
              placeholder="City"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              disabled={submitting}
            />
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="State"
              value={address.state}
              onChange={(e) => setAddress({ ...address, state: e.target.value })}
              disabled={submitting}
            />
            <Input
              type="number"
              placeholder="Pin Code"
              value={address.pin}
              onChange={(e) => setAddress({ ...address, pin: e.target.value })}
              disabled={submitting}
            />
          </div>
          <div className="relative">
            <Input
              className="pl-10"
              placeholder="Google Map Link"
              value={address.mapLink}
              onChange={(e) => setAddress({ ...address, mapLink: e.target.value })}
              disabled={submitting}
            />
            <MapPinned className="absolute size-5 top-2 left-3 stroke-1.5" />
          </div>
        </div>
      </div>
    </>
  )

  const renderStep3 = () => (
    <>
      <div className="grid gap-2">
        <Label>Select Your Sports</Label>
        <SportSelector
          selectedSports={selectedSports}
          onSportChange={setSelectedSports}
          disabled={submitting}
        />
        <p className="text-muted-foreground text-sm leading-normal">
          Search sports offered by your academy. Start typing to search, use <span className="px-1 py-0.5 border rounded shadow hover:bg-accent">↑</span> <span className="px-1 py-0.5 border rounded shadow hover:bg-accent">↓</span> to browse, and press Enter to select.
        </p>
      </div>
      <div className="grid gap-2">
        <Label>Gallery</Label>
        <ImageVideoUpload initialFiles={gallery} onFileChange={setGallery} disabled={submitting} />
      </div>
    </>
  )

  return loading ? <ContainerCenterCard sm className="h-32 gap-12 [&>svg]:last:size-6">
    <Loader />
  </ContainerCenterCard> : <ContainerCenterCard>
    <DestWordmark className='shrink-0 h-6' />

    <h2>Tell Us About Yourself</h2>

    <div className="w-full grid gap-6">
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}

      <div className="flex items-center justify-between gap-3">
        {currentStep > 1 && (
          <Button variant="outline" className="w-fit uppercase gap-1.5" onClick={handlePrevious} disabled={submitting}>
            <ChevronLeft /> Previous
          </Button>
        )}

        {currentStep < 3 ? (
          <Button className="w-fit uppercase gap-1.5" onClick={handleNext} disabled={submitting}>
            Next <ChevronRight />
          </Button>
        ) : (
          <Button className="w-fit uppercase gap-1.5" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader />} Next {!submitting && <ChevronRight />}
          </Button>
        )}
      </div>
    </div>
  </ContainerCenterCard>
}
