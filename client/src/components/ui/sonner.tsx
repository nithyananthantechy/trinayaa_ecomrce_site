import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#FFFDF8] group-[.toaster]:text-[#1A2C20] group-[.toaster]:border-[#DEDFD5] group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl font-sans text-xs p-4",
          description: "group-[.toast]:text-[#4A5568] group-[.toast]:text-xs font-normal mt-1",
          error:
            "group-[.toaster]:!bg-[#FFF5F5] group-[.toaster]:!border-red-400 group-[.toaster]:!text-red-950 [&_[data-title]]:!text-red-950 [&_[data-title]]:!font-bold [&_[data-title]]:!text-sm [&_[data-description]]:!text-red-900 [&_[data-description]]:!font-semibold [&_[data-icon]]:!text-red-600 shadow-2xl",
          success:
            "group-[.toaster]:!bg-[#F0FDF4] group-[.toaster]:!border-emerald-400 group-[.toaster]:!text-emerald-950 [&_[data-title]]:!text-emerald-950 [&_[data-title]]:!font-bold [&_[data-title]]:!text-sm [&_[data-description]]:!text-emerald-800 [&_[data-icon]]:!text-emerald-600 shadow-2xl",
          info:
            "group-[.toaster]:!bg-[#F0F9FF] group-[.toaster]:!border-sky-400 group-[.toaster]:!text-sky-950 [&_[data-title]]:!text-sky-950 [&_[data-title]]:!font-bold [&_[data-description]]:!text-sky-800 [&_[data-icon]]:!text-sky-600 shadow-2xl",
          warning:
            "group-[.toaster]:!bg-[#FFFBEB] group-[.toaster]:!border-amber-400 group-[.toaster]:!text-amber-950 [&_[data-title]]:!text-amber-950 [&_[data-title]]:!font-bold [&_[data-description]]:!text-amber-800 [&_[data-icon]]:!text-amber-600 shadow-2xl",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
