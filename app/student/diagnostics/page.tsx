import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function DiagnosticsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Diagnostics</h1>
        <p className="mt-2">Please log in to view your diagnostics.</p>
      </div>
    );
  }

  const userId = auth.user.id;

  const { data: decisions } = await supabase
    .from("decisions")
    .select("id, session_id, scenario_id, round_number, selected_option, outcome_score, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: simulations } = await supabase
    .from("simulation_sessions")
    .select("id, status, progress, current_round, total_rounds, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(5);

  let fallbackSessions: any[] | null = null;
  if (!simulations || simulations.length === 0) {
    const { data: legacy } = await supabase
      .from("sessions")
      .select("id, status, current_round, total_rounds, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(5);
    fallbackSessions = legacy || [];
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Diagnostics</h1>
        <p className="text-sm text-gray-600 mt-1">Live view of your latest decisions and sessions.</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Recent Decisions</h2>
        {(!decisions || decisions.length === 0) ? (
          <p className="text-sm text-gray-600 mt-2">No decisions found.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Session</th>
                  <th className="py-2 pr-4">Round</th>
                  <th className="py-2 pr-4">Option</th>
                  <th className="py-2 pr-4">Score</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((d: any) => (
                  <tr key={d.id} className="border-b">
                    <td className="py-2 pr-4">{new Date(d.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-4">{d.session_id}</td>
                    <td className="py-2 pr-4">{d.round_number ?? "-"}</td>
                    <td className="py-2 pr-4">{d.selected_option ?? "-"}</td>
                    <td className="py-2 pr-4">{d.outcome_score ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Simulation Sessions</h2>
        {simulations && simulations.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Updated</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Progress</th>
                  <th className="py-2 pr-4">Round</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map((s: any) => (
                  <tr key={s.id} className="border-b">
                    <td className="py-2 pr-4">{new Date(s.updated_at).toLocaleString()}</td>
                    <td className="py-2 pr-4">{s.status}</td>
                    <td className="py-2 pr-4">{s.progress}%</td>
                    <td className="py-2 pr-4">{s.current_round} / {s.total_rounds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mt-2">No simulation_sessions found. Showing legacy sessions if available.</p>
            {fallbackSessions && fallbackSessions.length > 0 ? (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">Updated</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Round</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fallbackSessions.map((s: any) => (
                      <tr key={s.id} className="border-b">
                        <td className="py-2 pr-4">{new Date(s.updated_at).toLocaleString()}</td>
                        <td className="py-2 pr-4">{s.status}</td>
                        <td className="py-2 pr-4">{(s.current_round || 1)} / {(s.total_rounds || 5)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
