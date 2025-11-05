"use client";

import { useRef, useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPickFile() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReferenceImage(file);
    setResultUrl(null);
    setError(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  async function onGenerate() {
    if (!referenceImage) {
      setError('Vui l?ng t?i l?n ?nh khu?n m?t tham chi?u.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const formData = new FormData();
      formData.append('reference', referenceImage);

      // Prompt m?c ??nh theo y?u c?u
      formData.append(
        'prompt',
        [
          '?nh ch?n dung ngo?i tr?i si?u th?c (photorealistic) c?a m?t c? g?i tr? ng??i Vi?t Nam',
          '??ng c?nh b?i hoa d? qu? cao v? r?m r?p ?ang n? r?. Hoa m?u v?ng ?ng r?c r?,',
          'gi?ng c?c l?n, c?nh thon d?i, nh?y cam ??m, l? xanh r? c? r?ng c?a.',
          'C? m?c ?o d?i tr?ng xanh m?m m?i, tay c?m n?n l? v?nh r?ng, thanh l?ch, h?i h?a.',
          'T?c th?ng ngang vai, ?m l?y khu?n m?t d?u d?ng; l?n da s?ng, m?n, kh?e kho?n.',
          'C? ??ng duy?n d?ng b?n xe ??p tr?ng c? ?i?n, gi? m?y c? b? hoa d? qu? m?i h?i.',
          'B?u kh?ng kh? y?n b?nh, ho?i ni?m, th? m?ng, con ???ng qu? m?c m?c.',
          '?nh s?ng n?ng v?ng nh? bu?i ho?ng h?n, chi?u ng??c t? nhi?n, ?? s?u ?i?n ?nh, t?ng ?m d?u.',
          'Gi? 100% danh t?nh t? ?nh tham chi?u: t? l? khu?n m?t t? nhi?n, m?u da, n? c??i nh? kh?p mi?ng.',
          'L?y n?t to?n khung h?nh, ch?t l??ng cao, chi ti?t da t? nhi?n.'
        ].join(' ')
      );

      const res = await fetch('/api/generate', { method: 'POST', body: formData });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Y?u c?u th?t b?i');
      }
      const data = (await res.json()) as { imageUrl: string };
      setResultUrl(data.imageUrl);
    } catch (e: any) {
      setError(e.message || '?? x?y ra l?i kh?ng x?c ??nh');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>Ch?n dung ngo?i tr?i v?i hoa d? qu?</h1>
      <p className="subtitle">Gi? nguy?n danh t?nh t? ?nh khu?n m?t tham chi?u</p>

      <div className="card">
        <div className="uploader">
          {previewUrl ? (
            <Image src={previewUrl} alt="?nh tham chi?u" width={240} height={240} className="preview" />
          ) : (
            <div className="placeholder">Ch?a c? ?nh
              <br />
              (PNG/JPG ? 10MB)
            </div>
          )}
          <div className="buttons">
            <button onClick={onPickFile} className="btn secondary">T?i ?nh l?n</button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onFileChange} />
            <button onClick={onGenerate} className="btn primary" disabled={!referenceImage || isLoading}>
              {isLoading ? '?ang t?o...' : 'T?o ch?n dung'}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </div>
      </div>

      {resultUrl && (
        <div className="card">
          <h2>K?t qu?</h2>
          <Image src={resultUrl} alt="K?t qu?" width={896} height={1120} className="result" />
          <a className="link" href={resultUrl} target="_blank" rel="noreferrer">M? ?nh g?c</a>
        </div>
      )}

      <footer>
        <span>? Agentic ? Next.js on Vercel</span>
      </footer>
    </main>
  );
}
