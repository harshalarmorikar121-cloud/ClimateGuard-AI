import React, { useState } from 'react';

const ELDERLY_RISKS = [
  { icon: '🫀', factor: 'Cardiovascular Comorbidity', desc: 'Dengue-induced plasma leakage causes acute cardiovascular stress — 4× more fatal in 55+ patients with existing heart conditions.', severity: 'CRITICAL' },
  { icon: '🩸', factor: 'Immune System Decline', desc: 'Immunosenescence reduces T-cell response. Elderly patients take 3× longer to clear dengue viremia, prolonging severe disease phase.', severity: 'HIGH' },
  { icon: '💊', factor: 'Polypharmacy Interactions', desc: 'NSAIDs and anticoagulants (common in elderly) increase dengue hemorrhagic risk. Blood thinners elevate internal bleeding probability by 60%.', severity: 'CRITICAL' },
  { icon: '🧠', factor: 'Neurological Vulnerability', desc: 'Cerebral malaria complications 5× more frequent in 55+ patients due to blood-brain barrier deterioration.', severity: 'HIGH' },
  { icon: '🏥', factor: 'Delayed Symptom Recognition', desc: 'Dengue fever often masked by chronic pain conditions in elderly. Average diagnosis delay: 3.2 days vs 1.4 days in adults.', severity: 'HIGH' },
  { icon: '🌡️', factor: 'Thermoregulation Failure', desc: 'Reduced ability to manage fever spikes. Dengue fever >40°C causes organ stress 2× faster in 55+ population.', severity: 'MEDIUM' },
];

const INFANT_RISKS = [
  { icon: '🍼', factor: 'Immature Immune System', desc: 'Infants 0–4 lack adaptive immunity to dengue serotypes. First infection with any serotype can cause severe dengue — no prior immunity buffer.', severity: 'CRITICAL' },
  { icon: '💧', factor: 'Rapid Dehydration Risk', desc: 'Dengue-induced plasma leakage causes dehydration 3× faster in infants than adults. Shock can develop within 2–4 hours.', severity: 'CRITICAL' },
  { icon: '⚖️', factor: 'Low Body Weight', desc: 'IV fluid management is critical and difficult. Dosing errors in small infants can worsen dengue shock syndrome.', severity: 'HIGH' },
  { icon: '🤱', factor: 'Maternal Dengue Transmission', desc: 'Perinatal dengue transmission occurs in 30% of cases when mother is infected near delivery. Neonates face severe thrombocytopenia.', severity: 'CRITICAL' },
  { icon: '🦟', factor: 'Peak Aedes Activity Hours', desc: 'Young children (0–4) are most active during Aedes aegypti peak biting hours (dawn/dusk), increasing exposure risk by 45%.', severity: 'HIGH' },
  { icon: '🏨', factor: 'Limited Pediatric ICU Access', desc: 'In high-outbreak regions (Lagos, Manila), pediatric ICU beds are overwhelmed first — capacity exceeded 300% in 2024 dengue surge.', severity: 'HIGH' },
];

const CAREGIVER_WARNINGS = {
  elderly: [
    { symptom: 'High Fever (>38.5°C) for >2 days', action: 'Seek emergency care immediately — do NOT give NSAIDs (ibuprofen)', urgency: 'emergency' },
    { symptom: 'Sudden bleeding gums or red spots on skin', action: 'This is dengue hemorrhagic warning — call hospital, avoid aspirin', urgency: 'emergency' },
    { symptom: 'Severe abdominal pain + vomiting', action: 'Critical dengue warning sign — hospitalize within 2 hours', urgency: 'emergency' },
    { symptom: 'Confusion or disorientation with fever', action: 'May indicate cerebral malaria — call ambulance immediately', urgency: 'emergency' },
    { symptom: 'Cold extremities despite high fever', action: 'Dengue shock syndrome symptom — life-threatening emergency', urgency: 'emergency' },
    { symptom: 'Mild fever + joint/muscle aches', action: 'Rest, hydrate with ORS, monitor closely, visit clinic within 24h', urgency: 'urgent' },
  ],
  infant: [
    { symptom: 'Fever >38°C in 0–3 month infant', action: 'ALWAYS emergency — rush to pediatric emergency immediately', urgency: 'emergency' },
    { symptom: 'Refusing to feed / excessive crying', action: 'Dehydration risk high — pediatric assessment needed urgently', urgency: 'emergency' },
    { symptom: 'Bruising or petechiae (red dots) on skin', action: 'Platelet drop warning — pediatric hospitalization required', urgency: 'emergency' },
    { symptom: 'Rapid breathing + pale/bluish skin', action: 'Dengue shock — call ambulance, do not wait', urgency: 'emergency' },
    { symptom: 'Prolonged fever >3 days in 1–4 year child', action: 'Dengue/malaria testing mandatory — visit pediatric clinic', urgency: 'urgent' },
    { symptom: 'Lethargy, difficulty waking, limpness', action: 'Neurological warning — emergency care immediately', urgency: 'emergency' },
  ],
};

