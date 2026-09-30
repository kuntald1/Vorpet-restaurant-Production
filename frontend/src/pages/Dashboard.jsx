import { useEffect, useState } from 'react';
import { companyAPI, usersAPI, foodMenuAPI, foodCategoryAPI, posOrderAPI } from '../services/api';
import { Spinner } from '../components/UI';
import { useApp } from '../context/useApp';

const P = {
  bg:      '#faf9ff',
  bg2:     '#f5f3ff',
  border:  '#e4d9fc',
  border2: '#d4c4f8',
  purple:  '#7c3aed',
  purple2: '#9f5fff',
  purpleL: '#ede9fe',
  text:    '#1e1433',
  text2:   '#6b4fa0',
  text3:   '#9880c4',
  white:   '#fff',
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ── Today's figures: two donut charts ─────────────────────────────────── */
const METHOD = {
  cash:          { label:'Cash',          color:'#16a34a' },
  upi:           { label:'UPI',           color:'#7c3aed' },
  card:          { label:'Card',          color:'#0891b2' },
  split:         { label:'Split',         color:'#d97706' },
  credit:        { label:'Credit',        color:'#dc2626' },
  complimentary: { label:'Complimentary', color:'#9ca3af' },
};
const STATUS = {
  draft:         { label:'Draft',      color:'#9ca3af' },
  kot_open:      { label:'KOT open',   color:'#f59e0b' },
  kot_inprocess: { label:'In kitchen', color:'#7c3aed' },
  ready:         { label:'Ready',      color:'#16a34a' },
  hold:          { label:'On hold',    color:'#0891b2' },
};

const money = (n) => {
  const v = Number(n) || 0;
  return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
};
const pad2 = (n) => String(n).padStart(2, '0');
const ymd  = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
// The server stores bill times as UTC without a zone marker; read them as UTC, compare in local time.
const localYmd = (s) => {
  if (!s) return '';
  let iso = String(s).replace(' ', 'T').replace(/\.\d+/, '');
  if (!/[zZ]|[+-]\d\d:?\d\d$/.test(iso)) iso += 'Z';
  const d = new Date(iso);
  return isNaN(d) ? '' : ymd(d);
};

function Donut({ slices, main, sub, label }) {
  const R = 64, W = 24, C = 2 * Math.PI * R;
  const total = slices.reduce((a, s) => a + s.value, 0);
  const shown = slices.filter(s => s.value > 0);
  let acc = 0;
  const mainSize = main.length > 9 ? 15 : main.length > 7 ? 18 : 22;
  return (
    <svg width="176" height="176" viewBox="0 0 176 176" role="img" aria-label={label} style={{ flexShrink:0 }}>
      <circle cx="88" cy="88" r={R} fill="none" stroke={P.purpleL} strokeWidth={W}/>
      {total > 0 && shown.map(s => {
        const len = (s.value / total) * C;
        const gap = shown.length > 1 ? 2 : 0;
        const dash = Math.max(len - gap, 0.5);
        const el = (
          <circle key={s.key} cx="88" cy="88" r={R} fill="none" stroke={s.color} strokeWidth={W}
            strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-acc} transform="rotate(-90 88 88)">
            <title>{`${s.label}: ${s.tip}`}</title>
          </circle>
        );
        acc += len;
        return el;
      })}
      <text x="88" y="90" textAnchor="middle" fontSize={mainSize} fontWeight="800" fill={P.text}>{main}</text>
      <text x="88" y="110" textAnchor="middle" fontSize="11" fill={P.text3}>{sub}</text>
    </svg>
  );
}

// one colour per branch, in a fixed order so a branch keeps its colour between refreshes
const BRANCH_COLORS = ['#7c3aed','#16a34a','#0891b2','#d97706','#dc2626','#db2777','#65a30d','#0d9488','#4f46e5','#ea580c'];

