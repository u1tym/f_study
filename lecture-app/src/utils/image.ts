/** API 向け base64（data URL のプレフィックスを除く） */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      const comma = r.indexOf(',');
      resolve(comma >= 0 ? r.slice(comma + 1) : r);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** 表示用 data URL（生 base64 のときは png 仮定） */
export function imageSrcForApiField(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null;
  if (raw.startsWith('data:')) return raw;
  return `data:image/png;base64,${raw}`;
}
