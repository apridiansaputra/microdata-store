const WHATSAPP_NUMBER = "62895371102685";

export default function WhatsAppFab() {
  return (
    <div className="fixed right-4 bottom-5 z-40 md:right-6 md:bottom-6">
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Hubungi via WhatsApp"
        className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:bg-[#1fbe59] md:h-14 md:w-14"
      >
        <span className="pointer-events-none absolute right-0 bottom-full mb-3 w-max max-w-[240px] translate-y-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium whitespace-nowrap text-secondary opacity-0 shadow-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 md:text-xs">
          klik disini untuk tanya lebih lanjut
        </span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-6 w-6 fill-current md:h-7 md:w-7"
        >
          <path d="M12 2a10 10 0 0 0-8.73 14.88L2 22l5.33-1.24A10 10 0 1 0 12 2Zm5.77 14.03c-.24.68-1.4 1.29-1.94 1.38-.5.08-1.14.11-1.84-.11-.43-.14-.98-.32-1.7-.63-2.99-1.29-4.94-4.47-5.09-4.68-.14-.21-1.22-1.62-1.22-3.1 0-1.48.78-2.2 1.06-2.5.27-.3.6-.37.8-.37.2 0 .4 0 .58.01.18 0 .42-.07.66.49.24.58.8 2 .88 2.14.07.15.12.32.02.53-.1.2-.15.33-.3.5-.15.17-.32.37-.46.5-.15.15-.31.3-.13.58.18.3.8 1.33 1.72 2.16 1.19 1.07 2.19 1.4 2.5 1.56.3.15.48.13.66-.08.17-.2.74-.86.94-1.16.2-.3.4-.25.68-.15.29.1 1.81.86 2.11 1.01.3.15.5.23.57.36.07.13.07.78-.17 1.46Z" />
        </svg>
      </a>
    </div>
  );
}
