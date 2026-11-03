import CabinetShell from "@/components/cabinet/CabinetShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <CabinetShell>{children}</CabinetShell>;
}
