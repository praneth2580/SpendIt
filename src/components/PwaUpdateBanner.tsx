import { useEffect, useState } from 'react';
import Button from './ui/Button';
import { applyPwaUpdate } from '../lib/pwa';

export default function PwaUpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onUpdate = () => setVisible(true);
    window.addEventListener('spendt:pwa-update', onUpdate);
    return () => window.removeEventListener('spendt:pwa-update', onUpdate);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-brand/30 bg-surface p-4 shadow-card flex flex-col gap-3 md:bottom-6">
      <p className="text-fg text-[14px] font-medium">A new version of Spendt is ready.</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => void applyPwaUpdate()}>
          Update
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setVisible(false)}>
          Later
        </Button>
      </div>
    </div>
  );
}