const PREVENTION_TIPS = {
  elderly: [
    { icon: '🦟', tip: 'Use mosquito repellent (DEET 20-30%) on all exposed skin, especially during outdoor walks at dawn/dusk' },
    { icon: '👕', tip: 'Wear long-sleeved, light-colored clothing — mosquitoes are attracted to dark colors and body heat' },
    { icon: '🛏️', tip: 'Sleep under permethrin-treated mosquito nets — especially important for those with mobility limitations' },
    { icon: '💊', tip: 'If taking blood thinners — inform doctor immediately if fever develops — dengue risk is multiplied' },
    { icon: '📋', tip: 'Get a CBC blood test if fever persists >2 days — early platelet monitoring is life-saving for 55+ patients' },
    { icon: '🏠', tip: 'Remove standing water from home surroundings — flowerpots, buckets, blocked gutters breed Aedes mosquitoes' },
  ],
  infant: [
    { icon: '🛏️', tip: 'Always use a mosquito net over cribs/cots — infants cannot communicate discomfort from bites' },
    { icon: '👶', tip: 'Apply baby-safe repellent (Picaridin) on clothing for children 2+ months; cover stroller with mesh' },
    { icon: '🌅', tip: 'Avoid outdoor activity during Aedes peak hours: 6–9 AM and 5–7 PM — this is when biting is highest' },
    { icon: '💧', tip: 'Keep your infant well-hydrated — dengue dehydration in infants progresses to shock in hours' },
    { icon: '🩺', tip: 'Any fever in infants <3 months = emergency visit — no "wait and watch" for this age group' },
    { icon: '📅', tip: 'During outbreak alerts, consider postponing outdoor events and playgroups for children <4 years' },
  ],
};

const REGIONAL_STATS = [
  { region: 'South/Southeast Asia', elderlyAtRisk: '4.2M', infantAtRisk: '1.8M', elderlyMortality: '12.4%', infantMortality: '8.1%', disease: 'Dengue' },
  { region: 'Sub-Saharan Africa', elderlyAtRisk: '3.1M', infantAtRisk: '6.2M', elderlyMortality: '9.8%', infantMortality: '15.3%', disease: 'Malaria' },
  { region: 'Latin America', elderlyAtRisk: '2.6M', infantAtRisk: '0.9M', elderlyMortality: '10.2%', infantMortality: '5.7%', disease: 'Dengue' },
  { region: 'Indian Subcontinent', elderlyAtRisk: '5.4M', infantAtRisk: '2.3M', elderlyMortality: '11.7%', infantMortality: '9.4%', disease: 'Dengue/Malaria' },
];

function SeverityTag({ level }) {
  const cfg = {
    CRITICAL: { color: '#ff3b5c', bg: 'rgba(255,59,92,0.15)', border: 'rgba(255,59,92,0.3)' },
    HIGH: { color: '#ff6b35', bg: 'rgba(255,107,53,0.15)', border: 'rgba(255,107,53,0.3)' },
    MEDIUM: { color: '#ffd700', bg: 'rgba(255,215,0,0.15)', border: 'rgba(255,215,0,0.3)' },
  };
  const c = cfg[level] || cfg.MEDIUM;
  return (
    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
      {level}
    </span>
  );
}

function UrgencyBadge({ level }) {
  const cfg = {
    emergency: { color: '#ff3b5c', bg: 'rgba(255,59,92,0.15)', label: '🚨 EMERGENCY', border: 'rgba(255,59,92,0.3)' },
    urgent: { color: '#ffd700', bg: 'rgba(255,215,0,0.1)', label: '⚠️ URGENT', border: 'rgba(255,215,0,0.3)' },
  };
  const c = cfg[level];
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, color: c.color, background: c.bg, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
}

