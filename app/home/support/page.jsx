"use client"

import { useSidebarStore } from '@/components/sidebar/sidebar-data';
import { Label } from '@/components/ui/label';
import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { TextEditor } from '@/components/site/ui/text-editor';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { getSupportRequests, requestForSupport } from '@/lib/supabase';
import { toast } from 'sonner';
import { getUserInfo } from '@/lib/store';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

export default function Page() {
  const setActiveSidebarItem = useSidebarStore(state => state.setActiveSidebarItem);
  const router = useRouter();

  useEffect(() => {
    setActiveSidebarItem("support");
  }, [setActiveSidebarItem]);

  const [oldRequest, setOldRequest] = useState([]);
  const [request, setRequest] = useState("");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const partnerId = useMemo(() => getUserInfo()?.id ?? null, []);

  useEffect(() => {
    if (!partnerId) {
      toast.error('Something went wrong.');
      router.push('/login');
      return;
    }

    const fetchOldRequests = async () => {
      try {
        const response = await getSupportRequests(partnerId);
        if (response?.error) {
          throw new Error(response.error.message);
        }
        setOldRequest(response ?? []);
      } catch (error) {
        console.error('Error fetching old requests:', error);
      }
    };

    fetchOldRequests();
  }, [partnerId, router]);

  const handleRequestSubmit = async () => {
    try {
      setIsSubmitting(true);
      const requestData = {
        customer_id: partnerId,
        request,
        description,
        screenshot: screenshot ? await toBase64(screenshot) : null,
      }
      const response = await requestForSupport(requestData);
      if (response.error) {
        throw new Error(response.error.message);
      } else {
        toast.success("Support request submitted successfully.");
        setRequest("");
        setDescription("");
        setScreenshot(null);
      }
    } catch (error) {
      console.error('Error submitting support request:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h2>Request for Support</h2>
      <div className="flex flex-col md:flex-row gap-12">
        <div className="w-full flex flex-col gap-4 md:max-w-3/4">
          <div className="space-y-2">
            <Label htmlFor="request" className="text-sm font-medium">Request/Feedback</Label>
            <Input id="request" value={request} onChange={(e) => setRequest(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <TextEditor id="description" useCharacterLimit={true} value={description} onChange={setDescription} disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="screenshot" className="text-sm font-medium">Screenshot</Label>
            <div className="relative">
              <Input type="file" id="screenshot" onChange={(e) => setScreenshot(e.target.files[0])} disabled={isSubmitting} />
              {screenshot && <Button variant="secondary" className="absolute h-6 end-1.5 top-1.5 !px-2 rounded-sm" onClick={() => setScreenshot(null)} disabled={isSubmitting}>Remove</Button>}
            </div>
          </div>
          <Button size="sm" className="self-end" onClick={() => handleRequestSubmit()} disabled={isSubmitting || !request || !description}>
            {isSubmitting ? <><Loader /> Submitting...</> : "Submit Request"}
          </Button>
        </div>
        <div className="space-y-4">
          <h5 className="text-muted-foreground">Recent Support Requests</h5>
          {oldRequest.length > 0 ? oldRequest.map((req) => (
            <Sheet key={req.id}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full md:w-96 h-fit flex-col items-start font-semibold text-xl py-3 rounded-xl">{req.request}
                  <Badge variant={req.resolved ? "secondary" : ""}>{req.resolved ? "Resolved" : "Pending"}</Badge>
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto [&>button]:top-6 [&>button]:end-6 md:[&>button]:top-8 md:[&>button]:end-8">
                <SheetHeader>
                  <SheetTitle>{req.request}</SheetTitle>
                  <SheetDescription><Badge variant={req.resolved ? "secondary" : ""}>{req.resolved ? "Resolved" : "Pending"}</Badge></SheetDescription>
                </SheetHeader>
                <div className="space-y-4 px-4 md:px-6">
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: req.description }} />
                  {req.screenshot && <Dialog>
                    <DialogTrigger asChild>
                      <img src={req.screenshot} alt="screenshot" className="rounded-lg border max-w-full h-auto" />
                    </DialogTrigger>
                    <ScreenshotZoom src={req.screenshot} name={req.request} />
                  </Dialog>}
                  <div className="text-sm text-muted-foreground">Request on {new Date(req.created_at).toLocaleString()}</div>
                </div>
              </SheetContent>
            </Sheet>
          )) : (
            <p className="text-sm text-muted-foreground">No recent support requests found.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ScreenshotZoom({ src, name }) {
  return (
    <DialogContent showCloseButton={false} className="sm:max-w-2xl p-2 gap-1">
      <DialogHeader>
        <div className="w-full flex justify-between items-center gap-2 p-2 py-1 [&>h2]:w-full [&>h2]:text-ellipsis [&>h2]:line-clamp-1">
          <DialogTitle>{name}</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="size-6 flex-shrink-0">
              <XIcon />
            </Button>
          </DialogClose>
        </div>
      </DialogHeader>
      <img src={src} alt={name} className="max-h-full max-w-full border rounded-md" />
    </DialogContent>
  )
}