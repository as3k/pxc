import React from 'react';
import { Text, Box } from 'ink';
import type { VmState } from '../lib/types.js';

interface SuccessProps {
	state: VmState;
}

export function Success({ state }: SuccessProps) {
	return (
		<Box flexDirection="column" paddingY={1}>
			<Text color="green" bold>
				✓ VM created successfully
			</Text>
			<Box paddingY={1} flexDirection="column">
				<Text>
					<Text dimColor>VM ID: </Text>
					{state.vmid}
				</Text>
				<Text>
					<Text dimColor>Name:  </Text>
					{state.name}
				</Text>
				{state.node && (
					<Text>
						<Text dimColor>Node:  </Text>
						{state.node}
					</Text>
				)}
			</Box>
			<Text dimColor>Next steps:</Text>
			<Box paddingLeft={2} flexDirection="column">
				<Text>qm start {state.vmid}</Text>
				<Text>qm terminal {state.vmid}</Text>
			</Box>
		</Box>
	);
}
