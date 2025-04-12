"use client";

import { useState } from "react"; // Import useState for loading state
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUploadThing } from "@/utils/uploadthing";
import { Loader2 } from "lucide-react"; // Import Loader icon
import {
  generateBlogPostAction,
  transcribeUploadedFile,
} from "@/actions/upload-actions"; // Ensure paths are correct

// Define the expected structure of the successful response from UploadThing
// Adjust based on what you actually return in `app/api/uploadthing/core.ts`
type UploadThingSuccessResponse = {
  serverData: {
    userId: string;
    file: {
      url: string;
      name: string;
      // Add other properties returned by UploadThing if needed (e.g., key, size)
    };
  };
  // Add other top-level properties if returned by UploadThing
}[]; // Assuming it returns an array

// Define the expected structure of the data part of the successful transcription response
// Adjust based on what you actually return in `actions/upload-actions.ts` > `transcribeUploadedFile`
type TranscriptionSuccessData = {
  transcriptionText: string;
  userId: string;
};

// Define the expected structure of the response from server actions
type ActionResult = {
  success: boolean;
  message?: string | null;
  data?: TranscriptionSuccessData | null; // Data structure from transcription action
};

// Define the expected structure of the response from the generation action
type GenerationResult = {
  success: boolean;
  message?: string | null;
  // Generation action likely doesn't return data as it redirects
};


// Zod schema for client-side validation
const schema = z.object({
  file: z
    .instanceof(File, { message: "A file must be selected." }) // Added message
    .refine(
      (file) => file.size <= 25 * 1024 * 1024, // Increased limit slightly (Whisper supports 25MB)
      "File size must not exceed 25MB." // Updated message
    )
    .refine(
      (file) =>
        file.type.startsWith("audio/") || file.type.startsWith("video/"),
      "File must be an audio or video file." // Updated message
    ),
});

