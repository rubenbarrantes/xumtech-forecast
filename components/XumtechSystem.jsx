"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, Legend } from "recharts";

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const TRIBUS_DEFAULT = ["Dunamis", "Yarigai", "Bulwak"];
const ROLES_DEFAULT = ["Técnico", "Funcional", "PO", "GA", "Arquitecto", "Proveedores", "Gerencia"];
const TIPOS_SERVICIO = ["Soporte Evolutivo", "Soporte Crítico", "Soporte Evolutivo + Crítico", "Proyecto", "Talento Dedicado", "Bolsa de Horas"];
const HORAS_DIA = 8;
const HORAS_NO_COBRABLE = 11;

const CALENDAR_SEED = [
  { mes: "2025-01", label: "Ene 2025", diasLaborales: 22, feriados: 1, dif20: 3 },
  { mes: "2025-02", label: "Feb 2025", diasLaborales: 20, feriados: 0, dif20: 0 },
  { mes: "2025-03", label: "Mar 2025", diasLaborales: 21, feriados: 0, dif20: 1 },
  { mes: "2025-04", label: "Abr 2025", diasLaborales: 19, feriados: 3, dif20: 2 },
  { mes: "2025-05", label: "May 2025", diasLaborales: 21, feriados: 1, dif20: 2 },
  { mes: "2025-06", label: "Jun 2025", diasLaborales: 21, feriados: 0, dif20: 1 },
  { mes: "2025-07", label: "Jul 2025", diasLaborales: 22, feriados: 1, dif20: 3 },
  { mes: "2025-08", label: "Ago 2025", diasLaborales: 19, feriados: 2, dif20: 1 },
  { mes: "2025-09", label: "Sep 2025", diasLaborales: 20, feriados: 2, dif20: 2 },
  { mes: "2025-10", label: "Oct 2025", diasLaborales: 23, feriados: 0, dif20: 3 },
  { mes: "2025-11", label: "Nov 2025", diasLaborales: 18, feriados: 2, dif20: 0 },
  { mes: "2025-12", label: "Dic 2025", diasLaborales: 21, feriados: 2, dif20: 3 },
  { mes: "2026-01", label: "Ene 2026", diasLaborales: 21, feriados: 1, dif20: 2 },
  { mes: "2026-02", label: "Feb 2026", diasLaborales: 20, feriados: 0, dif20: 0 },
  { mes: "2026-03", label: "Mar 2026", diasLaborales: 22, feriados: 0, dif20: 2 },
  { mes: "2026-04", label: "Abr 2026", diasLaborales: 19, feriados: 3, dif20: 2 },
  { mes: "2026-05", label: "May 2026", diasLaborales: 20, feriados: 1, dif20: 1 },
  { mes: "2026-06", label: "Jun 2026", diasLaborales: 22, feriados: 0, dif20: 2 },
];

const COLABORADORES_SEED = [ 
];

const SERVICIOS_SEED = [
  ];

// Disponibilidad % bruta semilla (legacy - se mantiene para Forecast/Simulador)
const DISPONIBILIDAD_SEED = [
];

// Parámetros globales de utilización
const PARAMS_SEED = {
  utilObjetivo: 100,
  horasNoCobrable: 11,
  pilotoPorPersona: ["Yarigai"],
};

// Asignaciones seed — rol+servicio+mes (Dunamis/Bulwak) y persona+servicio+mes (Yarigai)
const ASIGNACIONES_SEED = [
];

