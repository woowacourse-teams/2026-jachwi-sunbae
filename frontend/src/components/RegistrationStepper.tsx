import styles from './RegistrationStepper.module.css';

type RegistrationStep = 1 | 2 | 3;

type RegistrationStepperProps = {
  currentStep: RegistrationStep;
};

const steps = ['기본 정보', '상세 정보', '체크리스트'] as const;

const RegistrationStepper = ({ currentStep }: RegistrationStepperProps) => (
  <ol className={styles.stepper} aria-label="매물 등록 단계">
    {steps.map((label, index) => {
      const step = (index + 1) as RegistrationStep;
      const state = step < currentStep ? 'complete' : step === currentStep ? 'current' : 'upcoming';

      return (
        <li key={label} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
          <span className={styles.number}>{step}</span>
          <span className={styles.label}>{label}</span>
        </li>
      );
    })}
  </ol>
);

export default RegistrationStepper;