export default function UploadForm() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false); // State for UploadThing upload
  const [isProcessing, setIsProcessing] = useState(false); // State for server actions (transcribe/generate)

  const { startUpload } = useUploadThing("videoOrAudioUploader", {
    onClientUploadComplete: (res) => {
      setIsUploading(false); // Turn off upload loading state
      console.log("Upload complete client-side:", res);
      // Toast moved to handleTranscribe function after startUpload completes
      // toast({ title: "✅ File uploaded successfully!" });
    },
    onUploadError: (err: Error) => { // Explicitly type error
      setIsUploading(false); // Turn off loading state on error
      console.error("UploadThing Error:", err);
      toast({
          title: "❌ Upload Failed",
          description: err.message || "Please try another file or check console.",
          variant: "destructive",
      });
    },
    onUploadBegin: (fileName: string) => { // Explicitly type fileName
       setIsUploading(true); // Start loading state
       console.log("Upload starting client-side:", fileName);
       toast({ title: `⏳ Uploading ${fileName}...` });
    },
  });

  const handleTranscribe = async (formData: FormData) => {
    if (isUploading || isProcessing) return; // Prevent multiple submissions

    const file = formData.get("file"); // Get file from form data

    // Validate using Zod schema
    const validatedFields = schema.safeParse({ file });

    if (!validatedFields.success) {
      console.error(
        "Validation Errors:",
        validatedFields.error.flatten().fieldErrors
      );
      toast({
        title: "❌ Invalid File",
        variant: "destructive",
        description:
          validatedFields.error.flatten().fieldErrors.file?.[0] ??
          "Please select a valid audio/video file under 25MB.", // Updated validation message
      });
      return; // Stop execution if validation fails
    }

    // Ensure file is not null and is an instance of File after validation
    if (!(validatedFields.data.file instanceof File)) {
        toast({
            title: "❌ Error",
            description: "Selected file is not valid.",
            variant: "destructive",
        });
        return;
    }

    const validFile = validatedFields.data.file; // Use the validated file

    let uploadResp: UploadThingSuccessResponse | undefined;
    try {
        // setIsUploading is handled by onUploadBegin/onClientUploadComplete/onUploadError
        uploadResp = await startUpload([validFile]); // Upload the valid file
        console.log("UploadThing Response:", uploadResp);

        if (!uploadResp || !Array.isArray(uploadResp) || uploadResp.length === 0 || !uploadResp[0].serverData) {
           throw new Error("Upload failed or returned an unexpected response from UploadThing.");
        }
        // Upload successful toast
        toast({
             title: "✅ Upload Complete!",
             description: "Starting transcription..."
         });

    } catch (error: any) {
       console.error("Upload failed:", error);
       // Toast is handled by onUploadError, but we add one here just in case
       if (!isUploading) { // Only show if onUploadError didn't fire (e.g., error before upload began)
            toast({
                title: "❌ Upload Failed",
                description: error.message || "Please try again.",
                variant: "destructive",
            });
       }
       setIsUploading(false); // Ensure loading state is off
       return; // Stop if upload fails
    }

    // --- Start Server Processing ---
    setIsProcessing(true); // Indicate server-side work starting

    try {
        // Call the server action for transcription
        // Pass the validated UploadThing response
        const transcriptionResult: ActionResult = await transcribeUploadedFile(uploadResp);

        const { data = null, message = "An unknown error occurred during transcription.", success = false } = transcriptionResult || {};

        if (!success || !data?.transcriptionText) {
            console.error("Transcription failed or missing text:", message, data);
            toast({
                title: "❌ Transcription Failed",
                description: message,
                variant: "destructive",
            });
            setIsProcessing(false); // Stop processing state
            return; // Stop if transcription fails
        }

        // If transcription succeeded:
        toast({
            title: "🎙️ Transcription Complete!",
            description: "Generating AI blog post...",
        });

        // Call the server action for blog generation
        const generationResult: GenerationResult | void = await generateBlogPostAction({
            transcriptionText: data.transcriptionText,
            userId: data.userId,
        });

        // Handle the response from the generation action (primarily for errors, as success = redirect)
        // Redirect happens server-side, so we might not see a success state here often unless redirect fails.
        if (generationResult && !generationResult.success) {
            console.error("Blog post generation failed:", generationResult.message);
            toast({
                title: "❌ Blog Post Generation Failed",
                description: generationResult.message || "Please check logs or try again.",
                variant: "destructive",
            });
        } else if (generationResult?.success === true && generationResult.message?.includes("redirect failed")) {
             toast({
                 title: "✅ Blog Post Created (Redirect Issue)",
                 description: "Post saved, but redirect failed. Please navigate manually.",
                 variant: "default" // Or a warning style
             });
        }
        // No final success toast needed here if redirect works.

    } catch (serverError: any) { // Catch errors from server actions themselves
        console.error("Server action failed:", serverError);
        toast({
            title: "❌ Processing Error",
            description: serverError.message || "An error occurred on the server.",
            variant: "destructive",
        });
    } finally {
        setIsProcessing(false); // Ensure processing state is turned off
    }
  };

  // Disable button during upload or processing
  const isLoading = isUploading || isProcessing;

  return (
    // Using form action prop which is often preferred with server actions
    // but requires handling the state differently (e.g., useFormState)
    // For simplicity with multiple async steps, handling submit manually is clearer here.
    <form className="flex flex-col gap-6" onSubmit={(e) => {
        e.preventDefault(); // Prevent default form submission
        const formData = new FormData(e.currentTarget); // Get form data on submit
        handleTranscribe(formData); // Call the handler
    }}>
      <div className="flex justify-end items-center gap-1.5">
        <Input
          id="file"
          name="file"
          type="file"
          accept="audio/*,video/*"
          required
          disabled={isLoading} // Disable input while loading
        />
        <Button
           type="submit" // Ensure type is submit
           className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 w-32" // Added width and hover/disabled styles
           disabled={isLoading} // Disable button while loading
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Transcribe"
          )}
        </Button>
      </div>
    </form>
  );
}