import { useState } from "react";
import { Button, Input } from "@credshow/ui";
import { isValidEmail } from "@credshow/lib";

export interface PersonalDataValue {
  fullName: string;
  email: string;
}

interface PersonalDataProps {
  initial: PersonalDataValue;
  onBack: () => void;
  onSubmit: (value: PersonalDataValue) => void;
}

export function PersonalData({ initial, onBack, onSubmit }: PersonalDataProps) {
  const [fullName, setFullName] = useState(initial.fullName);
  const [email, setEmail] = useState(initial.email);
  const [touched, setTouched] = useState(false);

  const nameOk = fullName.trim().split(/\s+/).length >= 2 && fullName.trim().length >= 5;
  const emailOk = isValidEmail(email.trim());
  const canContinue = nameOk && emailOk;

  return (
    <div className="flex flex-col gap-6 px-6 pb-10 pt-2">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Seus dados</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          Precisamos saber quem voce e.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="Nome completo"
          placeholder="Como aparece no seu documento"
          value={fullName}
          autoComplete="name"
          onChange={(e) => setFullName(e.target.value)}
          onBlur={() => setTouched(true)}
          error={touched && !nameOk ? "Informe seu nome completo" : undefined}
        />
        <Input
          label="Email"
          type="email"
          placeholder="voce@email.com"
          value={email}
          autoComplete="email"
          inputMode="email"
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          error={touched && !emailOk ? "Email invalido" : undefined}
        />
      </div>

      <div className="mt-2 flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1" size="lg">
          Voltar
        </Button>
        <Button
          className="flex-[2]"
          size="lg"
          disabled={!canContinue}
          onClick={() =>
            onSubmit({ fullName: fullName.trim(), email: email.trim() })
          }
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