// Ausencias semilla
const AUSENCIAS_SEED = [
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const TRIBU_COLORS = { Dunamis: "#3b82f6", Yarigai: "#10b981", Bulwak: "#f59e0b" };
const ROL_COLORS = { Técnico: "#6366f1", Funcional: "#ec4899", PO: "#f97316", Arquitecto: "#14b8a6", Proveedores: "#8b5cf6", GA: "#06b6d4", Gerencia: "#64748b" };

function cls(...args) { return args.filter(Boolean).join(" "); }

function Badge({ children, color = "gray", size = "sm" }) {
  const c = { green: "bg-emerald-900/50 text-emerald-300 border-emerald-700/40", red: "bg-red-900/50 text-red-300 border-red-700/40", blue: "bg-blue-900/50 text-blue-300 border-blue-700/40", yellow: "bg-yellow-900/50 text-yellow-300 border-yellow-700/40", gray: "bg-slate-700/50 text-slate-300 border-slate-600/40", amber: "bg-amber-900/50 text-amber-300 border-amber-700/40", purple: "bg-purple-900/50 text-purple-300 border-purple-700/40" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${c[color]}`}>{children}</span>;
}

function Pill({ label, color }) {
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: (TRIBU_COLORS[color] || ROL_COLORS[color] || "#475569") + "22", color: TRIBU_COLORS[color] || ROL_COLORS[color] || "#94a3b8" }}>{label}</span>;
}

function KPI({ title, value, sub, color = "blue" }) {
  const acc = { blue: "border-blue-500/30 text-blue-400", green: "border-emerald-500/30 text-emerald-400", amber: "border-amber-500/30 text-amber-400", red: "border-red-500/30 text-red-400" };
  return (
    <div className={`rounded-xl border bg-slate-900/60 p-4 ${acc[color].split(" ")[0]}`}>
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <p className={`text-2xl font-bold font-mono ${acc[color].split(" ")[1]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-base font-semibold text-white flex items-center gap-2">
        <span className="w-0.5 h-4 bg-blue-500 rounded-full inline-block"></span>
        {children}
      </h2>
      {action}
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">{label}</label>}
      <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" {...props} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      {label && <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">{label}</label>}
      <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" {...props}>
        {options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, variant = "primary", size = "md", ...props }) {
  const v = { primary: "bg-blue-600 hover:bg-blue-700 text-white", ghost: "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700", danger: "bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-700/40" };
  const s = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  return <button className={`rounded-lg font-medium transition-colors ${v[variant]} ${s[size]}`} {...props}>{children}</button>;
}

// ─── MOTOR DE UTILIZACIÓN ─────────────────────────────────────────────────────

function useUtilizacion({ colaboradores, asignaciones, ausencias, calendar, servicios, params }) {
  return useMemo(() => {
    const activos = colaboradores.filter(c => c.status === "Activo");

    // Capacidad disponible de una persona en un mes
    const capacidadPersona = (colab, mes) => {
      const cal = calendar.find(c => c.mes === mes);
      const dias = cal?.diasLaborales || 20;
      const aus = ausencias.filter(a => a.colaborador === colab.name && a.mes === mes)
        .reduce((s, a) => s + (a.dias || 0), 0);
      const horasNoCob = colab.horasNoCobrable ?? (params ? params.horasNoCobrable : 11);
      const bruto = (dias - aus) * colab.horasDia;
      const disponible = Math.max(0, bruto - horasNoCob);
      return { bruto, disponible, dias, aus, horasNoCob };
    };

    // Horas asignadas de una persona en un mes (puede trabajar en cualquier tribu)
    const horasAsignadasPersona = (nombreColab, mes) =>
      asignaciones
        .filter(a => a.colaborador === nombreColab && a.mes === mes)
        .reduce((s, a) => s + (a.horas || 0), 0);

    // Horas asignadas por rol+tribu en un mes (para Dunamis/Bulwak)
    const horasAsignadasRolTribu = (tribu, rol, mes) =>
      asignaciones
        .filter(a => a.tribu === tribu && a.rol === rol && a.mes === mes)
        .reduce((s, a) => s + (a.horas || 0), 0);

    // Capacidad total de un rol en una tribu en un mes
    const capacidadRolTribu = (tribu, rol, mes) => {
      const personas = activos.filter(c => c.tribu === tribu && c.rolPrincipal === rol);
      return personas.reduce((s, c) => {
        const cap = capacidadPersona(c, mes);
        return s + cap.disponible;
      }, 0);
    };

    // Horas asignadas a un servicio en un mes (para validar límite)
    const horasAsignadasServicio = (servicioId, mes) =>
      asignaciones
        .filter(a => a.servicioId === servicioId && a.mes === mes)
        .reduce((s, a) => s + (a.horas || 0), 0);

    // Horas acumuladas de un proyecto (sin límite mensual)
    const horasAcumuladasProyecto = (servicioId) =>
      asignaciones
        .filter(a => a.servicioId === servicioId)
        .reduce((s, a) => s + (a.horas || 0), 0);

    // Utilización por persona (Yarigai pilot + cualquier tribu por persona)
    const utilizacionPorPersona = (colab, mes) => {
      const cap = capacidadPersona(colab, mes);
      const asignado = horasAsignadasPersona(colab.name, mes);
      const pct = cap.disponible > 0 ? Math.round((asignado / cap.disponible) * 100) : 0;
      return { ...cap, asignado, pct };
    };

    // Utilización por rol+tribu
    const utilizacionRolTribu = (tribu, rol, mes) => {
      const disponible = capacidadRolTribu(tribu, rol, mes);
      const asignado = horasAsignadasRolTribu(tribu, rol, mes);
      const pct = disponible > 0 ? Math.round((asignado / disponible) * 100) : 0;
      const personas = activos.filter(c => c.tribu === tribu && c.rolPrincipal === rol).length;
      return { disponible, asignado, pct, personas };
    };

    return {
      capacidadPersona,
      horasAsignadasPersona,
      horasAsignadasRolTribu,
      capacidadRolTribu,
      horasAsignadasServicio,
      horasAcumuladasProyecto,
      utilizacionPorPersona,
      utilizacionRolTribu,
    };
  }, [colaboradores, asignaciones, ausencias, calendar, servicios, params]);
}

// Semáforo de utilización
function semaforo(pct, objetivo) {
  if (pct >= objetivo) return { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", label: "Óptimo",   dot: "bg-emerald-400" };
  if (pct >= objetivo * 0.8) return { color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30",   label: "Tensión",  dot: "bg-amber-400"   };
  return                         { color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30",       label: "Bajo",     dot: "bg-red-400"     };
}

function BarUtil({ pct, objetivo }) {
  const s = semaforo(pct, objetivo);
  const w = Math.min(100, pct);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 bg-slate-800 rounded-full h-1.5 min-w-[60px]">
        <div className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${w}%`, background: pct >= objetivo ? "#34d89a" : pct >= objetivo * 0.8 ? "#f5a623" : "#f05c5c" }} />
      </div>
      <span className={`font-mono font-bold text-xs tabular-nums flex-shrink-0 ${s.color}`}>{pct}%</span>
    </div>
  );
}

const AUSENCIA_FORM_EMPTY = { mes: "2026-01", fecha: "", dias: 1, tipo: "Vacaciones", notas: "" };

function ModuloColaboradores({ colaboradores, setColaboradores, ausencias, setAusencias, calendar, params }) {

  const [search, setSearch] = useState("");
  const [tribFilter, setTribFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Activo");
  const [modalOpen, setModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(null);
  const [ausenciaModal, setAusenciaModal] = useState(null); // { nombre, editId? }
  const [ausenciaForm, setAusenciaForm] = useState(AUSENCIA_FORM_EMPTY);
  const [editColabModal, setEditColabModal] = useState(null);
  const [form, setForm] = useState({ name: "", rolPrincipal: "Técnico", tribu: "Dunamis", status: "Activo", email: "", horasDia: 8 });

  const calDesc = [...calendar].sort((a, b) => b.mes.localeCompare(a.mes));

  const filtered = colaboradores.filter(c =>
    (tribFilter === "Todas" || c.tribu === tribFilter) &&
    (statusFilter === "Todos" || c.status === statusFilter) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddColab = async () => {
    if (!form.name.trim()) return;
    const body = { ...form, horasDia: Number(form.horasDia) };
    const res = await fetch("/api/colaboradores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    setColaboradores(p => [...p, saved]);
    setModalOpen(false);
    setForm({ name: "", rolPrincipal: "Técnico", tribu: "Dunamis", status: "Activo", email: "", horasDia: 8 });
  };

  const handleToggleStatus = async (id) => {
    const colab = colaboradores.find(c => c.id === id);
    if (!colab) return;
    const updated = { ...colab, status: colab.status === "Activo" ? "Inactivo" : "Activo" };
    await fetch("/api/colaboradores", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    setColaboradores(p => p.map(c => c.id === id ? updated : c));
  };

  const openNuevaAusencia = (nombre) => {
    setAusenciaForm({ ...AUSENCIA_FORM_EMPTY, mes: calDesc[0]?.mes || "2026-01" });
    setAusenciaModal({ nombre, editId: null });
  };

  const openEditAusencia = (a) => {
    setAusenciaForm({ mes: a.mes, fecha: a.fecha || "", dias: a.dias, tipo: a.tipo, notas: a.notas || "" });
    setAusenciaModal({ nombre: a.colaborador, editId: a.id });
  };

  const handleSaveAusencia = async () => {
    if (!ausenciaModal) return;
    const cal = calendar.find(c => c.mes === ausenciaForm.mes);
    const max = cal ? cal.diasLaborales : 20;
    if (Number(ausenciaForm.dias) > max) return alert(`Máximo ${max} días laborales en ${cal?.label}`);
    if (Number(ausenciaForm.dias) < 1) return alert("Mínimo 1 día");
    const body = { ...ausenciaForm, dias: Number(ausenciaForm.dias), colaborador: ausenciaModal.nombre };
    if (ausenciaModal.editId) {
      await fetch("/api/ausencias", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, id: ausenciaModal.editId }) });
      setAusencias(p => p.map(a => a.id === ausenciaModal.editId ? { ...a, ...body } : a));
    } else {
      const res = await fetch("/api/ausencias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const saved = await res.json();
      setAusencias(p => [...p, saved]);
    }
    setAusenciaModal(null);
  };

  const handleDeleteAusencia = async (id) => {
    if (!confirm("¿Eliminar esta ausencia?")) return;
    await fetch("/api/ausencias", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setAusencias(p => p.filter(a => a.id !== id));
  };

  const getAusenciasColab = (name) => [...ausencias.filter(a => a.colaborador === name)].sort((a, b) => b.mes.localeCompare(a.mes));
  const totalDiasAusente = (name) => ausencias.filter(a => a.colaborador === name).reduce((s, a) => s + a.dias, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        {["Todas", ...TRIBUS_DEFAULT].map(t => {
          const count = colaboradores.filter(c => (t === "Todas" ? true : c.tribu === t) && c.status === "Activo").length;
          return <KPI key={t} title={t === "Todas" ? "Total activos" : t} value={count} color={t === "Todas" ? "blue" : "green"} />;
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar colaborador..." className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-52" />
        <div className="flex gap-1">
          {["Todas", ...TRIBUS_DEFAULT].map(t => <button key={t} onClick={() => setTribFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tribFilter === t ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"}`}>{t}</button>)}
        </div>
        <div className="flex gap-1">
          {["Todos", "Activo", "Inactivo"].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"}`}>{s}</button>)}
        </div>
        <Btn variant="primary" size="sm" onClick={() => setModalOpen(true)} className="ml-auto">+ Agregar colaborador</Btn>
      </div>

      <div className="rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/80">
            <tr>{["Colaborador", "Tribu", "Rol Principal", "Horas/día", "Estado", "Días ausentes", "Acciones"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const totalDias = totalDiasAusente(c.name);
              return (
                <tr key={c.id} className="border-t border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: TRIBU_COLORS[c.tribu] + "30", color: TRIBU_COLORS[c.tribu] }}>{c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                      <div>
                        <p className="text-white font-medium">{c.name}</p>
                        {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Pill label={c.tribu} color={c.tribu} /></td>
                  <td className="px-4 py-3"><Pill label={c.rolPrincipal} color={c.rolPrincipal} /></td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">{c.horasDia}h</td>
                  <td className="px-4 py-3"><Badge color={c.status === "Activo" ? "green" : "gray"}>{c.status}</Badge></td>
                  <td className="px-4 py-3">
                    {totalDias > 0 ? <span className="text-xs text-amber-400 font-mono font-bold">{totalDias}d</span> : <span className="text-xs text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <Btn variant="ghost" size="sm" onClick={() => setProfileOpen(c)}>Perfil</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => openNuevaAusencia(c.name)}>+ Ausencia</Btn>
                    <Btn variant={c.status === "Activo" ? "danger" : "ghost"} size="sm" onClick={() => handleToggleStatus(c.id)}>{c.status === "Activo" ? "Desactivar" : "Activar"}</Btn>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">No se encontraron colaboradores</p>}
      </div>

      {/* Modal: Nuevo colaborador */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo colaborador">
        <div className="space-y-4">
          <Input label="Nombre completo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre Apellido" />
          <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@xumtech.com" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Rol principal" value={form.rolPrincipal} onChange={e => setForm(f => ({ ...f, rolPrincipal: e.target.value }))} options={ROLES_DEFAULT} />
            <Select label="Tribu" value={form.tribu} onChange={e => setForm(f => ({ ...f, tribu: e.target.value }))} options={TRIBUS_DEFAULT} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={["Activo", "Inactivo"]} />
            <Input label="Horas por día" type="number" value={form.horasDia} onChange={e => setForm(f => ({ ...f, horasDia: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Btn>
            <Btn onClick={handleAddColab}>Guardar</Btn>
          </div>
        </div>
      </Modal>

      {/* Modal: Perfil */}
      <Modal open={!!profileOpen} onClose={() => setProfileOpen(null)} title="Perfil del colaborador">
        {profileOpen && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/40">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: TRIBU_COLORS[profileOpen.tribu] + "30", color: TRIBU_COLORS[profileOpen.tribu] }}>{profileOpen.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
              <div>
                <p className="text-white font-semibold text-base">{profileOpen.name}</p>
                <p className="text-xs text-slate-400">{profileOpen.email}</p>
                <div className="flex gap-2 mt-1.5">
                  <Pill label={profileOpen.tribu} color={profileOpen.tribu} />
                  <Pill label={profileOpen.rolPrincipal} color={profileOpen.rolPrincipal} />
                  <Badge color={profileOpen.status === "Activo" ? "green" : "gray"}>{profileOpen.status}</Badge>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/40 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-800/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Días ausentes registrados</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-amber-400 font-mono font-bold">{totalDiasAusente(profileOpen.name)}d total</span>
                  <Btn size="sm" variant="ghost" onClick={() => { setProfileOpen(null); openNuevaAusencia(profileOpen.name); }}>+ Registrar</Btn>
                </div>
              </div>
              {getAusenciasColab(profileOpen.name).length === 0
                ? <p className="text-slate-500 text-xs p-4 text-center">Sin ausencias registradas</p>
                : (
                  <table className="w-full text-xs">
                    <thead className="bg-slate-800/40">
                      <tr>{["Mes", "Fecha", "Días", "Tipo", "Notas", ""].map(h => <th key={h} className="text-left px-3 py-2 text-slate-500 uppercase tracking-wider font-semibold">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {getAusenciasColab(profileOpen.name).map(a => (
                        <tr key={a.id} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                          <td className="px-3 py-2 text-slate-300 font-mono">{a.mes}</td>
                          <td className="px-3 py-2 text-slate-400">{a.fecha || "—"}</td>
                          <td className="px-3 py-2 text-amber-400 font-mono font-bold">{a.dias}d</td>
                          <td className="px-3 py-2"><Badge color="amber">{a.tipo}</Badge></td>
                          <td className="px-3 py-2 text-slate-500 max-w-24 truncate">{a.notas || "—"}</td>
                          <td className="px-3 py-2 flex gap-1">
                            <button onClick={() => { setProfileOpen(null); openEditAusencia(a); }} className="text-blue-400 hover:text-blue-300 text-xs">✏️</button>
                            <button onClick={() => handleDeleteAusencia(a.id)} className="text-red-400 hover:text-red-300 text-xs">🗑</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Ausencia (crear / editar) */}
      <Modal open={!!ausenciaModal} onClose={() => setAusenciaModal(null)} title={`${ausenciaModal?.editId ? "Editar" : "Registrar"} ausencia — ${ausenciaModal?.nombre}`}>
        <div className="space-y-4">
          <Select
            label="Mes"
            value={ausenciaForm.mes}
            onChange={e => setAusenciaForm(f => ({ ...f, mes: e.target.value }))}
            options={calDesc.map(c => ({ value: c.mes, label: `${c.label} (${c.diasLaborales}d lab.)` }))}
          />
          <Input label="Fecha específica (opcional)" type="date" value={ausenciaForm.fecha} onChange={e => setAusenciaForm(f => ({ ...f, fecha: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Días a descontar" type="number" min="1" value={ausenciaForm.dias} onChange={e => setAusenciaForm(f => ({ ...f, dias: e.target.value }))} />
            <Select label="Tipo" value={ausenciaForm.tipo} onChange={e => setAusenciaForm(f => ({ ...f, tipo: e.target.value }))} options={["Vacaciones", "Incapacidad", "Día libre", "Permiso", "Otro"]} />
          </div>
          <Input label="Notas (opcional)" value={ausenciaForm.notas} onChange={e => setAusenciaForm(f => ({ ...f, notas: e.target.value }))} placeholder="Motivo o descripción..." />
          {ausenciaForm.mes && (
            <p className="text-xs text-slate-500 bg-slate-800/40 rounded-lg p-3">
              Días laborales en {calendar.find(c => c.mes === ausenciaForm.mes)?.label}: <strong className="text-white">{calendar.find(c => c.mes === ausenciaForm.mes)?.diasLaborales}</strong>
            </p>
          )}
          <div className="flex justify-between pt-2">
            {ausenciaModal?.editId && (
              <Btn variant="danger" onClick={() => { handleDeleteAusencia(ausenciaModal.editId); setAusenciaModal(null); }}>Eliminar</Btn>
            )}
            <div className="flex gap-2 ml-auto">
              <Btn variant="ghost" onClick={() => setAusenciaModal(null)}>Cancelar</Btn>
              <Btn onClick={handleSaveAusencia}>Guardar</Btn>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Helper: inline add item
function AddItemInline({ placeholder, onAdd }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-1">
      <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && val.trim()) { onAdd(val.trim()); setVal(""); } }}
        placeholder={placeholder} className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-32" />
      <button onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(""); } }} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg">+</button>
    </div>
  );
}

// ─── MÓDULO: PARÁMETROS ───────────────────────────────────────────────────────

function ModuloParametros({ calendar, setCalendar, disponibilidad, setDisponibilidad, colaboradores, ausencias, params, setParams }) {

  const [tab, setTab] = useState("calendario");
  const [dispForm, setDispForm] = useState({ colaborador: "", rol: "Técnico", tribu: "Dunamis", mes: "2026-01", porcentaje: 100 });
  const [dispModal, setDispModal] = useState(false);
  const [calModal, setCalModal] = useState(false);
  const [calForm, setCalForm] = useState({ mes: "", label: "", diasLaborales: 20, feriados: 0 });
  const [savingCal, setSavingCal] = useState(null);

  // Calendario: guardar cambio en BD con debounce
  const handleCalEdit = async (mes, field, val) => {
    const updated = calendar.map(c => c.mes === mes ? { ...c, [field]: Number(val), dif20: field === "diasLaborales" ? Number(val) - 20 : c.dif20 } : c);
    setCalendar(updated);
    const row = updated.find(c => c.mes === mes);
    setSavingCal(mes);
    await fetch("/api/calendar", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) });
    setSavingCal(null);
  };

  // Calendario: agregar mes nuevo
  const handleAddMes = async () => {
    if (!calForm.mes || !calForm.label) return;
    if (calendar.find(c => c.mes === calForm.mes)) return alert("Ese mes ya existe");
    const body = { ...calForm, diasLaborales: Number(calForm.diasLaborales), feriados: Number(calForm.feriados), dif20: Number(calForm.diasLaborales) - 20 };
    const res = await fetch("/api/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      setCalendar(p => [...p, body].sort((a, b) => a.mes.localeCompare(b.mes)));
      setCalModal(false);
      setCalForm({ mes: "", label: "", diasLaborales: 20, feriados: 0 });
    }
  };

  // Calendario: eliminar mes
  const handleDeleteMes = async (mes) => {
    if (!confirm(`¿Eliminar el mes ${mes}? Esto afectará asignaciones y ausencias registradas en ese mes.`)) return;
    await fetch("/api/calendar", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mes }) });
    setCalendar(p => p.filter(c => c.mes !== mes));
  };

  // Disponibilidad bruta: total por persona por mes
  const totalPorPersonaMes = useMemo(() => {
    const map = {};
    disponibilidad.forEach(d => {
      const k = `${d.colaborador}|${d.mes}`;
      map[k] = (map[k] || 0) + d.porcentaje;
    });
    return map;
  }, [disponibilidad]);

  const handleAddDisp = async () => {
    if (!dispForm.colaborador) return;
    const k = `${dispForm.colaborador}|${dispForm.mes}`;
    const current = totalPorPersonaMes[k] || 0;
    if (current + Number(dispForm.porcentaje) > 100) { alert(`⚠️ Supera el 100%. Ya tiene ${current}% asignado en ${dispForm.mes}`); return; }
    const body = { ...dispForm, porcentaje: Number(dispForm.porcentaje) };
    const res = await fetch("/api/disponibilidad", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    setDisponibilidad(p => [...p, saved]);
    setDispModal(false);
  };

  // Neto calculado
  const netoPorPersonaRolTribuMes = useMemo(() => {
    return disponibilidad.map(d => {
      const cal = calendar.find(c => c.mes === d.mes);
      const aus = ausencias.find(a => a.colaborador === d.colaborador && a.mes === d.mes);
      const diasCal = cal ? cal.diasLaborales : 20;
      const diasAus = aus ? aus.dias : 0;
      const diasReales = diasCal - diasAus;
      const porcNeto = d.porcentaje * (diasReales / diasCal);
      return { ...d, diasCal, diasReales, porcNeto: +porcNeto.toFixed(2) };
    });
  }, [disponibilidad, calendar, ausencias]);

  const activos = colaboradores.filter(c => c.status === "Activo").map(c => c.name);

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-slate-700/50 pb-1 flex-wrap">
        {[["calendario", "📅 Calendario"], ["parametros", "⚙️ Parámetros"], ["disponibilidad", "📊 Disponibilidad Bruta"], ["neto", "📈 Disponibilidad Neta"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === id ? "bg-slate-800 text-white border border-slate-700 border-b-transparent" : "text-slate-400 hover:text-white"}`}>{label}</button>
        ))}
      </div>

      {/* TAB: PARÁMETROS GLOBALES */}
      {tab === "parametros" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700/50 p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Utilización</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Objetivo de utilización (%)</label>
                <input type="number" min="50" max="120" value={params.utilObjetivo}
              onChange={e => {
                  const updated = { ...params, utilObjetivo: Number(e.target.value) };
                  setParams(updated);
                  fetch("/api/params", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
                }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Horas no cobrables por persona/mes</label>
                <input type="number" min="0" max="40" value={params.horasNoCobrable}
              onChange={e => {
                  const updated = { ...params, horasNoCobrable: Number(e.target.value) };
                  setParams(updated);
                  fetch("/api/params", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
                }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/50 p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Planificación por persona (Piloto)</p>
            <p className="text-xs text-slate-500">Las tribus marcadas usan planificación por persona en lugar de por rol.</p>
            <div className="flex flex-wrap gap-2">
              {["Dunamis", "Yarigai", "Bulwak"].map(t => {
                const activo = params.pilotoPorPersona.includes(t);
                return (
                  <button key={t} onClick={() => {
                    const newPiloto = activo ? params.pilotoPorPersona.filter(x => x !== t) : [...params.pilotoPorPersona, t];
                    const updated = { ...params, pilotoPorPersona: newPiloto };
                    setParams(updated);
                    fetch("/api/params", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
                  }} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${activo ? "bg-blue-600 text-white border-blue-600" : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"}`}>
                    {activo ? "✓ " : ""}{t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/50 p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tribus</p>
            <div className="flex flex-wrap gap-2">
              {TRIBUS_DEFAULT.map(t => (
                <div key={t} className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                  <span className="text-sm text-white">{t}</span>
                  <button onClick={() => {
                    const updated = { ...params, tribus: TRIBUS_DEFAULT.filter(x => x !== t) };
                    setParams(updated);
                    fetch("/api/params", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
                  }} className="text-red-400 hover:text-red-300 text-xs ml-1">✕</button>
                </div>
              ))}
              <AddItemInline placeholder="Nueva tribu..." onAdd={val => {
                if (!val || TRIBUS_DEFAULT.includes(val)) return;
                const updated = { ...params, tribus: [...TRIBUS_DEFAULT, val] };
                setParams(updated);
                fetch("/api/params", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
              }} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/50 p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Roles del sistema</p>
            <div className="flex flex-wrap gap-2">
              {ROLES_DEFAULT.map(r => (
                <div key={r} className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                  <span className="text-sm text-white">{r}</span>
                  <button onClick={() => {
                    const updated = { ...params, roles: ROLES_DEFAULT.filter(x => x !== r) };
                    setParams(updated);
                    fetch("/api/params", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
                  }} className="text-red-400 hover:text-red-300 text-xs ml-1">✕</button>
                </div>
              ))}
              <AddItemInline placeholder="Nuevo rol..." onAdd={val => {
                if (!val || ROLES_DEFAULT.includes(val)) return;
                const updated = { ...params, roles: [...ROLES_DEFAULT, val] };
                setParams(updated);
                fetch("/api/params", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
              }} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/50 p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipos de servicio</p>
            <div className="flex flex-wrap gap-2">
              {TIPOS_SERVICIO.map(t => (
                <div key={t} className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                  <span className="text-sm text-white">{t}</span>
                  <button onClick={() => {
                    const updated = { ...params, tiposServicio: TIPOS_SERVICIO.filter(x => x !== t) };
                    setParams(updated);
                    fetch("/api/params", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
                  }} className="text-red-400 hover:text-red-300 text-xs ml-1">✕</button>
                </div>
              ))}
              <AddItemInline placeholder="Nuevo tipo..." onAdd={val => {
                if (!val || TIPOS_SERVICIO.includes(val)) return;
                const updated = { ...params, tiposServicio: [...TIPOS_SERVICIO, val] };
                setParams(updated);
                fetch("/api/params", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
              }} />
            </div>
          </div>
        </div>
      )}

      {/* TAB: CALENDARIO */}
      {tab === "calendario" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Configura los días laborales reales por mes. Los cambios se guardan automáticamente.</p>
            <Btn size="sm" onClick={() => setCalModal(true)}>+ Agregar mes</Btn>
          </div>
          <div className="rounded-xl border border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80">
                <tr>{["Mes", "Feriados", "Días laborales netos", "Dif. vs 20 días", ""].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody>
                {calendar.map(c => (
                  <tr key={c.mes} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                    <td className="px-4 py-2.5 text-white font-medium">
                      {c.label}
                      {savingCal === c.mes && <span className="ml-2 text-xs text-blue-400 animate-pulse">guardando...</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <input type="number" min="0" max="10" value={c.feriados}
                        onChange={e => handleCalEdit(c.mes, "feriados", e.target.value)}
                        className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500" />
                    </td>
                    <td className="px-4 py-2.5">
                      <input type="number" min="1" max="23" value={c.diasLaborales}
                        onChange={e => handleCalEdit(c.mes, "diasLaborales", e.target.value)}
                        className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-blue-300 font-mono font-bold focus:outline-none focus:border-blue-500" />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`font-mono text-sm font-bold ${c.dif20 > 0 ? "text-emerald-400" : c.dif20 < 0 ? "text-red-400" : "text-slate-400"}`}>
                        {c.dif20 > 0 ? "+" : ""}{c.dif20}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => handleDeleteMes(c.mes)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Modal open={calModal} onClose={() => setCalModal(false)} title="Agregar mes al calendario">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Mes (YYYY-MM)" value={calForm.mes} onChange={e => setCalForm(f => ({ ...f, mes: e.target.value }))} placeholder="2026-07" />
                <Input label="Etiqueta" value={calForm.label} onChange={e => setCalForm(f => ({ ...f, label: e.target.value }))} placeholder="Jul 2026" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Días laborales" type="number" min="1" max="23" value={calForm.diasLaborales} onChange={e => setCalForm(f => ({ ...f, diasLaborales: e.target.value }))} />
                <Input label="Feriados" type="number" min="0" max="10" value={calForm.feriados} onChange={e => setCalForm(f => ({ ...f, feriados: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Btn variant="ghost" onClick={() => setCalModal(false)}>Cancelar</Btn>
                <Btn onClick={handleAddMes}>Agregar</Btn>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* TAB: DISPONIBILIDAD BRUTA */}
      {tab === "disponibilidad" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">% asignado por persona × rol × tribu × mes. Debe sumar exactamente 100% por persona por mes.</p>
            <Btn size="sm" onClick={() => setDispModal(true)}>+ Agregar asignación</Btn>
          </div>

          {/* Alert resumen */}
          {activos.map(name => {
            const meses = [...new Set(disponibilidad.filter(d => d.colaborador === name).map(d => d.mes))];
            return meses.map(mes => {
              const total = totalPorPersonaMes[`${name}|${mes}`] || 0;
              if (total === 100) return null;
              return (
                <div key={`${name}|${mes}`} className={`rounded-lg border px-4 py-2 text-xs flex items-center gap-3 ${total < 100 ? "border-amber-500/30 bg-amber-500/5 text-amber-300" : "border-red-500/30 bg-red-500/5 text-red-300"}`}>
                  <span className="font-bold">{name}</span> — {mes} —
                  <span className="font-mono font-bold">{total}%</span>
                  {total < 100 ? " ⚠️ Bajo 100%" : " ?? Sobre 100%"}
                </div>
              );
            });
          })}

          <div className="rounded-xl border border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80">
                <tr>{["Colaborador", "Rol", "Tribu", "Mes", "% Asignado", "Total persona-mes", ""].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody>
                {disponibilidad.map((d, i) => {
                  const total = totalPorPersonaMes[`${d.colaborador}|${d.mes}`] || 0;
                  return (
                    <tr key={i} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                      <td className="px-4 py-2.5 text-white">{d.colaborador}</td>
                      <td className="px-4 py-2.5"><Pill label={d.rol} color={d.rol} /></td>
                      <td className="px-4 py-2.5"><Pill label={d.tribu} color={d.tribu} /></td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{d.mes}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-blue-300">{d.porcentaje}%</td>
                      <td className="px-4 py-2.5">
                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${total === 100 ? "text-emerald-400 bg-emerald-900/30" : total > 100 ? "text-red-400 bg-red-900/30" : "text-amber-400 bg-amber-900/30"}`}>{total}%</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={async () => {
                          if (d.id) await fetch("/api/disponibilidad", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: d.id }) });
                          setDisponibilidad(p => p.filter((_, j) => j !== i));
                        }} className="text-xs text-red-400 hover:text-red-300">✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Modal open={dispModal} onClose={() => setDispModal(false)} title="Nueva asignación de disponibilidad">
            <div className="space-y-4">
              <Select label="Colaborador" value={dispForm.colaborador} onChange={e => setDispForm(f => ({ ...f, colaborador: e.target.value }))} options={[{ value: "", label: "Seleccionar..." }, ...activos.map(n => ({ value: n, label: n }))]} />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Rol" value={dispForm.rol} onChange={e => setDispForm(f => ({ ...f, rol: e.target.value }))} options={ROLES_DEFAULT} />
                <Select label="Tribu" value={dispForm.tribu} onChange={e => setDispForm(f => ({ ...f, tribu: e.target.value }))} options={TRIBUS_DEFAULT} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Mes" value={dispForm.mes} onChange={e => setDispForm(f => ({ ...f, mes: e.target.value }))} options={calendar.map(c => ({ value: c.mes, label: c.label }))} />
                <Input label="% Asignado" type="number" min="1" max="100" value={dispForm.porcentaje} onChange={e => setDispForm(f => ({ ...f, porcentaje: e.target.value }))} />
              </div>
              {dispForm.colaborador && dispForm.mes && (
                <p className="text-xs text-slate-400 bg-slate-800/50 rounded-lg p-3">
                  Total actual de <strong className="text-white">{dispForm.colaborador}</strong> en <strong className="text-white">{dispForm.mes}</strong>:{" "}
                  <span className="font-mono font-bold text-blue-300">{totalPorPersonaMes[`${dispForm.colaborador}|${dispForm.mes}`] || 0}%</span>
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Btn variant="ghost" onClick={() => setDispModal(false)}>Cancelar</Btn>
                <Btn onClick={handleAddDisp}>Guardar</Btn>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* TAB: NETO CALCULADO */}
      {tab === "neto" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Calculado automáticamente: % Bruto × (Días reales persona / Días calendario mes). Solo lectura.</p>
          <div className="rounded-xl border border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80">
                <tr>{["Colaborador", "Rol", "Tribu", "Mes", "% Bruto", "Días cal.", "Días reales", "% Neto"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody>
                {netoPorPersonaRolTribuMes.map((d, i) => (
                  <tr key={i} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                    <td className="px-4 py-2.5 text-white">{d.colaborador}</td>
                    <td className="px-4 py-2.5"><Pill label={d.rol} color={d.rol} /></td>
                    <td className="px-4 py-2.5"><Pill label={d.tribu} color={d.tribu} /></td>
                    <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{d.mes}</td>
                    <td className="px-4 py-2.5 text-slate-300 font-mono">{d.porcentaje}%</td>
                    <td className="px-4 py-2.5 text-slate-400 font-mono">{d.diasCal}</td>
                    <td className="px-4 py-2.5 font-mono">{d.diasReales < d.diasCal ? <span className="text-amber-400">{d.diasReales}</span> : <span className="text-slate-300">{d.diasReales}</span>}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-emerald-400">{d.porcNeto}%</td>
                  </tr>
                ))}
                {netoPorPersonaRolTribuMes.length === 0 && <tr><td colSpan={8} className="text-center text-slate-500 py-8 text-sm">Configure disponibilidad en la pestaña anterior</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: SEMÁFORO TABLA 5 */}
      {tab === "semaforo" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Resumen visual del % total asignado por colaborador por mes. Verde = 100%, Amarillo = bajo, Rojo = sobre.</p>
          {activos.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No hay colaboradores activos</p>}
          <div className="rounded-xl border border-slate-700/50 overflow-x-auto">
            <table className="text-xs w-full">
              <thead className="bg-slate-800/80">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-400 uppercase tracking-wider font-semibold sticky left-0 bg-slate-800/80 min-w-40">Colaborador</th>
                  {[...calendar].sort((a, b) => b.mes.localeCompare(a.mes)).map(c => (
                    <th key={c.mes} className="px-2 py-3 text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap text-center min-w-20">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activos.map(name => (
                  <tr key={name} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                    <td className="px-4 py-2.5 text-white font-medium sticky left-0 bg-slate-900">{name}</td>
                    {[...calendar].sort((a, b) => b.mes.localeCompare(a.mes)).map(c => {
                      const total = totalPorPersonaMes[`${name}|${c.mes}`] || 0;
                      const bg = total === 0 ? "bg-slate-800/30 text-slate-600" : total === 100 ? "bg-emerald-900/40 text-emerald-300 font-bold" : total < 100 ? "bg-amber-900/40 text-amber-300 font-bold" : "bg-red-900/50 text-red-300 font-bold";
                      return (
                        <td key={c.mes} className="px-2 py-2.5 text-center">
                          <span className={`inline-block rounded px-1.5 py-0.5 font-mono text-xs ${bg}`}>
                            {total === 0 ? "—" : `${total}%`}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-900/60 inline-block"></span> 100% — correcto</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-900/60 inline-block"></span> &lt;100% — alerta</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-900/60 inline-block"></span> &gt;100% — bloqueado</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-800/60 inline-block"></span> Sin configurar</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MÓDULO: MAESTRO DE SERVICIOS ─────────────────────────────────────────────

const SERVICIO_FORM_EMPTY = {
  nombre: "", tipo: "Soporte Evolutivo", tribu: "Dunamis", po: "",
  contratoId: "", jiraId: "", tecnologia: "", horasLimite: 0,
  personasDedicadas: 1, estado: "Activo", fechaInicio: "", fechaVencimiento: "", renovable: true,
};

function ModuloServicios({ servicios, setServicios, colaboradores, params }) {

  const ROLES_SERVICIO_EMPTY = ROLES_DEFAULT.reduce((acc, r) => ({ ...acc, [r]: false }), {});
  const [search, setSearch] = useState("");
  const [tribFilter, setTribFilter] = useState("Todas");
  const [estadoFilter, setEstadoFilter] = useState("Activo");
  const [modal, setModal] = useState(false);          // crear
  const [editModal, setEditModal] = useState(null);   // editar — servicio objeto
  const [editForm, setEditForm] = useState(SERVICIO_FORM_EMPTY);
  const [detail, setDetail] = useState(null);
  const [rolesModal, setRolesModal] = useState(null);
  const [form, setForm] = useState(SERVICIO_FORM_EMPTY);
  const [rolesForm, setRolesForm] = useState(ROLES_SERVICIO_EMPTY);

  // PO: cualquier colaborador activo (sin restricción de rol)
  const pos = colaboradores.filter(c => c.status === "Activo").map(c => c.name).sort();

  const filtered = servicios.filter(s =>
    (tribFilter === "Todas" || s.tribu === tribFilter) &&
    (estadoFilter === "Todos" || s.estado === estadoFilter) &&
    (s.nombre.toLowerCase().includes(search.toLowerCase()) || (s.contratoId || "").toLowerCase().includes(search.toLowerCase()))
  );

  const tieneHorasLimite = (tipo) => ["Soporte Evolutivo", "Soporte Crítico", "Soporte Evolutivo + Crítico", "Bolsa de Horas"].includes(tipo);

  // ── Crear ─────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.nombre.trim()) return;
    const body = { ...form, horasLimite: Number(form.horasLimite), personasDedicadas: Number(form.personasDedicadas) };
    const res = await fetch("/api/servicios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    setServicios(p => [...p, { ...saved, roles: {} }]);
    setModal(false);
    setForm(SERVICIO_FORM_EMPTY);
  };

  // ── Abrir edición ─────────────────────────────────────────────────────────
  const openEdit = (s) => {
    setEditForm({
      nombre: s.nombre, tipo: s.tipo, tribu: s.tribu, po: s.po,
      contratoId: s.contratoId, jiraId: s.jiraId, tecnologia: s.tecnologia,
      horasLimite: s.horasLimite, personasDedicadas: s.personasDedicadas,
      estado: s.estado, fechaInicio: s.fechaInicio, fechaVencimiento: s.fechaVencimiento,
      renovable: s.renovable,
    });
    setEditModal(s);
    setDetail(null);
  };

  // ── Guardar edición ───────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editForm.nombre.trim()) return;
    const body = { id: editModal.id, ...editForm, horasLimite: Number(editForm.horasLimite), personasDedicadas: Number(editForm.personasDedicadas) };
    const res = await fetch("/api/servicios", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    if (saved.error) { alert(`Error al guardar: ${saved.error}`); return; }
    setServicios(p => p.map(s => s.id === editModal.id ? { ...saved, roles: s.roles || {} } : s));
    setEditModal(null);
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const handleDelete = async (s) => {
    if (!confirm(`¿Eliminar "${s.nombre}"? Se eliminarán también todas sus asignaciones.`)) return;
    await fetch("/api/servicios", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id }) });
    setServicios(p => p.filter(x => x.id !== s.id));
    setDetail(null);
  };

  // ── Cambiar estado ────────────────────────────────────────────────────────
  const handleToggleEstado = async (s) => {
    const body = { ...s, estado: s.estado === "Activo" ? "Inactivo" : "Activo" };
    const res = await fetch("/api/servicios", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    if (saved.error) { alert(`Error: ${saved.error}`); return; }
    setServicios(p => p.map(x => x.id === s.id ? { ...x, estado: body.estado } : x));
  };

  // ── Roles ─────────────────────────────────────────────────────────────────
  const handleSaveRoles = () => {
    setServicios(p => p.map(s => s.id === rolesModal ? { ...s, roles: { ...rolesForm } } : s));
    setRolesModal(null);
  };
  const openRolesModal = (s) => {
    setRolesForm({ ...ROLES_SERVICIO_EMPTY, ...(s.roles || {}) });
    setRolesModal(s.id);
    setDetail(null);
  };
  const rolesActivos = (s) => Object.entries(s.roles || {}).filter(([, v]) => v).map(([k]) => k);

  // ── Form compartido (create / edit) ──────────────────────────────────────
  const ServicioForm = ({ f, setF, isEdit }) => (
    <div className="space-y-4">
      <Input label="Nombre" value={f.nombre} onChange={e => setF(x => ({ ...x, nombre: e.target.value }))} placeholder="Nombre del cliente o proyecto" />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Tipo" value={f.tipo} onChange={e => setF(x => ({ ...x, tipo: e.target.value }))} options={TIPOS_SERVICIO} />
        <Select label="Tribu" value={f.tribu} onChange={e => setF(x => ({ ...x, tribu: e.target.value }))} options={TRIBUS_DEFAULT} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="ID Contrato" value={f.contratoId} onChange={e => setF(x => ({ ...x, contratoId: e.target.value }))} placeholder="CN-00xxx" />
        <Input label="ID Jira" value={f.jiraId} onChange={e => setF(x => ({ ...x, jiraId: e.target.value }))} placeholder="JIRA-xxx" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="PO / Responsable"
          value={f.po}
          onChange={e => setF(x => ({ ...x, po: e.target.value }))}
          options={[{ value: "", label: "Seleccionar..." }, ...pos.map(p => ({ value: p, label: p }))]}
        />
        <Input label="Tecnología" value={f.tecnologia} onChange={e => setF(x => ({ ...x, tecnologia: e.target.value }))} placeholder="Salesforce, Oracle, Adobe..." />
      </div>
      {f.tipo === "Talento Dedicado"
        ? <Input label="Personas dedicadas" type="number" min="1" value={f.personasDedicadas} onChange={e => setF(x => ({ ...x, personasDedicadas: e.target.value }))} />
        : <Input label={tieneHorasLimite(f.tipo) ? "Horas límite / mes" : "Horas totales estimadas"} type="number" value={f.horasLimite} onChange={e => setF(x => ({ ...x, horasLimite: e.target.value }))} />
      }
      <div className="grid grid-cols-2 gap-3">
        <Input label="Fecha inicio" type="date" value={f.fechaInicio} onChange={e => setF(x => ({ ...x, fechaInicio: e.target.value }))} />
        <Input label="Fecha vencimiento" type="date" value={f.fechaVencimiento} onChange={e => setF(x => ({ ...x, fechaVencimiento: e.target.value }))} />
      </div>
      {isEdit && (
        <Select label="Estado" value={f.estado} onChange={e => setF(x => ({ ...x, estado: e.target.value }))} options={["Activo", "Inactivo"]} />
      )}
      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input type="checkbox" checked={f.renovable} onChange={e => setF(x => ({ ...x, renovable: e.target.checked }))} className="w-4 h-4 accent-blue-500" />
        Contrato renovable
      </label>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        <KPI title="Total servicios" value={servicios.filter(s => s.estado === "Activo").length} color="blue" />
        {TRIBUS_DEFAULT.map(t => <KPI key={t} title={t} value={servicios.filter(s => s.tribu === t && s.estado === "Activo").length} color="green" />)}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar servicio o contrato..." className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56" />
        <div className="flex gap-1">
          {["Todas", ...TRIBUS_DEFAULT].map(t => <button key={t} onClick={() => setTribFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tribFilter === t ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"}`}>{t}</button>)}
        </div>
        <div className="flex gap-1">
          {["Activo", "Inactivo", "Todos"].map(e => <button key={e} onClick={() => setEstadoFilter(e)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${estadoFilter === e ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"}`}>{e}</button>)}
        </div>
        <Btn size="sm" onClick={() => setModal(true)} className="ml-auto">+ Nuevo servicio</Btn>
      </div>

      <div className="rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/80">
            <tr>{["Contrato", "Servicio/Proyecto", "Tipo", "Tribu", "PO", "Tecnología", "Límite horas", "Vigencia", "Estado", ""].map(h => <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const hoy = new Date();
              const venc = s.fechaVencimiento ? new Date(s.fechaVencimiento) : null;
              const diasRestantes = venc ? Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24)) : null;
              const vigenciaColor = diasRestantes === null ? "text-slate-500" : diasRestantes < 0 ? "text-red-400" : diasRestantes <= 60 ? "text-amber-400" : "text-emerald-400";
              const vigenciaLabel = diasRestantes === null ? "Sin fecha" : diasRestantes < 0 ? `Venció hace ${Math.abs(diasRestantes)}d` : diasRestantes <= 30 ? `${diasRestantes}d ⚠` : s.fechaVencimiento;
              return (
                <tr key={s.id} className={`border-t border-slate-700/30 hover:bg-slate-800/20 ${s.estado === "Inactivo" ? "opacity-50" : ""}`}>
                  <td className="px-3 py-3 text-blue-400 font-mono text-xs">{s.contratoId || "—"}</td>
                  <td className="px-3 py-3 text-white font-medium">{s.nombre}</td>
                  <td className="px-3 py-3"><Badge color={s.tipo.includes("Crítico") ? "red" : s.tipo.includes("Dedicado") ? "purple" : s.tipo.includes("Proyecto") ? "amber" : "blue"}>{s.tipo}</Badge></td>
                  <td className="px-3 py-3"><Pill label={s.tribu} color={s.tribu} /></td>
                  <td className="px-3 py-3 text-slate-300 text-xs">{s.po || "—"}</td>
                  <td className="px-3 py-3 text-slate-400 text-xs">{s.tecnologia || "—"}</td>
                  <td className="px-3 py-3 text-slate-300 font-mono text-xs">
                    {s.tipo === "Talento Dedicado" ? `${s.personasDedicadas}p` : `${s.horasLimite}h`}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className={`font-mono text-xs font-semibold ${vigenciaColor}`}>{vigenciaLabel}</span>
                      {s.renovable && <span className="text-xs text-slate-500">renovable</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge color={s.estado === "Activo" ? "green" : "gray"}>{s.estado}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <Btn variant="ghost" size="sm" onClick={() => setDetail(s)}>Ver</Btn>
                      <Btn variant="ghost" size="sm" onClick={() => openEdit(s)}>✏️</Btn>
                      <Btn variant={s.estado === "Activo" ? "danger" : "ghost"} size="sm" onClick={() => handleToggleEstado(s)}>
                        {s.estado === "Activo" ? "Desactivar" : "Activar"}
                      </Btn>
                      <Btn variant="danger" size="sm" onClick={() => handleDelete(s)}>🗑</Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">No se encontraron servicios</p>}
      </div>

      {/* Modal: Crear */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo servicio / proyecto">
        <ServicioForm f={form} setF={setForm} isEdit={false} />
        <div className="flex justify-end gap-2 pt-4">
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
          <Btn onClick={handleAdd}>Guardar</Btn>
        </div>
      </Modal>

      {/* Modal: Editar */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Editar — ${editModal?.nombre}`}>
        <ServicioForm f={editForm} setF={setEditForm} isEdit={true} />
        <div className="flex justify-between pt-4">
          <Btn variant="danger" onClick={() => handleDelete(editModal)}>Eliminar</Btn>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={() => setEditModal(null)}>Cancelar</Btn>
            <Btn onClick={handleEdit}>Guardar cambios</Btn>
          </div>
        </div>
      </Modal>

      {/* Modal: Roles */}
      <Modal open={!!rolesModal} onClose={() => setRolesModal(null)} title={`Roles requeridos — ${servicios.find(s => s.id === rolesModal)?.nombre}`}>
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Selecciona los roles que participan en este servicio/proyecto.</p>
          <div className="grid grid-cols-2 gap-3">
            {ROLES_DEFAULT.map(rol => (
              <label key={rol} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${rolesForm[rol] ? "border-blue-500/50 bg-blue-500/10" : "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60"}`}>
                <input type="checkbox" checked={!!rolesForm[rol]} onChange={e => setRolesForm(f => ({ ...f, [rol]: e.target.checked }))} className="w-4 h-4 accent-blue-500" />
                <Pill label={rol} color={rol} />
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setRolesModal(null)}>Cancelar</Btn>
            <Btn onClick={handleSaveRoles}>Guardar</Btn>
          </div>
        </div>
      </Modal>

      {/* Modal: Detalle */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detalle del servicio">
        {detail && (
          <div className="space-y-3">
            {[
              ["Nombre", detail.nombre],
              ["Tipo", detail.tipo],
              ["Tribu", detail.tribu],
              ["PO / Responsable", detail.po || "—"],
              ["Contrato", detail.contratoId || "—"],
              ["Jira", detail.jiraId || "—"],
              ["Tecnología", detail.tecnologia || "—"],
              ["Límite horas", detail.tipo === "Talento Dedicado" ? `${detail.personasDedicadas} personas dedicadas` : `${detail.horasLimite}h`],
              ["Fecha inicio", detail.fechaInicio || "—"],
              ["Fecha vencimiento", detail.fechaVencimiento || "—"],
              ["Estado", detail.estado],
              ["Renovable", detail.renovable ? "Sí" : "No"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-slate-700/30">
                <span className="text-xs text-slate-500 uppercase tracking-wider">{k}</span>
                <span className="text-sm text-white font-medium">{v}</span>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Roles requeridos</p>
              <div className="flex flex-wrap gap-2">
                {rolesActivos(detail).length > 0
                  ? rolesActivos(detail).map(r => <Pill key={r} label={r} color={r} />)
                  : <span className="text-xs text-slate-600">No configurados</span>
                }
              </div>
            </div>
            <div className="flex justify-between pt-3">
              <Btn variant="danger" size="sm" onClick={() => handleDelete(detail)}>Eliminar</Btn>
              <div className="flex gap-2">
                <Btn variant="ghost" size="sm" onClick={() => openRolesModal(detail)}>Editar roles</Btn>
                <Btn size="sm" onClick={() => openEdit(detail)}>✏️ Editar</Btn>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── MÓDULO: GESTIÓN DE TRIBU ─────────────────────────────────────────────────

function ModuloTribu({ tribu, servicios, calendar, disponibilidad, ausencias, colaboradores, params }) {

  const [mesSel, setMesSel] = useState("2026-01");
  const [tab, setTab] = useState("planificacion");

  const tribServicios = servicios.filter(s => s.tribu === tribu && s.estado === "Activo");
  const cal = calendar.find(c => c.mes === mesSel);
  const diasMes = cal ? cal.diasLaborales : 20;

  // Horas por rol (mock editable)
  const [horasPorRolServicio, setHorasPorRolServicio] = useState(() => {
    const init = {};
    tribServicios.forEach(s => {
      ROLES_DEFAULT.forEach(r => { init[`${s.id}|${r}`] = 0; });
    });
    return init;
  });

  const setHoras = (sid, rol, val) => setHorasPorRolServicio(p => ({ ...p, [`${sid}|${rol}`]: Math.max(0, Number(val)) }));

  // Totales por servicio
  const totalHorasServicio = (sid) => ROLES_DEFAULT.reduce((a, r) => a + (horasPorRolServicio[`${sid}|${r}`] || 0), 0);

  // Requerido por rol (personas equiv)
  const requeridoPorRol = useMemo(() => {
    const map = {};
    ROLES_DEFAULT.forEach(rol => {
      const totalH = tribServicios.reduce((a, s) => a + (horasPorRolServicio[`${s.id}|${rol}`] || 0), 0);
      map[rol] = +(totalH / (diasMes * HORAS_DIA)).toFixed(3);
    });
    return map;
  }, [horasPorRolServicio, diasMes, tribServicios]);

  // Disponible por rol en tribu
  const disponiblePorRol = useMemo(() => {
    const map = {};
    ROLES_DEFAULT.forEach(rol => {
      const entries = disponibilidad.filter(d => d.tribu === tribu && d.rol === rol && d.mes === mesSel);
      const total = entries.reduce((a, d) => {
        const ausEntry = ausencias.find(au => au.colaborador === d.colaborador && au.mes === mesSel);
        const diasAus = ausEntry ? ausEntry.dias : 0;
        const neto = d.porcentaje * ((diasMes - diasAus) / diasMes);
        return a + neto / 100;
      }, 0);
      map[rol] = +total.toFixed(3);
    });
    return map;
  }, [disponibilidad, ausencias, tribu, mesSel, diasMes]);

  // Personas en tribu ese mes
  const personasTribu = disponibilidad.filter(d => d.tribu === tribu && d.mes === mesSel).map(d => d.colaborador);
  const uniquePersonas = [...new Set(personasTribu)];
  const noCobrable = +(HORAS_NO_COBRABLE * uniquePersonas.length / (diasMes * HORAS_DIA)).toFixed(3);
  const totalRequeridoConNC = Object.values(requeridoPorRol).reduce((a, b) => a + b, 0) + noCobrable;
  const totalDisponible = Object.values(disponiblePorRol).reduce((a, b) => a + b, 0);
  const diferencia = +(totalDisponible - totalRequeridoConNC).toFixed(3);

  // Por persona (piloto Yarigai)
  const porPersona = useMemo(() => {
    if (tribu !== "Yarigai") return [];
    return uniquePersonas.map(name => {
      const diasAus = (ausencias.find(a => a.colaborador === name && a.mes === mesSel)?.dias || 0);
      const dispHoras = (diasMes - diasAus) * HORAS_DIA;
      const asigH = tribServicios.reduce((acc, s) => {
        return acc + ROLES_DEFAULT.reduce((a, r) => a + (horasPorRolServicio[`${s.id}|${r}`] || 0), 0);
      }, 0) / Math.max(uniquePersonas.length, 1);
      const dif = +(asigH - dispHoras).toFixed(1);
      return { name, dispHoras, asigH: +asigH.toFixed(1), dif };
    });
  }, [uniquePersonas, tribu, diasMes, ausencias, mesSel, tribServicios, horasPorRolServicio]);

  return (
    <div className="space-y-5">
      {/* Selector mes */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 uppercase tracking-wider">Mes:</span>
        <div className="flex gap-1 flex-wrap">
          {calendar.slice(-8).map(c => (
            <button key={c.mes} onClick={() => setMesSel(c.mes)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mesSel === c.mes ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"}`}>{c.label}</button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700/50 pb-1">
        {[["planificacion", "?? Planificación"], ["capacidad", "⚖️ Capacidad vs Demanda"], ...(tribu === "Yarigai" ? [["personas", "?? Por Persona (Piloto)"]] : [])].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === id ? "bg-slate-800 text-white border border-slate-700" : "text-slate-400 hover:text-white"}`}>{label}</button>
        ))}
      </div>

      {/* PLANIFICACIÓN */}
      {tab === "planificacion" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Ingresa las horas por rol para cada servicio en {cal?.label}. Días laborales del mes: <strong className="text-white">{diasMes}</strong></p>
          {tribServicios.length === 0 && <p className="text-center text-slate-500 py-8">No hay servicios activos para {tribu}</p>}
          {tribServicios.map(s => {
            const total = totalHorasServicio(s.id);
            const limite = s.horasLimite;
            const sobreLimite = limite > 0 && total > limite;
            const bajoLimite = limite > 0 && total < limite && total > 0;
            return (
              <div key={s.id} className={`rounded-xl border p-4 space-y-3 ${sobreLimite ? "border-red-500/40 bg-red-500/5" : bajoLimite ? "border-amber-500/30 bg-amber-500/5" : "border-slate-700/50 bg-slate-800/20"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold">{s.nombre}</span>
                    <Badge color={s.tipo.includes("Crítico") ? "red" : "blue"}>{s.tipo}</Badge>
                    <span className="text-xs text-slate-500 font-mono">{s.contratoId}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`font-mono font-bold ${sobreLimite ? "text-red-400" : bajoLimite ? "text-amber-400" : "text-emerald-400"}`}>{total}h / {limite > 0 ? `${limite}h` : "sin límite"}</span>
                    {sobreLimite && <Badge color="red">Sobre límite</Badge>}
                    {bajoLimite && <Badge color="amber">Bajo límite</Badge>}
                  </div>
                </div>
                <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
                  {ROLES_DEFAULT.map(rol => (
                    <div key={rol}>
                      <label className="text-xs text-slate-500 block mb-1">{rol}</label>
                      <input
                        type="number" min="0"
                        value={horasPorRolServicio[`${s.id}|${rol}`] || ""}
                        onChange={e => setHoras(s.id, rol, e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
                {limite > 0 && (
                  <div className="w-full bg-slate-700/50 rounded-full h-1">
                    <div className={`h-1 rounded-full transition-all ${sobreLimite ? "bg-red-500" : bajoLimite ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, (total / limite) * 100)}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CAPACIDAD */}
      {tab === "capacidad" && (
        <div className="space-y-5">
          <div className={`rounded-xl border p-4 ${diferencia >= 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Balance general — {tribu} — {cal?.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">Disponible: <span className="text-blue-400 font-mono font-bold">{totalDisponible.toFixed(2)}</span> personas · Requerido + No cobrable: <span className="text-slate-300 font-mono font-bold">{totalRequeridoConNC.toFixed(2)}</span></p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold font-mono ${diferencia >= 0 ? "text-emerald-400" : "text-red-400"}`}>{diferencia >= 0 ? "+" : ""}{diferencia}</p>
                <p className="text-xs text-slate-500">personas equiv.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80">
                <tr>{["Rol", "Requerido", "+ No cobrable", "Disponible", "Diferencia"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody>
                {ROLES_DEFAULT.map(rol => {
                  const req = requeridoPorRol[rol];
                  const disp = disponiblePorRol[rol];
                  const nc = rol === "GA" ? noCobrable : 0;
                  const diff = +(disp - req - nc).toFixed(3);
                  return (
                    <tr key={rol} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                      <td className="px-4 py-2.5"><Pill label={rol} color={rol} /></td>
                      <td className="px-4 py-2.5 font-mono text-slate-300">{req.toFixed(3)}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">{nc > 0 ? nc.toFixed(3) : "—"}</td>
                      <td className="px-4 py-2.5 font-mono text-blue-400">{disp.toFixed(3)}</td>
                      <td className="px-4 py-2.5 font-mono font-bold">
                        <span className={diff >= 0 ? "text-emerald-400" : "text-red-400"}>{diff >= 0 ? "+" : ""}{diff}</span>
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-slate-600 bg-slate-800/50">
                  <td className="px-4 py-2.5 font-bold text-white text-xs uppercase">TOTAL</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-slate-300">{Object.values(requeridoPorRol).reduce((a, b) => a + b, 0).toFixed(3)}</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-slate-400">{noCobrable.toFixed(3)}</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-blue-400">{totalDisponible.toFixed(3)}</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-lg">
                    <span className={diferencia >= 0 ? "text-emerald-400" : "text-red-400"}>{diferencia >= 0 ? "+" : ""}{diferencia}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POR PERSONA (Yarigai piloto) */}
      {tab === "personas" && tribu === "Yarigai" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Vista piloto — distribución de horas por persona individual en {cal?.label}.</p>
          {porPersona.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">No hay asignaciones de disponibilidad configuradas para Yarigai en este mes</p>}
          <div className="grid grid-cols-1 gap-3">
            {porPersona.map(p => (
              <div key={p.name} className={`rounded-xl border p-4 flex items-center justify-between ${p.dif > 0 ? "border-red-500/40 bg-red-500/5" : p.dif < -40 ? "border-amber-500/30 bg-amber-500/5" : "border-slate-700/50"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: TRIBU_COLORS["Yarigai"] + "30", color: TRIBU_COLORS["Yarigai"] }}>{p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                  <span className="text-white font-medium">{p.name}</span>
                </div>
                <div className="flex items-center gap-6 text-xs">
                  <div className="text-right"><p className="text-slate-500">Asignado</p><p className="font-mono font-bold text-slate-300">{p.asigH}h</p></div>
                  <div className="text-right"><p className="text-slate-500">Disponible</p><p className="font-mono font-bold text-blue-400">{p.dispHoras}h</p></div>
                  <div className="text-right">
                    <p className="text-slate-500">Diferencia</p>
                    <p className={`font-mono font-bold ${p.dif > 0 ? "text-red-400" : "text-emerald-400"}`}>{p.dif > 0 ? "+" : ""}{p.dif}h</p>
                  </div>
                  {p.dif > 0 && <Badge color="red">Sobreocupado</Badge>}
                  {p.dif < -40 && <Badge color="amber">Subutilizado</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MÓDULO: DASHBOARD ────────────────────────────────────────────────────────

function ModuloDashboard({ colaboradores, servicios, calendar, disponibilidad, ausencias, alertas, onNavigate, params }) {

  const activos = colaboradores.filter(c => c.status === "Activo").length;
  const contratosActivos = servicios.filter(s => s.estado === "Activo").length;
  const ultimoMes = calendar[calendar.length - 1];
  const totalAlertas = (alertas?.deficit?.length || 0) + (alertas?.holgura?.length || 0) + (alertas?.vencimientos?.length || 0);

  const chartData = calendar.slice(-6).map(c => {
    const row = { mes: c.label };
    TRIBUS_DEFAULT.forEach(t => {
      row[t] = +disponibilidad.filter(d => d.tribu === t && d.mes === c.mes).reduce((acc, d) => {
        const aus = ausencias.find(a => a.colaborador === d.colaborador && a.mes === c.mes);
        const diasAus = aus ? aus.dias : 0;
        return acc + (d.porcentaje / 100) * ((c.diasLaborales - diasAus) / c.diasLaborales);
      }, 0).toFixed(2);
    });
    return row;
  });

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="xt-kpi-grid grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI title="Colaboradores activos" value={activos} sub="3 tribus" color="blue" />
        <KPI title="Servicios activos" value={contratosActivos} color="green" />
        <KPI title="Días laborales" value={ultimoMes?.diasLaborales} sub={ultimoMes?.label} color="amber" />
        <KPI title="Horas no cobrables" value={`${HORAS_NO_COBRABLE}h`} sub="por persona/mes" color="blue" />
      </div>

      {/* Alertas resumen ejecutivo */}
      {totalAlertas > 0 && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0"></span>
              <div>
                <p className="text-sm font-semibold text-red-400">{totalAlertas} alerta{totalAlertas > 1 ? "s" : ""} proactiva{totalAlertas > 1 ? "s" : ""} detectada{totalAlertas > 1 ? "s" : ""}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {alertas.deficit.length > 0 && `${alertas.deficit.length} déficit de capacidad · `}
                  {alertas.holgura.length > 0 && `${alertas.holgura.length} subutilización · `}
                  {alertas.vencimientos.length > 0 && `${alertas.vencimientos.length} contratos por vencer`}
                </p>
              </div>
            </div>
            <button onClick={() => onNavigate("alertas")} className="text-xs font-semibold text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0">
              Ver todas las alertas →
            </button>
          </div>
        </div>
      )}

      {/* Tribu cards */}
      <div className="xt-tribu-grid grid grid-cols-1 lg:grid-cols-3 gap-4">
        {TRIBUS_DEFAULT.map(t => {
          const cnt = colaboradores.filter(c => c.tribu === t && c.status === "Activo").length;
          const srv = servicios.filter(s => s.tribu === t && s.estado === "Activo").length;
          return (
            <div key={t} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full" style={{ background: TRIBU_COLORS[t] }}></span>
                <span className="font-semibold text-white">{t}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-2xl font-bold font-mono" style={{ color: TRIBU_COLORS[t] }}>{cnt}</p><p className="text-xs text-slate-500">colaboradores</p></div>
                <div><p className="text-2xl font-bold font-mono text-slate-300">{srv}</p><p className="text-xs text-slate-500">servicios</p></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráfico disponibilidad */}
      <div>
        <SectionHeader>Disponibilidad neta por tribu — últimos 6 meses</SectionHeader>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-4 h-64">
          {chartData.some(d => TRIBUS_DEFAULT.some(t => d[t] > 0))
            ? <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="mes" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc" }} />
                  <Legend />
                  {TRIBUS_DEFAULT.map(t => <Bar key={t} dataKey={t} fill={TRIBU_COLORS[t]} radius={[3, 3, 0, 0]} />)}
                </BarChart>
              </ResponsiveContainer>
            : <div className="h-full flex items-center justify-center text-slate-500 text-sm">Configure disponibilidad en Parámetros para ver datos</div>
          }
        </div>
      </div>

      {/* Servicios por tipo */}
      <div>
        <SectionHeader>Resumen de servicios por tipo</SectionHeader>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {TIPOS_SERVICIO.map(tipo => {
            const count = servicios.filter(s => s.tipo === tipo && s.estado === "Activo").length;
            if (count === 0) return null;
            return (
              <div key={tipo} className="rounded-lg border border-slate-700/40 bg-slate-800/20 p-3 flex justify-between items-center">
                <span className="text-xs text-slate-400">{tipo}</span>
                <span className="text-lg font-bold font-mono text-white">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MÓDULO: ASIGNACIONES ────────────────────────────────────────────────────

const ASIG_FORM_DEFAULT = { tribu: "Dunamis", rol: "Técnico", colaborador: "", servicioId: "", mes: "2026-02", horas: 0 };

function ModuloAsignaciones({ asignaciones, setAsignaciones, colaboradores, servicios, ausencias, calendar, params }) {

  const [mesFilter, setMesFilter] = useState("2026-02");
  const [tribFilter, setTribFilter] = useState("Todas");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(ASIG_FORM_DEFAULT);
  const [error, setError] = useState("");

  const motor = useUtilizacion({ colaboradores, asignaciones, ausencias, calendar, servicios, params });

  const mesesDisponibles = calendar.filter(c => {
    const d = new Date(c.mes + "-01");
    const hoy = new Date();
    return d >= new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  }).slice(0, 9);

  const esPiloto = params.pilotoPorPersona.includes(form.tribu);
  const personasTribu = colaboradores.filter(c => c.tribu === form.tribu && c.status === "Activo");
  const serviciosFiltrados = servicios.filter(s => s.estado === "Activo");

  const servicio = servicios.find(s => s.id === Number(form.servicioId));
  const esProyecto = servicio?.tipo === "Proyecto";

  // Validaciones al guardar
  const handleAdd = async () => {
    if (!form.horas || form.horas <= 0) return setError("Las horas deben ser mayor a 0");
    if (esPiloto && !form.colaborador) return setError("Selecciona un colaborador");

    const srv = servicios.find(s => s.id === Number(form.servicioId));

    // Validar límite del servicio
    if (srv && !esProyecto) {
      const yaAsignado = motor.horasAsignadasServicio(srv.id, form.mes);
      if (yaAsignado + Number(form.horas) > srv.horasLimite) {
        return setError(`Supera el límite del servicio: ${srv.horasLimite}h/mes (ya asignadas: ${yaAsignado}h)`);
      }
    }
    if (srv && esProyecto) {
      const acum = motor.horasAcumuladasProyecto(srv.id);
      if (acum + Number(form.horas) > srv.horasLimite) {
        return setError(`Supera el presupuesto total del proyecto: ${srv.horasLimite}h (acumuladas: ${acum}h)`);
      }
    }

    // Validar capacidad de persona (Yarigai)
    if (esPiloto && form.colaborador) {
      const colab = colaboradores.find(c => c.name === form.colaborador);
      if (colab) {
        const cap = motor.capacidadPersona(colab, form.mes);
        const yaAsig = motor.horasAsignadasPersona(form.colaborador, form.mes);
        if (yaAsig + Number(form.horas) > cap.disponible) {
          return setError(`Supera la capacidad de ${form.colaborador}: ${cap.disponible}h disponibles (ya asignadas: ${yaAsig}h)`);
        }
      }
    }

    // Validar capacidad del rol en la tribu (Dunamis/Bulwak)
    if (!esPiloto) {
      const capRol = motor.capacidadRolTribu(form.tribu, form.rol, form.mes);
      const yaAsigRol = motor.horasAsignadasRolTribu(form.tribu, form.rol, form.mes);
      if (yaAsigRol + Number(form.horas) > capRol) {
        return setError(`Supera la capacidad del rol ${form.rol} en ${form.tribu}: ${capRol}h disponibles (ya asignadas: ${yaAsigRol}h)`);
      }
    }

    const body = {
      ...form,
      servicioId: Number(form.servicioId),
      horas: Number(form.horas),
      colaborador: esPiloto ? form.colaborador : null,
    };
    const res = await fetch("/api/asignaciones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    setAsignaciones(p => [...p, saved]);
    setModal(false);
    setForm(ASIG_FORM_DEFAULT);
  };

  const handleDelete = async (id) => {
    await fetch("/api/asignaciones", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setAsignaciones(p => p.filter(a => a.id !== id));
  };

  // Filtrar asignaciones para mostrar
  const filtered = asignaciones.filter(a =>
    a.mes === mesFilter &&
    (tribFilter === "Todas" || a.tribu === tribFilter)
  );

  // Resumen rápido del mes seleccionado
  const resumenMes = TRIBUS_DEFAULT.map(tribu => {
    const roles = [...new Set(colaboradores.filter(c => c.tribu === tribu && c.status === "Activo").map(c => c.rolPrincipal))];
    const totalDisp = ROLES_DEFAULT.reduce((s, rol) => s + motor.capacidadRolTribu(tribu, rol, mesFilter), 0);
    const totalAsig = asignaciones.filter(a => a.tribu === tribu && a.mes === mesFilter).reduce((s, a) => s + a.horas, 0);
    const pct = totalDisp > 0 ? Math.round((totalAsig / totalDisp) * 100) : 0;
    return { tribu, totalDisp, totalAsig, pct };
  });

  return (
    <div className="space-y-5">
      {/* Resumen KPIs por tribu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {resumenMes.map(r => {
          const s = semaforo(r.pct, params.utilObjetivo);
          return (
            <div key={r.tribu} className={`rounded-xl border p-4 ${s.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: TRIBU_COLORS[r.tribu] }}></span>
                  <span className="font-semibold text-white text-sm">{r.tribu}</span>
                  <span className="text-xs text-slate-500">{mesFilter}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
              </div>
              <BarUtil pct={r.pct} objetivo={params.utilObjetivo} />
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>Asignado: <span className="text-white font-mono">{r.totalAsig}h</span></span>
                <span>Disponible: <span className="text-white font-mono">{r.totalDisp}h</span></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 flex-wrap">
          {mesesDisponibles.map(c => (
            <button key={c.mes} onClick={() => setMesFilter(c.mes)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${mesFilter === c.mes ? "bg-blue-600 text-white border-blue-600" : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"}`}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {["Todas", ...TRIBUS_DEFAULT].map(t => (
            <button key={t} onClick={() => setTribFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${tribFilter === t ? "bg-slate-600 text-white border-slate-500" : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"}`}>
              {t}
            </button>
          ))}
        </div>
        <Btn size="sm" onClick={() => { setForm({ ...ASIG_FORM_DEFAULT, mes: mesFilter }); setError(""); setModal(true); }}>
          + Nueva asignación
        </Btn>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-slate-700/50 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/80">
            <tr>
              {["Tribu", "Rol", "Colaborador", "Servicio", "Mes", "Horas", "% Límite srv.", ""].map(h => (
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => {
              const srv = servicios.find(s => s.id === a.servicioId);
              const totalSrv = motor.horasAsignadasServicio(a.servicioId, a.mes);
              const pctSrv = srv && !esProyecto ? Math.round((totalSrv / srv.horasLimite) * 100) : null;
              return (
                <tr key={a.id} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                  <td className="px-3 py-2.5"><Pill label={a.tribu} color={a.tribu} /></td>
                  <td className="px-3 py-2.5"><Pill label={a.rol} color={a.rol} /></td>
                  <td className="px-3 py-2.5 text-slate-300 text-xs">{a.colaborador || <span className="text-slate-600">— por rol</span>}</td>
                  <td className="px-3 py-2.5 text-white text-xs font-medium">{srv?.nombre || `#${a.servicioId}`}</td>
                  <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">{a.mes}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-white">{a.horas}h</td>
                  <td className="px-3 py-2.5">
                    {pctSrv !== null
                      ? <BarUtil pct={pctSrv} objetivo={100} />
                      : <span className="text-xs text-slate-600">proyecto</span>
                    }
                  </td>
                  <td className="px-3 py-2.5">
                    <Btn variant="danger" size="sm" onClick={() => handleDelete(a.id)}>✕</Btn>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-500 py-10 text-sm">
                No hay asignaciones para {mesFilter} — {tribFilter !== "Todas" ? tribFilter : "todas las tribus"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal nueva asignación */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nueva asignación de horas">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tribu" value={form.tribu} onChange={e => setForm(f => ({ ...f, tribu: e.target.value, colaborador: "" }))} options={TRIBUS_DEFAULT} />
            <Select label="Rol" value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))} options={ROLES_DEFAULT} />
          </div>

          {/* Colaborador — solo si es tribu piloto */}
          {params.pilotoPorPersona.includes(form.tribu) && (
            <Select
              label="Colaborador (piloto por persona)"
              value={form.colaborador}
              onChange={e => setForm(f => ({ ...f, colaborador: e.target.value }))}
              options={[{ value: "", label: "Seleccionar..." }, ...personasTribu.map(c => ({ value: c.name, label: c.name }))]}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select label="Mes" value={form.mes} onChange={e => setForm(f => ({ ...f, mes: e.target.value }))}
              options={mesesDisponibles.map(c => ({ value: c.mes, label: c.label }))} />
            <Input label="Horas" type="number" min="1" value={form.horas} onChange={e => setForm(f => ({ ...f, horas: +e.target.value }))} />
          </div>

          <Select
            label="Servicio"
            value={form.servicioId}
            onChange={e => setForm(f => ({ ...f, servicioId: e.target.value }))}
            options={[{ value: "", label: "Seleccionar servicio..." }, ...serviciosFiltrados.map(s => ({ value: s.id, label: `${s.nombre} (${s.contratoId})` }))]}
          />

          {/* Preview de capacidad */}
          {form.servicioId && (() => {
            const srv = servicios.find(s => s.id === Number(form.servicioId));
            const yaAsigSrv = motor.horasAsignadasServicio(Number(form.servicioId), form.mes);
            const esProy = srv?.tipo === "Proyecto";
            const limite = srv?.horasLimite || 0;
            const restante = esProy
              ? limite - motor.horasAcumuladasProyecto(Number(form.servicioId))
              : limite - yaAsigSrv;
            return (
              <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-3 text-xs space-y-1">
                <p className="text-slate-400 font-semibold">{srv?.nombre}</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">{esProy ? "Presupuesto total" : "Límite mensual"}</span>
                  <span className="font-mono text-white">{limite}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ya asignadas</span>
                  <span className="font-mono text-amber-400">{esProy ? motor.horasAcumuladasProyecto(Number(form.servicioId)) : yaAsigSrv}h</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Disponible</span>
                  <span className={`font-mono ${restante < (form.horas || 0) ? "text-red-400" : "text-emerald-400"}`}>{restante}h</span>
                </div>
              </div>
            );
          })()}

          {/* Preview capacidad persona (Yarigai) */}
          {params.pilotoPorPersona.includes(form.tribu) && form.colaborador && form.mes && (() => {
            const colab = colaboradores.find(c => c.name === form.colaborador);
            if (!colab) return null;
            const cap = motor.capacidadPersona(colab, form.mes);
            const yaAsig = motor.horasAsignadasPersona(form.colaborador, form.mes);
            const restante = cap.disponible - yaAsig;
            return (
              <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-3 text-xs space-y-1">
                <p className="text-slate-400 font-semibold">{form.colaborador} — capacidad {form.mes}</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Disponible ({cap.dias}d × {colab.horasDia}h − {cap.horasNoCob}h NC − {cap.aus}d aus.)</span>
                  <span className="font-mono text-white">{cap.disponible}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ya asignadas</span>
                  <span className="font-mono text-amber-400">{yaAsig}h</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Disponible para asignar</span>
                  <span className={`font-mono ${restante < (form.horas || 0) ? "text-red-400" : "text-emerald-400"}`}>{restante}h</span>
                </div>
              </div>
            );
          })()}

          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn onClick={handleAdd}>Guardar asignación</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── MÓDULO: FORECAST DE CAPACIDAD ───────────────────────────────────────────

function ModuloForecast({ servicios, colaboradores, disponibilidad, ausencias, calendar, params }) {

  const [horizonte, setHorizonte] = useState(6);
  const [tribFocus, setTribFocus] = useState("Todas");

  // Meses del forecast: desde hoy hacia adelante
  const hoy = new Date();
  const mesesForecast = calendar.filter(c => {
    const d = new Date(c.mes + "-01");
    return d >= new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }).slice(0, horizonte);

  // Para cada mes: demanda proyectada = sum horas de servicios activos en ese mes / (diasLaborales * HORAS_DIA)
  const calcDemanda = (tribu, mes) => {
    const cal = calendar.find(c => c.mes === mes);
    const diasMes = cal?.diasLaborales || 20;
    const srvActivos = servicios.filter(s => {
      if (s.estado !== "Activo") return false;
      if (tribu !== "Todas" && s.tribu !== tribu) return false;
      const inicio = s.fechaInicio ? new Date(s.fechaInicio) : new Date("2020-01-01");
      const fin = s.fechaVencimiento ? new Date(s.fechaVencimiento) : new Date("2099-12-31");
      const mesDate = new Date(mes + "-01");
      const mesFinDate = new Date(mesDate.getFullYear(), mesDate.getMonth() + 1, 0);
      return inicio <= mesFinDate && fin >= mesDate;
    });
    const horasTotales = srvActivos.reduce((acc, s) => {
      if (s.tipo === "Talento Dedicado") return acc + (s.personasDedicadas || 1) * diasMes * HORAS_DIA;
      return acc + (s.horasLimite || 0);
    }, 0);
    return +(horasTotales / (diasMes * HORAS_DIA)).toFixed(2);
  };

  const calcDisponibilidad = (tribu, mes) => {
    const cal = calendar.find(c => c.mes === mes);
    const diasMes = cal?.diasLaborales || 20;
    return +disponibilidad
      .filter(d => (tribu === "Todas" || d.tribu === tribu) && d.mes === mes)
      .reduce((acc, d) => {
        const aus = ausencias.find(a => a.colaborador === d.colaborador && a.mes === mes);
        const diasAus = aus ? aus.dias : 0;
        return acc + (d.porcentaje / 100) * ((diasMes - diasAus) / diasMes);
      }, 0).toFixed(2);
  };

  // Tabla de forecast por tribu x mes
  const forecastRows = (tribFocus === "Todas" ? TRIBUS_DEFAULT : [tribFocus]).map(tribu => {
    const mesesData = mesesForecast.map(c => {
      const demanda = calcDemanda(tribu, c.mes);
      const disp = calcDisponibilidad(tribu, c.mes);
      const brecha = +(disp - demanda).toFixed(2);
      return { ...c, demanda, disp, brecha };
    });
    return { tribu, mesesData };
  });

  // Alertas: meses con brecha negativa o < 0.5 personas
  const alertas = [];
  forecastRows.forEach(({ tribu, mesesData }) => {
    mesesData.forEach(m => {
      if (m.brecha < 0) alertas.push({ tribu, mes: m.label, brecha: m.brecha, tipo: "deficit" });
      else if (m.brecha < 0.5 && m.disp > 0) alertas.push({ tribu, mes: m.label, brecha: m.brecha, tipo: "tension" });
    });
  });

  // Alertas de holgura excesiva (candidatos a reasignar): brecha >= 1.5 por 2+ meses consecutivos
  const holguras = [];
  forecastRows.forEach(({ tribu, mesesData }) => {
    let consecutivos = 0;
    mesesData.forEach((m, i) => {
      if (m.brecha >= 1.5 && m.disp > 0) {
        consecutivos++;
        if (consecutivos >= 2 && i === mesesData.findIndex((x, j) => j >= i - consecutivos + 1 && x.brecha >= 1.5 && x.disp > 0) + consecutivos - 1) {
          const ya = holguras.find(h => h.tribu === tribu);
          if (!ya) holguras.push({ tribu, desde: mesesData[i - consecutivos + 1]?.label, brecha: m.brecha });
        }
      } else consecutivos = 0;
    });
  });

  // Contratos por vencer en el horizonte
  const porVencer = servicios.filter(s => {
    if (!s.fechaVencimiento || s.estado !== "Activo") return false;
    const fin = new Date(s.fechaVencimiento);
    const ultimo = mesesForecast[mesesForecast.length - 1];
    const finHorizonte = ultimo ? new Date(ultimo.mes + "-28") : hoy;
    return fin >= hoy && fin <= finHorizonte;
  }).sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

  // Chart data para el área chart
  const chartData = mesesForecast.map(c => {
    const row = { mes: c.label };
    TRIBUS_DEFAULT.forEach(t => {
      if (tribFocus === "Todas" || tribFocus === t) {
        row[`${t}_disp`] = calcDisponibilidad(t, c.mes);
        row[`${t}_dem`] = calcDemanda(t, c.mes);
      }
    });
    return row;
  });

  const tribsToShow = tribFocus === "Todas" ? TRIBUS_DEFAULT : [tribFocus];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {["Todas", ...TRIBUS_DEFAULT].map(t => (
            <button key={t} onClick={() => setTribFocus(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tribFocus === t ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-500">Horizonte:</span>
          {[3, 6, 9].map(n => (
            <button key={n} onClick={() => setHorizonte(n)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${horizonte === n ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"}`}>
              {n} meses
            </button>
          ))}
        </div>
      </div>

      {/* Alertas */}
      {(alertas.length > 0 || holguras.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {alertas.length > 0 && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">
                ⚡ {alertas.length} alerta{alertas.length > 1 ? "s" : ""} de capacidad
              </p>
              <div className="space-y-2">
                {alertas.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${a.tipo === "deficit" ? "bg-red-400" : "bg-amber-400"}`}></span>
                      <span className="text-white font-medium">{a.tribu}</span>
                      <span className="text-slate-400">{a.mes}</span>
                    </div>
                    <span className={`font-mono font-bold ${a.tipo === "deficit" ? "text-red-400" : "text-amber-400"}`}>
                      {a.brecha > 0 ? "+" : ""}{a.brecha} pers.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {holguras.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                ↓ Posibles personas subutilizadas
              </p>
              <div className="space-y-2">
                {holguras.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      <span className="text-white font-medium">{h.tribu}</span>
                      <span className="text-slate-400">desde {h.desde}</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400">+{h.brecha} pers. libres</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">Considerar reasignación o ajuste de equipo en ~3 meses</p>
            </div>
          )}
        </div>
      )}

      {/* Gráfico demanda vs disponibilidad */}
      <div>
        <SectionHeader>Demanda proyectada vs. Disponibilidad configurada</SectionHeader>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-4 h-72">
          {chartData.some(d => Object.values(d).some(v => typeof v === "number" && v > 0))
            ? <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    {tribsToShow.map(t => (
                      <linearGradient key={t} id={`fg${t}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={TRIBU_COLORS[t]} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={TRIBU_COLORS[t]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="mes" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "personas equiv.", angle: -90, position: "insideLeft", fill: "#475569", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc", fontSize: 12 }} />
                  <Legend />
                  {tribsToShow.map(t => (
                    <Area key={`${t}_disp`} type="monotone" dataKey={`${t}_disp`} name={`${t} Disponible`} stroke={TRIBU_COLORS[t]} fill={`url(#fg${t})`} strokeWidth={2} dot={false} />
                  ))}
                  {tribsToShow.map(t => (
                    <Line key={`${t}_dem`} type="monotone" dataKey={`${t}_dem`} name={`${t} Demanda`} stroke={TRIBU_COLORS[t]} strokeWidth={2} strokeDasharray="5 3" dot={false} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            : <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500 text-sm">
                <span className="text-3xl opacity-20">◈</span>
                <p>Configura disponibilidad en Parámetros para ver el forecast</p>
              </div>
          }
        </div>
      </div>

      {/* Tabla de brecha por tribu x mes */}
      <div>
        <SectionHeader>Brecha mensual — Disponible minus Demanda (personas equiv.)</SectionHeader>
        <div className="rounded-xl border border-slate-700/50 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-800/80">Tribu</th>
                {mesesForecast.map(c => (
                  <th key={c.mes} className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider min-w-[90px]">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forecastRows.map(({ tribu, mesesData }) => (
                <tr key={tribu} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                  <td className="px-4 py-3 sticky left-0 bg-slate-900/80">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: TRIBU_COLORS[tribu] }}></span>
                      <span className="font-semibold text-white">{tribu}</span>
                    </div>
                  </td>
                  {mesesData.map(m => {
                    const color = m.brecha < 0 ? "bg-red-500/15 text-red-400" : m.brecha < 0.5 && m.disp > 0 ? "bg-amber-500/15 text-amber-400" : m.disp === 0 ? "text-slate-600" : "bg-emerald-500/10 text-emerald-400";
                    return (
                      <td key={m.mes} className="px-3 py-3 text-center">
                        <div className={`inline-flex flex-col items-center rounded-lg px-2 py-1 ${color}`}>
                          <span className="font-mono font-bold text-sm">{m.brecha > 0 ? "+" : ""}{m.brecha}</span>
                          <span className="text-xs opacity-60">{m.disp}d / {m.demanda}r</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-600 mt-2">d = disponible · r = requerido (demanda proyectada por contratos activos)</p>
      </div>

      {/* Contratos por vencer */}
      {porVencer.length > 0 && (
        <div>
          <SectionHeader>Contratos que vencen en el horizonte seleccionado</SectionHeader>
          <div className="rounded-xl border border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80">
                <tr>{["Contrato", "Servicio", "Tribu", "Vencimiento", "¿Renovable?", "Impacto (personas)"].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {porVencer.map(s => {
                  const venc = new Date(s.fechaVencimiento);
                  const dias = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
                  const cal = calendar.find(c => c.mes === s.fechaVencimiento?.slice(0, 7));
                  const diasMes = cal?.diasLaborales || 20;
                  const impacto = s.tipo === "Talento Dedicado"
                    ? s.personasDedicadas
                    : +((s.horasLimite || 0) / (diasMes * HORAS_DIA)).toFixed(2);
                  return (
                    <tr key={s.id} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                      <td className="px-3 py-3 text-blue-400 font-mono text-xs">{s.contratoId}</td>
                      <td className="px-3 py-3 text-white font-medium">{s.nombre}</td>
                      <td className="px-3 py-3"><Pill label={s.tribu} color={s.tribu} /></td>
                      <td className="px-3 py-3">
                        <span className={`font-mono text-xs font-semibold ${dias <= 30 ? "text-red-400" : dias <= 60 ? "text-amber-400" : "text-slate-300"}`}>
                          {s.fechaVencimiento} <span className="text-slate-500">({dias}d)</span>
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <Badge color={s.renovable ? "green" : "gray"}>{s.renovable ? "Sí" : "No"}</Badge>
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-slate-300">{impacto} pers.</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MÓDULO: SIMULADOR DE PROYECTO ───────────────────────────────────────────

const SIM_FORM_DEFAULT = {
  nombre: "Nuevo proyecto",
  tribu: "Dunamis",
  tipo: "Soporte Evolutivo",
  horasLimite: 80,
  personasDedicadas: 1,
  fechaInicio: "",
  fechaVencimiento: "",
  duracionMeses: 6,
};

function ModuloSimulador({ servicios, colaboradores, disponibilidad, ausencias, calendar, params }) {

  const [form, setForm] = useState(SIM_FORM_DEFAULT);
  const [simActivo, setSimActivo] = useState(false);
  const [horizonte, setHorizonte] = useState(6);

  const hoy = new Date();

  // Meses del forecast desde hoy
  const mesesForecast = calendar.filter(c => {
    const d = new Date(c.mes + "-01");
    return d >= new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }).slice(0, horizonte);

  const tieneHorasLimite = (tipo) =>
    ["Soporte Evolutivo", "Soporte Crítico", "Soporte Evolutivo + Crítico", "Bolsa de Horas"].includes(tipo);

  // Calcula demanda real (sin simulado)
  const calcDemandaReal = (tribu, mes) => {
    const cal = calendar.find(c => c.mes === mes);
    const diasMes = cal?.diasLaborales || 20;
    const srvActivos = servicios.filter(s => {
      if (s.estado !== "Activo") return false;
      if (s.tribu !== tribu) return false;
      const inicio = s.fechaInicio ? new Date(s.fechaInicio) : new Date("2020-01-01");
      const fin = s.fechaVencimiento ? new Date(s.fechaVencimiento) : new Date("2099-12-31");
      const mesDate = new Date(mes + "-01");
      const mesFinDate = new Date(mesDate.getFullYear(), mesDate.getMonth() + 1, 0);
      return inicio <= mesFinDate && fin >= mesDate;
    });
    const horasTotales = srvActivos.reduce((acc, s) => {
      if (s.tipo === "Talento Dedicado") return acc + (s.personasDedicadas || 1) * diasMes * HORAS_DIA;
      return acc + (s.horasLimite || 0);
    }, 0);
    return +(horasTotales / (diasMes * HORAS_DIA)).toFixed(2);
  };

  // Demanda adicional del proyecto simulado en un mes dado
  const calcDemandaSim = (mes) => {
    const cal = calendar.find(c => c.mes === mes);
    const diasMes = cal?.diasLaborales || 20;
    if (!form.fechaInicio || !form.fechaVencimiento) return 0;
    const inicio = new Date(form.fechaInicio);
    const fin = new Date(form.fechaVencimiento);
    const mesDate = new Date(mes + "-01");
    const mesFinDate = new Date(mesDate.getFullYear(), mesDate.getMonth() + 1, 0);
    if (inicio > mesFinDate || fin < mesDate) return 0;
    if (form.tipo === "Talento Dedicado") {
      return +((form.personasDedicadas || 1)).toFixed(2);
    }
    return +((form.horasLimite || 0) / (diasMes * HORAS_DIA)).toFixed(2);
  };

  // Disponibilidad neta
  const calcDisp = (tribu, mes) => {
    const cal = calendar.find(c => c.mes === mes);
    const diasMes = cal?.diasLaborales || 20;
    return +disponibilidad
      .filter(d => d.tribu === tribu && d.mes === mes)
      .reduce((acc, d) => {
        const aus = ausencias.find(a => a.colaborador === d.colaborador && a.mes === mes);
        const diasAus = aus ? aus.dias : 0;
        return acc + (d.porcentaje / 100) * ((diasMes - diasAus) / diasMes);
      }, 0).toFixed(2);
  };

  // Costo estimado del proyecto simulado
  const duracion = (() => {
    if (!form.fechaInicio || !form.fechaVencimiento) return form.duracionMeses;
    const ini = new Date(form.fechaInicio);
    const fin = new Date(form.fechaVencimiento);
    return Math.max(1, Math.round((fin - ini) / (1000 * 60 * 60 * 24 * 30)));
  })();

  const horasTotalesSim = form.tipo === "Talento Dedicado"
    ? (form.personasDedicadas || 1) * duracion * 160
    : (form.horasLimite || 0) * duracion;
  const costoEstimado = horasTotalesSim * 46; // COSTO_HORA

  // Impacto en personas equiv.
  const personasNecesarias = form.tipo === "Talento Dedicado"
    ? +(form.personasDedicadas || 1)
    : +((form.horasLimite || 0) / 160).toFixed(2);

  // Tabla de impacto por mes
  const impactoRows = mesesForecast.map(c => {
    const disp = calcDisp(form.tribu, c.mes);
    const demReal = calcDemandaReal(form.tribu, c.mes);
    const demSim = simActivo ? calcDemandaSim(c.mes) : 0;
    const brechaAntes = +(disp - demReal).toFixed(2);
    const brechaDespues = +(disp - demReal - demSim).toFixed(2);
    const afectado = demSim > 0;
    return { ...c, disp, demReal, demSim, brechaAntes, brechaDespues, afectado };
  });

  const mesesConProblema = impactoRows.filter(r => r.afectado && r.brechaDespues < 0);
  const mesesConTension = impactoRows.filter(r => r.afectado && r.brechaDespues >= 0 && r.brechaDespues < 0.5);
  const puedeAceptar = mesesConProblema.length === 0;

  // Mes de mayor tensión
  const mesCritico = impactoRows.filter(r => r.afectado).sort((a, b) => a.brechaDespues - b.brechaDespues)[0];

  // Chart data
  const chartData = mesesForecast.map(c => {
    const disp = calcDisp(form.tribu, c.mes);
    const demReal = calcDemandaReal(form.tribu, c.mes);
    const demSim = simActivo ? calcDemandaSim(c.mes) : 0;
    return {
      mes: c.label,
      "Disponible": disp,
      "Demanda actual": demReal,
      ...(simActivo && demSim > 0 ? { "Con proyecto": +(demReal + demSim).toFixed(2) } : {}),
    };
  });

  // Auto-calcular fechaVencimiento cuando cambia fechaInicio + duracionMeses
  const handleDuracionChange = (meses) => {
    setForm(f => {
      const ini = f.fechaInicio ? new Date(f.fechaInicio) : null;
      if (!ini) return { ...f, duracionMeses: meses };
      const fin = new Date(ini);
      fin.setMonth(fin.getMonth() + meses);
      fin.setDate(fin.getDate() - 1);
      return { ...f, duracionMeses: meses, fechaVencimiento: fin.toISOString().slice(0, 10) };
    });
  };

  const handleInicioChange = (fecha) => {
    setForm(f => {
      const ini = fecha ? new Date(fecha) : null;
      if (!ini) return { ...f, fechaInicio: fecha };
      const fin = new Date(ini);
      fin.setMonth(fin.getMonth() + f.duracionMeses);
      fin.setDate(fin.getDate() - 1);
      return { ...f, fechaInicio: fecha, fechaVencimiento: fin.toISOString().slice(0, 10) };
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Panel izquierdo: configuración del proyecto */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">⚡ Proyecto a simular</p>

            <div className="space-y-3">
              <Input label="Nombre del proyecto" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Tribu" value={form.tribu} onChange={e => setForm(f => ({ ...f, tribu: e.target.value }))} options={TRIBUS_DEFAULT} />
                <Select label="Tipo" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} options={TIPOS_SERVICIO} />
              </div>

              {form.tipo === "Talento Dedicado"
                ? <Input label="Personas dedicadas" type="number" min="1" value={form.personasDedicadas}
                    onChange={e => setForm(f => ({ ...f, personasDedicadas: +e.target.value }))} />
                : <Input label="Horas / mes" type="number" min="0" value={form.horasLimite}
                    onChange={e => setForm(f => ({ ...f, horasLimite: +e.target.value }))} />
              }

              <Input label="Fecha de inicio" type="date" value={form.fechaInicio} onChange={e => handleInicioChange(e.target.value)} />

              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Duración</label>
                <div className="flex gap-1 flex-wrap">
                  {[1, 2, 3, 6, 9, 12].map(n => (
                    <button key={n} onClick={() => handleDuracionChange(n)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${form.duracionMeses === n ? "bg-blue-600 text-white border-blue-600" : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"}`}>
                      {n}m
                    </button>
                  ))}
                </div>
              </div>

              {form.fechaVencimiento && (
                <p className="text-xs text-slate-500">Vence: <span className="text-slate-300 font-mono">{form.fechaVencimiento}</span></p>
              )}
            </div>
          </div>

          {/* Resumen económico */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-4 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resumen económico</p>
            {[
              ["Personas equiv.", personasNecesarias, "text-blue-400"],
              ["Duración", `${duracion} meses`, "text-slate-300"],
              ["Horas totales", `${horasTotalesSim.toLocaleString()}h`, "text-slate-300"],
              ["Costo estimado", `$${costoEstimado.toLocaleString()}`, "text-amber-400"],
            ].map(([label, val, cls]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-xs text-slate-500">{label}</span>
                <span className={`font-mono font-bold text-sm ${cls}`}>{val}</span>
              </div>
            ))}
          </div>

          {/* Botón simular */}
          <button
            onClick={() => setSimActivo(s => !s)}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              simActivo
                ? "bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
            }`}>
            {simActivo ? "⟳ Limpiar simulación" : "▶ Simular impacto"}
          </button>
        </div>

        {/* Panel derecho: resultado */}
        <div className="lg:col-span-2 space-y-4">

          {/* Veredicto */}
          {simActivo && (
            <div className={`rounded-xl border p-5 ${puedeAceptar ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5"}`}>
              <div className="flex items-start gap-4">
                <span className="text-4xl">{puedeAceptar ? "✅" : "❌"}</span>
                <div className="flex-1">
                  <p className={`text-lg font-bold ${puedeAceptar ? "text-emerald-400" : "text-red-400"}`}>
                    {puedeAceptar
                      ? "Puedes aceptar este proyecto"
                      : `Capacidad insuficiente en ${mesesConProblema.length} mes${mesesConProblema.length > 1 ? "es" : ""}`}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {form.nombre} · {form.tribu} · {duracion} meses · {personasNecesarias} pers. equiv.
                  </p>
                  {!puedeAceptar && mesCritico && (
                    <p className="text-sm text-red-300 mt-2">
                      Mes más crítico: <strong>{mesCritico.mes}</strong> — faltan{" "}
                      <span className="font-mono font-bold">{Math.abs(mesCritico.brechaDespues).toFixed(2)}</span> personas
                    </p>
                  )}
                  {puedeAceptar && mesesConTension.length > 0 && (
                    <p className="text-sm text-amber-300 mt-2">
                      ⚠ Hay tensión en {mesesConTension.length} mes{mesesConTension.length > 1 ? "es" : ""} — margen &lt; 0.5 personas
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold font-mono" style={{ color: mesCritico ? (mesCritico.brechaDespues >= 0 ? "#34d89a" : "#f05c5c") : "#34d89a" }}>
                    {mesCritico ? (mesCritico.brechaDespues >= 0 ? "+" : "") + mesCritico.brechaDespues.toFixed(2) : "—"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">brecha mínima</p>
                </div>
              </div>
            </div>
          )}

          {/* Gráfico */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {form.tribu} — Disponibilidad vs Demanda{simActivo ? " (con proyecto simulado)" : ""}
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradDisp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={TRIBU_COLORS[form.tribu]} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={TRIBU_COLORS[form.tribu]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="mes" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Disponible" stroke={TRIBU_COLORS[form.tribu]} fill="url(#gradDisp)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Demanda actual" stroke="#475569" strokeWidth={2} strokeDasharray="4 2" dot={false} />
                  {simActivo && <Line type="monotone" dataKey="Con proyecto" stroke="#f05c5c" strokeWidth={2.5} dot={false} />}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla de impacto mes a mes */}
          <div className="rounded-xl border border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80">
                <tr>
                  {["Mes", "Disponible", "Demanda actual", simActivo ? "+ Proyecto" : "", simActivo ? "Brecha nueva" : "Brecha actual", "Estado"].filter(Boolean).map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {impactoRows.map(r => {
                  const brecha = simActivo ? r.brechaDespues : r.brechaAntes;
                  const statusColor = brecha < 0 ? "text-red-400" : brecha < 0.5 ? "text-amber-400" : "text-emerald-400";
                  const statusLabel = brecha < 0 ? "Déficit" : brecha < 0.5 ? "Tensión" : "OK";
                  return (
                    <tr key={r.mes} className={`border-t border-slate-700/30 hover:bg-slate-800/20 ${r.afectado && simActivo ? "bg-blue-500/3" : ""}`}>
                      <td className="px-3 py-2.5 text-slate-300 font-medium">
                        {r.label}
                        {r.afectado && simActivo && <span className="ml-1.5 text-xs text-blue-400">●</span>}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-300">{r.disp}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-400">{r.demReal}</td>
                      {simActivo && <td className="px-3 py-2.5 font-mono text-red-400">+{r.demSim.toFixed(2)}</td>}
                      <td className="px-3 py-2.5 font-mono font-bold" style={{ color: brecha < 0 ? "#f05c5c" : brecha < 0.5 ? "#f5a623" : "#34d89a" }}>
                        {brecha > 0 ? "+" : ""}{brecha.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Horizonte selector */}
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-slate-500">Horizonte:</span>
            {[3, 6, 9].map(n => (
              <button key={n} onClick={() => setHorizonte(n)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${horizonte === n ? "bg-slate-600 text-white border-slate-500" : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"}`}>
                {n}m
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────

const VIEWS = [
  { id: "dashboard",     label: "Dashboard",      icon: "⬡" },
  { id: "utilizacion",   label: "Utilización",    icon: "◎" },
  { id: "asignaciones",  label: "Asignaciones",   icon: "◧" },
  { id: "forecast",      label: "Forecast",       icon: "↗" },
  { id: "simulador",     label: "Simulador",      icon: "⚡" },
  { id: "colaboradores", label: "Colaboradores",  icon: "◉" },
  { id: "parametros",    label: "Parámetros",     icon: "⚙" },
  { id: "servicios",     label: "Servicios",      icon: "◫" },
  { id: "dunamis",       label: "Dunamis",        icon: "◈", tribu: true },
  { id: "yarigai",       label: "Yarigai",        icon: "◈", tribu: true },
  { id: "bulwak",        label: "Bulwak",         icon: "◈", tribu: true },
];

// ─── MÓDULO: UTILIZACIÓN ─────────────────────────────────────────────────────

function ModuloUtilizacion({ colaboradores, asignaciones, ausencias, calendar, servicios, params, setParams }) {

  const [mes, setMes] = useState("2026-02");
  const [expandida, setExpandida] = useState({});
  const [editObjetivo, setEditObjetivo] = useState(false);
  const [objTemp, setObjTemp] = useState(params.utilObjetivo);

  const motor = useUtilizacion({ colaboradores, asignaciones, ausencias, calendar, servicios, params });

  const mesesDisponibles = calendar.filter(c => {
    const d = new Date(c.mes + "-01");
    const hoy = new Date();
    return d >= new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  }).slice(0, 9);

  const activos = colaboradores.filter(c => c.status === "Activo");

  // Datos por tribu
  const dataTribus = TRIBUS_DEFAULT.map(tribu => {
    const roles = [...new Set(activos.filter(c => c.tribu === tribu).map(c => c.rolPrincipal))];

    const rolesData = ROLES_DEFAULT.map(rol => {
      const util = motor.utilizacionRolTribu(tribu, rol, mes);
      return { rol, ...util };
    }).filter(r => r.personas > 0);

    const totalDisp = rolesData.reduce((s, r) => s + r.disponible, 0);
    const totalAsig = rolesData.reduce((s, r) => s + r.asignado, 0);
    const pctTribu = totalDisp > 0 ? Math.round((totalAsig / totalDisp) * 100) : 0;

    // Para Yarigai: desglose por persona
    const personasYarigai = params.pilotoPorPersona.includes(tribu)
      ? activos.filter(c => c.tribu === tribu).map(colab => {
          const util = motor.utilizacionPorPersona(colab, mes);
          return { colab, ...util };
        })
      : [];

    return { tribu, rolesData, totalDisp, totalAsig, pctTribu, personasYarigai };
  });

  // Totales globales
  const totalDispGlobal = dataTribus.reduce((s, t) => s + t.totalDisp, 0);
  const totalAsigGlobal = dataTribus.reduce((s, t) => s + t.totalAsig, 0);
  const pctGlobal = totalDispGlobal > 0 ? Math.round((totalAsigGlobal / totalDispGlobal) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header con objetivo parametrizable */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1 flex-wrap">
          {mesesDisponibles.map(c => (
            <button key={c.mes} onClick={() => setMes(c.mes)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${mes === c.mes ? "bg-blue-600 text-white border-blue-600" : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"}`}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">Objetivo:</span>
          {editObjetivo ? (
            <div className="flex items-center gap-1">
              <input type="number" min="50" max="100" value={objTemp}
                onChange={e => setObjTemp(+e.target.value)}
                className="w-16 bg-slate-800 border border-blue-500 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none text-center" />
              <span className="text-xs text-slate-500">%</span>
              <Btn size="sm" onClick={() => { setParams(p => ({ ...p, utilObjetivo: objTemp })); setEditObjetivo(false); }}>OK</Btn>
              <Btn size="sm" variant="ghost" onClick={() => setEditObjetivo(false)}>✕</Btn>
            </div>
          ) : (
            <button onClick={() => { setObjTemp(params.utilObjetivo); setEditObjetivo(true); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500 transition-colors text-xs font-mono font-bold text-blue-400">
              {params.utilObjetivo}% <span className="text-slate-600 text-xs">✎</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI global */}
      <div className={`rounded-xl border p-5 ${semaforo(pctGlobal, params.utilObjetivo).bg}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Utilización global — {mes}</p>
            <div className="flex items-end gap-3">
              <span className={`text-4xl font-bold font-mono ${semaforo(pctGlobal, params.utilObjetivo).color}`}>{pctGlobal}%</span>
              <span className="text-slate-500 text-sm mb-1">de {params.utilObjetivo}% objetivo</span>
            </div>
            <div className="mt-2 w-64 max-w-full bg-slate-800 rounded-full h-2">
              <div className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, pctGlobal)}%`, background: pctGlobal >= params.utilObjetivo ? "#34d89a" : pctGlobal >= params.utilObjetivo * 0.8 ? "#f5a623" : "#f05c5c" }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-right">
            <div>
              <p className="text-2xl font-bold font-mono text-white">{totalAsigGlobal}h</p>
              <p className="text-xs text-slate-500">horas asignadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-slate-400">{totalDispGlobal}h</p>
              <p className="text-xs text-slate-500">horas disponibles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Por tribu */}
      <div className="space-y-3">
        {dataTribus.map(({ tribu, rolesData, totalDisp, totalAsig, pctTribu, personasYarigai }) => {
          const s = semaforo(pctTribu, params.utilObjetivo);
          const open = expandida[tribu];
          return (
            <div key={tribu} className="rounded-xl border border-slate-700/50 overflow-hidden">
              {/* Tribu header */}
              <button
                className="w-full flex items-center gap-4 px-4 py-3.5 bg-slate-800/40 hover:bg-slate-800/70 transition-colors text-left"
                onClick={() => setExpandida(e => ({ ...e, [tribu]: !e[tribu] }))}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: TRIBU_COLORS[tribu] }}></span>
                <span className="font-semibold text-white flex-1">{tribu}</span>
                <div className="flex items-center gap-3 flex-1 max-w-xs">
                  <BarUtil pct={pctTribu} objetivo={params.utilObjetivo} />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-mono">{totalAsig}h / {totalDisp}h</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${s.bg} ${s.color}`}>{s.label}</span>
                  <span className="text-slate-600">{open ? "▲" : "▼"}</span>
                </div>
              </button>

              {/* Detalle expandido */}
              {open && (
                <div className="border-t border-slate-700/40">
                  {/* Por rol */}
                  <div className="p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Por rol</p>
                    <div className="space-y-2">
                      {rolesData.map(r => {
                        const sr = semaforo(r.pct, params.utilObjetivo);
                        return (
                          <div key={r.rol} className="flex items-center gap-3 py-2 border-b border-slate-700/20 last:border-0">
                            <div className="w-24 flex-shrink-0"><Pill label={r.rol} color={r.rol} /></div>
                            <div className="flex-1"><BarUtil pct={r.pct} objetivo={params.utilObjetivo} /></div>
                            <span className="text-xs text-slate-500 font-mono w-28 text-right flex-shrink-0">{r.asignado}h / {r.disponible}h</span>
                            <span className="text-xs text-slate-600 w-12 text-right flex-shrink-0">{r.personas}p</span>
                          </div>
                        );
                      })}
                      {rolesData.length === 0 && <p className="text-xs text-slate-600">Sin personas activas en esta tribu</p>}
                    </div>
                  </div>

                  {/* Por persona (solo Yarigai piloto) */}
                  {personasYarigai.length > 0 && (
                    <div className="p-4 border-t border-slate-700/30 bg-slate-900/30">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Por persona — piloto Yarigai
                      </p>
                      <div className="space-y-2">
                        {personasYarigai
                          .sort((a, b) => b.pct - a.pct)
                          .map(({ colab, disponible, asignado, pct }) => {
                            const sp = semaforo(pct, params.utilObjetivo);
                            return (
                              <div key={colab.name} className="flex items-center gap-3 py-2 border-b border-slate-700/20 last:border-0">
                                <div className="w-36 flex-shrink-0">
                                  <p className="text-xs text-white font-medium truncate">{colab.name}</p>
                                  <p className="text-xs text-slate-600">{colab.rolPrincipal}</p>
                                </div>
                                <div className="flex-1"><BarUtil pct={pct} objetivo={params.utilObjetivo} /></div>
                                <span className="text-xs font-mono text-slate-500 w-28 text-right flex-shrink-0">{asignado}h / {disponible}h</span>
                                <span className={`text-xs font-bold w-16 text-right flex-shrink-0 ${sp.color}`}>
                                  {pct === 0 && asignado === 0 ? "Sin asig." : pct + "%"}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MÓDULO: ALERTAS PROACTIVAS ──────────────────────────────────────────────

function ModuloAlertas({ alertas, onNavigate }) {
  const { deficit, holgura, vencimientos } = alertas;
  const total = deficit.length + holgura.length + vencimientos.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
        <span className="text-5xl opacity-20">✓</span>
        <p className="text-base font-semibold">Sin alertas activas</p>
        <p className="text-sm">El sistema no detecta problemas en los próximos 6 meses</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Déficit de capacidad */}
      {deficit.length > 0 && (
        <div>
          <SectionHeader>
            <span className="text-red-400">⚡ Déficit de capacidad — acción requerida</span>
          </SectionHeader>
          <div className="space-y-2">
            {deficit.map((a, i) => (
              <div key={i} className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 animate-pulse"></span>
                  <div>
                    <p className="text-sm font-semibold text-white">{a.tribu} <span className="text-slate-400 font-normal">— {a.mes}</span></p>
                    <p className="text-xs text-red-300 mt-0.5">Faltan <strong>{a.personas}</strong> personas equivalentes — considera contratar o reasignar</p>
                  </div>
                </div>
                <button onClick={() => onNavigate("forecast")} className="text-xs text-red-400 hover:text-red-300 font-medium flex-shrink-0 border border-red-500/30 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors">
                  Ver forecast →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Holgura / subutilización */}
      {holgura.length > 0 && (
        <div>
          <SectionHeader>
            <span className="text-amber-400">↓ Personas posiblemente subutilizadas</span>
          </SectionHeader>
          <div className="space-y-2">
            {holgura.map((h, i) => (
              <div key={i} className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></span>
                  <div>
                    <p className="text-sm font-semibold text-white">{h.tribu} <span className="text-slate-400 font-normal">— desde {h.mes}</span></p>
                    <p className="text-xs text-amber-300 mt-0.5">
                      +{h.brecha} personas libres por {h.mesesConsecutivos}+ meses — evalúa reasignación o ajuste de equipo
                    </p>
                  </div>
                </div>
                <button onClick={() => onNavigate("colaboradores")} className="text-xs text-amber-400 hover:text-amber-300 font-medium flex-shrink-0 border border-amber-500/30 px-2 py-1 rounded-lg hover:bg-amber-500/10 transition-colors">
                  Ver equipo →
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Regla: si una tribu tiene &gt;1.5 personas libres por 2+ meses consecutivos se activa esta alerta
          </p>
        </div>
      )}

      {/* Contratos por vencer */}
      {vencimientos.length > 0 && (
        <div>
          <SectionHeader>
            <span className="text-blue-400">◫ Contratos vencen en menos de 60 días</span>
          </SectionHeader>
          <div className="rounded-xl border border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80">
                <tr>
                  {["Contrato", "Servicio", "Tribu", "Días restantes", "¿Renovable?"].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vencimientos.sort((a, b) => a.dias - b.dias).map((v, i) => (
                  <tr key={i} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                    <td className="px-3 py-2.5 text-blue-400 font-mono text-xs">{v.contratoId}</td>
                    <td className="px-3 py-2.5 text-white font-medium">{v.nombre}</td>
                    <td className="px-3 py-2.5"><Pill label={v.tribu} color={v.tribu} /></td>
                    <td className="px-3 py-2.5">
                      <span className={`font-mono font-bold text-sm ${v.dias <= 14 ? "text-red-400" : v.dias <= 30 ? "text-amber-400" : "text-slate-300"}`}>
                        {v.dias}d
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge color={v.renovable ? "green" : "red"}>{v.renovable ? "Sí" : "No"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GLOBAL STYLES (responsive + fonts) ──────────────────────────────────────

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  * { box-sizing: border-box; }

  body {
    font-family: 'Inter', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* Sidebar transitions */
  .xt-sidebar {
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .xt-overlay {
    transition: opacity 0.25s ease;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }

  /* Number input no arrows */
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }

  /* Mobile: sidebar hidden by default */
  @media (max-width: 1023px) {
    .xt-sidebar {
      position: fixed;
      left: 0; top: 0; bottom: 0;
      width: 220px;
      transform: translateX(-100%);
      z-index: 50;
    }
    .xt-sidebar.open {
      transform: translateX(0);
      box-shadow: 0 0 60px rgba(0,0,0,0.8);
    }
    .xt-main {
      margin-left: 0 !important;
    }
    .xt-hamburger {
      display: flex !important;
    }
  }

  /* Responsive grids */
  @media (max-width: 640px) {
    .xt-kpi-grid { grid-template-columns: 1fr 1fr !important; }
    .xt-tribu-grid { grid-template-columns: 1fr !important; }
    .xt-sim-grid { grid-template-columns: 1fr !important; }
    .xt-form-2col { grid-template-columns: 1fr !important; }
    .xt-padding { padding: 16px !important; }
    .xt-header-padding { padding: 12px 16px !important; }
  }
  @media (max-width: 768px) {
    .xt-forecast-controls { flex-direction: column; align-items: flex-start !important; }
  }
`;

function useGlobalStyles() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.prepend(el);
    return () => el.remove();
  }, []);
}

// ─── FASE 3: ALERTAS PROACTIVAS ──────────────────────────────────────────────

function useAlertasProactivas({ servicios, disponibilidad, ausencias, calendar }) {
  return useMemo(() => {
    const hoy = new Date();
    const meses = calendar.filter(c => {
      const d = new Date(c.mes + "-01");
      return d >= new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    }).slice(0, 6);

    const calcDem = (tribu, mes) => {
      const cal = calendar.find(c => c.mes === mes);
      const dias = cal?.diasLaborales || 20;
      const srvs = servicios.filter(s => {
        if (s.estado !== "Activo" || s.tribu !== tribu) return false;
        const ini = new Date(s.fechaInicio || "2020-01-01");
        const fin = new Date(s.fechaVencimiento || "2099-12-31");
        const md = new Date(mes + "-01");
        const mf = new Date(md.getFullYear(), md.getMonth() + 1, 0);
        return ini <= mf && fin >= md;
      });
      const h = srvs.reduce((a, s) => s.tipo === "Talento Dedicado"
        ? a + (s.personasDedicadas || 1) * dias * HORAS_DIA
        : a + (s.horasLimite || 0), 0);
      return +(h / (dias * HORAS_DIA)).toFixed(2);
    };

    const calcDisp = (tribu, mes) => {
      const cal = calendar.find(c => c.mes === mes);
      const dias = cal?.diasLaborales || 20;
      return +disponibilidad
        .filter(d => d.tribu === tribu && d.mes === mes)
        .reduce((acc, d) => {
          const aus = ausencias.find(a => a.colaborador === d.colaborador && a.mes === mes);
          return acc + (d.porcentaje / 100) * ((dias - (aus?.dias || 0)) / dias);
        }, 0).toFixed(2);
    };

    const deficit = [];
    const holgura = [];
    const vencimientos = [];

    TRIBUS_DEFAULT.forEach(tribu => {
      let consHolgura = 0;
      meses.forEach((c, i) => {
        const dem = calcDem(tribu, c.mes);
        const disp = calcDisp(tribu, c.mes);
        const brecha = +(disp - dem).toFixed(2);
        if (brecha < 0 && disp > 0) {
          deficit.push({ tribu, mes: c.label, brecha, personas: Math.abs(brecha).toFixed(2) });
        }
        if (brecha >= 1.5 && disp > 0) {
          consHolgura++;
          if (consHolgura >= 2) {
            const ya = holgura.find(h => h.tribu === tribu);
            if (!ya) holgura.push({ tribu, mes: c.label, brecha: brecha.toFixed(2), mesesConsecutivos: consHolgura });
            else ya.mesesConsecutivos = consHolgura;
          }
        } else {
          consHolgura = 0;
        }
      });
    });

    // Contratos venciendo en < 60 días
    servicios.forEach(s => {
      if (!s.fechaVencimiento || s.estado !== "Activo") return;
      const dias = Math.ceil((new Date(s.fechaVencimiento) - hoy) / 86400000);
      if (dias >= 0 && dias <= 60) {
        vencimientos.push({ nombre: s.nombre, tribu: s.tribu, contratoId: s.contratoId, dias, renovable: s.renovable });
      }
    });

    return { deficit, holgura, vencimientos };
  }, [servicios, disponibilidad, ausencias, calendar]);
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  useGlobalStyles();
  const [view, setView] = useState("utilizacion");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calendar, setCalendar] = useState(CALENDAR_SEED);
  const [colaboradores, setColaboradores] = useState(COLABORADORES_SEED);
  const [servicios, setServicios] = useState(SERVICIOS_SEED);
  const [disponibilidad, setDisponibilidad] = useState(DISPONIBILIDAD_SEED);
  const [ausencias, setAusencias] = useState(AUSENCIAS_SEED);
  const [asignaciones, setAsignaciones] = useState(ASIGNACIONES_SEED);
  const [params, setParams] = useState(PARAMS_SEED);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/colaboradores").then(r => r.json()),
      fetch("/api/servicios").then(r => r.json()),
      fetch("/api/asignaciones").then(r => r.json()),
      fetch("/api/ausencias").then(r => r.json()),
      fetch("/api/calendar").then(r => r.json()),
      fetch("/api/params").then(r => r.json()),
      fetch("/api/disponibilidad").then(r => r.json()),
    ]).then(([cols, servs, asigs, aus, cal, par, disp]) => {
      if (Array.isArray(cols) && cols.length > 0) setColaboradores(cols);
      if (Array.isArray(servs) && servs.length > 0) setServicios(servs);
      if (Array.isArray(asigs) && asigs.length > 0) setAsignaciones(asigs);
      if (Array.isArray(aus) && aus.length > 0) setAusencias(aus);
      if (Array.isArray(cal) && cal.length > 0) setCalendar(cal);
      if (par && !par.error) setParams({ ...PARAMS_SEED, ...par });
      if (Array.isArray(disp)) setDisponibilidad(disp);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const alertas = useAlertasProactivas({ servicios, disponibilidad, ausencias, calendar });
  const totalAlertas = alertas.deficit.length + alertas.holgura.length + alertas.vencimientos.length;

  const currentView = VIEWS.find(v => v.id === view);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-sm font-bold mx-auto animate-pulse">XT</div>
        <p className="text-slate-400 text-sm">Cargando sistema...</p>
      </div>
    </div>
  );

  const navigate = (id) => {
    setView(id);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="xt-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`xt-sidebar bg-slate-900 border-r border-slate-800 flex flex-col lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-52 lg:translate-x-0 lg:z-40 ${sidebarOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">XT</div>
            <div>
              <p className="text-sm font-bold text-white leading-none">XUMTech</p>
              <p className="text-xs text-slate-500 leading-none mt-0.5">Consultoría</p>
            </div>
          </div>
          {/* Close button (mobile only) */}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-white text-lg leading-none p-1">✕</button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {/* Alertas badge */}
          {totalAlertas > 0 && (
            <button
              onClick={() => navigate("alertas")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all text-left mb-2 ${view === "alertas" ? "bg-red-600/20 text-red-400 border border-red-600/30" : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"}`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xs">⚡</span>
                Alertas
              </span>
              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{totalAlertas}</span>
            </button>
          )}

          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => navigate(v.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${view === v.id ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" : "text-slate-400 hover:text-white hover:bg-slate-800/60"} ${v.tribu ? "ml-2 text-xs" : ""}`}
            >
              <span className="opacity-60 text-xs">{v.icon}</span>
              {v.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
            <span className="text-xs text-slate-500">Sistema activo</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="xt-main lg:ml-52 min-h-screen flex flex-col">

        {/* Header */}
        <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="xt-header-padding px-6 py-3.5 flex items-center gap-4">
            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="xt-hamburger hidden items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
              aria-label="Abrir menú"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-white truncate">{currentView?.label || "Alertas"}</h1>
            </div>

            {/* Alertas pill en header */}
            {totalAlertas > 0 && view !== "alertas" && (
              <button
                onClick={() => navigate("alertas")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/25 transition-colors flex-shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                {totalAlertas} alerta{totalAlertas > 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>

        {/* Page content */}
        <div className="xt-padding flex-1 p-6 lg:p-8">
         {view === "alertas"       && <ModuloAlertas alertas={alertas} onNavigate={navigate} />}
          {view === "dashboard"     && <ModuloDashboard colaboradores={colaboradores} servicios={servicios} calendar={calendar} disponibilidad={disponibilidad} ausencias={ausencias} alertas={alertas} onNavigate={navigate} params={params} />}
          {view === "utilizacion"   && <ModuloUtilizacion colaboradores={colaboradores} asignaciones={asignaciones} ausencias={ausencias} calendar={calendar} servicios={servicios} params={params} setParams={setParams} />}
          {view === "asignaciones"  && <ModuloAsignaciones asignaciones={asignaciones} setAsignaciones={setAsignaciones} colaboradores={colaboradores} servicios={servicios} ausencias={ausencias} calendar={calendar} params={params} />}
          {view === "forecast"      && <ModuloForecast servicios={servicios} colaboradores={colaboradores} disponibilidad={disponibilidad} ausencias={ausencias} calendar={calendar} params={params} />}
          {view === "simulador"     && <ModuloSimulador servicios={servicios} colaboradores={colaboradores} disponibilidad={disponibilidad} ausencias={ausencias} calendar={calendar} params={params} />}
          {view === "colaboradores" && <ModuloColaboradores colaboradores={colaboradores} setColaboradores={setColaboradores} ausencias={ausencias} setAusencias={setAusencias} calendar={calendar} params={params} />}
          {view === "parametros"    && <ModuloParametros calendar={calendar} setCalendar={setCalendar} disponibilidad={disponibilidad} setDisponibilidad={setDisponibilidad} colaboradores={colaboradores} ausencias={ausencias} params={params} setParams={setParams} />}
          {view === "servicios"     && <ModuloServicios servicios={servicios} setServicios={setServicios} colaboradores={colaboradores} params={params} />}
          {view === "dunamis"       && <ModuloTribu tribu="Dunamis" servicios={servicios} calendar={calendar} disponibilidad={disponibilidad} ausencias={ausencias} colaboradores={colaboradores} params={params} />}
          {view === "yarigai"       && <ModuloTribu tribu="Yarigai" servicios={servicios} calendar={calendar} disponibilidad={disponibilidad} ausencias={ausencias} colaboradores={colaboradores} params={params} />}
          {view === "bulwak"        && <ModuloTribu tribu="Bulwak"  servicios={servicios} calendar={calendar} disponibilidad={disponibilidad} ausencias={ausencias} colaboradores={colaboradores} params={params} />}
        </div>
      </div>
    </div>
  );
}
