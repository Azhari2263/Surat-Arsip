import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  AlertCircle,
  Loader2,
  Eye,
} from 'lucide-react';
import {
  DirectFileInput,
  dataUrlToBlob,
  resolveDirectFileAccess,
  triggerDirectDownload,
} from '../utils/googleDriveSync';
import { DocxExtractedContent, extractDocumentPreviewFromDataUrl } from '../utils/docxPreview';

interface FilePreviewModalProps {
  file: DirectFileInput | null;
  rootFolderId?: string;
  onClose: () => void;
  onToast?: (msg: string) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  rootFolderId,
  onClose,
  onToast,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [docPreview, setDocPreview] = useState<DocxExtractedContent | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);

  const access = useMemo(
    () => resolveDirectFileAccess(file, rootFolderId),
    [file, rootFolderId]
  );

  const fileCategory = useMemo(() => {
    if (!file) return 'other';
    const lowerName = (file.name || '').toLowerCase();
    const lowerType = (file.type || '').toLowerCase();
    const dataPrefix = (file.dataUrl || '').slice(0, 60).toLowerCase();

    if (
      lowerType.includes('pdf') ||
      lowerName.endsWith('.pdf') ||
      dataPrefix.includes('application/pdf')
    ) {
      return 'pdf';
    }
    if (
      lowerType.startsWith('image/') ||
      /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lowerName) ||
      dataPrefix.includes('image/')
    ) {
      return 'image';
    }
    if (file.htmlContent) {
      return 'html';
    }
    if (
      lowerName.endsWith('.docx') ||
      lowerName.endsWith('.doc') ||
      lowerType.includes('word') ||
      lowerType.includes('officedocument')
    ) {
      return 'word';
    }
    if (lowerName.endsWith('.txt') || lowerName.endsWith('.csv') || lowerName.endsWith('.html')) {
      return 'text';
    }
    return 'other';
  }, [file]);

  // Kelola Blob URL untuk PDF / Image / Tab Baru lokal
  useEffect(() => {
    if (!file) {
      setBlobUrl(null);
      return;
    }

    let createdUrl: string | null = null;
    if (access.hasDataUrl && file.dataUrl) {
      const blob = dataUrlToBlob(file.dataUrl, file.type || 'application/octet-stream');
      if (blob) {
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      } else {
        setBlobUrl(null);
      }
    } else if (file.htmlContent) {
      const blob = new Blob([file.htmlContent], { type: 'text/html;charset=utf-8' });
      createdUrl = URL.createObjectURL(blob);
      setBlobUrl(createdUrl);
    } else {
      setBlobUrl(null);
    }

    return () => {
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [file, access.hasDataUrl]);

  // Parse pratinjau dokumen Word / Teks lokal apabila tidak menggunakan Drive Preview iframe
  useEffect(() => {
    let active = true;
    setDocPreview(null);

    if (!file) return;
    if (file.htmlContent) {
      setDocPreview({ kind: 'html', html: file.htmlContent });
      return;
    }

    if (
      (fileCategory === 'word' || fileCategory === 'text' || fileCategory === 'other') &&
      access.hasDataUrl &&
      file.dataUrl &&
      !access.previewUrl
    ) {
      setIsLoadingDoc(true);
      extractDocumentPreviewFromDataUrl(file.dataUrl, file.name)
        .then((res) => {
          if (active) setDocPreview(res);
        })
        .catch(() => {
          if (active) {
            setDocPreview({
              kind: 'unsupported',
              reason: 'Tidak dapat mempratinjau isi berkas secara langsung.',
            });
          }
        })
        .finally(() => {
          if (active) setIsLoadingDoc(false);
        });
    }

    return () => {
      active = false;
    };
  }, [file, fileCategory, access.hasDataUrl, access.previewUrl]);

  if (!file) return null;

  // Tautan langsung untuk tombol "Buka di Tab Baru" (SELALU ke file langsung atau blob URL, TIDAK PERNAH ke folder)
  const newTabUrl =
    access.viewUrl ||
    (fileCategory === 'pdf' || fileCategory === 'image' || fileCategory === 'html' ? blobUrl : null);

  const handleDownload = () => {
    const res = triggerDirectDownload(file, rootFolderId);
    if (res.ok) {
      onToast?.(`✔ Mengunduh berkas ${file.name}`);
    } else {
      onToast?.(`⚠ ${res.reason || 'Gagal mengunduh berkas.'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[70] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[88vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900">
        {/* Header Modal */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-[#0f4c82] text-white flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={file.name}>
                {file.name}
              </h3>
              <div className="text-[11px] text-slate-500 font-mono-tabular flex items-center gap-2 flex-wrap">
                {file.size && file.size > 0 ? <span>{(file.size / 1024).toFixed(1)} KB</span> : null}
                {access.fileId && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-sans font-semibold text-[10px]">
                    Terhubung Google Drive (ID File Langsung)
                  </span>
                )}
                {!access.fileId && access.hasDataUrl && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#0f4c82] border border-blue-200 font-sans font-semibold text-[10px]">
                    Pratinjau Berkas Lokal
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {newTabUrl && (
              <a
                href={newTabUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-[#0f4c82] font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                title="Buka berkas langsung di tab browser baru"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Tab Baru</span>
              </a>
            )}

            {access.hasAnyAccess && !file.htmlContent && (
              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-[#0f4c82] hover:bg-[#1a6bb5] text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title={`Unduh ${file.name}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh</span>
              </button>
            )}

            {file.htmlContent && (
              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-[#0f4c82] hover:bg-[#1a6bb5] text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title={`Unduh ${file.name}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer transition-colors"
              title="Tutup pratinjau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Pratinjau */}
        <div className="flex-1 bg-slate-100 overflow-hidden flex flex-col">
          {!access.hasAnyAccess ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
              <h4 className="text-sm font-bold text-slate-800">Berkas Belum Tersedia untuk Dibuka</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                File ID Google Drive maupun data berkas lokal belum tersedia untuk dokumen ini. Pastikan Web App Google Apps Script terbaru sudah di-deploy atau unggah ulang dokumen.
              </p>
            </div>
          ) : fileCategory === 'pdf' && blobUrl ? (
            <iframe
              src={blobUrl}
              title={file.name}
              className="w-full h-full border-0 bg-white"
            />
          ) : fileCategory === 'image' && (blobUrl || file.dataUrl) ? (
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              <img
                src={blobUrl || file.dataUrl}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-xl shadow-md bg-white"
              />
            </div>
          ) : fileCategory === 'html' && (file.htmlContent || docPreview?.html) ? (
            <div className="flex-1 p-3 sm:p-5 overflow-auto flex justify-center">
              <iframe
                srcDoc={file.htmlContent || docPreview?.html}
                title={file.name}
                className="w-full max-w-4xl h-full min-h-[500px] bg-white rounded-xl border border-slate-200 shadow-sm"
              />
            </div>
          ) : access.previewUrl ? (
            <iframe
              src={access.previewUrl}
              title={file.name}
              className="w-full h-full border-0 bg-white"
              allow="autoplay"
            />
          ) : isLoadingDoc ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-[#0f4c82]" />
              <span className="text-xs font-medium">Memuat pratinjau isi dokumen...</span>
            </div>
          ) : docPreview?.kind === 'docx-blocks' && docPreview.blocks ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center">
              <div className="w-full max-w-3xl bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-3 text-sm text-slate-800 leading-relaxed h-fit">
                <div className="pb-3 mb-4 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-semibold text-[#0f4c82]">
                    <FileText className="w-4 h-4" />
                    Pratinjau Konten Dokumen Word (.docx)
                  </span>
                  <span>{docPreview.blocks.length} bagian terbaca</span>
                </div>
                {docPreview.blocks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    Dokumen tidak memiliki teks paragraf yang dapat ditampilkan (kemungkinan hanya berisi gambar/scan).
                  </p>
                ) : (
                  docPreview.blocks.map((block, idx) =>
                    block.type === 'paragraph' ? (
                      block.text && block.text.trim().length > 0 ? (
                        <p key={idx} className="whitespace-pre-wrap text-[13px] text-slate-800">
                          {block.text}
                        </p>
                      ) : (
                        <div key={idx} className="h-2" />
                      )
                    ) : block.type === 'table' && block.rows ? (
                      <div key={idx} className="overflow-x-auto my-3">
                        <table className="w-full border-collapse border border-slate-300 text-xs">
                          <tbody>
                            {block.rows.map((row, rIdx) => (
                              <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-50 font-semibold' : ''}>
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="border border-slate-300 px-2.5 py-1.5 align-top whitespace-pre-wrap"
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null
                  )
                )}
              </div>
            </div>
          ) : docPreview?.kind === 'html' && docPreview.html ? (
            <div className="flex-1 p-3 sm:p-5 overflow-auto flex justify-center">
              <iframe
                srcDoc={docPreview.html}
                title={file.name}
                className="w-full max-w-4xl h-full min-h-[500px] bg-white rounded-xl border border-slate-200 shadow-sm"
              />
            </div>
          ) : docPreview?.kind === 'text' && docPreview.text !== undefined ? (
            <div className="flex-1 overflow-auto p-4 sm:p-6">
              <pre className="max-w-4xl mx-auto bg-white p-5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap">
                {docPreview.text}
              </pre>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <FileText className="w-12 h-12 text-slate-400 mb-3" />
              <h4 className="text-sm font-bold text-slate-800">{file.name}</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                {docPreview?.reason ||
                  'Pratinjau langsung tidak tersedia untuk format biner ini. Silakan unduh berkas untuk membukanya di aplikasi perangkat Anda.'}
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="mt-4 px-4 py-2 rounded-xl bg-[#0f4c82] hover:bg-[#1a6bb5] text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Berkas Sekarang</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
