interface AlertsProps {
  alerts: string[];
  className?: string;
}

export default function AlertsPanel({ alerts, className }: AlertsProps) {
  return (
    <div className={`panel alerts-panel ${className ?? ""}`.trim()} style={{ maxHeight: "100%", overflowY: "auto" }}>
      <h3 className="title" style={{ color: "var(--danger)" }}>Активные ошибки</h3>
      
      {alerts && alerts.length > 0 ? (
        <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-main)' }}>
          {alerts.map((alert, idx) => (
             <li key={idx} style={{ marginBottom: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid var(--danger)' }}>
                {alert}
             </li>
          ))}
        </ul>
      ) : (
        <div style={{ color: 'var(--success)', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
           Системы в норме
        </div>
      )}
    </div>
  );
}
