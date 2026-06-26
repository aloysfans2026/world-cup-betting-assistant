import type { ChangeEvent } from "react";
import type { Match } from "../domain/types";
import { recognizeImageOdds } from "../services/browserOcrService";
import {
  matchRecognizedOddsToMatches,
  parseOddsFromOcrText,
  type RecognizedOddsRow,
} from "../services/ocrOddsService";

type EditableField = keyof Pick<RecognizedOddsRow, "awayTeam" | "awayWin" | "draw" | "homeTeam" | "homeWin" | "matchId">;

export function ScreenshotOddsUploader({
  matches,
  rows,
  isRecognizing,
  message,
  onApply,
  onClear,
  onMessage,
  onRowsChange,
  onRecognizingChange,
}: {
  matches: Match[];
  rows: RecognizedOddsRow[];
  isRecognizing: boolean;
  message: string;
  onApply: () => void;
  onClear: () => void;
  onMessage: (message: string) => void;
  onRowsChange: (rows: RecognizedOddsRow[]) => void;
  onRecognizingChange: (isRecognizing: boolean) => void;
}) {
  const updateRow = (rowId: string, field: EditableField, value: string) => {
    onRowsChange(
      rows.map((row) => {
        if (row.id !== rowId) return row;
        const next = { ...row, [field]: value };
        if (field === "matchId") next.status = value ? "已匹配" : "待确认";
        return next;
      }),
    );
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onRecognizingChange(true);
    onMessage("正在识别截图，请稍候。");

    try {
      const text = await recognizeImageOdds(file);
      const parsedRows = matchRecognizedOddsToMatches(parseOddsFromOcrText(text), matches);
      onRowsChange(parsedRows);
      onMessage(parsedRows.length > 0 ? "识别完成，请核对后应用。" : "未识别到完整胜平负赔率，可继续手动录入。");
    } catch {
      onRowsChange([]);
      onMessage("截图识别失败，可继续手动录入赔率。");
    } finally {
      onRecognizingChange(false);
      event.target.value = "";
    }
  };

  return (
    <section className="panel ocr-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">赔率截图识别</p>
          <h2>上传赔率截图</h2>
        </div>
        <label className="upload-button">
          上传赔率截图
          <input accept=".png,.jpg,.jpeg,image/png,image/jpeg" type="file" onChange={handleFileChange} />
        </label>
      </div>

      <p className="helper-copy">图片只在本地浏览器内识别，不会上传到第三方服务器。识别结果请人工核对。</p>
      {message && <p className="ocr-message">{isRecognizing ? "识别中：" : ""}{message}</p>}

      {rows.length > 0 && (
        <div className="ocr-preview">
          <div className="ocr-table" role="table" aria-label="赔率识别预览">
            <div className="ocr-row ocr-head" role="row">
              <span>识别比赛</span>
              <span>匹配比赛</span>
              <span>主胜赔率</span>
              <span>平局赔率</span>
              <span>客胜赔率</span>
              <span>状态</span>
            </div>
            {rows.map((row) => (
              <div className="ocr-row" role="row" key={row.id}>
                <div className="ocr-teams">
                  <input
                    aria-label={`${row.code || row.id}主队`}
                    value={row.homeTeam}
                    onChange={(event) => updateRow(row.id, "homeTeam", event.target.value)}
                  />
                  <input
                    aria-label={`${row.code || row.id}客队`}
                    value={row.awayTeam}
                    onChange={(event) => updateRow(row.id, "awayTeam", event.target.value)}
                  />
                </div>
                <select
                  aria-label={`${row.code || row.id}匹配比赛`}
                  value={row.matchId}
                  onChange={(event) => updateRow(row.id, "matchId", event.target.value)}
                >
                  <option value="">待确认</option>
                  {matches.map((match) => (
                    <option value={match.id} key={match.id}>
                      {match.homeTeam.name} VS {match.awayTeam.name}
                    </option>
                  ))}
                </select>
                <input
                  aria-label={`${row.code || row.id}主胜赔率`}
                  inputMode="decimal"
                  value={row.homeWin}
                  onChange={(event) => updateRow(row.id, "homeWin", event.target.value)}
                />
                <input
                  aria-label={`${row.code || row.id}平局赔率`}
                  inputMode="decimal"
                  value={row.draw}
                  onChange={(event) => updateRow(row.id, "draw", event.target.value)}
                />
                <input
                  aria-label={`${row.code || row.id}客胜赔率`}
                  inputMode="decimal"
                  value={row.awayWin}
                  onChange={(event) => updateRow(row.id, "awayWin", event.target.value)}
                />
                <strong className={row.status === "已匹配" ? "match-ok" : "match-pending"}>{row.status}</strong>
              </div>
            ))}
          </div>

          <div className="ocr-actions">
            <button className="primary-button" onClick={onApply}>
              应用到今日比赛
            </button>
            <button className="secondary-button" onClick={onClear}>
              清空识别结果
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
