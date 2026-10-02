import { useEffect, useState } from 'react';
import { EXAMPLE_FIELD, formatArea, planExampleContent } from '../../domain';
import type { LayoutDocument } from '../../types';

interface FieldSettingsPanelProps {
  document: LayoutDocument;
  onResizeField: (width: number, height: number) => void;
  onImportExample: () => void;
  onLoadExampleDocument: () => void;
}

export function FieldSettingsPanel({ document, onResizeField, onImportExample, onLoadExampleDocument }: FieldSettingsPanelProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const plan = planExampleContent(document.field);

  useEffect(() => {
    if (!confirmOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setConfirmOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmOpen]);

  const runImport = () => { setConfirmOpen(false); onImportExample(); };
  const runLoadAll = () => { setConfirmOpen(false); onLoadExampleDocument(); };

  return <section className="panel field-settings">
    <div className="panel-heading"><div><span className="section-kicker">FIELD SETUP</span><h2>场地设置</h2></div></div>
    <div className="field-summary"><span>当前尺寸</span><strong>{formatArea(document.field)}</strong></div>
    <div className="field-inputs"><label>宽度 <input aria-label="场地宽度" type="number" min="12" step="0.5" defaultValue={document.field.width} key={`width-${document.field.width}`} onBlur={(event) => onResizeField(Number(event.target.value), document.field.height)} /></label><span>×</span><label>深度 <input aria-label="场地深度" type="number" min="10" step="0.5" defaultValue={document.field.height} key={`height-${document.field.height}`} onBlur={(event) => onResizeField(document.field.width, Number(event.target.value))} /></label></div>
    <button type="button" className="text-button" onClick={() => setConfirmOpen(true)}>↺ 恢复示例布局</button>

    {confirmOpen ? <div className="reset-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmOpen(false); }}>
      <div className="reset-dialog" role="dialog" aria-modal="true" aria-label="恢复示例布局">
        <div className="reset-dialog-head"><strong>恢复示例布局</strong><button type="button" className="reset-close" aria-label="关闭" onClick={() => setConfirmOpen(false)}>×</button></div>
        <p className="reset-dialog-note">示例基于 {formatArea(EXAMPLE_FIELD)} 场地设计。当前场地为 <b>{formatArea(document.field)}</b>，现有 {document.elements.length} 个元素会被替换。</p>
        <button type="button" className="reset-choice" onClick={runImport}>
          <span className="reset-choice-title">只取示例摆法</span>
          <span className="reset-choice-desc">保留当前场地尺寸 {formatArea(document.field)} 与项目名，仅载入示例元素的摆放方式。</span>
          {plan.adjusted.length || plan.skipped.length ? <span className="reset-choice-warn">{plan.adjusted.length} 个元素将自动挪动到界内{plan.skipped.length ? `；${plan.skipped.map((item) => item.name).join('、')} 尺寸超过场地，将跳过` : ''}。</span> : <span className="reset-choice-ok">全部示例元素均可原样放入，无需挪动。</span>}
        </button>
        <button type="button" className="reset-choice" onClick={runLoadAll}>
          <span className="reset-choice-title">整份文档回到示例</span>
          <span className="reset-choice-desc">场地尺寸将改为 {formatArea(EXAMPLE_FIELD)}，项目名与 {document.elements.length} 个现有元素全部恢复为示例内容。</span>
        </button>
        <button type="button" className="reset-cancel" onClick={() => setConfirmOpen(false)}>取消</button>
      </div>
    </div> : null}
  </section>;
}
