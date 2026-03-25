import type { HTMLInputTypeAttribute } from "react";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import AccountSection from "./AccountSection";

function FieldRow({
  label,
  name,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: HTMLInputTypeAttribute;
  defaultValue?: string;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
      <label htmlFor={name} className="text-xs text-dark-grey">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="h-10 border-0 bg-white text-xs text-gray-700 shadow-none"
      />
    </div>
  );
}

export default function ProfileGeneralSection() {
  return (
    <AccountSection title="Informasi Umum">
      <form className="space-y-5">
        <FieldRow label="Username" name="username" defaultValue="bajukuning" />
        <FieldRow label="Nama" name="nama" defaultValue="bajukuning" />
        <FieldRow
          label="Email"
          name="email"
          type="email"
          defaultValue="bajukuning@email.com"
        />

        <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
          <p className="text-xs text-dark-grey">Jenis Kelamin</p>
          <div className="flex h-10 items-center gap-6 rounded-md bg-white px-4">
            <label
              htmlFor="gender-male"
              className="flex items-center gap-2 text-xs text-gray-700"
            >
              <input
                id="gender-male"
                name="gender"
                type="radio"
                value="male"
                defaultChecked
                className="h-3.5 w-3.5 accent-primary-orange"
              />
              Laki-laki
            </label>
            <label
              htmlFor="gender-female"
              className="flex items-center gap-2 text-xs text-gray-700"
            >
              <input
                id="gender-female"
                name="gender"
                type="radio"
                value="female"
                className="h-3.5 w-3.5 accent-primary-orange"
              />
              Perempuan
            </label>
          </div>
        </div>

        <FieldRow
          label="Tanggal Lahir"
          name="tanggalLahir"
          type="date"
          defaultValue="2000-01-01"
        />
      </form>
    </AccountSection>
  );
}
