import { useState } from 'react';
import { fitExampleElements, STARTER_FIELD } from '../../domain';
import type { LayoutDocument } from '../../types';

interface FieldSettingsPanelProps {
  document: LayoutDocument;
  onResizeField: (width: number, height: number) => void;
  onApplyExampleContent: () => void;
  onRestoreExampleDocument: () => void;
}

export function FieldSettingsPanel({ document, onResizeField, onApplyExampleContent, onRestoreExampleDocument }: FieldSettingsPanelProps) {
  const [choosing, setChoosing] = useState(false);
  const fit = fitExampleElements(document.field);

  return <section className="panel field-settings">
    <div className="panel-heading"><div><span className="section-kicker">FIELD SETUP</span><h2>场地设置</h2></div></div>
    <div className="field-summary"><span>当前尺寸</span><strong>{document.field.width} × {document.field.height} m</strong></div>
    <div className="field-inputs"><label>宽度 <input aria-label="场地宽度" type="number" min="12" step="0.5" defaultValue={document.field.width} key={`width-${document.field.width}`} onBlur={(event) => onResizeField(Number(event.target.value), document.field.height)} /></label><span>×</span><label>深度 <input aria-label="场地深度" type="number" min="10" step="0.5" defaultValue={document.field.height} key={`height-${document.field.height}`} onBlur={(event) => onResizeField(document.field.width, Number(event.target.value))} /></label></div>
    <button type="button" className="text-button" onClick={() => setChoosing((open) => !open)} aria-expanded={choosing}>↺ 恢复示例布局</button>
    {choosing ? <div className="example-chooser" role="group" aria-label="恢复示例布局方式">
      <p className="example-chooser-hint">请选择恢复方式，两种操作都会替换当前画布上的全部元素：</p>
      <button type="button" className="example-option" onClick={() => { setChoosing(false); onApplyExampleContent(); }}>
        <strong>只套用示例摆法</strong>
        <span>保留当前场地尺寸 {document.field.width} × {document.field.height} m 和项目名称，仅替换元素。{fit.resized ? `示例内容偏大，将按 ${Math.round(fit.scale * 100)}% 等比缩小，不会出现越界。` : '示例内容可直接放入当前场地。'}</span>
      </button>
      <button type="button" className="example-option danger" onClick={() => { setChoosing(false); onRestoreExampleDocument(); }}>
        <strong>整份文档回到示例</strong>
        <span>场地尺寸将从 {document.field.width} × {document.field.height} m 改回示例的 {STARTER_FIELD.width} × {STARTER_FIELD.height} m，项目名称与当前布置也会被示例内容覆盖。</span>
      </button>
      <button type="button" className="example-cancel" onClick={() => setChoosing(false)}>取消</button>
    </div> : null}
  </section>;
}
