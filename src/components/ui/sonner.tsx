import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: // Rimosso group-[.toaster]:text-[hsl(var(--border))] per permettere l'ereditarietà dalle classi specifiche
            "group toast group-[.toaster]:bg-background group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-inherit", 
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group toast group-[.toaster]:bg-[#2A4614] group-[.toaster]:text-[#2A4614] group-[.toaster]:border-[#2A4614] group-[.toaster]:shadow-lg",
          info: 
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-[#EAB308] group-[.toaster]:border-[#EAB308] group-[.toaster]:shadow-lg",
          // Assicurati che anche warning ed error abbiano il loro colore di testo definito se li usi
          warning:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-orange-500 group-[.toaster]:border-orange-500 group-[.toaster]:shadow-lg",
          error:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-red-500 group-[.toaster]:border-red-500 group-[.toaster]:shadow-lg",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
