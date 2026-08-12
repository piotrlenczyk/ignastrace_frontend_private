import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { cn } from '@/libs/utils';
import type { SexOffenderData } from '@/types/sex-offenders.types';

const FeatureRow = ({ label, values }: { label: string; values: string[] }) => (
  <div className="block border-b border-gray-100 pb-3 text-lg last:border-b-0 md:flex md:gap-3">
    <h5 className="mb-1 w-60 font-bold md:mb-0">{label}</h5>
    <p>{values?.length ? values.join(', ') : '--'}</p>
  </div>
);

const DistinctiveFeaturesComponent = ({
  className,
  sexOffenderData,
}: {
  className?: string;
  sexOffenderData: SexOffenderData;
}) => {
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders.report.distinctive_features');

  // Organize marks by body part
  const distinctiveFeatures = {
    head: sexOffenderData.marks
      .filter(mark => mark.body_part === 'head')
      .map(mark => mark.description),
    torso: sexOffenderData.marks
      .filter(mark => mark.body_part === 'torso')
      .map(mark => mark.description),
    back: sexOffenderData.marks
      .filter(mark => mark.body_part === 'back')
      .map(mark => mark.description),
    leftArm: sexOffenderData.marks
      .filter(mark => mark.body_part === 'left_arm')
      .map(mark => mark.description),
    rightArm: sexOffenderData.marks
      .filter(mark => mark.body_part === 'right_arm')
      .map(mark => mark.description),
    leftHand: sexOffenderData.marks
      .filter(mark => mark.body_part === 'left_hand')
      .map(mark => mark.description),
    rightHand: sexOffenderData.marks
      .filter(mark => mark.body_part === 'right_hand')
      .map(mark => mark.description),
    leftLeg: sexOffenderData.marks
      .filter(mark => mark.body_part === 'left_leg')
      .map(mark => mark.description),
    rightLeg: sexOffenderData.marks
      .filter(mark => mark.body_part === 'right_leg')
      .map(mark => mark.description),
  };

  return (
    <Card className={cn('flex flex-col gap-8 border border-stroke-weak p-6 shadow-raised', className)}>
      <h4 className="font-bold">
        {t('title')}
      </h4>

      <div className="space-y-4">
        <FeatureRow label={t('head')} values={distinctiveFeatures.head} />
        <FeatureRow label={t('torso')} values={distinctiveFeatures.torso} />
        <FeatureRow label={t('back')} values={distinctiveFeatures.back} />
        <FeatureRow label={t('left_arm')} values={distinctiveFeatures.leftArm} />
        <FeatureRow label={t('right_arm')} values={distinctiveFeatures.rightArm} />
        <FeatureRow label={t('left_hand')} values={distinctiveFeatures.leftHand} />
        <FeatureRow label={t('right_hand')} values={distinctiveFeatures.rightHand} />
        <FeatureRow label={t('left_leg')} values={distinctiveFeatures.leftLeg} />
        <FeatureRow label={t('right_leg')} values={distinctiveFeatures.rightLeg} />
      </div>
    </Card>
  );
};
export default DistinctiveFeaturesComponent;
