'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '../ui/button';

const TrustPilot = () => {
  const [trustPilotResponse, setTrustPilotResponse] = useState<boolean | null>(null);
  const t = useTranslations('pages.success');

  const handleTrustPilotCompleted = (value: boolean) => {
    if (value) {
      window.open('https://www.trustpilot.com/evaluate/mobitrace.io', '_blank');
    }
    setTrustPilotResponse(value);
  };

  const contentTrustPilot = () => {
    return (
      <>
        {trustPilotResponse === null
          ? (
              <>
                <p className="font-bold">{t('did_you_like_your_shopping_experience')}</p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    className="min-w-24 bg-brand"
                    onClick={() => handleTrustPilotCompleted(true)}
                    type="button"
                    size="lg"
                  >
                    {t('yes')}
                  </Button>
                  <Button
                    className="min-w-24 bg-red"
                    onClick={() => handleTrustPilotCompleted(false)}
                    type="button"
                    size="lg"
                  >
                    {t('no')}
                  </Button>
                </div>
              </>
            )
          : (
              <>
                {trustPilotResponse && (
                  <Image
                    src="/images/trustpilot/happy-face.svg"
                    alt="Trustpilot"
                    width={32}
                    height={32}
                  />
                )}
                <p className="text-lg font-bold">
                  {t('thank_you_for_your_feedback')}
                  {!trustPilotResponse && (
                    <span>
                      {' '}
                      {t('we_ll_work_on_making_it_better')}
                    </span>
                  )}
                </p>
                <p>
                  {t.rich('more_details_feedback', {
                    email: chunks => (
                      <a
                        className="link block text-information"
                        href={`mailto:${chunks}`}
                      >
                        {chunks}
                      </a>
                    ),
                  })}
                </p>
              </>
            )}
      </>
    );
  };

  return (
    <div className={`
      container-wide flex flex-col items-center justify-center gap-4 rounded-xl bg-gray-100 px-4 py-6
      lg:px-0 lg:py-20
    `}
    >
      {contentTrustPilot()}
    </div>
  );
};

export default TrustPilot;