function Seg({ value, onChange, options }) {
  return (
    <div role="tablist" style={T.seg}>
      {options.map(o => (
        <button key={o.v} type="button" role="tab" aria-selected={value === o.v}
          onClick={() => onChange(o.v)} style={{ ...T.segBtn, ...(value === o.v ? T.segOn : null) }}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

function ChartCard({ title, note, toggle, slices, main, sub, label, unit, emptyText, loading, failed }) {
  return (
    <div style={T.card}>
      <div style={T.head}>
        <div>
          <div style={T.title}>{title}</div>
          <div style={T.note}>{note}</div>
        </div>
        {toggle}
      </div>
      <div style={T.body}>
        <Donut slices={slices} main={main} sub={sub} label={label}/>
        <div style={T.legend}>
          {failed ? <div style={T.empty}>Could not load these figures. They will retry shortly.</div>
           : loading ? <div style={T.empty}>Loading…</div>
           : slices.length === 0 ? <div style={T.empty}>{emptyText}</div>
           : slices.map(s => (
              <div key={s.key} style={T.row}>
                <span style={{ ...T.dot, background: s.color }}/>
                <span style={T.rowLabel} title={s.label}>{s.label}</span>
                <span style={T.rowCount}>{s.count} {s.count === 1 ? unit : unit + 's'}</span>
                <span style={T.rowAmt}>{money(s.amount)}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function BranchTable({ rows, totals }) {
  return (
    <div style={T.tCard}>
      <div style={T.head}>
        <div>
          <div style={T.title}>Branch-wise today</div>
          <div style={T.note}>Every branch under this company, including branches with no activity yet</div>
        </div>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={T.table}>
          <thead>
            <tr>
              <th scope="col" style={T.thL}>Branch</th>
              <th scope="col" style={T.th}>Bills</th>
              <th scope="col" style={T.th}>Billed</th>
              <th scope="col" style={T.th}>Running orders</th>
              <th scope="col" style={T.th}>Open amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={T.tdL}><span style={{ ...T.dot, background: r.color, display:'inline-block', marginRight:9, verticalAlign:'middle' }}/>{r.name}</td>
                <td style={T.td}>{r.bills}</td>
                <td style={{ ...T.td, fontWeight:600 }}>{money(r.billed)}</td>
                <td style={T.td}>{r.orders}</td>
                <td style={{ ...T.td, fontWeight:600 }}>{money(r.open)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={T.tfL}>Total</td>
              <td style={T.tf}>{totals.bills}</td>
              <td style={T.tf}>{money(totals.billed)}</td>
              <td style={T.tf}>{totals.orders}</td>
              <td style={T.tf}>{money(totals.open)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function TodayCharts({ company, companies }) {
  const [state, setState] = useState({ bills: [], orders: [], ready: false, failed: false });
  const [billView, setBillView] = useState('branch');
  const [ordView,  setOrdView]  = useState('branch');

  const cid      = company.company_unique_id;
  const kidObjs  = (companies || []).filter(c => Number(c.parant_company_unique_id) === Number(cid) && c.company_unique_id !== cid);
  const kidKey   = kidObjs.map(c => c.company_unique_id).join(',');
  const scope    = [company, ...kidObjs];            // this company + its branches
  const hasBranches = scope.length > 1;
  const nameOf = {}, colorOf = {};
  scope.forEach((c, i) => { nameOf[c.company_unique_id] = c.name; colorOf[c.company_unique_id] = BRANCH_COLORS[i % BRANCH_COLORS.length]; });

  useEffect(() => {
    let dead = false;
    const load = async () => {
      try {
        const ids  = [cid, ...(kidKey ? kidKey.split(',').map(Number) : [])];
        const now  = new Date();
        const from = ymd(new Date(now.getTime() - 86400000));
        const to   = ymd(new Date(now.getTime() + 86400000));
        // One day either side, then keep only bills whose LOCAL date is today (server dates are UTC).
        const [billsRes, ...orderRes] = await Promise.all([
          fetch(`/pos/bill/company/${cid}?from_date=${from}&to_date=${to}`).then(r => r.ok ? r.json() : Promise.reject(new Error('bills'))),
          ...ids.map(id => posOrderAPI.getRunning(id).catch(() => [])),
        ]);
        if (dead) return;
        const today = ymd(now);
        setState({
          bills:  (Array.isArray(billsRes) ? billsRes : []).filter(b => localYmd(b.created_at) === today),
          orders: orderRes.flat(),
          ready: true, failed: false,
        });
      } catch {
        if (!dead) setState(s => ({ ...s, ready: true, failed: true }));
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => { dead = true; clearInterval(t); };
  }, [cid, kidKey]);

  const { bills, orders } = state;
  const branchName  = (id, fallback) => nameOf[id] || fallback || `Company ${id}`;
  const branchColor = (id) => colorOf[id] || '#6b7280';

  // ---- billed today ----
  const byMethod = {}, byBillBranch = {};
  bills.forEach(b => {
    const amt = Number(b.total_payable) || 0;
    const m = b.payment_method || 'cash';
    const e = (byMethod[m] = byMethod[m] || { count: 0, amount: 0 });  e.count += 1; e.amount += amt;
    const k = b.company_unique_id;
    const f = (byBillBranch[k] = byBillBranch[k] || { count: 0, amount: 0, fb: b.company_name }); f.count += 1; f.amount += amt;
  });
  const methodSlices = Object.entries(byMethod)
    .map(([k, v]) => ({ key:k, label: METHOD[k]?.label || k, color: METHOD[k]?.color || '#6b7280',
                        value: v.amount, count: v.count, amount: v.amount, tip: `${money(v.amount)} · ${v.count}` }))
    .sort((a, b) => b.amount - a.amount);
  const branchBillSlices = Object.entries(byBillBranch)
    .map(([k, v]) => ({ key:'b'+k, label: branchName(Number(k), v.fb), color: branchColor(Number(k)),
                        value: v.amount, count: v.count, amount: v.amount, tip: `${money(v.amount)} · ${v.count}` }))
    .sort((a, b) => b.amount - a.amount);
  const billSlices = hasBranches && billView === 'branch' ? branchBillSlices : methodSlices;
  const billTotal  = bills.reduce((a, b) => a + (Number(b.total_payable) || 0), 0);

  // ---- running orders ----
  const byStatus = {}, byOrdBranch = {};
  orders.forEach(o => {
    const amt = Number(o.total_payable) || 0;
    const s = o.is_hold ? 'hold' : o.order_status;
    const e = (byStatus[s] = byStatus[s] || { count: 0, amount: 0 });  e.count += 1; e.amount += amt;
    const k = o.company_unique_id;
    const f = (byOrdBranch[k] = byOrdBranch[k] || { count: 0, amount: 0 }); f.count += 1; f.amount += amt;
  });
  const statusSlices = Object.entries(byStatus)
    .map(([k, v]) => ({ key:k, label: STATUS[k]?.label || k, color: STATUS[k]?.color || '#6b7280',
                        value: v.count, count: v.count, amount: v.amount, tip: `${v.count} · ${money(v.amount)}` }))
    .sort((a, b) => b.count - a.count);
  const branchOrdSlices = Object.entries(byOrdBranch)
    .map(([k, v]) => ({ key:'o'+k, label: branchName(Number(k)), color: branchColor(Number(k)),
                        value: v.count, count: v.count, amount: v.amount, tip: `${v.count} · ${money(v.amount)}` }))
    .sort((a, b) => b.count - a.count);
  const orderSlices = hasBranches && ordView === 'branch' ? branchOrdSlices : statusSlices;
  const orderTotal  = orders.reduce((a, o) => a + (Number(o.total_payable) || 0), 0);

  // ---- branch table (all branches, even with nothing today) ----
  const rows = scope.map(c => {
    const id = c.company_unique_id;
    return { id, name: c.name, color: branchColor(id),
             bills: byBillBranch[id]?.count || 0,  billed: byBillBranch[id]?.amount || 0,
             orders: byOrdBranch[id]?.count || 0,  open:   byOrdBranch[id]?.amount || 0 };
  }).sort((a, b) => b.billed - a.billed || b.orders - a.orders || a.name.localeCompare(b.name));
  const totals = rows.reduce((t, r) => ({ bills: t.bills + r.bills, billed: t.billed + r.billed, orders: t.orders + r.orders, open: t.open + r.open }),
                             { bills: 0, billed: 0, orders: 0, open: 0 });

  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' });
  const nBills = bills.length, nOrders = orders.length;

  return (
    <>
      <div style={T.grid}>
        <ChartCard
          title="Today's billing" note={dateLabel} unit="bill"
          toggle={hasBranches && <Seg value={billView} onChange={setBillView} options={[{ v:'branch', l:'Branch' }, { v:'method', l:'Payment' }]}/>}
          slices={billSlices} main={money(billTotal)} sub={`${nBills} ${nBills === 1 ? 'bill' : 'bills'}`}
          label={`Billed today: ${money(billTotal)} across ${nBills} bills`}
          emptyText="No bills generated yet today."
          loading={!state.ready} failed={state.failed}/>
        <ChartCard
          title="Running orders" note="updates every 30 seconds" unit="order"
          toggle={hasBranches && <Seg value={ordView} onChange={setOrdView} options={[{ v:'branch', l:'Branch' }, { v:'status', l:'Status' }]}/>}
          slices={orderSlices} main={String(nOrders)} sub={`${money(orderTotal)} open`}
          label={`${nOrders} running orders worth ${money(orderTotal)}`}
          emptyText="No running orders right now."
          loading={!state.ready} failed={state.failed}/>
      </div>
      {hasBranches && state.ready && !state.failed && (
        <div style={{ padding:'16px 32px 0' }}><BranchTable rows={rows} totals={totals}/></div>
      )}
    </>
  );
}

export default function Dashboard() {
  const { selectedCompany, user, allCompanies } = useApp();
  const [stats,     setStats]     = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const all = allCompanies?.length ? allCompanies : await companyAPI.getAll();

        // Filter companies based on role:
        // Super Admin → all companies
        // Admin       → own company + its children
        // Staff/User  → only their own company
        let visible = all;
        if (!user?.is_super_admin) {
          const ownId = user?.company_unique_id;
          visible = all.filter(c =>
            c.company_unique_id === ownId ||          // own company
            c.parant_company_unique_id === ownId       // children of own company
          );
        }
        setCompanies(visible);

        if (selectedCompany) {
          // Food menu/categories are stored under root parent company (rootCid pattern)
          const myParentId  = selectedCompany.parant_company_unique_id;
          const isChild     = !!myParentId && Number(myParentId) !== 0;
          const menuCid     = isChild ? myParentId : selectedCompany.company_unique_id;

          const [u, fm, fc] = await Promise.allSettled([
            usersAPI.getAll(selectedCompany.company_unique_id),
            foodMenuAPI.getAll(menuCid),
            foodCategoryAPI.getAll(menuCid),
          ]);
          setStats({
            users: u.status  === 'fulfilled' ? u.value.length  : 0,
            menus: fm.status === 'fulfilled' ? fm.value.length : 0,
            cats:  fc.status === 'fulfilled' ? fc.value.length : 0,
          });
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [selectedCompany, user, allCompanies]);

  if (loading) return <Spinner />;

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`;
  const role     = user?.is_super_admin ? 'Super Admin' : user?.is_admin ? 'Admin' : 'Staff';

  const STATS = [
    { label:'Total Companies', value: companies.length,    icon:'🏢', accent:'#7c3aed', light:'#f5f3ff', border:'#d4c4f8' },
    { label:'Users',           value: stats?.users ?? '—', icon:'👥', accent:'#0891b2', light:'#e0f7fa', border:'#a0dce8' },
    { label:'Menu Items',      value: stats?.menus ?? '—', icon:'🍽️', accent:'#d97706', light:'#fff8e6', border:'#f0d080' },
    { label:'Food Categories', value: stats?.cats  ?? '—', icon:'🗂️', accent:'#dc2626', light:'#fef2f2', border:'#f0a0a0' },
  ];

  return (
    <div style={D.page}>

      {/* ── WELCOME BANNER ── */}
      <div style={D.banner}>
        {/* Shine overlay */}
        <div style={D.bannerShine}/>
        <div style={D.bannerInner}>
          <div style={D.bannerLeft}>
            <div style={D.avatar}>{initials}</div>
            <div>
              <div style={D.greet}>{greeting()}, {user?.first_name}! 👋</div>
              <div style={D.subRow}>
                <span style={D.rolePill}>{role}</span>
                {user?.employment_type  && <span style={D.metaDot}>·</span>}
                {user?.employment_type  && <span style={D.metaTxt}>{user.employment_type.replace('-',' ')}</span>}
                {user?.shift_preference && <span style={D.metaDot}>·</span>}
                {user?.shift_preference && <span style={D.metaTxt}>{user.shift_preference} shift</span>}
              </div>
            </div>
          </div>
          <div style={D.bannerRight}>
            {user?.email        && <div style={D.infoRow}><span>📧</span><span>{user.email}</span></div>}
            {user?.phone_number && <div style={D.infoRow}><span>📞</span><span>{user.phone_number}</span></div>}
            {user?.salary       && <div style={D.infoRow}><span>💰</span><span>₹{user.salary.toLocaleString()}/mo</span></div>}
          </div>
        </div>
      </div>

      {/* ── TODAY: BILLING + RUNNING ORDERS ── */}
      {selectedCompany && <TodayCharts company={selectedCompany} companies={companies} />}

      {/* ── STAT CARDS ── */}
      <div style={D.statsGrid}>
        {STATS.map(s => (
          <div key={s.label} style={{ ...D.statCard, borderTopColor: s.accent }}>
            <div style={{ ...D.statIcon, background: s.light, border:`1px solid ${s.border}` }}>
              <span style={{ fontSize:22 }}>{s.icon}</span>
            </div>
            <div style={{ ...D.statVal, color: s.accent }}>{s.value}</div>
            <div style={D.statLbl}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── ACTIVE COMPANY ── */}
      {!selectedCompany ? (
        <div style={D.ctaBox}>
          <div style={D.ctaIcon}>🏢</div>
          <div style={D.ctaTitle}>Select a Company to Begin</div>
          <div style={D.ctaSub}>Go to <strong style={{ color: P.purple }}>Companies</strong> in the sidebar to choose an active company. All modules are scoped per company.</div>
        </div>
      ) : (
        <div style={D.compCard}>
          <div style={D.compHead}>
            <div style={D.compLogo}>{selectedCompany.name[0]}</div>
            <div style={{ flex:1 }}>
              <div style={D.compName}>{selectedCompany.name}</div>
              <div style={D.compMeta}>{selectedCompany.short_name} · {selectedCompany.country}</div>
            </div>
            <span style={D.activeBadge}>✓ Active Company</span>
          </div>
          <div style={D.compInfoGrid}>
            {selectedCompany.admin_email  && <div style={D.compInfo}><span>📧</span>{selectedCompany.admin_email}</div>}
            {selectedCompany.admin_phone  && <div style={D.compInfo}><span>📞</span>{selectedCompany.admin_phone_country_code}{selectedCompany.admin_phone}</div>}
            {selectedCompany.website      && <div style={D.compInfo}><span>🌐</span><a href={selectedCompany.website} target="_blank" rel="noreferrer" style={{ color: P.purple }}>{selectedCompany.website}</a></div>}
            {selectedCompany.address1     && <div style={D.compInfo}><span>📍</span>{selectedCompany.address1}</div>}
          </div>
        </div>
      )}

      {/* ── ALL COMPANIES ── */}
      <div style={D.section}>
        <div style={D.secHead}>
          <div style={D.secLine}/><span style={D.secTitle}>{user?.is_super_admin ? 'All Companies' : 'My Companies'}</span><div style={D.secLine}/>
        </div>
        <div style={D.compGrid}>
          {companies.map(c => (
            <div key={c.company_id} style={D.compMini}>
              <div style={D.miniLogo}>{c.name[0]}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={D.miniName}>{c.name}</div>
                <div style={D.miniMeta}>#{c.company_unique_id} · {c.country}</div>
              </div>
              <span style={D.activeBadgeSm}>Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const D = {
  page:       { display:'flex', flexDirection:'column', minHeight:'100%', background: P.bg, fontFamily:"'DM Sans',system-ui,sans-serif" },

  banner:     { position:'relative', overflow:'hidden', background:'linear-gradient(135deg,#7c3aed 0%,#9f5fff 60%,#c084fc 100%)', borderBottom:`1px solid ${P.border}` },
  bannerShine: { position:'absolute', top:0, left:0, right:0, height:'50%', background:'rgba(255,255,255,.07)', pointerEvents:'none' },
  bannerInner: { position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'26px 32px', gap:20, flexWrap:'wrap' },
  bannerLeft: { display:'flex', alignItems:'center', gap:16 },
  avatar:     { width:52, height:52, borderRadius:'50%', background:'rgba(255,255,255,.2)', border:'2px solid rgba(255,255,255,.4)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:16, fontWeight:700, flexShrink:0, boxShadow:'0 2px 12px rgba(0,0,0,.15)' },
  greet:      { color:'#fff', fontSize:18, fontWeight:700, marginBottom:6, textShadow:'0 1px 3px rgba(0,0,0,.15)' },
  subRow:     { display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' },
  rolePill:   { background:'rgba(255,255,255,.2)', border:'1px solid rgba(255,255,255,.3)', color:'#fff', fontSize:11, fontWeight:600, padding:'2px 10px', borderRadius:20 },
  metaDot:    { color:'rgba(255,255,255,.4)', fontSize:12 },
  metaTxt:    { fontSize:12, color:'rgba(255,255,255,.75)', textTransform:'capitalize' },
  bannerRight: { display:'flex', flexDirection:'column', gap:5 },
  infoRow:    { display:'flex', alignItems:'center', gap:8, fontSize:12, color:'rgba(255,255,255,.8)' },


  statsGrid:  { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, padding:'24px 32px' },
  statCard:   { background: P.white, border:`1px solid ${P.border}`, borderTop:'3px solid', borderRadius:12, padding:'18px 16px', display:'flex', flexDirection:'column', gap:8, boxShadow:'0 1px 4px rgba(124,58,237,.04)' },
  statIcon:   { width:44, height:44, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:4 },
  statVal:    { fontSize:30, fontWeight:900, lineHeight:1 },
  statLbl:    { fontSize:12, color: P.text3 },

  ctaBox:     { margin:'0 32px 24px', background: P.white, border:`1.5px dashed ${P.border}`, borderRadius:14, padding:'52px 32px', textAlign:'center' },
  ctaIcon:    { fontSize:44, marginBottom:14 },
  ctaTitle:   { fontSize:20, fontWeight:700, color: P.text, marginBottom:10 },
  ctaSub:     { fontSize:14, color: P.text2, lineHeight:1.7 },

  compCard:   { margin:'0 32px 24px', background: P.white, border:`1px solid ${P.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 8px rgba(124,58,237,.05)' },
  compHead:   { padding:'18px 22px', display:'flex', alignItems:'center', gap:14, background: P.bg2, borderBottom:`1px solid ${P.border}` },
  compLogo:   { width:46, height:46, borderRadius:12, background:'linear-gradient(135deg,#7c3aed,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:20, fontWeight:700, flexShrink:0, boxShadow:'0 4px 12px rgba(124,58,237,.25)' },
  compName:   { fontSize:16, fontWeight:700, color: P.text, marginBottom:3 },
  compMeta:   { fontSize:12, color: P.text3 },
  activeBadge: { background: P.purpleL, border:`1px solid ${P.border}`, color: P.purple, fontSize:12, fontWeight:700, padding:'5px 14px', borderRadius:20, flexShrink:0 },
  compInfoGrid: { padding:'16px 22px', display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px 24px', borderTop:`1px solid ${P.border}` },
  compInfo:   { display:'flex', alignItems:'center', gap:8, fontSize:13, color: P.text2 },

  section:    { padding:'0 32px 32px' },
  secHead:    { display:'flex', alignItems:'center', gap:12, marginBottom:16 },
  secLine:    { flex:1, height:1, background: P.border },
  secTitle:   { fontSize:11, fontWeight:700, color: P.text3, letterSpacing:'.08em', textTransform:'uppercase', flexShrink:0 },
  compGrid:   { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 },
  compMini:   { background: P.white, border:`1px solid ${P.border}`, borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 1px 3px rgba(124,58,237,.03)' },
  miniLogo:   { width:34, height:34, borderRadius:8, background:'linear-gradient(135deg,#7c3aed,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13, fontWeight:700, flexShrink:0 },
  miniName:   { fontSize:13, fontWeight:600, color: P.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  miniMeta:   { fontSize:11, color: P.text3, marginTop:1 },
  activeBadgeSm: { background: P.purpleL, border:`1px solid ${P.border}`, color: P.purple, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, flexShrink:0 },
};

const T = {
  grid:     { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(360px, 1fr))', gap:16, padding:'24px 32px 0' },
  card:     { background: P.white, border:`1px solid ${P.border}`, borderRadius:12, padding:'16px 20px 18px', boxShadow:'0 1px 4px rgba(124,58,237,.04)' },
  head:     { display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:10 },
  title:    { fontSize:15, fontWeight:700, color: P.text },
  note:     { fontSize:12, color: P.text3, marginTop:2 },
  body:     { display:'flex', alignItems:'center', gap:22, flexWrap:'wrap' },
  legend:   { flex:'1 1 200px', minWidth:0, display:'flex', flexDirection:'column', gap:9 },
  row:      { display:'flex', alignItems:'center', gap:8, fontSize:13, color: P.text },
  dot:      { width:10, height:10, borderRadius:3, flexShrink:0 },
  rowLabel: { flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  rowCount: { color: P.text3, fontSize:12, whiteSpace:'nowrap' },
  rowAmt:   { minWidth:68, textAlign:'right', fontWeight:600, whiteSpace:'nowrap' },
  empty:    { fontSize:13, color: P.text3, lineHeight:1.5 },
  seg:      { display:'inline-flex', background: P.bg2, border:`1px solid ${P.border}`, borderRadius:9, padding:2, flexShrink:0 },
  segBtn:   { border:'none', background:'transparent', color: P.text2, fontFamily:'inherit', fontSize:12, fontWeight:600, padding:'5px 12px', borderRadius:7, cursor:'pointer' },
  segOn:    { background: P.white, color: P.purple, boxShadow:'0 1px 3px rgba(124,58,237,.18)' },
  tCard:    { background: P.white, border:`1px solid ${P.border}`, borderRadius:12, padding:'16px 20px 8px', boxShadow:'0 1px 4px rgba(124,58,237,.04)' },
  table:    { width:'100%', borderCollapse:'collapse', fontSize:13, color: P.text, minWidth:520 },
  th:       { textAlign:'right', fontSize:11, fontWeight:700, color: P.text3, padding:'8px 10px', borderBottom:`1px solid ${P.border}`, whiteSpace:'nowrap' },
  thL:      { textAlign:'left',  fontSize:11, fontWeight:700, color: P.text3, padding:'8px 10px', borderBottom:`1px solid ${P.border}` },
  td:       { textAlign:'right', padding:'11px 10px', borderBottom:`1px solid ${P.border}`, whiteSpace:'nowrap' },
  tdL:      { textAlign:'left',  padding:'11px 10px', borderBottom:`1px solid ${P.border}`, fontWeight:600 },
  tf:       { textAlign:'right', padding:'11px 10px', fontWeight:800, whiteSpace:'nowrap' },
  tfL:      { textAlign:'left',  padding:'11px 10px', fontWeight:800 },
};
