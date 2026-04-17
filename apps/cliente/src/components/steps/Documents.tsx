import { useState } from "react";
import { Button, Card, Spinner, cn } from "@credshow/ui";
import { uploadClientPhoto } from "@credshow/lib";

export interface DocumentsValue {
  document_photo_url: string;
  selfie_url: string;
}

interface DocumentsProps {
  smsLinkToken: string;
  initial: DocumentsValue | null;
  onBack: () => void;
  onSubmit: (value: DocumentsValue) => void;
}

type SlotKind = "document" | "selfie";

interface SlotState {
  url: string | null;
  preview: string | null;
  uploading: boolean;
  error: string | null;
}

const EMPTY_SLOT: SlotState = {
  url: null,
  preview: null,
  uploading: false,
  error: null,
};

export function Documents({ smsLinkToken, initial, onBack, onSubmit }: DocumentsProps) {
  const [doc, setDoc] = useState<SlotState>({
    ...EMPTY_SLOT,
    url: initial?.document_photo_url ?? null,
    preview: initial?.document_photo_url ?? null,
  });
  const [selfie, setSelfie] = useState<SlotState>({
    ...EMPTY_SLOT,
    url: initial?.selfie_url ?? null,
    preview: initial?.selfie_url ?? null,
  });

  function setSlot(kind: SlotKind, next: SlotState) {
    if (kind === "document") setDoc(next);
    else setSelfie(next);
  }

  async function handleFile(kind: SlotKind, file: File) {
    // preview otimista (cria objectURL local pra mostrar enquanto sobe)
    const localPreview = URL.createObjectURL(file);
    setSlot(kind, {
      url: null,
      preview: localPreview,
      uploading: true,
      error: null,
    });
    try {
      const { publicUrl } = await uploadClientPhoto(file, kind, smsLinkToken);
      setSlot(kind, {
        url: publicUrl,
        preview: publicUrl,
        uploading: false,
        error: null,
      });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Falha no upload. Tente novamente.";
      // mantem o preview local pra usuario ver o que escolheu, mas marca erro
      setSlot(kind, {
        url: null,
        preview: localPreview,
        uploading: false,
        error: msg,
      });
    }
  }

  const canContinue = !!doc.url && !!selfie.url && !doc.uploading && !selfie.uploading;

  return (
    <div className="flex flex-col gap-6 px-6 pb-10 pt-2">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Documentos</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          Para concluir, envie uma foto do seu documento e uma selfie segurando ele.
        </p>
      </div>

      <UploadSlot
        title="Foto do documento"
        description="RG ou CNH, frente do documento legivel."
        accept="image/*"
        capture="environment"
        state={doc}
        onSelect={(file) => void handleFile("document", file)}
        icon={<DocumentIcon />}
      />

      <UploadSlot
        title="Selfie segurando o documento"
        description="Mantenha o rosto e o documento bem visiveis."
        accept="image/*"
        capture="user"
        state={selfie}
        onSelect={(file) => void handleFile("selfie", file)}
        icon={<SelfieIcon />}
      />

      <div className="mt-2 flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1" size="lg">
          Voltar
        </Button>
        <Button
          className="flex-[2]"
          size="lg"
          disabled={!canContinue}
          onClick={() =>
            onSubmit({
              document_photo_url: doc.url!,
              selfie_url: selfie.url!,
            })
          }
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}

interface UploadSlotProps {
  title: string;
  description: string;
  accept: string;
  capture: "environment" | "user";
  state: SlotState;
  onSelect: (file: File) => void;
  icon: React.ReactNode;
}

function UploadSlot({
  title,
  description,
  accept,
  capture,
  state,
  onSelect,
  icon,
}: UploadSlotProps) {
  const inputId = `upload-${title.replace(/\s+/g, "-")}`;
  const hasPreview = !!state.preview;

  return (
    <Card
      className={cn(
        "flex flex-col gap-4 transition-shadow hover:shadow-md",
        state.error && "border-red-200"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            state.url ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
          )}
        >
          {state.url ? <CheckIcon /> : icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>

      {hasPreview && (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <img
            src={state.preview!}
            alt={title}
            className="h-44 w-full object-cover"
          />
          {state.uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40">
              <Spinner className="h-7 w-7 text-white" />
            </div>
          )}
        </div>
      )}

      {state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}

      <label htmlFor={inputId} className="block">
        <input
          id={inputId}
          type="file"
          accept={accept}
          capture={capture}
          className="sr-only"
          disabled={state.uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSelect(f);
            // permite selecionar o mesmo arquivo de novo
            e.target.value = "";
          }}
        />
        <span
          className={cn(
            "inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl",
            "border-2 border-dashed border-orange-300 bg-orange-50 text-sm font-semibold text-orange-700",
            "transition-colors hover:bg-orange-100",
            state.uploading && "cursor-wait opacity-60"
          )}
        >
          {state.uploading ? (
            <>
              <Spinner className="h-4 w-4" />
              Enviando...
            </>
          ) : hasPreview ? (
            <>
              <RefreshIcon />
              Trocar foto
            </>
          ) : (
            <>
              <CameraIcon />
              Tirar foto
            </>
          )}
        </span>
      </label>
    </Card>
  );
}

function DocumentIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="11" r="1.8" />
      <path d="M14 10h4" />
      <path d="M14 13h4" />
      <path d="M5 17l3-3 2 2 3-3" />
    </svg>
  );
}

function SelfieIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M3 7h3l2-2h8l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