export default function VulnerablePopulations() {
  const [activeGroup, setActiveGroup] = useState('elderly');
  const [activeTab, setActiveTab] = useState('risks');

  const risks = activeGroup === 'elderly' ? ELDERLY_RISKS : INFANT_RISKS;
  const warnings = CAREGIVER_WARNINGS[activeGroup];
  const prevention = PREVENTION_TIPS[activeGroup];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Group Selector */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
        padding: '1.5rem', borderRadius: '16px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Elderly Card */}
        <div
          onClick={() => setActiveGroup('elderly')}
          style={{
            padding: '1.5rem', borderRadius: '14px', cursor: 'pointer',
            background: activeGroup === 'elderly' ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.03)',
            border: `2px solid ${activeGroup === 'elderly' ? '#ff6b35' : 'rgba(255,255,255,0.08)'}`,
            transition: 'all 0.25s', textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>👴👵</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#ff6b35', marginBottom: '4px' }}>Seniors 55+</div>
          <div style={{ fontSize: '0.82rem', color: '#8fafc4', lineHeight: 1.5 }}>
            Elderly individuals face 3–5× higher dengue/malaria mortality due to comorbidities, immune decline, and delayed diagnosis.
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', background: 'rgba(255,107,53,0.2)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.3)', fontWeight: 700 }}>55–70 yrs: HIGH RISK</span>
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', background: 'rgba(255,59,92,0.2)', color: '#ff3b5c', border: '1px solid rgba(255,59,92,0.3)', fontWeight: 700 }}>70+ yrs: CRITICAL</span>
          </div>
        </div>

        {/* Infant Card */}
        <div
          onClick={() => setActiveGroup('infant')}
          style={{
            padding: '1.5rem', borderRadius: '14px', cursor: 'pointer',
            background: activeGroup === 'infant' ? 'rgba(0,136,255,0.12)' : 'rgba(255,255,255,0.03)',
            border: `2px solid ${activeGroup === 'infant' ? '#0088ff' : 'rgba(255,255,255,0.08)'}`,
            transition: 'all 0.25s', textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>👶🍼</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#0088ff', marginBottom: '4px' }}>Infants 0–4 Years</div>
          <div style={{ fontSize: '0.82rem', color: '#8fafc4', lineHeight: 1.5 }}>
            Newborns and young children have immature immune systems — dengue shock syndrome can develop within hours.
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', background: 'rgba(255,59,92,0.2)', color: '#ff3b5c', border: '1px solid rgba(255,59,92,0.3)', fontWeight: 700 }}>0–3 months: CRITICAL</span>
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', background: 'rgba(255,107,53,0.2)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.3)', fontWeight: 700 }}>1–4 years: HIGH RISK</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === 'risks' ? 'active' : ''}`} onClick={() => setActiveTab('risks')}>
          {activeGroup === 'elderly' ? '👴' : '👶'} Why Vulnerable?
        </button>
        <button className={`tab-btn ${activeTab === 'warnings' ? 'active' : ''}`} onClick={() => setActiveTab('warnings')}>
          🚨 Warning Signs
        </button>
        <button className={`tab-btn ${activeTab === 'prevention' ? 'active' : ''}`} onClick={() => setActiveTab('prevention')}>
          🛡️ Protection Guide
        </button>
        <button className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          📊 Regional Stats
        </button>
      </div>

      {/* Risks Tab */}
      {activeTab === 'risks' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {risks.map((r, i) => (
            <div key={i} className="card" style={{ padding: '1.2rem', borderLeft: `3px solid ${r.severity === 'CRITICAL' ? '#ff3b5c' : r.severity === 'HIGH' ? '#ff6b35' : '#ffd700'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.6rem' }}>{r.icon}</span>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#e8f4f8' }}>{r.factor}</div>
                </div>
                <SeverityTag level={r.severity} />
              </div>
              <div style={{ fontSize: '0.81rem', color: '#8fafc4', lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* Warnings Tab */}
      {activeTab === 'warnings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ff3b5c', marginBottom: '4px' }}>
              ⚠️ For Caregivers of {activeGroup === 'elderly' ? 'Elderly Patients (55+)' : 'Infants & Young Children (0–4 Years)'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8fafc4' }}>
              Act immediately on emergency signs. Do NOT wait to "see if it gets better." {activeGroup === 'elderly' ? 'For 55+ patients with comorbidities, dengue can deteriorate to critical within 24 hours.' : 'In infants, dengue shock syndrome can develop within 2–4 hours of symptom onset.'}
            </div>
          </div>
          {warnings.map((w, i) => (
            <div key={i} className="card" style={{
              padding: '1rem',
              borderLeft: `3px solid ${w.urgency === 'emergency' ? '#ff3b5c' : '#ffd700'}`,
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0 }}>
                  <UrgencyBadge level={w.urgency} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e8f4f8', marginBottom: '6px' }}>
                    {i + 1}. {w.symptom}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#8fafc4', lineHeight: 1.6 }}>
                    ➡️ {w.action}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Emergency Numbers */}
          <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(0,136,255,0.08)', border: '1px solid rgba(0,136,255,0.25)', marginTop: '0.5rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0088ff', marginBottom: '8px' }}>📞 Emergency Medical Contacts</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
              {[
                ['🇮🇳 India', 'AIIMS: 011-26588500', '108 Ambulance'],
                ['🇵🇭 Philippines', 'DOH Hotline: 1555', '911 Emergency'],
                ['🇧🇩 Bangladesh', 'DGHS: 16752', '999 Emergency'],
                ['🇳🇬 Nigeria', 'NCDC: 0800-9700-0010', '112 Emergency'],
              ].map(([country, line1, line2]) => (
                <div key={country} style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', fontSize: '0.78rem' }}>
                  <div style={{ fontWeight: 700, color: '#e8f4f8', marginBottom: '2px' }}>{country}</div>
                  <div style={{ color: '#00d4aa' }}>{line1}</div>
                  <div style={{ color: '#8fafc4' }}>{line2}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prevention Tab */}
      {activeTab === 'prevention' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {prevention.map((p, i) => (
              <div key={i} className="card" style={{ padding: '1.1rem', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{p.icon}</span>
                <div style={{ fontSize: '0.83rem', color: '#8fafc4', lineHeight: 1.65 }}>{p.tip}</div>
              </div>
            ))}
          </div>

          {/* Outbreak Alert Action Plan */}
          <div style={{ padding: '1.2rem', borderRadius: '12px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#00d4aa', marginBottom: '1rem' }}>
              📋 When ClimateGuard AI Issues a HIGH/CRITICAL Alert for Your Region
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {[
                ['Day 0', 'AI Alert Issued', '⚡', 'Subscribe to SMS/Email alerts for your district'],
                ['Day 1–3', 'Preventive Window', '🛡️', 'Deploy mosquito prevention measures, stock ORS'],
                ['Day 3–7', 'Preparation Phase', '🏥', 'Pre-register at nearby hospital, know nearest pediatric/geriatric ward'],
                ['Ongoing', 'Monitoring', '📡', 'Check ClimateGuard dashboard daily during outbreak season'],
              ].map(([phase, label, icon, action]) => (
                <div key={phase} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#4a6b80', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{phase}</div>
                  <div style={{ fontSize: '1.2rem', margin: '4px 0' }}>{icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#e8f4f8', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#8fafc4', lineHeight: 1.5 }}>{action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {REGIONAL_STATS.map((r, i) => (
              <div key={i} className="card" style={{ padding: '1.2rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e8f4f8', marginBottom: '4px' }}>📍 {r.region}</div>
                <div style={{ fontSize: '0.72rem', color: '#00d4aa', fontWeight: 600, marginBottom: '1rem' }}>Primary: {r.disease}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    ['👴 Seniors at Risk', r.elderlyAtRisk, '#ff6b35'],
                    ['👶 Infants at Risk', r.infantAtRisk, '#0088ff'],
                    ['💀 Elderly Mortality', r.elderlyMortality, '#ff3b5c'],
                    ['💀 Infant Mortality', r.infantMortality, '#ff3b5c'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: '#4a6b80', marginBottom: '3px', lineHeight: 1.3 }}>{label}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color, fontFamily: 'Outfit' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mortality Risk Multiplier Visual */}
          <div className="card" style={{ padding: '1.2rem' }}>
            <div className="chart-title" style={{ marginBottom: '1rem' }}>⚡ Mortality Risk Multiplier vs Healthy Adults (Baseline 1×)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Healthy Adult (18–54)', mult: 1.0, color: '#00ff88', bar: '20%' },
                { label: 'Senior (55–70 yrs)', mult: 3.2, color: '#ffd700', bar: '64%' },
                { label: 'Senior (70+ yrs)', mult: 4.8, color: '#ff6b35', bar: '96%' },
                { label: 'Child (1–4 yrs)', mult: 2.9, color: '#0088ff', bar: '58%' },
                { label: 'Infant (0–12 months)', mult: 4.1, color: '#ff3b5c', bar: '82%' },
                { label: 'Newborn (0–3 months)', mult: 5.3, color: '#ff3b5c', bar: '100%' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '180px', fontSize: '0.78rem', color: '#8fafc4', flexShrink: 0 }}>{item.label}</div>
                  <div style={{ flex: 1, height: '24px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: item.bar, background: `linear-gradient(90deg, ${item.color}aa, ${item.color})`,
                      borderRadius: '12px', display: 'flex', alignItems: 'center', paddingLeft: '10px',
                      transition: 'width 1s ease', fontSize: '0.72rem', fontWeight: 700, color: 'white',
                    }}>
                      {item.mult}×
                    </div>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: item.color, width: '35px', textAlign: 'right' }}>{item.mult}×</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#4a6b80' }}>
              Source: WHO Global Dengue & Malaria Mortality Data 2023 · Adjusted for comorbidities and healthcare access
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
