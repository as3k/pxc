import React, { useState } from 'react';
import { Box } from 'ink';
import { Welcome } from '../steps/Welcome.js';
import { Identity } from '../steps/Identity.js';
import { Compute } from '../steps/Compute.js';
import { Storage } from '../steps/Storage.js';
import { Network } from '../steps/Network.js';
import { Iso } from '../steps/Iso.js';
import { Summary } from '../steps/Summary.js';
import { Execute } from '../steps/Execute.js';
import { Success } from '../steps/Success.js';
import { Error } from '../steps/Error.js';
import type { VmState, WizardStep } from '../lib/types.js';

export function CreateCommand() {
	const [step, setStep] = useState<WizardStep>('welcome');
	const [state, setState] = useState<Partial<VmState>>({});
	const [error, setError] = useState<string>('');

	const handleNext = (updates: Partial<VmState>) => {
		const newState = { ...state, ...updates };
		setState(newState);

		// Progress through the steps
		if (step === 'welcome') setStep('identity');
		else if (step === 'identity') setStep('compute');
		else if (step === 'compute') setStep('storage');
		else if (step === 'storage') setStep('network');
		else if (step === 'network') setStep('iso');
		else if (step === 'iso') setStep('summary');
		else if (step === 'summary') setStep('execute');
	};

	const handleError = (errorMessage: string) => {
		setError(errorMessage);
		setStep('error');
	};

	const handleSuccess = () => {
		setStep('success');
	};

	return (
		<Box>
			{step === 'welcome' && <Welcome onNext={() => handleNext({})} onError={handleError} />}
			{step === 'identity' && <Identity state={state} onNext={handleNext} />}
			{step === 'compute' && <Compute state={state} onNext={handleNext} />}
			{step === 'storage' && <Storage state={state} onNext={handleNext} />}
			{step === 'network' && <Network state={state} onNext={handleNext} />}
			{step === 'iso' && <Iso state={state} onNext={handleNext} />}
			{step === 'summary' && <Summary state={state} onNext={handleNext} />}
			{step === 'execute' && (
				<Execute state={state as VmState} onSuccess={handleSuccess} onError={handleError} />
			)}
			{step === 'success' && <Success state={state as VmState} />}
			{step === 'error' && <Error error={error} />}
		</Box>
	);
}
