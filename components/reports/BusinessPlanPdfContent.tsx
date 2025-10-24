import React from 'react';

interface BusinessPlanPdfContentProps {
  planText: string;
  projectName: string;
}

const BusinessPlanPdfContent: React.FC<BusinessPlanPdfContentProps> = ({ planText, projectName }) => {
  const containerStyle: React.CSSProperties = {
    width: '210mm',
    fontFamily: "'Noto Sans JP', sans-serif",
    color: '#333',
    backgroundColor: '#fff',
  };

  const pageStyle: React.CSSProperties = {
    width: '210mm',
    minHeight: '297mm',
    padding: '20mm',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  };
  
  const h1Style: React.CSSProperties = { fontSize: '24px', fontWeight: 'bold', color: '#1E40AF', marginBottom: '15px', lineHeight: 1.4, borderBottom: '2px solid #3B82F6', paddingBottom: '10px' };
  const pStyle: React.CSSProperties = { fontSize: '11px', lineHeight: 1.8, color: '#374151', whiteSpace: 'pre-wrap' };

  return (
    <div id="business-plan-pdf-content" style={containerStyle}>
      <div style={pageStyle}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ ...h1Style, fontSize: '28px', borderBottom: 'none' }}>事業計画書</h1>
            <p style={{ fontSize: '16px', color: '#555' }}>プロジェクト: {projectName}</p>
        </header>
        <main style={{flexGrow: 1}}>
            <div style={{...pStyle}} dangerouslySetInnerHTML={{__html: planText.replace(/\n/g, '<br />') }} />
        </main>
        <footer style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #ccc', fontSize: '10px', color: '#888', textAlign: 'center' }}>
            <p>文唱堂印刷株式会社 | {new Date().toLocaleDateString('ja-JP')}</p>
        </footer>
      </div>
    </div>
  );
};

export default BusinessPlanPdfContent;
