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
  { mes: "2026-01", label: "Ene 2026", diasLaborales: 21, feriados: 1, dif20: 2 },
  { mes: "2026-02", label: "Feb 2026", diasLaborales: 20, feriados: 0, dif20: 0 },
  { mes: "2026-03", label: "Mar 2026", diasLaborales: 22, feriados: 0, dif20: 2 },
  { mes: "2026-04", label: "Abr 2026", diasLaborales: 19, feriados: 3, dif20: 2 },
  { mes: "2026-05", label: "May 2026", diasLaborales: 20, feriados: 1, dif20: 1 },
  { mes: "2026-06", label: "Jun 2026", diasLaborales: 22, feriados: 0, dif20: 2 },
  { mes: "2026-07", label: "Jul 2026", diasLaborales: 23, feriados: 1, dif20: 3 },
  { mes: "2026-08", label: "Ago 2026", diasLaborales: 19, feriados: 2, dif20: 1 },
  { mes: "2026-09", label: "Sep 2026", diasLaborales: 21, feriados: 1, dif20: 2 },
  { mes: "2026-10", label: "Oct 2026", diasLaborales: 22, feriados: 0, dif20: 2 },
  { mes: "2026-11", label: "Nov 2026", diasLaborales: 19, feriados: 2, dif20: 1 },
  { mes: "2026-12", label: "Dic 2026", diasLaborales: 21, feriados: 2, dif20: 3 },
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
  const acc = { blue: "border-blue-500/30 text-blue-400", green: "border-emerald-500/30 text-emerald-400", amber: "border-amber-500/30 text-amber-400", red: "border-red-500/30 text-red-400", purple: "border-purple-500/30 text-purple-400", gray: "border-slate-500/30 text-slate-400" };
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

