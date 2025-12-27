import React, { useEffect, useState } from 'react';
import { Text, Box } from 'ink';
import { createVm } from '../lib/proxmox.js';
import type { VmState, VmConfig } from '../lib/types.js';

interface ExecuteProps {
	state: VmState;
	onSuccess: () => void;
	onError: (error: string) => void;
}

export function Execute({ state, onSuccess, onError }: ExecuteProps) {
	const [status, setStatus] = useState<string>('Creating VM...');

	useEffect(() => {
		// Convert VmState to VmConfig (they're compatible now)
		const vmConfig: VmConfig = {
			vmid: state.vmid,
			name: state.name,
			cores: state.cores,
			memoryMb: state.memoryMb,
			diskGb: state.diskGb,
			storage: state.storage,
			bridge: state.bridge,
			isoVolid: state.isoVolid,
			node: state.node, // Optional node parameter
		};

		createVm(vmConfig)
			.then(() => {
				const nodeInfo = vmConfig.node ? ` on ${vmConfig.node}` : '';
				setStatus(`VM created successfully${nodeInfo}`);
				setTimeout(onSuccess, 500);
			})
			.catch((err) => {
				const nodeInfo = vmConfig.node ? ` on ${vmConfig.node}` : '';
				onError(`VM creation failed${nodeInfo}: ${err.message}`);
			});
	}, [state, onSuccess, onError]);

	return (
		<Box flexDirection="column" paddingY={1}>
			<Text>{status}</Text>
		</Box>
	);
}
