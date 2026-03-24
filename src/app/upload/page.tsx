import { FileUpload } from "@/components/file-upload";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Upload a Contract</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Upload a PDF or DOCX file and get a full clause-by-clause risk
          analysis.
        </p>
      </div>
      <FileUpload />
      <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
        Your documents are processed securely and not stored permanently unless
        you choose to save them.
      </p>
    </div>
  );
}
