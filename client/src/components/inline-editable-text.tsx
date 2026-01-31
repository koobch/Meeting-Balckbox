import { useState, useRef, useEffect } from "react";

interface InlineEditableTextProps {
  value: string;
  onSave: (newValue: string) => void | Promise<void>;
  className?: string;
  testId?: string;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function InlineEditableText({
  value,
  onSave,
  className = "",
  testId,
  multiline = false,
  placeholder = "",
  maxLength
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      if (multiline && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      } else if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }, [isEditing, multiline]);

  const handleSave = async () => {
    if (isSaving) return;
    
    const trimmedValue = editValue.trim();
    if (!trimmedValue) {
      setError("값을 입력해주세요");
      return;
    }
    
    if (trimmedValue === value) {
      setIsEditing(false);
      setError(null);
      return;
    }

    const previousValue = value;
    setIsSaving(true);
    setError(null);

    try {
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (err) {
      setEditValue(previousValue);
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (multiline && e.shiftKey) {
        return;
      }
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    const inputClasses = `bg-transparent border-b-2 border-primary outline-none w-full ${className} ${isSaving ? "opacity-50" : ""}`;
    
    return (
      <div className="inline-block w-full">
        {multiline ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`${inputClasses} resize-none min-h-[60px]`}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={isSaving}
            data-testid={testId ? `${testId}-input` : undefined}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={inputClasses}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={isSaving}
            data-testid={testId ? `${testId}-input` : undefined}
          />
        )}
        {error && (
          <p className="text-xs text-destructive mt-1" data-testid={testId ? `${testId}-error` : undefined}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <span
      onDoubleClick={() => setIsEditing(true)}
      className={`cursor-text hover:bg-muted/50 rounded px-1 -mx-1 transition-colors inline-block ${className}`}
      title="더블클릭하여 편집"
      data-testid={testId}
    >
      {value || <span className="text-muted-foreground italic">{placeholder || "편집하려면 더블클릭"}</span>}
    </span>
  );
}
