import { z } from "zod";

// Zod må ikke generere kode med eval/new Function: CSP'en tillader det ikke. Zod tester det, når
// skemaer oprettes (ved modulindlæsning), så dette modul skal evalueres før alle skemaer – det
// importeres derfor allerførst i main.tsx og øverst i shared/apiSchemas.ts.
z.config({ jitless: true });
