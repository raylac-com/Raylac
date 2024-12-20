'use client';
import { useState } from 'react';
import useEnsAddress from '@/hooks/useEnsAddress';
import { useRouter } from 'next/navigation';
import { shortenAddress } from '@/lib/utils';

const StartButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <div
      className="cursor-pointer w-[240px] bg-tertiary rounded-[16px] px-[16px] py-[12px]"
      onClick={onClick}
    >
      <div className="text-background font-bold w-full text-center">Start</div>
    </div>
  );
};

const WatchModePage = () => {
  const [inputText, setInputText] = useState('');
  const { data: ensAddress } = useEnsAddress(inputText);
  const router = useRouter();

  const onStartClick = () => {
    router.push(`/watch/${inputText}`);
  };

  return (
    <div className="flex flex-col items-start justify-center h-[60vh]">
      <div className="flex flex-col gap-y-[32px]">
        <div className="text-foreground font-bold text-lg">Watch address</div>
        <div className="flex flex-col gap-y-[12px]">
          <input
            className="w-[362px] bg-background rounded-[8px] px-[16px] py-[12px] border border-tertiary"
            placeholder="Ethereum address or ENS"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          <div className="text-foreground">
            {ensAddress ? `${shortenAddress(ensAddress)}` : ''}
          </div>
        </div>
      </div>
      <div className="mt-[80px]">
        <StartButton onClick={onStartClick} />
      </div>
    </div>
  );
};

export default WatchModePage;
