import { countResponses, listForms } from "@/lib/formStorage";
import { getFormOpenState } from "@/lib/formStatus";

export async function GET(): Promise<Response> {
  try {
    const forms = await listForms();
    const activities = await Promise.all(
      forms.map(async (form) => {
        try {
          const count = await countResponses(form.id);
          return {
            form,
            state: getFormOpenState(form, count),
          };
        } catch {
          return { form, state: getFormOpenState(form) };
        }
      }),
    );

    const open = activities
      .filter((item) => item.state === "open")
      .map((item) => ({
        id: item.form.id,
        token: item.form.token,
        title: item.form.title,
        description: item.form.description ?? "",
        eventDate: item.form.eventDate ?? null,
      }));

    return Response.json(
      { activities: open },
      {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=30",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal memuat daftar kegiatan.",
      },
      { status: 500 },
    );
  }
}
