interface RawPdfViewProps {
  pdfUrl: string
}

export function RawPdfView({ pdfUrl }: RawPdfViewProps) {
  return (
    <div className="max-w-[794px] mx-auto shadow-xl rounded-sm overflow-hidden bg-white">
      <iframe
        src={`${pdfUrl}#toolbar=0`}
        style={{ width: '100%', height: '1123px', border: 'none' }}
        title="原始履歷 PDF 預覽"
      />
    </div>
  )
}
