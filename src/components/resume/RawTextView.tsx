interface RawTextViewProps {
  text: string
}

export function RawTextView({ text }: RawTextViewProps) {
  return (
    <div className="max-w-[794px] bg-white shadow-xl rounded-sm p-12 mx-auto text-sm font-mono leading-relaxed">
      <pre className="whitespace-pre-wrap break-words">{text}</pre>
    </div>
  )
}