function Input({ label, value, onChange, type = "text", ...props }) {
  const isNum = type === "number";
  const handleChange = (e) => {
    if (!onChange) return;
    if (isNum && e.target.value === "") {
      onChange({ ...e, target: { ...e.target, value: "0" } });
    } else {
      onChange(e);
    }
  };
  return (
    <div>
      {label && <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">{label}</label>}
      <input type={type} value={value} onChange={handleChange}
        onFocus={e => isNum && e.target.select()}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" {...props} />
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

function AddItemInline({ placeholder = "Agregar...", onAdd }) {
  const [val, setVal] = useState("");
  const commit = () => { if (val.trim()) { onAdd(val.trim()); setVal(""); } };
  return (
    <div className="flex gap-2 mt-2">
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === "Enter" && commit()}
        placeholder={placeholder}
        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
      />
      <Btn size="sm" onClick={commit}>+ Agregar</Btn>
    </div>
  );
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

function ModuloColaboradores({ colaboradores, setColaboradores, ausencias, setAusencias, calendar, params, maestros }) {
  const MOTIVOS_AUSENCIA = ["Vacaciones","Incapacidad","Permiso con goce","Permiso sin goce","Feriado","Capacitación","Otro"];
  const TIPOS_ID = ["Cédula de identidad","DIMEX","Pasaporte","Otro"];

  const [search, setSearch] = useState("");
  const [tribFilter, setTribFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Activo");
  const [modal, setModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [ausenciaModal, setAusenciaModal] = useState(null);
  const [ausenciaForm, setAusenciaForm] = useState({ fecha: "", motivo: "Vacaciones", descripcion: "", dias: 1 });
  const [form, setForm] = useState({ codigoInterno: "", nombre: "", apellidos: "", tipoId: "Cédula de identidad", cedula: "", correo: "", telefono: "", fechaIngreso: "", fechaNacimiento: "", tribu: "Dunamis", rolPrincipal: "Técnico", diasLibresAnio: 15, horasDia: 8, status: "Activo" });
  const [editForm, setEditForm] = useState({});
  const [formErrors, setFormErrors] = useState({});

  const calDesc = [...calendar].sort((a, b) => b.mes.localeCompare(a.mes));
  const filtered = colaboradores.filter(co =>
    (tribFilter === "Todas" || co.tribu === tribFilter) &&
    (statusFilter === "Todos" || co.status === statusFilter) &&
    (`${co.name||""} ${co.apellidos||""}`.toLowerCase().includes(search.toLowerCase()) ||
     (co.codigoInterno||"").toLowerCase().includes(search.toLowerCase()))
  );

  const genCodigo = () => `COL-${String(Date.now()).slice(-5)}`;

  const validateForm = (f) => {
    const e = {};
    if (!f.nombre?.trim()) e.nombre = "Requerido";
    if (!f.apellidos?.trim()) e.apellidos = "Requerido";
    if (f.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo)) e.correo = "Email inválido";
    if (f.telefono && !/^[+\d\s\-()\-]{6,20}$/.test(f.telefono)) e.telefono = "Formato inválido";
    return e;
  };

  const handleAdd = async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    const body = { ...form, codigoInterno: form.codigoInterno || genCodigo(), name: `${form.nombre} ${form.apellidos}`.trim(), horasDia: Number(form.horasDia), diasLibresAnio: Number(form.diasLibresAnio) };
    const res = await fetch("/api/colaboradores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    if (saved.error) { alert(saved.error); return; }
    setColaboradores(p => [...p, saved]);
    setModal(false);
    setForm({ codigoInterno: "", nombre: "", apellidos: "", tipoId: "Cédula de identidad", cedula: "", correo: "", telefono: "", fechaIngreso: "", fechaNacimiento: "", tribu: "Dunamis", rolPrincipal: "Técnico", diasLibresAnio: 15, horasDia: 8, status: "Activo" });
    setFormErrors({});
  };

  const handleEdit = async () => {
    const errs = validateForm(editForm);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    const body = { ...editForm, name: `${editForm.nombre} ${editForm.apellidos}`.trim(), horasDia: Number(editForm.horasDia), diasLibresAnio: Number(editForm.diasLibresAnio) };
    const res = await fetch("/api/colaboradores", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editModal.id, ...body }) });
    const saved = await res.json();
    if (saved.error) { alert(saved.error); return; }
    setColaboradores(p => p.map(co => co.id === editModal.id ? saved : co));
    setEditModal(null); setDetailModal(null); setFormErrors({});
  };

  const handleToggleStatus = async (id) => {
    const co = colaboradores.find(x => x.id === id);
    if (!co) return;
    const updated = { ...co, status: co.status === "Activo" ? "Inactivo" : "Activo" };
    await fetch("/api/colaboradores", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    setColaboradores(p => p.map(x => x.id === id ? updated : x));
    if (detailModal?.id === id) setDetailModal(updated);
  };

  const handleAddAusencia = async () => {
    if (!ausenciaModal || !ausenciaForm.fecha) return;
    const body = { ...ausenciaForm, dias: Number(ausenciaForm.dias), colaborador: ausenciaModal.name, mes: ausenciaForm.fecha.substring(0, 7) };
    const res = await fetch("/api/ausencias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    setAusencias(p => [...p, saved]);
    setAusenciaForm({ fecha: "", motivo: "Vacaciones", descripcion: "", dias: 1 });
  };

  const handleDeleteAusencia = async (id) => {
    await fetch("/api/ausencias", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setAusencias(p => p.filter(a => a.id !== id));
  };

  const openEdit = (co) => {
    const parts = (co.name || "").split(" ");
    setEditForm({
      codigoInterno: co.codigoInterno || "", nombre: co.nombre || parts[0] || "", apellidos: co.apellidos || parts.slice(1).join(" ") || "",
      tipoId: co.tipoId || "Cédula de identidad", cedula: co.cedula || "", correo: co.correo || co.email || "",
      telefono: co.telefono || "", fechaIngreso: co.fechaIngreso || "", fechaNacimiento: co.fechaNacimiento || "",
      tribu: co.tribu || "Dunamis", rolPrincipal: co.rolPrincipal || "Técnico",
      diasLibresAnio: co.diasLibresAnio || 15, horasDia: co.horasDia || 8, status: co.status || "Activo"
    });
    setFormErrors({});
    setEditModal(co);
    setDetailModal(null);
  };

  const ErrMsg = ({ f }) => formErrors[f] ? <p className="text-xs text-red-400 mt-0.5">{formErrors[f]}</p> : null;

  const ColabForm = ({ f, setF }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Input label="Código interno" value={f.codigoInterno} onChange={e => setF(x => ({ ...x, codigoInterno: e.target.value }))} placeholder="COL-XXXXX (auto)" /><p className="text-xs text-slate-500 mt-0.5">Dejar vacío para generar automático</p></div>
        <Select label="Tribu" value={f.tribu} onChange={e => setF(x => ({ ...x, tribu: e.target.value }))} options={TRIBUS_DEFAULT} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Input label="Nombre *" value={f.nombre} onChange={e => { setF(x => ({ ...x, nombre: e.target.value })); setFormErrors(er => ({ ...er, nombre: "" })); }} /><ErrMsg f="nombre" /></div>
        <div><Input label="Apellidos *" value={f.apellidos} onChange={e => { setF(x => ({ ...x, apellidos: e.target.value })); setFormErrors(er => ({ ...er, apellidos: "" })); }} /><ErrMsg f="apellidos" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Tipo de ID" value={f.tipoId} onChange={e => setF(x => ({ ...x, tipoId: e.target.value }))} options={TIPOS_ID} />
        <Input label="N° Identificación" value={f.cedula} onChange={e => setF(x => ({ ...x, cedula: e.target.value }))} placeholder="1-XXXX-XXXX" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Input label="Correo" value={f.correo} onChange={e => { setF(x => ({ ...x, correo: e.target.value })); setFormErrors(er => ({ ...er, correo: "" })); }} placeholder="nombre@xumtech.com" /><ErrMsg f="correo" /></div>
        <div><Input label="Teléfono" value={f.telefono} onChange={e => { const v = e.target.value.replace(/[^+\d\s\-()\-]/g,""); setF(x => ({ ...x, telefono: v })); setFormErrors(er => ({ ...er, telefono: "" })); }} placeholder="+506 8888-8888" /><ErrMsg f="telefono" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Fecha de ingreso" type="date" value={f.fechaIngreso} onChange={e => setF(x => ({ ...x, fechaIngreso: e.target.value }))} />
        <Input label="Fecha de nacimiento" type="date" value={f.fechaNacimiento} onChange={e => setF(x => ({ ...x, fechaNacimiento: e.target.value }))} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select label="Rol principal" value={f.rolPrincipal} onChange={e => setF(x => ({ ...x, rolPrincipal: e.target.value }))} options={ROLES_DEFAULT} />
        <Input label="Horas/día" type="number" value={f.horasDia} onChange={e => setF(x => ({ ...x, horasDia: e.target.value }))} />
        <Input label="Días libres/año" type="number" value={f.diasLibresAnio} onChange={e => setF(x => ({ ...x, diasLibresAnio: e.target.value }))} />
      </div>
    </div>
  );

  const ausenciasDeColab = (name) => ausencias.filter(a => a.colaborador === name);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI title="Activos" value={colaboradores.filter(c => c.status === "Activo").length} color="blue" />
        {TRIBUS_DEFAULT.map(t => <KPI key={t} title={t} value={colaboradores.filter(c => c.tribu === t && c.status === "Activo").length} color="green" />)}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar colaborador o código..." className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-52" />
        <div className="flex gap-1">{["Todas",...TRIBUS_DEFAULT].map(t => <button key={t} onClick={() => setTribFilter(t)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${tribFilter === t ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"}`}>{t}</button>)}</div>
        <div className="flex gap-1">{["Activo","Inactivo","Todos"].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"}`}>{s}</button>)}</div>
        <Btn size="sm" onClick={() => { setModal(true); setFormErrors({}); }} className="ml-auto">+ Nuevo colaborador</Btn>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-slate-800/80"><tr>{["ID","Nombre","Rol","Tribu","Correo","Teléfono","Ingreso","Estado",""].map(h => <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(co => (
              <tr key={co.id} className={`border-t border-slate-700/30 hover:bg-slate-800/20 ${co.status === "Inactivo" ? "opacity-50" : ""}`}>
                <td className="px-3 py-3"><button onClick={() => setDetailModal(co)} className="text-blue-400 font-mono text-xs hover:underline font-bold">{co.codigoInterno || `COL-${co.id}`}</button></td>
                <td className="px-3 py-3"><button onClick={() => setDetailModal(co)} className="text-white font-medium hover:text-blue-300 text-left">{co.name}</button></td>
                <td className="px-3 py-3 whitespace-nowrap"><Pill label={co.rolPrincipal} color={co.rolPrincipal} /></td>
                <td className="px-3 py-3 whitespace-nowrap"><Pill label={co.tribu} color={co.tribu} /></td>
                <td className="px-3 py-3 text-slate-400 text-xs">{co.correo || co.email || "—"}</td>
                <td className="px-3 py-3 text-slate-400 text-xs font-mono">{co.telefono || "—"}</td>
                <td className="px-3 py-3 text-slate-400 text-xs whitespace-nowrap">{co.fechaIngreso || "—"}</td>
                <td className="px-3 py-3 whitespace-nowrap"><Badge color={co.status === "Activo" ? "green" : "gray"}>{co.status}</Badge></td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex gap-1">
                    <Btn variant="ghost" size="sm" onClick={() => openEdit(co)}>✏️</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => { setAusenciaModal(co); setAusenciaForm({ fecha: "", motivo: "Vacaciones", descripcion: "", dias: 1 }); }}>📅</Btn>
                    <Btn variant={co.status === "Activo" ? "danger" : "ghost"} size="sm" onClick={() => handleToggleStatus(co.id)}>{co.status === "Activo" ? "Off" : "On"}</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">No se encontraron colaboradores</p>}
      </div>

      {/* Modal nuevo */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo colaborador">
        <ColabForm f={form} setF={setForm} />
        <div className="flex justify-end gap-2 pt-4"><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn onClick={handleAdd}>Guardar</Btn></div>
      </Modal>

      {/* Modal editar */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Editar — ${editModal?.name}`}>
        <ColabForm f={editForm} setF={setEditForm} />
        <div className="flex justify-between pt-4">
          <Btn variant={editModal?.status === "Activo" ? "danger" : "ghost"} onClick={() => { handleToggleStatus(editModal.id); setEditModal(null); }}>{editModal?.status === "Activo" ? "Desactivar" : "Activar"}</Btn>
          <div className="flex gap-2"><Btn variant="ghost" onClick={() => setEditModal(null)}>Cancelar</Btn><Btn onClick={handleEdit}>Guardar cambios</Btn></div>
        </div>
      </Modal>

      {/* Modal detalle */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={`${detailModal?.codigoInterno || ""} — ${detailModal?.name}`}>
        {detailModal && (
          <div className="space-y-2">
            {[
              ["Código interno", detailModal.codigoInterno || `COL-${detailModal.id}`],
              ["Nombre completo", detailModal.name],
              ["Tipo de ID", detailModal.tipoId || "—"],
              ["N° Identificación", detailModal.cedula || "—"],
              ["Correo", detailModal.correo || detailModal.email || "—"],
              ["Teléfono", detailModal.telefono || "—"],
              ["Tribu", detailModal.tribu],
              ["Rol principal", detailModal.rolPrincipal],
              ["Horas/día", detailModal.horasDia],
              ["Días libres/año", detailModal.diasLibresAnio || 15],
              ["Fecha ingreso", detailModal.fechaIngreso || "—"],
              ["Fecha nacimiento", detailModal.fechaNacimiento || "—"],
              ["Estado", detailModal.status],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-slate-700/30">
                <span className="text-xs text-slate-500">{k}</span>
                <span className="text-sm text-white font-medium">{v}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3">
              <Btn variant="ghost" size="sm" onClick={() => { setAusenciaModal(detailModal); setDetailModal(null); }}>📅 Ausencias</Btn>
              <Btn size="sm" onClick={() => openEdit(detailModal)}>✏️ Editar</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal ausencias */}
      <Modal open={!!ausenciaModal} onClose={() => setAusenciaModal(null)} title={`Ausencias — ${ausenciaModal?.name}`}>
        {ausenciaModal && (
          <div className="space-y-4">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ausenciasDeColab(ausenciaModal.name).length === 0
                ? <p className="text-slate-500 text-sm text-center py-3">Sin ausencias registradas</p>
                : ausenciasDeColab(ausenciaModal.name).sort((a, b) => (b.fecha||b.mes) > (a.fecha||a.mes) ? 1 : -1).map(a => (
                  <div key={a.id} className="bg-slate-800/40 rounded-lg p-3 flex items-start justify-between border border-slate-700/30">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-blue-400">{a.fecha || a.mes}</span>
                        <Badge color="blue">{a.tipo || a.motivo}</Badge>
                        <span className="text-xs text-slate-400">{a.dias}d</span>
                      </div>
                      {(a.descripcion || a.notas) && <p className="text-xs text-slate-500 mt-1">{a.descripcion || a.notas}</p>}
                    </div>
                    <button onClick={() => handleDeleteAusencia(a.id)} className="text-red-400 hover:text-red-300 text-xs ml-2">✕</button>
                  </div>
                ))
              }
            </div>
            <div className="border-t border-slate-700/50 pt-3 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase">Registrar ausencia</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Fecha" type="date" value={ausenciaForm.fecha} onChange={e => setAusenciaForm(f => ({ ...f, fecha: e.target.value }))} />
                <Input label="Días" type="number" value={ausenciaForm.dias} onChange={e => setAusenciaForm(f => ({ ...f, dias: e.target.value }))} />
              </div>
              <Select label="Motivo" value={ausenciaForm.motivo} onChange={e => setAusenciaForm(f => ({ ...f, motivo: e.target.value }))} options={MOTIVOS_AUSENCIA} />
              <div><label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Descripción</label><textarea value={ausenciaForm.descripcion} onChange={e => setAusenciaForm(f => ({ ...f, descripcion: e.target.value }))} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" /></div>
              <div className="flex justify-end"><Btn size="sm" onClick={handleAddAusencia}>+ Registrar</Btn></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ModuloParametros({ calendar, setCalendar, disponibilidad, setDisponibilidad, colaboradores, ausencias, params, setParams, maestros, setMaestros, activeTab }) {

  const [tabInternal, setTabInternal] = useState("calendario");
  const tab = activeTab || tabInternal;
  const setTab = (v) => setTabInternal(v);
  const [dispForm, setDispForm] = useState({ colaborador: "", rol: "Técnico", tribu: "Dunamis", mes: "2026-01", porcentaje: 100 });
  const [dispModal, setDispModal] = useState(false);
  const [calModal, setCalModal] = useState(false);
  const [calForm, setCalForm] = useState({ mes: "", ano: "2026", mo: "", diasLaboralesBrutos: 20, diasLibres: 0 });
  const [savingCal, setSavingCal] = useState(null);
  const calDesc = [...calendar].sort((a, b) => b.mes.localeCompare(a.mes));

  // Calendario: guardar cambio en BD con debounce
  const handleCalEdit = async (mes, field, val) => {
    const updated = calendar.map(c => {
      if (c.mes !== mes) return c;
      const diasBrutos = field === "diasLaboralesBrutos" ? Number(val) : (c.diasLaboralesBrutos ?? c.diasLaborales);
      const diasLibres = field === "diasLibres" ? Number(val) : (c.diasLibres ?? c.feriados ?? 0);
      const netos = Math.max(0, diasBrutos - diasLibres);
      return { ...c, [field]: Number(val), diasLaboralesBrutos: diasBrutos, diasLibres, diasLaborales: netos, feriados: diasLibres, dif20: netos - 20 };
    });
    setCalendar(updated);
    const row = updated.find(c => c.mes === mes);
    setSavingCal(mes);
    await fetch("/api/calendar", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...row, diasLaborales: row.diasLaborales, feriados: row.diasLibres ?? row.feriados }) });
    setSavingCal(null);
  };

  // Calendario: agregar mes nuevo
  const handleAddMes = async () => {
    if (!calForm.mes) return;
    if (calendar.find(c => c.mes === calForm.mes)) return alert("Ese mes ya existe");
    const MESES_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const [yr, mo] = calForm.mes.split("-");
    const autoLabel = `${MESES_ES[parseInt(mo,10)-1]} ${yr}`;
    const brutos = Number(calForm.diasLaboralesBrutos ?? 20);
    const libres = Number(calForm.diasLibres ?? 0);
    const netos = Math.max(0, brutos - libres);
    const body = { mes: calForm.mes, label: autoLabel, diasLaborales: netos, diasLaboralesBrutos: brutos, diasLibres: libres, feriados: libres, dif20: netos - 20 };
    const res = await fetch("/api/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      setCalendar(p => [...p, body].sort((a, b) => b.mes.localeCompare(a.mes)));
      setCalModal(false);
      setCalForm({ mes: "", ano: "2026", mo: "", diasLaboralesBrutos: 20, diasLibres: 0 });
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
      {/* tabs manejados por ModuloConfiguracion */}

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
          <div className="overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-slate-800/80">
                <tr>
                  {["Mes", "Días Lab. Brutos", "Días Libres", "Días Lab. Netos", "Dif. vs 20 días", ""].map(h =>
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {calDesc.map(c => {
                  const brutos = c.diasLaboralesBrutos ?? c.diasLaborales;
                  const libres = c.diasLibres ?? c.feriados ?? 0;
                  const netos = Math.max(0, brutos - libres);
                  return (
                    <tr key={c.mes} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                      <td className="px-4 py-2.5 text-white font-medium whitespace-nowrap">
                        {c.label}
                        {savingCal === c.mes && <span className="ml-2 text-xs text-blue-400 animate-pulse">guardando...</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <input type="number" min="1" max="31"
                          value={brutos === 0 ? "" : brutos}
                          onChange={e => handleCalEdit(c.mes, "diasLaboralesBrutos", e.target.value === "" ? 0 : e.target.value)}
                          onFocus={e => e.target.select()}
                          className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500" />
                      </td>
                      <td className="px-4 py-2.5">
                        <input type="number" min="0" max="15"
                          value={libres === 0 ? "" : libres}
                          onChange={e => handleCalEdit(c.mes, "diasLibres", e.target.value === "" ? 0 : e.target.value)}
                          onFocus={e => e.target.select()}
                          className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500" />
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="w-16 inline-block text-center bg-slate-900/60 border border-slate-700/30 rounded px-2 py-1 text-xs text-blue-300 font-mono font-bold">{netos}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`font-mono text-sm font-bold ${netos - 20 > 0 ? "text-emerald-400" : netos - 20 < 0 ? "text-red-400" : "text-slate-400"}`}>
                          {netos - 20 > 0 ? "+" : ""}{netos - 20}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => handleDeleteMes(c.mes)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Modal open={calModal} onClose={() => setCalModal(false)} title="Agregar mes al calendario">
            <div className="space-y-4">
              {/* Año */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Año</label>
                <div className="flex gap-2">
                  {["2026","2027","2028"].map(yr => (
                    <button type="button" key={yr}
                      onClick={() => setCalForm(f => ({ ...f, ano: yr, mes: f.mo ? `${yr}-${f.mo}` : "" }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${calForm.ano === yr ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}>
                      {yr}
                    </button>
                  ))}
                </div>
              </div>
              {/* Mes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mes</label>
                <div className="grid grid-cols-4 gap-2">
                  {["01","02","03","04","05","06","07","08","09","10","11","12"].map(mo => {
                    const MESES_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
                    const val = `${calForm.ano || "2026"}-${mo}`;
                    const exists = !!calendar.find(x => x.mes === val);
                    const selected = calForm.mo === mo && calForm.ano === (calForm.ano || "2026");
                    return (
                      <button type="button" key={mo} disabled={exists}
                        onClick={() => setCalForm(f => ({ ...f, mo, mes: `${f.ano || "2026"}-${mo}` }))}
                        className={`py-2 rounded-lg text-xs font-semibold transition-colors border ${selected ? "bg-blue-600 border-blue-500 text-white" : exists ? "bg-slate-800/20 border-slate-700/20 text-slate-600 cursor-not-allowed line-through" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-blue-500/50"}`}>
                        {MESES_ES[parseInt(mo,10)-1]}
                      </button>
                    );
                  })}
                </div>
                {calForm.mes && <p className="text-xs text-blue-400 mt-2 font-mono">→ {calForm.mes}</p>}
              </div>
              {/* Días */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Días lab. brutos</label>
                  <input type="number" min="1" max="31"
                    value={calForm.diasLaboralesBrutos ?? 20}
                    onChange={e => setCalForm(f => ({ ...f, diasLaboralesBrutos: e.target.value === "" ? 0 : Number(e.target.value) }))}
                    onFocus={e => e.target.select()}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Días libres</label>
                  <input type="number" min="0" max="15"
                    value={calForm.diasLibres ?? 0}
                    onChange={e => setCalForm(f => ({ ...f, diasLibres: e.target.value === "" ? 0 : Number(e.target.value) }))}
                    onFocus={e => e.target.select()}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">Días laborales netos</span>
                <span className="text-lg font-bold text-blue-300 font-mono">{Math.max(0, (calForm.diasLaboralesBrutos ?? 20) - (calForm.diasLibres ?? 0))}</span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Btn variant="ghost" onClick={() => setCalModal(false)}>Cancelar</Btn>
                <Btn onClick={handleAddMes} disabled={!calForm.mes}>Agregar</Btn>
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
      {tab === "maestros" && <TabMaestros maestros={maestros} setMaestros={setMaestros} />}

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
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState(SERVICIO_FORM_EMPTY);
  const [detail, setDetail] = useState(null);
  const [rolesModal, setRolesModal] = useState(null);
  const [form, setForm] = useState(SERVICIO_FORM_EMPTY);
  const [rolesForm, setRolesForm] = useState(ROLES_SERVICIO_EMPTY);

  const pos = colaboradores.filter(c => c.status === "Activo").map(c => c.name).sort();

  const filtered = servicios.filter(s =>
    (tribFilter === "Todas" || s.tribu === tribFilter) &&
    (estadoFilter === "Todos" || s.estado === estadoFilter) &&
    (s.nombre.toLowerCase().includes(search.toLowerCase()) || (s.contratoId || "").toLowerCase().includes(search.toLowerCase()))
  );

  const tieneHorasLimite = (tipo) => ["Soporte Evolutivo", "Soporte Crítico", "Soporte Evolutivo + Crítico", "Bolsa de Horas"].includes(tipo);

  const handleAdd = async () => {
    if (!form.nombre.trim()) return;
    const body = { ...form, horasLimite: Number(form.horasLimite), personasDedicadas: Number(form.personasDedicadas) };
    const res = await fetch("/api/servicios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    setServicios(p => [...p, { ...saved, roles: {} }]);
    setModal(false);
    setForm(SERVICIO_FORM_EMPTY);
  };

  const openEdit = (s) => {
    setEditForm({ nombre: s.nombre, tipo: s.tipo, tribu: s.tribu, po: s.po, contratoId: s.contratoId, jiraId: s.jiraId, tecnologia: s.tecnologia, horasLimite: s.horasLimite, personasDedicadas: s.personasDedicadas, estado: s.estado, fechaInicio: s.fechaInicio, fechaVencimiento: s.fechaVencimiento, renovable: s.renovable });
    setEditModal(s);
    setDetail(null);
  };

  const handleEdit = async () => {
    if (!editForm.nombre.trim()) return;
    const body = { id: editModal.id, ...editForm, horasLimite: Number(editForm.horasLimite), personasDedicadas: Number(editForm.personasDedicadas) };
    const res = await fetch("/api/servicios", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    if (saved.error) { alert(`Error al guardar: ${saved.error}`); return; }
    setServicios(p => p.map(s => s.id === editModal.id ? { ...saved, roles: s.roles || {} } : s));
    setEditModal(null);
  };

  const handleDelete = async (s) => {
    if (!confirm(`¿Eliminar "${s.nombre}"?`)) return;
    await fetch("/api/servicios", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id }) });
    setServicios(p => p.filter(x => x.id !== s.id));
    setDetail(null);
    setEditModal(null);
  };

  const handleToggleEstado = async (s) => {
    const body = { ...s, estado: s.estado === "Activo" ? "Inactivo" : "Activo" };
    const res = await fetch("/api/servicios", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    if (saved.error) { alert(`Error: ${saved.error}`); return; }
    setServicios(p => p.map(x => x.id === s.id ? { ...x, estado: body.estado } : x));
  };

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

  const ServicioForm = ({ f, setF, isEdit }) => (
    <div className="space-y-4">
      <Input label="Nombre" value={f.nombre} onChange={e => setF(x => ({ ...x, nombre: e.target.value }))} placeholder="Nombre del cliente o proyecto" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Tipo" value={f.tipo} onChange={e => setF(x => ({ ...x, tipo: e.target.value }))} options={TIPOS_SERVICIO} />
        <Select label="Tribu" value={f.tribu} onChange={e => setF(x => ({ ...x, tribu: e.target.value }))} options={TRIBUS_DEFAULT} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="ID Contrato" value={f.contratoId} onChange={e => setF(x => ({ ...x, contratoId: e.target.value }))} placeholder="CN-00xxx" />
        <Input label="ID Jira" value={f.jiraId} onChange={e => setF(x => ({ ...x, jiraId: e.target.value }))} placeholder="JIRA-xxx" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="PO / Responsable" value={f.po} onChange={e => setF(x => ({ ...x, po: e.target.value }))} options={[{ value: "", label: "Seleccionar..." }, ...pos.map(p => ({ value: p, label: p }))]} />
        <Input label="Tecnología" value={f.tecnologia} onChange={e => setF(x => ({ ...x, tecnologia: e.target.value }))} placeholder="Salesforce, Oracle, Adobe..." />
      </div>
      {f.tipo === "Talento Dedicado"
        ? <Input label="Personas dedicadas" type="number" min="1" value={f.personasDedicadas} onChange={e => setF(x => ({ ...x, personasDedicadas: e.target.value }))} />
        : <Input label={tieneHorasLimite(f.tipo) ? "Horas límite / mes" : "Horas totales estimadas"} type="number" value={f.horasLimite} onChange={e => setF(x => ({ ...x, horasLimite: e.target.value }))} />
      }
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Fecha inicio" type="date" value={f.fechaInicio} onChange={e => setF(x => ({ ...x, fechaInicio: e.target.value }))} />
        <Input label="Fecha vencimiento" type="date" value={f.fechaVencimiento} onChange={e => setF(x => ({ ...x, fechaVencimiento: e.target.value }))} />
      </div>
      {isEdit && <Select label="Estado" value={f.estado} onChange={e => setF(x => ({ ...x, estado: e.target.value }))} options={["Activo", "Inactivo"]} />}
      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input type="checkbox" checked={f.renovable} onChange={e => setF(x => ({ ...x, renovable: e.target.checked }))} className="w-4 h-4 accent-blue-500" />
        Contrato renovable
      </label>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI title="Total activos" value={servicios.filter(s => s.estado === "Activo").length} color="blue" />
        {TRIBUS_DEFAULT.map(t => <KPI key={t} title={t} value={servicios.filter(s => s.tribu === t && s.estado === "Activo").length} color="green" />)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44" />
        <div className="flex flex-wrap gap-1">
          {["Todas", ...TRIBUS_DEFAULT].map(t => <button key={t} onClick={() => setTribFilter(t)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${tribFilter === t ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"}`}>{t}</button>)}
        </div>
        <div className="flex gap-1">
          {["Activo", "Inactivo", "Todos"].map(e => <button key={e} onClick={() => setEstadoFilter(e)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${estadoFilter === e ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"}`}>{e}</button>)}
        </div>
        <Btn size="sm" onClick={() => setModal(true)} className="ml-auto">+ Nuevo</Btn>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-slate-800/80">
            <tr>{["Contrato", "Servicio/Proyecto", "Tipo", "Tribu", "PO", "Tecnología", "Límite", "Vigencia", "Estado", ""].map(h => <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const hoy = new Date();
              const venc = s.fechaVencimiento ? new Date(s.fechaVencimiento) : null;
              const dias = venc ? Math.ceil((venc - hoy) / 86400000) : null;
              const vigColor = dias === null ? "text-slate-500" : dias < 0 ? "text-red-400" : dias <= 60 ? "text-amber-400" : "text-emerald-400";
              const vigLabel = dias === null ? "Sin fecha" : dias < 0 ? `Venció ${Math.abs(dias)}d` : dias <= 30 ? `${dias}d ⚠` : s.fechaVencimiento;
              return (
                <tr key={s.id} className={`border-t border-slate-700/30 hover:bg-slate-800/20 ${s.estado === "Inactivo" ? "opacity-50" : ""}`}>
                  <td className="px-3 py-3 text-blue-400 font-mono text-xs whitespace-nowrap">{s.contratoId || "—"}</td>
                  <td className="px-3 py-3 text-white font-medium">{s.nombre}</td>
                  <td className="px-3 py-3 whitespace-nowrap"><Badge color={s.tipo.includes("Crítico") ? "red" : s.tipo.includes("Dedicado") ? "purple" : s.tipo.includes("Proyecto") ? "amber" : "blue"}>{s.tipo}</Badge></td>
                  <td className="px-3 py-3 whitespace-nowrap"><Pill label={s.tribu} color={s.tribu} /></td>
                  <td className="px-3 py-3 text-slate-300 text-xs whitespace-nowrap">{s.po || "—"}</td>
                  <td className="px-3 py-3 text-slate-400 text-xs whitespace-nowrap">{s.tecnologia || "—"}</td>
                  <td className="px-3 py-3 text-slate-300 font-mono text-xs whitespace-nowrap">{s.tipo === "Talento Dedicado" ? `${s.personasDedicadas}p` : `${s.horasLimite}h`}</td>
                  <td className="px-3 py-3 whitespace-nowrap"><span className={`font-mono text-xs font-semibold ${vigColor}`}>{vigLabel}</span>{s.renovable && <span className="text-xs text-slate-500 block">renovable</span>}</td>
                  <td className="px-3 py-3 whitespace-nowrap"><Badge color={s.estado === "Activo" ? "green" : "gray"}>{s.estado}</Badge></td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Btn variant="ghost" size="sm" onClick={() => openEdit(s)}>✏️</Btn>
                      <Btn variant={s.estado === "Activo" ? "danger" : "ghost"} size="sm" onClick={() => handleToggleEstado(s)}>{s.estado === "Activo" ? "Off" : "On"}</Btn>
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
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo servicio / proyecto">
        <ServicioForm f={form} setF={setForm} isEdit={false} />
        <div className="flex justify-end gap-2 pt-4"><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn onClick={handleAdd}>Guardar</Btn></div>
      </Modal>
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Editar — ${editModal?.nombre}`}>
        <ServicioForm f={editForm} setF={setEditForm} isEdit={true} />
        <div className="flex justify-between pt-4">
          <Btn variant="danger" onClick={() => handleDelete(editModal)}>Eliminar</Btn>
          <div className="flex gap-2"><Btn variant="ghost" onClick={() => setEditModal(null)}>Cancelar</Btn><Btn onClick={handleEdit}>Guardar cambios</Btn></div>
        </div>
      </Modal>
      <Modal open={!!rolesModal} onClose={() => setRolesModal(null)} title={`Roles — ${servicios.find(s => s.id === rolesModal)?.nombre}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {ROLES_DEFAULT.map(rol => (
              <label key={rol} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${rolesForm[rol] ? "border-blue-500/50 bg-blue-500/10" : "border-slate-700/50 bg-slate-800/30"}`}>
                <input type="checkbox" checked={!!rolesForm[rol]} onChange={e => setRolesForm(f => ({ ...f, [rol]: e.target.checked }))} className="w-4 h-4 accent-blue-500" />
                <Pill label={rol} color={rol} />
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2"><Btn variant="ghost" onClick={() => setRolesModal(null)}>Cancelar</Btn><Btn onClick={handleSaveRoles}>Guardar</Btn></div>
        </div>
      </Modal>
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detalle del servicio">
        {detail && (
          <div className="space-y-3">
            {[["Nombre",detail.nombre],["Tipo",detail.tipo],["Tribu",detail.tribu],["PO",detail.po||"—"],["Contrato",detail.contratoId||"—"],["Tecnología",detail.tecnologia||"—"],["Límite",detail.tipo==="Talento Dedicado"?`${detail.personasDedicadas}p`:`${detail.horasLimite}h`],["Vencimiento",detail.fechaVencimiento||"—"],["Estado",detail.estado]].map(([k,v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-slate-700/30"><span className="text-xs text-slate-500 uppercase">{k}</span><span className="text-sm text-white font-medium">{v}</span></div>
            ))}
            <div className="flex justify-end gap-2 pt-3">
              <Btn variant="danger" size="sm" onClick={() => handleDelete(detail)}>Eliminar</Btn>
              <Btn size="sm" onClick={() => openEdit(detail)}>✏️ Editar</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── MÓDULO: GESTIÓN DE TRIBU ─────────────────────────────────────────────────

function BarUtilSimple({ pct, color }) {
  const bg = color === "green" ? "bg-emerald-500" : color === "amber" ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full bg-slate-700/50 rounded-full h-2 mt-1">
      <div className={`h-2 rounded-full ${bg}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function ModuloTribu({ tribu, servicios, asignaciones, calendar, disponibilidad, ausencias, colaboradores, params }) {
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const calDesc = [...calendar].sort((a, b) => b.mes.localeCompare(a.mes));
  const mesInicial = calDesc.find(c => c.mes <= mesActual)?.mes || calDesc[0]?.mes || mesActual;
  const [mesSel, setMesSel] = useState(mesInicial);
  const [tab, setTab] = useState("utilizacion");

  const motor = useUtilizacion({ colaboradores, asignaciones, ausencias, calendar, servicios, params });
  const tribColabs = colaboradores.filter(c => c.tribu === tribu && c.status === "Activo");
  const tribAsigs = (asignaciones || []).filter(a => a.tribu === tribu && a.mes === mesSel);
  const rolesData = ROLES_DEFAULT.map(rol => motor.utilizacionRolTribu(tribu, rol, mesSel)).filter(r => r && r.personas > 0);
  const porPersona = tribColabs.map(colab => motor.utilizacionPorPersona(colab, mesSel)).filter(p => p && p.colab).sort((a, b) => b.pct - a.pct);

  const totalDisp = rolesData.reduce((s, r) => s + r.disponible, 0);
  const totalAsig = rolesData.reduce((s, r) => s + r.asignado, 0);
  const pctGlobal = totalDisp > 0 ? Math.round(totalAsig / totalDisp * 100) : 0;
  const semaforo = pctGlobal >= (params?.utilObjetivo || 75) ? "text-emerald-400" : pctGlobal >= 50 ? "text-amber-400" : "text-red-400";

  const tabs = [
    { id: "utilizacion",  label: "Utilización por rol" },
    { id: "asignaciones", label: "Asignaciones activas" },
    { id: "capacidad",    label: "Capacidad vs Asignado" },
    { id: "personas",     label: "Por colaborador" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{tribu}</h2>
          <p className={`text-2xl font-bold ${semaforo}`}>{pctGlobal}% <span className="text-sm font-normal text-slate-400">utilización {mesSel}</span></p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[...calendar].sort((a, b) => b.mes.localeCompare(a.mes)).map(cal => (
            <button key={cal.mes} onClick={() => setMesSel(cal.mes)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${mesSel === cal.mes ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"}`}>{cal.label}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-700/50 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${tab === t.id ? "bg-slate-800 text-white border border-slate-700/50" : "text-slate-400 hover:text-slate-300"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "utilizacion" && (
        <div className="space-y-3">
          {rolesData.length === 0
            ? <p className="text-slate-500 text-sm text-center py-8">No hay datos de utilización para este mes.</p>
            : rolesData.map(r => {
                const color = r.pct >= (params?.utilObjetivo || 75) ? "green" : r.pct >= 50 ? "amber" : "red";
                return (
                  <div key={r.rol} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Pill label={r.rol} color={r.rol} />
                        <span className="text-xs text-slate-400">{r.personas}p</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${color === "green" ? "text-emerald-400" : color === "amber" ? "text-amber-400" : "text-red-400"}`}>{r.pct}%</span>
                        <span className="text-xs text-slate-500 ml-2">{r.asignado}h / {r.disponible}h</span>
                      </div>
                    </div>
                    <BarUtilSimple pct={r.pct} color={color} />
                  </div>
                );
              })
          }
          {rolesData.length > 0 && (
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-600/50 flex justify-between items-center">
              <span className="font-semibold text-white">Total tribu</span>
              <div className="text-right">
                <span className={`text-xl font-bold ${semaforo}`}>{pctGlobal}%</span>
                <span className="text-xs text-slate-400 ml-2">{totalAsig}h / {totalDisp}h</span>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "asignaciones" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KPI title="Asignaciones" value={tribAsigs.length} color="blue" />
            <KPI title="Horas totales" value={`${tribAsigs.reduce((s, a) => s + (a.horas || 0), 0)}h`} color="green" />
            <KPI title="Servicios" value={new Set(tribAsigs.map(a => a.servicioId || a.servicio_id)).size} color="blue" />
          </div>
          {tribAsigs.length === 0
            ? <p className="text-slate-500 text-sm text-center py-8">No hay asignaciones registradas para {tribu} en {mesSel}.</p>
            : (
              <div className="overflow-x-auto rounded-xl border border-slate-700/50">
                <table className="w-full text-sm min-w-[400px]">
                  <thead className="bg-slate-800/80"><tr>{["Rol","Colaborador","Servicio","Horas"].map(h => <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>
                    {tribAsigs.map((a, i) => {
                      const srv = servicios.find(s => s.id === (a.servicioId || a.servicio_id));
                      const rol = a.rol || "—";
                      return (
                        <tr key={i} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                          <td className="px-3 py-2.5 whitespace-nowrap">{rol !== "—" ? <Pill label={rol} color={rol} /> : <span className="text-slate-500 text-xs">—</span>}</td>
                          <td className="px-3 py-2.5 text-slate-300 text-xs">{a.colaborador || <span className="text-slate-600">Por rol</span>}</td>
                          <td className="px-3 py-2.5 text-white text-xs">{srv?.nombre || `Servicio #${a.servicioId || a.servicio_id}`}</td>
                          <td className="px-3 py-2.5 text-slate-300 font-mono text-xs whitespace-nowrap">{a.horas}h</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {tab === "capacidad" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KPI title="Disponible" value={`${totalDisp}h`} color="blue" />
            <KPI title="Asignado" value={`${totalAsig}h`} color={pctGlobal >= (params?.utilObjetivo || 75) ? "green" : "amber"} />
            <KPI title="Libre" value={`${totalDisp - totalAsig}h`} color={totalDisp - totalAsig < 0 ? "red" : "green"} />
          </div>
          {rolesData.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-700/50">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="bg-slate-800/80"><tr>{["Rol","Personas","Disponible","Asignado","Libre","Util."].map(h => <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {rolesData.map(r => {
                    const libre = r.disponible - r.asignado;
                    const color = r.pct >= (params?.utilObjetivo || 75) ? "text-emerald-400" : r.pct >= 50 ? "text-amber-400" : "text-red-400";
                    return (
                      <tr key={r.rol} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                        <td className="px-3 py-2.5 whitespace-nowrap"><Pill label={r.rol} color={r.rol} /></td>
                        <td className="px-3 py-2.5 text-slate-400 text-xs">{r.personas}</td>
                        <td className="px-3 py-2.5 text-slate-300 font-mono text-xs">{r.disponible}h</td>
                        <td className="px-3 py-2.5 text-slate-300 font-mono text-xs">{r.asignado}h</td>
                        <td className={`px-3 py-2.5 font-mono text-xs ${libre < 0 ? "text-red-400" : "text-emerald-400"}`}>{libre}h</td>
                        <td className="px-3 py-2.5"><span className={`font-bold text-xs ${color}`}>{r.pct}%</span></td>
                      </tr>
                    );
                  })}
                  <tr className="border-t border-slate-600/50 bg-slate-800/40 font-semibold">
                    <td className="px-3 py-2.5 text-white text-xs">TOTAL</td>
                    <td className="px-3 py-2.5 text-slate-400 text-xs">{rolesData.reduce((s,r)=>s+r.personas,0)}</td>
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-xs">{totalDisp}h</td>
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-xs">{totalAsig}h</td>
                    <td className={`px-3 py-2.5 font-mono text-xs ${totalDisp-totalAsig < 0 ? "text-red-400" : "text-emerald-400"}`}>{totalDisp-totalAsig}h</td>
                    <td className="px-3 py-2.5"><span className={`font-bold text-xs ${semaforo}`}>{pctGlobal}%</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "personas" && (
        <div className="space-y-3">
          {porPersona.length === 0
            ? <p className="text-slate-500 text-sm text-center py-8">No hay colaboradores activos en {tribu}.</p>
            : porPersona.map(p => {
                const color = p.pct >= (params?.utilObjetivo || 75) ? "green" : p.pct >= 50 ? "amber" : "red";
                const asigPersona = tribAsigs.filter(a => a.colaborador === p.colab.name);
                return (
                  <div key={p.colab.name} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0">{p.colab.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-medium text-white">{p.colab.name}</p>
                          <p className="text-xs text-slate-500">{p.colab.rolPrincipal} · {p.disponible}h disp.</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-lg font-bold ${color === "green" ? "text-emerald-400" : color === "amber" ? "text-amber-400" : "text-red-400"}`}>{p.pct}%</span>
                        <span className="text-xs text-slate-500 ml-1">{p.asignado}h</span>
                      </div>
                    </div>
                    <BarUtilSimple pct={p.pct} color={color} />
                    {asigPersona.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {asigPersona.map((a, i) => {
                          const srv = servicios.find(s => s.id === (a.servicioId || a.servicio_id));
                          return <div key={i} className="flex justify-between text-xs text-slate-400 pl-2 border-l border-slate-700"><span className="truncate mr-2">{srv?.nombre || "Servicio"}</span><span className="font-mono whitespace-nowrap">{a.horas}h</span></div>;
                        })}
                      </div>
                    )}
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}


// ─── MAESTROS: PAÍSES, INDUSTRIAS, TIPOS CONTRATO ────────────────────────────

const PAISES_DEFAULT = ["Costa Rica","Guatemala","El Salvador","Honduras","Nicaragua","Panamá","México","Colombia","Estados Unidos","España","Otro"];
const PROVINCIAS_CR = ["San José","Alajuela","Cartago","Heredia","Guanacaste","Puntarenas","Limón"];
const INDUSTRIAS_DEFAULT = ["Tecnología","Retail / Comercio","Banca y Finanzas","Salud","Manufactura","Logística","Educación","Gobierno","Telecomunicaciones","Seguros","Agroindustria","Otro"];
const TIPOS_CONTRATO_DEFAULT = ["Tiempo y Materiales","Precio Fijo","Retención Mensual","Bolsa de Horas","Talento Dedicado","Proyecto Llave en Mano","Otro"];
const TAMANIOS_EMPRESA = ["1-10","11-50","51-200","201-500","501-1000","1000+"];

// ─── MÓDULO: PROVEEDORES ─────────────────────────────────────────────────────

const PROVEEDOR_EMPTY = {
  codigo: "", nombre: "", tipo: "Persona física",
  cedula: "", correo: "", telefono: "",
  especialidad: "", tribu: "Dunamis",
  costoHora: 0, monedaCosto: "USD",
  pais: "Costa Rica", notas: "", estado: "Activo",
  horasDia: 8,
};

const TIPOS_PROVEEDOR = ["Persona física", "Empresa"];

// Form como componente de nivel superior para evitar re-mount en cada render
function ProveedorFormFields({ f, setF, formErrors, setFormErrors, paises }) {
  const ErrMsg = ({ field }) => formErrors[field] ? <p className="text-xs text-red-400 mt-0.5">{formErrors[field]}</p> : null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Input label="Código (auto)" value={f.codigo} onChange={e => setF(x => ({ ...x, codigo: e.target.value }))} placeholder="PRV-XXXXX" />
          <p className="text-xs text-slate-500 mt-0.5">Dejar vacío para generar automático</p>
        </div>
        <Select label="Tipo" value={f.tipo} onChange={e => setF(x => ({ ...x, tipo: e.target.value }))} options={TIPOS_PROVEEDOR} />
      </div>
      <div>
        <Input label="Nombre / Razón social *" value={f.nombre} onChange={e => { setF(x => ({ ...x, nombre: e.target.value })); setFormErrors(er => ({ ...er, nombre: "" })); }} />
        <ErrMsg field="nombre" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Cédula / Cédula jurídica" value={f.cedula} onChange={e => setF(x => ({ ...x, cedula: e.target.value }))} placeholder="1-XXXX-XXXX" />
        <Select label="País" value={f.pais} onChange={e => setF(x => ({ ...x, pais: e.target.value }))} options={paises} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Input label="Correo" value={f.correo} onChange={e => { setF(x => ({ ...x, correo: e.target.value })); setFormErrors(er => ({ ...er, correo: "" })); }} placeholder="proveedor@empresa.com" />
          <ErrMsg field="correo" />
        </div>
        <div>
          <Input label="Teléfono" value={f.telefono} onChange={e => { const v = e.target.value.replace(/[^+\d\s\-()]/g,""); setF(x => ({ ...x, telefono: v })); setFormErrors(er => ({ ...er, telefono: "" })); }} placeholder="+506 8888-8888" />
          <ErrMsg field="telefono" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Especialidad / Rol" value={f.especialidad} onChange={e => setF(x => ({ ...x, especialidad: e.target.value }))} options={[{ value: "", label: "Seleccionar..." }, ...ROLES_DEFAULT.map(r => ({ value: r, label: r }))]} />
        <Select label="Tribu asignada" value={f.tribu} onChange={e => setF(x => ({ ...x, tribu: e.target.value }))} options={TRIBUS_DEFAULT} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input label="Costo / hora" type="number" value={f.costoHora} onChange={e => setF(x => ({ ...x, costoHora: Number(e.target.value) }))} />
        <Select label="Moneda" value={f.monedaCosto} onChange={e => setF(x => ({ ...x, monedaCosto: e.target.value }))} options={["USD","CRC","EUR"]} />
        <Input label="Horas / día" type="number" value={f.horasDia} onChange={e => setF(x => ({ ...x, horasDia: Number(e.target.value) }))} />
      </div>
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Notas</label>
        <textarea value={f.notas} onChange={e => setF(x => ({ ...x, notas: e.target.value }))} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
      </div>
    </div>
  );
}

function ModuloProveedores({ proveedores, setProveedores, disponibilidad, setDisponibilidad, servicios, setServicios, calendar, params, maestros }) {
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("Activo");
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [dispModal, setDispModal] = useState(null);
  const [asigModal, setAsigModal] = useState(null); // proveedor para ver sus servicios asignados
  const [form, setForm] = useState({ ...PROVEEDOR_EMPTY, codigo: `PRV-${String(Date.now()).slice(-5)}` });
  const [editForm, setEditForm] = useState({ ...PROVEEDOR_EMPTY });
  const [formErrors, setFormErrors] = useState({});
  const [dispForm, setDispForm] = useState({ mes: "", porcentaje: 100 });

  const paises = maestros?.paises?.length ? maestros.paises : PAISES_DEFAULT;
  const calDesc = [...calendar].sort((a, b) => b.mes.localeCompare(a.mes));

  const filtered = proveedores.filter(p =>
    (estadoFilter === "Todos" || p.estado === estadoFilter) &&
    (p.nombre.toLowerCase().includes(search.toLowerCase()) ||
     (p.codigo||"").toLowerCase().includes(search.toLowerCase()) ||
     (p.especialidad||"").toLowerCase().includes(search.toLowerCase()))
  );

  const validate = (f) => {
    const e = {};
    if (!f.nombre.trim()) e.nombre = "Requerido";
    if (f.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo)) e.correo = "Email inválido";
    if (f.telefono && !/^[+\d\s\-()\-]{6,20}$/.test(f.telefono)) e.telefono = "Formato inválido";
    return e;
  };

  const handleAdd = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    const body = { ...form, codigo: form.codigo.trim() || `PRV-${String(Date.now()).slice(-5)}` };
    const res = await fetch("/api/proveedores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    if (saved.error) { alert(saved.error); return; }
    setProveedores(p => [...p, saved]);
    setModal(false);
    setForm({ ...PROVEEDOR_EMPTY, codigo: `PRV-${String(Date.now()).slice(-5)}` });
    setFormErrors({});
  };

  const handleEdit = async () => {
    const errs = validate(editForm);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    const res = await fetch("/api/proveedores", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editModal.id, ...editForm }) });
    const saved = await res.json();
    if (saved.error) { alert(saved.error); return; }
    setProveedores(p => p.map(x => x.id === editModal.id ? saved : x));
    setEditModal(null); setDetailModal(null); setFormErrors({});
  };

  const handleDelete = async (p) => {
    if (!confirm(`¿Eliminar proveedor "${p.nombre}"?`)) return;
    await fetch("/api/proveedores", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id }) });
    setProveedores(prev => prev.filter(x => x.id !== p.id));
    setDetailModal(null); setEditModal(null);
  };

  const handleToggleEstado = async (p) => {
    const body = { ...p, estado: p.estado === "Activo" ? "Inactivo" : "Activo" };
    const res = await fetch("/api/proveedores", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    if (!saved.error) {
      setProveedores(prev => prev.map(x => x.id === p.id ? { ...x, estado: body.estado } : x));
      if (detailModal?.id === p.id) setDetailModal(d => d ? { ...d, estado: body.estado } : null);
    }
  };

  const openEdit = (p) => {
    setEditForm({ codigo: p.codigo||"", nombre: p.nombre, tipo: p.tipo||"Persona física", cedula: p.cedula||"", correo: p.correo||"", telefono: p.telefono||"", especialidad: p.especialidad||"", tribu: p.tribu||"Dunamis", costoHora: p.costoHora||0, monedaCosto: p.monedaCosto||"USD", pais: p.pais||"Costa Rica", notas: p.notas||"", estado: p.estado||"Activo", horasDia: p.horasDia||8 });
    setFormErrors({});
    setEditModal(p); setDetailModal(null);
  };

  const dispDeProveedor = (nombre) => disponibilidad.filter(d => d.colaborador === nombre);

  const handleAddDisp = async () => {
    if (!dispModal || !dispForm.mes) return;
    const body = { colaborador: dispModal.nombre, tribu: dispModal.tribu, rol: dispModal.especialidad || "Proveedor", mes: dispForm.mes, porcentaje: Number(dispForm.porcentaje), esProveedor: true };
    const existing = dispDeProveedor(dispModal.nombre).find(d => d.mes === dispForm.mes);
    if (existing) {
      const res = await fetch("/api/disponibilidad", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...existing, porcentaje: Number(dispForm.porcentaje) }) });
      const saved = await res.json();
      setDisponibilidad(p => p.map(d => d.id === existing.id ? saved : d));
    } else {
      const res = await fetch("/api/disponibilidad", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const saved = await res.json();
      setDisponibilidad(p => [...p, saved]);
    }
    setDispForm({ mes: calDesc[0]?.mes || "", porcentaje: 100 });
  };

  const handleDeleteDisp = async (id) => {
    await fetch("/api/disponibilidad", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setDisponibilidad(p => p.filter(d => d.id !== id));
  };

  // Servicios asignados a este proveedor
  const serviciosDeProveedor = (nombre) => (servicios || []).filter(s => s.proveedores && s.proveedores.includes(nombre));

  const handleToggleServicio = async (proveedor, servicio) => {
    const provList = servicio.proveedores || [];
    const yaAsignado = provList.includes(proveedor.nombre);
    const nuevaLista = yaAsignado ? provList.filter(n => n !== proveedor.nombre) : [...provList, proveedor.nombre];
    const body = { ...servicio, proveedores: nuevaLista };
    const res = await fetch("/api/servicios", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    if (!saved.error) setServicios(p => p.map(s => s.id === servicio.id ? { ...s, proveedores: nuevaLista } : s));
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI title="Activos" value={proveedores.filter(p => p.estado === "Activo").length} color="purple" />
        <KPI title="Personas" value={proveedores.filter(p => p.tipo === "Persona física" && p.estado === "Activo").length} color="blue" />
        <KPI title="Empresas" value={proveedores.filter(p => p.tipo === "Empresa" && p.estado === "Activo").length} color="green" />
        <KPI title="Con disponibilidad" value={new Set(disponibilidad.filter(d => proveedores.some(p => p.nombre === d.colaborador)).map(d => d.colaborador)).size} color="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proveedor, código, rol..." className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-52" />
        <div className="flex gap-1">{["Activo","Inactivo","Todos"].map(e => <button key={e} onClick={() => setEstadoFilter(e)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${estadoFilter === e ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"}`}>{e}</button>)}</div>
        <Btn size="sm" onClick={() => { setModal(true); setFormErrors({}); setForm({ ...PROVEEDOR_EMPTY, codigo: `PRV-${String(Date.now()).slice(-5)}` }); }} className="ml-auto">+ Nuevo proveedor</Btn>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-slate-800/80">
            <tr>{["Código","Nombre","Tipo","Especialidad","Tribu","Costo/h","Estado",""].map(h => <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className={`border-t border-slate-700/30 hover:bg-slate-800/20 ${p.estado === "Inactivo" ? "opacity-50" : ""}`}>
                <td className="px-3 py-3"><button onClick={() => setDetailModal(p)} className="text-purple-400 font-mono text-xs hover:underline font-bold">{p.codigo || `PRV-${p.id}`}</button></td>
                <td className="px-3 py-3"><button onClick={() => setDetailModal(p)} className="text-white font-medium hover:text-purple-300 text-left">{p.nombre}</button></td>
                <td className="px-3 py-3 whitespace-nowrap"><Badge color={p.tipo === "Empresa" ? "blue" : "green"}>{p.tipo}</Badge></td>
                <td className="px-3 py-3 text-slate-400 text-xs">{p.especialidad || "—"}</td>
                <td className="px-3 py-3 whitespace-nowrap"><Pill label={p.tribu} color={p.tribu} /></td>
                <td className="px-3 py-3 text-emerald-400 font-mono text-xs font-bold whitespace-nowrap">{p.costoHora ? `${p.monedaCosto} ${p.costoHora}/h` : "—"}</td>
                <td className="px-3 py-3 whitespace-nowrap"><Badge color={p.estado === "Activo" ? "green" : "gray"}>{p.estado}</Badge></td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex gap-1">
                    <Btn variant="ghost" size="sm" onClick={() => setAsigModal(p)}>📋</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => { setDispModal(p); setDispForm({ mes: calDesc[0]?.mes || "", porcentaje: 100 }); }}>📅</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => openEdit(p)}>✏️</Btn>
                    <Btn variant={p.estado === "Activo" ? "danger" : "ghost"} size="sm" onClick={() => handleToggleEstado(p)}>{p.estado === "Activo" ? "Off" : "On"}</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">No se encontraron proveedores</p>}
      </div>

      {/* Modal nuevo */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo proveedor">
        <ProveedorFormFields f={form} setF={setForm} formErrors={formErrors} setFormErrors={setFormErrors} paises={paises} />
        <div className="flex justify-end gap-2 pt-4"><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn onClick={handleAdd}>Guardar</Btn></div>
      </Modal>

      {/* Modal editar */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Editar — ${editModal?.nombre}`}>
        <ProveedorFormFields f={editForm} setF={setEditForm} formErrors={formErrors} setFormErrors={setFormErrors} paises={paises} />
        <div className="flex justify-between pt-4">
          <Btn variant="danger" onClick={() => handleDelete(editModal)}>Eliminar</Btn>
          <div className="flex gap-2"><Btn variant="ghost" onClick={() => setEditModal(null)}>Cancelar</Btn><Btn onClick={handleEdit}>Guardar</Btn></div>
        </div>
      </Modal>

      {/* Modal detalle */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={`${detailModal?.codigo || ""} — ${detailModal?.nombre}`}>
        {detailModal && (
          <div className="space-y-2">
            {[["Tipo",detailModal.tipo],["Cédula",detailModal.cedula||"—"],["País",detailModal.pais||"—"],["Correo",detailModal.correo||"—"],["Teléfono",detailModal.telefono||"—"],["Especialidad",detailModal.especialidad||"—"],["Tribu",detailModal.tribu],["Costo/hora",detailModal.costoHora?`${detailModal.monedaCosto} ${detailModal.costoHora}`:"—"],["Horas/día",detailModal.horasDia||8],["Estado",detailModal.estado]].map(([k,v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-slate-700/30"><span className="text-xs text-slate-500">{k}</span><span className="text-sm text-white">{v}</span></div>
            ))}
            {detailModal.notas && <div className="bg-slate-800/40 rounded-lg p-3 mt-1"><p className="text-xs text-slate-400">{detailModal.notas}</p></div>}
            <div className="flex justify-between pt-3 flex-wrap gap-2">
              <div className="flex gap-2">
                <Btn variant="ghost" size="sm" onClick={() => { setAsigModal(detailModal); setDetailModal(null); }}>📋 Servicios</Btn>
                <Btn variant="ghost" size="sm" onClick={() => { setDispModal(detailModal); setDetailModal(null); setDispForm({ mes: calDesc[0]?.mes||"", porcentaje: 100 }); }}>📅 Disp.</Btn>
              </div>
              <Btn size="sm" onClick={() => openEdit(detailModal)}>✏️ Editar</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal servicios asignados */}
      <Modal open={!!asigModal} onClose={() => setAsigModal(null)} title={`Servicios — ${asigModal?.nombre}`}>
        {asigModal && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Selecciona los servicios/proyectos donde participa este proveedor.</p>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {(servicios || []).filter(s => s.estado === "Activo").length === 0
                ? <p className="text-slate-500 text-sm text-center py-4">No hay servicios activos</p>
                : (servicios || []).filter(s => s.estado === "Activo").map(s => {
                  const asignado = (s.proveedores || []).includes(asigModal.nombre);
                  return (
                    <div key={s.id} onClick={() => handleToggleServicio(asigModal, s)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 border cursor-pointer transition-colors ${asignado ? "bg-purple-600/15 border-purple-500/40" : "bg-slate-800/40 border-slate-700/30 hover:bg-slate-800/70"}`}>
                      <div>
                        <p className="text-sm font-medium text-white">{s.nombre || s.name}</p>
                        <div className="flex gap-2 mt-0.5">
                          {s.tribu && <Pill label={s.tribu} color={s.tribu} />}
                          {s.tipo && <span className="text-xs text-slate-500">{s.tipo}</span>}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${asignado ? "bg-purple-500 text-white text-xs" : "border border-slate-600"}`}>
                        {asignado && "✓"}
                      </div>
                    </div>
                  );
                })
              }
            </div>
            <p className="text-xs text-slate-500">{(servicios||[]).filter(s => (s.proveedores||[]).includes(asigModal.nombre)).length} servicio(s) asignado(s)</p>
          </div>
        )}
      </Modal>

      {/* Modal disponibilidad */}
      <Modal open={!!dispModal} onClose={() => setDispModal(null)} title={`Disponibilidad — ${dispModal?.nombre}`}>
        {dispModal && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Este proveedor aparecerá en Utilización, Asignaciones y Forecast de la tribu <span className="text-white font-semibold">{dispModal.tribu}</span> con badge <span className="text-purple-400 font-semibold">Proveedor</span>.</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {dispDeProveedor(dispModal.nombre).length === 0
                ? <p className="text-slate-500 text-sm text-center py-3">Sin disponibilidad configurada</p>
                : dispDeProveedor(dispModal.nombre).sort((a,b) => b.mes > a.mes ? 1 : -1).map(d => (
                  <div key={d.id} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-700/30">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-blue-400">{d.mes}</span>
                      <span className="text-sm font-bold text-white">{d.porcentaje}%</span>
                      <span className="text-xs text-slate-500">{Math.round((d.porcentaje/100) * (dispModal.horasDia||8) * 20)}h aprox/mes</span>
                    </div>
                    <button onClick={() => handleDeleteDisp(d.id)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                  </div>
                ))
              }
            </div>
            <div className="border-t border-slate-700/50 pt-3 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase">Configurar mes</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Mes</label>
                  <select value={dispForm.mes} onChange={e => setDispForm(f => ({ ...f, mes: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="">Seleccionar...</option>
                    {calDesc.map(m => <option key={m.mes} value={m.mes}>{m.label}</option>)}
                  </select>
                </div>
                <Input label="Disponibilidad %" type="number" value={dispForm.porcentaje} onChange={e => setDispForm(f => ({ ...f, porcentaje: Math.min(100, Math.max(0, Number(e.target.value))) }))} />
              </div>
              <div className="flex justify-end"><Btn size="sm" onClick={handleAddDisp}>Guardar</Btn></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── MÓDULO: CLIENTES ─────────────────────────────────────────────────────────

const CLIENTE_EMPTY = {
  nombre: "", razonSocial: "", cedulaJuridica: "", pais: "Costa Rica",
  industria: "", tamano: "", sitioWeb: "", notas: "",
  provincia: "", canton: "", distrito: "", direccionDetalle: "",
  estado: "Activo",
};

function ModuloClientes({ clientes, setClientes, contactos, setContactos, maestros }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState(CLIENTE_EMPTY);
  const [editForm, setEditForm] = useState(CLIENTE_EMPTY);
  const [detail, setDetail] = useState(null);
  const [contactoModal, setContactoModal] = useState(null);
  const [contactoForm, setContactoForm] = useState({ nombre: "", cargo: "", email: "", telefono: "", clienteId: "" });
  const [estadoFilter, setEstadoFilter] = useState("Activo");

  const paises = maestros?.paises?.length ? maestros.paises : PAISES_DEFAULT;
  const industrias = maestros?.industrias?.length ? maestros.industrias : INDUSTRIAS_DEFAULT;
  const filtered = clientes.filter(c =>
    (estadoFilter === "Todos" || c.estado === estadoFilter) &&
    (c.nombre.toLowerCase().includes(search.toLowerCase()) ||
     (c.razonSocial||"").toLowerCase().includes(search.toLowerCase()) ||
     (c.cedulaJuridica||"").includes(search))
  );
  const contactosPorCliente = (id) => contactos.filter(c => c.clienteId === id || c.cliente_id === id);

  const handleAdd = async () => {
    if (!form.nombre.trim()) return;
    const res = await fetch("/api/clientes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const saved = await res.json();
    if (saved.error) { alert(saved.error); return; }
    setClientes(p => [...p, saved]);
    setModal(false); setForm(CLIENTE_EMPTY);
  };

  const handleEdit = async () => {
    if (!editForm.nombre.trim()) return;
    const res = await fetch("/api/clientes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editModal.id, ...editForm }) });
    const saved = await res.json();
    if (saved.error) { alert(saved.error); return; }
    setClientes(p => p.map(c => c.id === editModal.id ? saved : c));
    setEditModal(null);
  };

  const handleDelete = async (cl) => {
    if (!confirm(`¿Eliminar "${cl.nombre}"? Se eliminarán también sus contactos.`)) return;
    await fetch("/api/clientes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: cl.id }) });
    setClientes(p => p.filter(x => x.id !== cl.id));
    setContactos(p => p.filter(x => x.clienteId !== cl.id && x.cliente_id !== cl.id));
    setDetail(null); setEditModal(null);
  };

  const handleToggleEstado = async (cl) => {
    const body = { ...cl, estado: cl.estado === "Activo" ? "Inactivo" : "Activo" };
    const res = await fetch("/api/clientes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    if (!saved.error) setClientes(p => p.map(x => x.id === cl.id ? { ...x, estado: body.estado } : x));
  };

  const openEdit = (cl) => {
    setEditForm({ nombre: cl.nombre, razonSocial: cl.razonSocial||"", cedulaJuridica: cl.cedulaJuridica||"", pais: cl.pais||"Costa Rica", industria: cl.industria||"", tamano: cl.tamano||"", sitioWeb: cl.sitioWeb||"", notas: cl.notas||"", provincia: cl.provincia||"", canton: cl.canton||"", distrito: cl.distrito||"", direccionDetalle: cl.direccionDetalle||"", estado: cl.estado||"Activo" });
    setEditModal(cl); setDetail(null);
  };

  const handleAddContacto = async () => {
    if (!contactoForm.nombre.trim()) return;
    const body = { ...contactoForm, clienteId: contactoModal };
    const res = await fetch("/api/contactos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    if (saved.error) { alert(saved.error); return; }
    setContactos(p => [...p, saved]);
    setContactoForm({ nombre: "", cargo: "", email: "", telefono: "", clienteId: "" });
  };

  const handleDeleteContacto = async (id) => {
    await fetch("/api/contactos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setContactos(p => p.filter(x => x.id !== id));
  };

  const ClienteForm = ({ f, setF }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Nombre comercial *" value={f.nombre} onChange={e => setF(x => ({ ...x, nombre: e.target.value }))} placeholder="ACME Corp" />
        <Input label="Razón social" value={f.razonSocial} onChange={e => setF(x => ({ ...x, razonSocial: e.target.value }))} placeholder="ACME Sociedad Anónima" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Cédula jurídica" value={f.cedulaJuridica} onChange={e => setF(x => ({ ...x, cedulaJuridica: e.target.value }))} placeholder="3-101-XXXXXX" />
        <Select label="País" value={f.pais} onChange={e => setF(x => ({ ...x, pais: e.target.value }))} options={paises} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Industria" value={f.industria} onChange={e => setF(x => ({ ...x, industria: e.target.value }))} options={[{ value: "", label: "Seleccionar..." }, ...industrias.map(i => ({ value: i, label: i }))]} />
        <Select label="Tamaño (empleados)" value={f.tamano} onChange={e => setF(x => ({ ...x, tamano: e.target.value }))} options={[{ value: "", label: "Seleccionar..." }, ...TAMANIOS_EMPRESA.map(t => ({ value: t, label: t }))]} />
      </div>
      <Input label="Sitio web" value={f.sitioWeb} onChange={e => setF(x => ({ ...x, sitioWeb: e.target.value }))} placeholder="https://www.empresa.com" />
      <div className="border border-slate-700/50 rounded-xl p-3 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dirección</p>
          {f.pais === "Costa Rica" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select label="Provincia" value={f.provincia} onChange={e => setF(x => ({ ...x, provincia: e.target.value }))} options={[{ value: "", label: "Seleccionar..." }, ...PROVINCIAS_CR.map(p => ({ value: p, label: p }))]} />
              <Input label="Cantón" value={f.canton} onChange={e => setF(x => ({ ...x, canton: e.target.value }))} placeholder="San José" />
              <Input label="Distrito" value={f.distrito} onChange={e => setF(x => ({ ...x, distrito: e.target.value }))} placeholder="Carmen" />
            </div>
          )}
          <Input label="Detalle de dirección" value={f.direccionDetalle} onChange={e => setF(x => ({ ...x, direccionDetalle: e.target.value }))} placeholder="Edificio Torre Mercedes, piso 5" />
        </div>
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Notas internas</label>
        <textarea value={f.notas} onChange={e => setF(x => ({ ...x, notas: e.target.value }))} rows={2} placeholder="Observaciones..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none" />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI title="Activos" value={clientes.filter(c => c.estado === "Activo").length} color="blue" />
        <KPI title="Contactos" value={contactos.length} color="green" />
        <KPI title="Inactivos" value={clientes.filter(c => c.estado === "Inactivo").length} color="gray" />
        <KPI title="Sin contacto" value={clientes.filter(c => contactosPorCliente(c.id).length === 0).length} color="amber" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente o cédula..." className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-52" />
        <div className="flex gap-1">{["Activo","Inactivo","Todos"].map(e => <button key={e} onClick={() => setEstadoFilter(e)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${estadoFilter === e ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"}`}>{e}</button>)}</div>
        <Btn size="sm" onClick={() => setModal(true)} className="ml-auto">+ Nuevo cliente</Btn>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-slate-800/80"><tr>{["Cliente","Cédula jurídica","País","Industria","Tamaño","Contactos","Estado",""].map(h => <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(cl => (
              <tr key={cl.id} className={`border-t border-slate-700/30 hover:bg-slate-800/20 ${cl.estado === "Inactivo" ? "opacity-50" : ""}`}>
                <td className="px-3 py-3"><p className="text-white font-medium">{cl.nombre}</p>{cl.razonSocial && <p className="text-xs text-slate-500">{cl.razonSocial}</p>}</td>
                <td className="px-3 py-3 text-slate-400 font-mono text-xs">{cl.cedulaJuridica || "—"}</td>
                <td className="px-3 py-3 text-slate-300 text-xs whitespace-nowrap">{cl.pais || "—"}</td>
                <td className="px-3 py-3 text-slate-300 text-xs whitespace-nowrap">{cl.industria || "—"}</td>
                <td className="px-3 py-3 text-slate-400 text-xs">{cl.tamano || "—"}</td>
                <td className="px-3 py-3"><button onClick={() => { setContactoModal(cl.id); setDetail(null); }} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"><span className="font-mono font-bold">{contactosPorCliente(cl.id).length}</span><span className="text-slate-500 ml-1">ver</span></button></td>
                <td className="px-3 py-3 whitespace-nowrap"><Badge color={cl.estado === "Activo" ? "green" : "gray"}>{cl.estado}</Badge></td>
                <td className="px-3 py-3 whitespace-nowrap"><div className="flex gap-1"><Btn variant="ghost" size="sm" onClick={() => setDetail(cl)}>Ver</Btn><Btn variant="ghost" size="sm" onClick={() => openEdit(cl)}>✏️</Btn><Btn variant={cl.estado === "Activo" ? "danger" : "ghost"} size="sm" onClick={() => handleToggleEstado(cl)}>{cl.estado === "Activo" ? "Off" : "On"}</Btn></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">No se encontraron clientes</p>}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo cliente"><ClienteForm f={form} setF={setForm} /><div className="flex justify-end gap-2 pt-4"><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn onClick={handleAdd}>Guardar</Btn></div></Modal>
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Editar — ${editModal?.nombre}`}><ClienteForm f={editForm} setF={setEditForm} /><div className="flex justify-between pt-4"><Btn variant="danger" onClick={() => handleDelete(editModal)}>Eliminar</Btn><div className="flex gap-2"><Btn variant="ghost" onClick={() => setEditModal(null)}>Cancelar</Btn><Btn onClick={handleEdit}>Guardar</Btn></div></div></Modal>
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.nombre}>
        {detail && (<div className="space-y-2">{[["Razón social",detail.razonSocial||"—"],["Cédula jurídica",detail.cedulaJuridica||"—"],["País",detail.pais||"—"],["Industria",detail.industria||"—"],["Tamaño",detail.tamano||"—"],["Sitio web",detail.sitioWeb||"—"],["Provincia",detail.provincia||"—"],["Cantón",detail.canton||"—"],["Distrito",detail.distrito||"—"],["Dirección",detail.direccionDetalle||"—"]].map(([k,v]) => (<div key={k} className="flex justify-between py-1.5 border-b border-slate-700/30"><span className="text-xs text-slate-500">{k}</span><span className="text-sm text-white text-right max-w-[60%]">{v}</span></div>))}{detail.notas && <div className="bg-slate-800/40 rounded-lg p-3 mt-2"><p className="text-xs text-slate-400">{detail.notas}</p></div>}<div className="flex justify-between pt-3"><Btn variant="danger" size="sm" onClick={() => handleDelete(detail)}>Eliminar</Btn><div className="flex gap-2"><Btn variant="ghost" size="sm" onClick={() => { setContactoModal(detail.id); setDetail(null); }}>Contactos</Btn><Btn size="sm" onClick={() => openEdit(detail)}>✏️ Editar</Btn></div></div></div>)}
      </Modal>
      <Modal open={!!contactoModal} onClose={() => setContactoModal(null)} title={`Contactos — ${clientes.find(cl => cl.id === contactoModal)?.nombre}`}>
        <div className="space-y-4">
          <div className="space-y-2">{contactosPorCliente(contactoModal).length === 0 ? <p className="text-slate-500 text-sm text-center py-4">Sin contactos registrados</p> : contactosPorCliente(contactoModal).map(ct => (<div key={ct.id} className="bg-slate-800/40 rounded-lg p-3 flex items-start justify-between"><div><p className="text-sm font-medium text-white">{ct.nombre}</p><p className="text-xs text-slate-400">{ct.cargo}</p><div className="flex gap-3 mt-1">{ct.email && <a href={`mailto:${ct.email}`} className="text-xs text-blue-400 hover:underline">{ct.email}</a>}{ct.telefono && <span className="text-xs text-slate-400">{ct.telefono}</span>}</div></div><button onClick={() => handleDeleteContacto(ct.id)} className="text-red-400 hover:text-red-300 text-xs ml-3">✕</button></div>))}</div>
          <div className="border-t border-slate-700/50 pt-3 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase">Agregar contacto</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input label="Nombre *" value={contactoForm.nombre} onChange={e => setContactoForm(f => ({ ...f, nombre: e.target.value }))} />
              <Input label="Cargo" value={contactoForm.cargo} onChange={e => setContactoForm(f => ({ ...f, cargo: e.target.value }))} />
              <Input label="Email" value={contactoForm.email} onChange={e => setContactoForm(f => ({ ...f, email: e.target.value }))} />
              <Input label="Teléfono" value={contactoForm.telefono} onChange={e => setContactoForm(f => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div className="flex justify-end"><Btn size="sm" onClick={handleAddContacto}>+ Agregar</Btn></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}


// ─── MÓDULO: CONTACTOS ───────────────────────────────────────────────────────

function validarEmail(v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function validarTel(v) { return !v || /^[+\d\s\-()]{6,20}$/.test(v); }

const CONTACTO_EMPTY = { nombre: "", cargo: "", email: "", telefono: "", clienteId: "" };

function ModuloContactos({ contactos, setContactos, clientes }) {
  const [search, setSearch] = useState("");
  const [clienteFilter, setClienteFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState(CONTACTO_EMPTY);
  const [editForm, setEditForm] = useState(CONTACTO_EMPTY);
  const [formErrors, setFormErrors] = useState({});

  const filtered = contactos.filter(ct =>
    (clienteFilter === "" || String(ct.clienteId) === String(clienteFilter)) &&
    (ct.nombre.toLowerCase().includes(search.toLowerCase()) ||
     (ct.email||"").toLowerCase().includes(search.toLowerCase()) ||
     (ct.cargo||"").toLowerCase().includes(search.toLowerCase()))
  );

  const clienteNombre = (id) => clientes.find(c => String(c.id) === String(id))?.nombre || "—";

  const validate = (f) => {
    const errs = {};
    if (!f.nombre.trim()) errs.nombre = "Requerido";
    if (!f.clienteId) errs.clienteId = "Requerido";
    if (!validarEmail(f.email)) errs.email = "Email inválido";
    if (!validarTel(f.telefono)) errs.telefono = "Formato inválido (ej: +506 8888-8888)";
    return errs;
  };

  const handleAdd = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    const res = await fetch("/api/contactos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const saved = await res.json();
    if (saved.error) { alert(saved.error); return; }
    setContactos(p => [...p, saved]);
    setModal(false); setForm(CONTACTO_EMPTY); setFormErrors({});
  };

  const handleEdit = async () => {
    const errs = validate(editForm);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    const res = await fetch("/api/contactos", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editModal.id, ...editForm }) });
    const saved = await res.json();
    if (saved.error) { alert(saved.error); return; }
    setContactos(p => p.map(c => c.id === editModal.id ? saved : c));
    setEditModal(null); setFormErrors({});
  };

  const handleDelete = async (ct) => {
    if (!confirm(`¿Eliminar contacto "${ct.nombre}"?`)) return;
    await fetch("/api/contactos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ct.id }) });
    setContactos(p => p.filter(x => x.id !== ct.id));
  };

  const ErrMsg = ({ field }) => formErrors[field] ? <p className="text-xs text-red-400 mt-0.5">{formErrors[field]}</p> : null;

  const ContactoForm = ({ f, setF }) => (
    <div className="space-y-3">
      <Select label="Cliente *" value={f.clienteId} onChange={e => { setF(x => ({ ...x, clienteId: e.target.value })); setFormErrors(er => ({ ...er, clienteId: "" })); }}
        options={[{ value: "", label: "Seleccionar cliente..." }, ...clientes.filter(c => c.estado === "Activo").map(c => ({ value: String(c.id), label: c.nombre }))]} />
      <ErrMsg field="clienteId" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Input label="Nombre completo *" value={f.nombre} onChange={e => { setF(x => ({ ...x, nombre: e.target.value })); setFormErrors(er => ({ ...er, nombre: "" })); }} />
          <ErrMsg field="nombre" />
        </div>
        <Input label="Cargo / Puesto" value={f.cargo} onChange={e => setF(x => ({ ...x, cargo: e.target.value }))} placeholder="Gerente de TI" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Input label="Email" value={f.email} onChange={e => { setF(x => ({ ...x, email: e.target.value })); setFormErrors(er => ({ ...er, email: "" })); }} placeholder="nombre@empresa.com" />
          <ErrMsg field="email" />
        </div>
        <div>
          <Input label="Teléfono" value={f.telefono} onChange={e => { const v = e.target.value.replace(/[^+\d\s\-()\-]/g,""); setF(x => ({ ...x, telefono: v })); setFormErrors(er => ({ ...er, telefono: "" })); }} placeholder="+506 8888-8888" />
          <ErrMsg field="telefono" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KPI title="Total contactos" value={contactos.length} color="blue" />
        <KPI title="Clientes cubiertos" value={new Set(contactos.map(c => c.clienteId)).size} color="green" />
        <KPI title="Sin contacto" value={clientes.filter(c => !contactos.find(ct => String(ct.clienteId) === String(c.id))).length} color="amber" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, email, cargo..." className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56" />
        <select value={clienteFilter} onChange={e => setClienteFilter(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
          <option value="">Todos los clientes</option>
          {clientes.filter(c => c.estado === "Activo").map(c => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
        </select>
        <Btn size="sm" onClick={() => { setForm(CONTACTO_EMPTY); setFormErrors({}); setModal(true); }} className="ml-auto">+ Nuevo contacto</Btn>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-slate-800/80"><tr>{["Nombre","Cargo","Cliente","Email","Teléfono",""].map(h => <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(ct => (
              <tr key={ct.id} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                <td className="px-3 py-3 text-white font-medium">{ct.nombre}</td>
                <td className="px-3 py-3 text-slate-400 text-xs">{ct.cargo || "—"}</td>
                <td className="px-3 py-3 whitespace-nowrap"><Pill label={clienteNombre(ct.clienteId)} color="blue" /></td>
                <td className="px-3 py-3 text-xs">{ct.email ? <a href={`mailto:${ct.email}`} className="text-blue-400 hover:underline">{ct.email}</a> : <span className="text-slate-500">—</span>}</td>
                <td className="px-3 py-3 text-slate-300 text-xs font-mono">{ct.telefono || "—"}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex gap-1">
                    <Btn variant="ghost" size="sm" onClick={() => { setEditForm({ nombre: ct.nombre, cargo: ct.cargo||"", email: ct.email||"", telefono: ct.telefono||"", clienteId: String(ct.clienteId) }); setFormErrors({}); setEditModal(ct); }}>✏️</Btn>
                    <Btn variant="danger" size="sm" onClick={() => handleDelete(ct)}>🗑</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">No se encontraron contactos</p>}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo contacto">
        <ContactoForm f={form} setF={setForm} />
        <div className="flex justify-end gap-2 pt-4"><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn onClick={handleAdd}>Guardar</Btn></div>
      </Modal>
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Editar — ${editModal?.nombre}`}>
        <ContactoForm f={editForm} setF={setEditForm} />
        <div className="flex justify-between pt-4">
          <Btn variant="danger" onClick={() => { handleDelete(editModal); setEditModal(null); }}>Eliminar</Btn>
          <div className="flex gap-2"><Btn variant="ghost" onClick={() => setEditModal(null)}>Cancelar</Btn><Btn onClick={handleEdit}>Guardar</Btn></div>
        </div>
      </Modal>
    </div>
  );
}

// ─── MÓDULO: CONTRATOS ────────────────────────────────────────────────────────

const CONTRATO_EMPTY = {
  numero: "", clienteId: "", nombre: "", descripcion: "",
  tipo: "Soporte Evolutivo", estado: "Activo",
  fechaFirma: "", fechaInicio: "", cantidadMeses: 12, fechaVencimiento: "", fechaRenovacion: "",
  urlContrato: "", tribu: "Dunamis", formaPago: "Transferencia",
  moneda: "USD", montoContrato: 0, nombreFacturar: "",
  facturaExtranjera: false, aplicaIVA: false, porcentajeIVA: 13,
  gerenteCuenta: "", notas: "",
};

function calcFechas(fechaInicio, meses) {
  if (!fechaInicio || !meses) return { fechaVencimiento: "", fechaRenovacion: "" };
  const inicio = new Date(fechaInicio);
  const venc = new Date(inicio);
  venc.setMonth(venc.getMonth() + Number(meses));
  const renov = new Date(venc);
  renov.setDate(renov.getDate() - 45); // 1.5 meses antes
  const fmt = d => d.toISOString().substring(0, 10);
  return { fechaVencimiento: fmt(venc), fechaRenovacion: fmt(renov) };
}

function ModuloContratos({ contratos, setContratos, clientes, colaboradores, maestros }) {
  const FORMAS_PAGO = maestros?.formasPago?.length ? maestros.formasPago : ["Transferencia","Cheque","Tarjeta","SINPE","Otro"];
  const MONEDAS = ["USD","CRC","EUR"];
  const TIPOS_CONTRATO = ["Proyecto","Licencias Oracle","Licencias Salesforce","Licencias XumTech","Licencias Terceros","Soporte Crítico","Soporte Evolutivo","Soporte Evolutivo + Crítico","Talento Dedicado"];
  const ESTADOS = ["Activo","Inactivo","En revisión","Vencido","Cancelado"];

  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("Activo");
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [form, setForm] = useState({ ...CONTRATO_EMPTY, numero: `CN-${String(Date.now()).slice(-5)}` });
  const [editForm, setEditForm] = useState(CONTRATO_EMPTY);

  const gerentes = colaboradores.filter(c => c.status === "Activo").map(c => c.name).sort();
  const clienteNombre = (id) => clientes.find(c => String(c.id) === String(id))?.nombre || "—";

  const updateFechas = (f, setF, field, val) => {
    const next = { ...f, [field]: val };
    if (field === "fechaInicio" || field === "cantidadMeses") {
      const { fechaVencimiento, fechaRenovacion } = calcFechas(next.fechaInicio, next.cantidadMeses);
      next.fechaVencimiento = fechaVencimiento;
      next.fechaRenovacion = fechaRenovacion;
    }
    setF(next);
  };

  const filtered = contratos.filter(c =>
    (estadoFilter === "Todos" || c.estado === estadoFilter) &&
    ((c.numero||"").toLowerCase().includes(search.toLowerCase()) ||
     (c.nombre||"").toLowerCase().includes(search.toLowerCase()) ||
     clienteNombre(c.clienteId).toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = async () => {
    if (!form.clienteId) { alert("Selecciona un cliente"); return; }
    const res = await fetch("/api/contratos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const saved = await res.json();
    if (saved.error) { alert(saved.error); return; }
    setContratos(p => [...p, saved]);
    setModal(false);
    setForm({ ...CONTRATO_EMPTY, numero: `CN-${String(Date.now()).slice(-5)}` });
  };

  const handleEdit = async () => {
    const res = await fetch("/api/contratos", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editModal.id, ...editForm }) });
    const saved = await res.json();
    if (saved.error) { alert(saved.error); return; }
    setContratos(p => p.map(c => c.id === editModal.id ? saved : c));
    setEditModal(null);
  };

  const handleDelete = async (c) => {
    if (!confirm(`¿Eliminar contrato "${c.numero}"?`)) return;
    await fetch("/api/contratos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id }) });
    setContratos(p => p.filter(x => x.id !== c.id));
    setDetailModal(null); setEditModal(null);
  };

  const openEdit = (c) => {
    setEditForm({ numero: c.numero, clienteId: String(c.clienteId||""), nombre: c.nombre||"", descripcion: c.descripcion||"", tipo: c.tipo||"Soporte Evolutivo", estado: c.estado||"Activo", fechaFirma: c.fechaFirma||"", fechaInicio: c.fechaInicio||"", cantidadMeses: c.cantidadMeses||12, fechaVencimiento: c.fechaVencimiento||"", fechaRenovacion: c.fechaRenovacion||"", urlContrato: c.urlContrato||"", tribu: c.tribu||"Dunamis", formaPago: c.formaPago||"Transferencia", moneda: c.moneda||"USD", montoContrato: c.montoContrato||0, nombreFacturar: c.nombreFacturar||"", facturaExtranjera: !!c.facturaExtranjera, aplicaIVA: !!c.aplicaIVA, porcentajeIVA: c.porcentajeIVA||13, gerenteCuenta: c.gerenteCuenta||"", notas: c.notas||"" });
    setEditModal(c); setDetailModal(null);
  };

  const VigTag = ({ fecha }) => {
    if (!fecha) return <span className="text-slate-500 text-xs">—</span>;
    try {
      const dias = Math.ceil((new Date(fecha) - new Date()) / 86400000);
      const color = dias < 0 ? "text-red-400" : dias <= 60 ? "text-amber-400" : "text-emerald-400";
      return <span className={`text-xs font-mono font-semibold ${color}`}>{dias < 0 ? `Venció ${Math.abs(dias)}d` : dias <= 30 ? `${dias}d ⚠` : fecha}</span>;
    } catch { return <span className="text-slate-500 text-xs">{fecha}</span>; }
  };

  const ContratoForm = ({ f, setF }) => (
    <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="N° Contrato *" value={f.numero} onChange={e => setF(x => ({ ...x, numero: e.target.value }))} placeholder="CN-XXXXX" />
        <Select label="Cliente *" value={f.clienteId} onChange={e => setF(x => ({ ...x, clienteId: e.target.value }))} options={[{ value: "", label: "Seleccionar cliente..." }, ...clientes.filter(c => c.estado === "Activo").map(c => ({ value: String(c.id), label: c.nombre }))]} />
      </div>
      <Input label="Nombre del contrato" value={f.nombre} onChange={e => setF(x => ({ ...x, nombre: e.target.value }))} placeholder="Ej: Contrato Soporte Oracle 2026" />
      <div><label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Descripción</label><textarea value={f.descripcion} onChange={e => setF(x => ({ ...x, descripcion: e.target.value }))} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Tipo contrato" value={f.tipo} onChange={e => setF(x => ({ ...x, tipo: e.target.value }))} options={TIPOS_CONTRATO} />
        <Select label="Estado" value={f.estado} onChange={e => setF(x => ({ ...x, estado: e.target.value }))} options={ESTADOS} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input label="Fecha de firma" type="date" value={f.fechaFirma} onChange={e => setF(x => ({ ...x, fechaFirma: e.target.value }))} />
        <Input label="Fecha de inicio" type="date" value={f.fechaInicio} onChange={e => updateFechas(f, setF, "fechaInicio", e.target.value)} />
        <Input label="Cantidad de meses" type="number" value={f.cantidadMeses} onChange={e => updateFechas(f, setF, "cantidadMeses", e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Input label="Fecha vencimiento (auto)" value={f.fechaVencimiento} onChange={e => setF(x => ({ ...x, fechaVencimiento: e.target.value }))} /><p className="text-xs text-slate-500 mt-0.5">Calculada automáticamente</p></div>
        <div><Input label="Fecha renovación (auto)" value={f.fechaRenovacion} onChange={e => setF(x => ({ ...x, fechaRenovacion: e.target.value }))} /><p className="text-xs text-slate-500 mt-0.5">45 días antes del vencimiento</p></div>
      </div>
      <Input label="URL del contrato" value={f.urlContrato} onChange={e => setF(x => ({ ...x, urlContrato: e.target.value }))} placeholder="https://drive.google.com/..." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Tribu asignada" value={f.tribu} onChange={e => setF(x => ({ ...x, tribu: e.target.value }))} options={TRIBUS_DEFAULT} />
        <Select label="Gerente de cuenta" value={f.gerenteCuenta} onChange={e => setF(x => ({ ...x, gerenteCuenta: e.target.value }))} options={[{ value: "", label: "Seleccionar..." }, ...gerentes.map(g => ({ value: g, label: g }))]} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select label="Forma de pago" value={f.formaPago} onChange={e => setF(x => ({ ...x, formaPago: e.target.value }))} options={FORMAS_PAGO} />
        <Select label="Moneda" value={f.moneda} onChange={e => setF(x => ({ ...x, moneda: e.target.value }))} options={MONEDAS} />
        <Input label="Monto contrato" type="number" value={f.montoContrato} onChange={e => setF(x => ({ ...x, montoContrato: Number(e.target.value) }))} />
      </div>
      <div className="border border-slate-700/50 rounded-xl p-3 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase">Facturación</p>
        <Input label="Nombre a facturar" value={f.nombreFacturar} onChange={e => setF(x => ({ ...x, nombreFacturar: e.target.value }))} placeholder="Razón social del cliente" />
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer"><input type="checkbox" checked={f.facturaExtranjera} onChange={e => setF(x => ({ ...x, facturaExtranjera: e.target.checked }))} className="w-4 h-4 accent-blue-500" />Factura extranjera</label>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer"><input type="checkbox" checked={f.aplicaIVA} onChange={e => setF(x => ({ ...x, aplicaIVA: e.target.checked }))} className="w-4 h-4 accent-blue-500" />Aplica IVA</label>
          {f.aplicaIVA && <Input label="% IVA" type="number" value={f.porcentajeIVA} onChange={e => setF(x => ({ ...x, porcentajeIVA: Number(e.target.value) }))} />}
        </div>
      </div>
    </div>
  );

  const totalMRR = contratos.filter(c => c.estado === "Activo" && c.moneda === "USD").reduce((s, c) => s + (c.montoContrato || 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI title="Activos" value={contratos.filter(c => c.estado === "Activo").length} color="blue" />
        <KPI title="MRC USD" value={`$${totalMRR.toLocaleString()}`} color="green" />
        <KPI title="Por renovar 60d" value={contratos.filter(c => { try { if (!c.fechaRenovacion) return false; const d = Math.ceil((new Date(c.fechaRenovacion) - new Date()) / 86400000); return d >= 0 && d <= 60; } catch { return false; } }).length} color="amber" />
        <KPI title="Vencidos" value={contratos.filter(c => { try { return c.fechaVencimiento && new Date(c.fechaVencimiento) < new Date() && c.estado === "Activo"; } catch { return false; } }).length} color="red" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por N°, nombre o cliente..." className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56" />
        <div className="flex flex-wrap gap-1">{["Activo","Inactivo","En revisión","Vencido","Todos"].map(e => <button key={e} onClick={() => setEstadoFilter(e)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${estadoFilter === e ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"}`}>{e}</button>)}</div>
        <Btn size="sm" onClick={() => setModal(true)} className="ml-auto">+ Nuevo contrato</Btn>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-slate-800/80"><tr>{["N° Contrato","Nombre","Cliente","Tipo","Tribu","Monto","Vencimiento","Renovación","Estado",""].map(h => <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className={`border-t border-slate-700/30 hover:bg-slate-800/20 ${c.estado === "Inactivo" ? "opacity-50" : ""}`}>
                <td className="px-3 py-3"><button onClick={() => setDetailModal(c)} className="text-blue-400 font-mono text-xs hover:underline font-bold">{c.numero}</button></td>
                <td className="px-3 py-3"><button onClick={() => setDetailModal(c)} className="text-white font-medium hover:text-blue-300 text-left max-w-[160px] truncate block">{c.nombre || "—"}</button></td>
                <td className="px-3 py-3 text-slate-300 text-xs">{clienteNombre(c.clienteId)}</td>
                <td className="px-3 py-3 whitespace-nowrap"><Badge color="blue">{c.tipo}</Badge></td>
                <td className="px-3 py-3 whitespace-nowrap"><Pill label={c.tribu} color={c.tribu} /></td>
                <td className="px-3 py-3 text-emerald-400 font-mono text-xs font-bold whitespace-nowrap">{c.moneda} {(c.montoContrato||0).toLocaleString()}</td>
                <td className="px-3 py-3 whitespace-nowrap"><VigTag fecha={c.fechaVencimiento} /></td>
                <td className="px-3 py-3 whitespace-nowrap"><VigTag fecha={c.fechaRenovacion} /></td>
                <td className="px-3 py-3 whitespace-nowrap"><Badge color={c.estado === "Activo" ? "green" : c.estado === "Vencido" ? "red" : c.estado === "En revisión" ? "amber" : "gray"}>{c.estado}</Badge></td>
                <td className="px-3 py-3 whitespace-nowrap"><div className="flex gap-1"><Btn variant="ghost" size="sm" onClick={() => openEdit(c)}>✏️</Btn><Btn variant="danger" size="sm" onClick={() => handleDelete(c)}>🗑</Btn></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">No se encontraron contratos</p>}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo contrato">
        <ContratoForm f={form} setF={setForm} />
        <div className="flex justify-end gap-2 pt-4"><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn onClick={handleAdd}>Guardar</Btn></div>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Editar — ${editModal?.numero}`}>
        <ContratoForm f={editForm} setF={setEditForm} />
        <div className="flex justify-between pt-4"><Btn variant="danger" onClick={() => handleDelete(editModal)}>Eliminar</Btn><div className="flex gap-2"><Btn variant="ghost" onClick={() => setEditModal(null)}>Cancelar</Btn><Btn onClick={handleEdit}>Guardar</Btn></div></div>
      </Modal>

      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={`${detailModal?.numero} — ${detailModal?.nombre || ""}`}>
        {detailModal && (
          <div className="space-y-1.5 max-h-[65vh] overflow-y-auto">
            {[
              ["Cliente", clienteNombre(detailModal.clienteId)],
              ["Tipo", detailModal.tipo],
              ["Estado", detailModal.estado],
              ["Tribu", detailModal.tribu],
              ["Gerente de cuenta", detailModal.gerenteCuenta||"—"],
              ["Fecha firma", detailModal.fechaFirma||"—"],
              ["Fecha inicio", detailModal.fechaInicio||"—"],
              ["Meses", detailModal.cantidadMeses],
              ["Vencimiento", detailModal.fechaVencimiento||"—"],
              ["Renovación", detailModal.fechaRenovacion||"—"],
              ["Moneda", detailModal.moneda],
              ["Monto", `${detailModal.moneda} ${(detailModal.montoContrato||0).toLocaleString()}`],
              ["Forma de pago", detailModal.formaPago||"—"],
              ["Nombre facturar", detailModal.nombreFacturar||"—"],
              ["Factura extranjera", detailModal.facturaExtranjera?"Sí":"No"],
              ["Aplica IVA", detailModal.aplicaIVA ? `Sí (${detailModal.porcentajeIVA}%)` : "No"],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-slate-700/30">
                <span className="text-xs text-slate-500">{k}</span>
                <span className="text-sm text-white">{v}</span>
              </div>
            ))}
            {detailModal.urlContrato && <div className="py-2"><a href={detailModal.urlContrato} target="_blank" rel="noreferrer" className="text-blue-400 text-xs hover:underline">📎 Ver documento del contrato</a></div>}
            {detailModal.descripcion && <div className="bg-slate-800/40 rounded-lg p-3 mt-1"><p className="text-xs text-slate-400">{detailModal.descripcion}</p></div>}
            <div className="flex justify-end pt-3"><Btn size="sm" onClick={() => openEdit(detailModal)}>✏️ Editar</Btn></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── TAB MAESTROS (dentro de Parámetros) ─────────────────────────────────────

function TabMaestros({ maestros, setMaestros }) {
  const [tab, setTab] = useState("paises");
  const [nuevoItem, setNuevoItem] = useState("");

  const listas = {
    paises:        { label: "Países" },
    industrias:    { label: "Industrias" },
    tiposContrato: { label: "Tipos de contrato" },
    formasPago:    { label: "Formas de pago" },
  };
  const defaults = { paises: PAISES_DEFAULT, industrias: INDUSTRIAS_DEFAULT, tiposContrato: TIPOS_CONTRATO_DEFAULT, formasPago: ["Transferencia","Cheque","Tarjeta","SINPE","Otro"] };
  const current = maestros[tab]?.length ? maestros[tab] : defaults[tab];

  const save = async (updated) => {
    await fetch("/api/maestros", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: tab, valores: updated }) });
    setMaestros(m => ({ ...m, [tab]: updated }));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-slate-700/50 overflow-x-auto">
        {Object.entries(listas).map(([key, { label }]) => (
          <button key={key} onClick={() => { setTab(key); setNuevoItem(""); }}
            className={`px-4 py-2 text-xs font-medium whitespace-nowrap rounded-t-lg transition-colors ${tab === key ? "bg-slate-800 text-white border border-slate-700/50" : "text-slate-400 hover:text-slate-300"}`}>
            {label} <span className="ml-1 text-slate-500">({(maestros[key]?.length || defaults[key].length)})</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={nuevoItem} onChange={e => setNuevoItem(e.target.value)} onKeyDown={e => e.key === "Enter" && (save([...current, nuevoItem.trim()]), setNuevoItem(""))}
          placeholder={`Nuevo ${listas[tab].label.slice(0,-1).toLowerCase()}...`}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        <Btn size="sm" onClick={() => { if (nuevoItem.trim() && !current.includes(nuevoItem.trim())) save([...current, nuevoItem.trim()]); setNuevoItem(""); }}>+ Agregar</Btn>
      </div>
      <div className="space-y-1.5">
        {current.map((item, i) => (
          <div key={i} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2.5 border border-slate-700/30">
            <span className="text-sm text-white">{item}</span>
            <button onClick={() => save(current.filter(x => x !== item))} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10">✕ Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MÓDULO: CONFIGURACIÓN ───────────────────────────────────────────────────

function ModuloConfiguracion({ maestros, setMaestros, params, setParams, calendar, setCalendar, disponibilidad, setDisponibilidad, colaboradores, ausencias }) {
  const [tab, setTab] = useState("calendario");
  const TABS = [
    ["calendario",    "📅 Calendario"],
    ["parametros",    "⚙️ Parámetros"],
    ["disponibilidad","📊 Disponibilidad"],
    ["maestros",      "📋 Maestros"],
  ];
  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-slate-700/50 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${tab === id ? "bg-slate-800 text-white border border-slate-700/50" : "text-slate-400 hover:text-slate-300"}`}>
            {label}
          </button>
        ))}
      </div>
      <ModuloParametros
        calendar={calendar} setCalendar={setCalendar}
        disponibilidad={disponibilidad} setDisponibilidad={setDisponibilidad}
        colaboradores={colaboradores} ausencias={ausencias}
        params={params} setParams={setParams}
        maestros={maestros} setMaestros={setMaestros}
        activeTab={tab}
      />
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
  { id: "colaboradores", label: "Colaboradores",  icon: "👥", header: true },
  { id: "clientes",      label: "Clientes",       icon: "🏢", header: true },
  { id: "contactos",     label: "Contactos",      icon: "◎", sub: true },
  { id: "contratos",     label: "Contratos",      icon: "📄", sub: true },
  { id: "consultoria",   label: "Consultoría",    icon: "◈", header: true },
  { id: "proveedores",   label: "Proveedores",    icon: "🤝", sub: true },
  { id: "dashboard",     label: "Dashboard",      icon: "⬡", sub: true },
  { id: "servicios",     label: "Servicios",      icon: "◫", sub: true },
  { id: "utilizacion",   label: "Utilización",    icon: "◎", sub: true },
  { id: "asignaciones",  label: "Asignaciones",   icon: "◧", sub: true },
  { id: "forecast",      label: "Forecast",       icon: "↗", sub: true },
  { id: "simulador",     label: "Simulador",      icon: "⚡", sub: true },
  { id: "dunamis",       label: "Dunamis",        icon: "◈", sub: true, tribu: true },
  { id: "yarigai",       label: "Yarigai",        icon: "◈", sub: true, tribu: true },
  { id: "bulwak",        label: "Bulwak",         icon: "◈", sub: true, tribu: true },
  { id: "configuracion", label: "Configuración",  icon: "⚙", header: true },
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
    .xt-main { font-size: 13px; }
  }
  @media (max-width: 768px) {
    .xt-forecast-controls { flex-direction: column; align-items: flex-start !important; }
    .xt-modal-inner { max-width: 100% !important; margin: 0 8px !important; }
    .xt-action-bar { flex-wrap: wrap; gap: 8px !important; }
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
  const [clientes, setClientes] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [maestros, setMaestros] = useState({ paises: [], industrias: [], tiposContrato: [], formasPago: [] });
  const [proveedores, setProveedores] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/colaboradores").then(r => r.json()),
      fetch("/api/servicios").then(r => r.json()),
      fetch("/api/asignaciones").then(r => r.json()),
      fetch("/api/ausencias").then(r => r.json()),
      fetch("/api/calendar").then(r => r.json()),
      fetch("/api/params").then(r => r.json()),
      fetch("/api/disponibilidad").then(r => r.json()),
      fetch("/api/clientes").then(r => r.json()),
      fetch("/api/contactos").then(r => r.json()),
      fetch("/api/contratos").then(r => r.json()),
      fetch("/api/maestros").then(r => r.json()),
      fetch("/api/proveedores").then(r => r.json()),
    ]).then(([cols, servs, asigs, aus, cal, par, disp, clis, conts, contrs, maes, provs]) => {
      if (Array.isArray(cols) && cols.length > 0) setColaboradores(cols);
      if (Array.isArray(servs) && servs.length > 0) setServicios(servs);
      if (Array.isArray(asigs) && asigs.length > 0) setAsignaciones(asigs);
      if (Array.isArray(aus) && aus.length > 0) setAusencias(aus);
      if (Array.isArray(cal) && cal.length > 0) setCalendar(cal.filter(m => m.mes >= "2026-01"));
      if (par && !par.error) setParams({ ...PARAMS_SEED, ...par });
      if (Array.isArray(disp)) setDisponibilidad(disp);
      if (Array.isArray(clis)) setClientes(clis);
      if (Array.isArray(conts)) setContactos(conts);
      if (Array.isArray(contrs)) setContratos(contrs);
      if (maes && !maes.error) setMaestros(m => ({ ...m, ...maes }));
      if (Array.isArray(provs)) setProveedores(provs);
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

          {VIEWS.map(v => v.header ? (
            <div key={v.id} className="mt-3 first:mt-0">
              <button
                onClick={() => navigate(v.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all text-left ${view === v.id ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" : "text-slate-300 hover:text-white hover:bg-slate-800/60"}`}
              >
                <span className="text-base">{v.icon}</span>
                <span className="truncate">{v.label}</span>
              </button>
            </div>
          ) : (
            <button
              key={v.id}
              onClick={() => navigate(v.id)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 ml-3 rounded-lg text-xs font-medium transition-all text-left border-l-2 ${view === v.id ? "bg-blue-600/20 text-blue-400 border-blue-500" : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/40 border-slate-800"}`}
            >
              <span className="opacity-50 flex-shrink-0">└</span>
              <span className="truncate">{v.label}</span>
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
          {view === "configuracion"  && <ModuloConfiguracion maestros={maestros} setMaestros={setMaestros} params={params} setParams={setParams} calendar={calendar} setCalendar={setCalendar} disponibilidad={disponibilidad} setDisponibilidad={setDisponibilidad} colaboradores={colaboradores} ausencias={ausencias} />}
          {view === "consultoria"    && <ModuloDashboard colaboradores={colaboradores} servicios={servicios} calendar={calendar} disponibilidad={disponibilidad} ausencias={ausencias} alertas={alertas} onNavigate={navigate} params={params} />}
          {view === "dashboard"     && <ModuloDashboard colaboradores={colaboradores} servicios={servicios} calendar={calendar} disponibilidad={disponibilidad} ausencias={ausencias} alertas={alertas} onNavigate={navigate} params={params} />}
          {view === "utilizacion"   && <ModuloUtilizacion colaboradores={colaboradores} asignaciones={asignaciones} ausencias={ausencias} calendar={calendar} servicios={servicios} params={params} setParams={setParams} />}
          {view === "asignaciones"  && <ModuloAsignaciones asignaciones={asignaciones} setAsignaciones={setAsignaciones} colaboradores={colaboradores} servicios={servicios} ausencias={ausencias} calendar={calendar} params={params} />}
          {view === "forecast"      && <ModuloForecast servicios={servicios} colaboradores={colaboradores} disponibilidad={disponibilidad} ausencias={ausencias} calendar={calendar} params={params} />}
          {view === "simulador"     && <ModuloSimulador servicios={servicios} colaboradores={colaboradores} disponibilidad={disponibilidad} ausencias={ausencias} calendar={calendar} params={params} />}
          {view === "proveedores"   && <ModuloProveedores proveedores={proveedores} setProveedores={setProveedores} disponibilidad={disponibilidad} setDisponibilidad={setDisponibilidad} servicios={servicios} setServicios={setServicios} calendar={calendar} params={params} maestros={maestros} />}
          {view === "colaboradores" && <ModuloColaboradores colaboradores={colaboradores} setColaboradores={setColaboradores} ausencias={ausencias} setAusencias={setAusencias} calendar={calendar} params={params} maestros={maestros} />}
          {/* parametros merged into configuracion */}
          {view === "clientes"      && <ModuloClientes clientes={clientes} setClientes={setClientes} contactos={contactos} setContactos={setContactos} maestros={maestros} />}
          {view === "contactos"     && <ModuloContactos contactos={contactos} setContactos={setContactos} clientes={clientes} />}
          {view === "contratos"     && <ModuloContratos contratos={contratos} setContratos={setContratos} clientes={clientes} colaboradores={colaboradores} maestros={maestros} />}
          {view === "servicios"     && <ModuloServicios servicios={servicios} setServicios={setServicios} colaboradores={colaboradores} params={params} />}
          {view === "dunamis"       && <ModuloTribu tribu="Dunamis" servicios={servicios} asignaciones={asignaciones} calendar={calendar} disponibilidad={disponibilidad} ausencias={ausencias} colaboradores={colaboradores} params={params} />}
          {view === "yarigai"       && <ModuloTribu tribu="Yarigai" servicios={servicios} asignaciones={asignaciones} calendar={calendar} disponibilidad={disponibilidad} ausencias={ausencias} colaboradores={colaboradores} params={params} />}
          {view === "bulwak"        && <ModuloTribu tribu="Bulwak"  servicios={servicios} asignaciones={asignaciones} calendar={calendar} disponibilidad={disponibilidad} ausencias={ausencias} colaboradores={colaboradores} params={params} />}
        </div>
      </div>
    </div>
  );
}
