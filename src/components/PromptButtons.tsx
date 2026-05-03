interface Props {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

export function PromptButtons({ prompts, onSelect }: Props) {
  return (
    <div className="prompt-buttons">
      {prompts.slice(0, 6).map((p, i) => (
        <button key={i} className="prompt-btn" onClick={() => onSelect(p)}>
          {p}
        </button>
      ))}
    </div>
  );
}
