'use client';

import { Share2 } from 'lucide-react';

interface ShareButtonProps {
  fileName: string;
  fileUrl: string;
}

export default function ShareButton({ fileName, fileUrl }: ShareButtonProps) {
  const handleShare = () => {
    const subject = encodeURIComponent(`Shared file: ${fileName}`);
    const body = encodeURIComponent(
      `I'm sharing a file with you: ${fileName}\n\nDownload link:\n${fileUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <button
      onClick={handleShare}
      className="rounded p-1.5 hover:bg-muted"
      title="Share via email"
    >
      <Share2 className="h-4 w-4" />
    </button>
  );
}
