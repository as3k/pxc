import React, { useState, useEffect, useMemo } from 'react';
import { Text, Box } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { getBridges, getPreferredNode } from '../lib/proxmox.js';
import { getResolvedDefaults, getNodeConfig } from '../lib/config.js';
import type { StepProps } from '../lib/types.js';

export function Network({ state, onNext, packageName }: StepProps) {
	const defaults = useMemo(() => getResolvedDefaults(packageName), [packageName]);
	const [bridges, setBridges] = useState<Array<{ label: string; value: string }>>([]);
	const [initialIndex, setInitialIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');
	const [manualMode, setManualMode] = useState(false);
	const [manualBridge, setManualBridge] = useState('');
	const [targetNode, setTargetNode] = useState<string>('');

	useEffect(() => {
		async function loadBridges() {
			try {
				// Use selected node, fallback to preferred node
				const node = state.node || await getPreferredNode();
				setTargetNode(node);
				
				// Get node-specific defaults
				const nodeDefaults = getNodeConfig(node);
				const bridgeDefault = defaults.bridge || nodeDefaults.bridge;

				const items = await getBridges(node);
				
				if (items.length === 0) {
					// No bridges found, use manual mode
					setManualMode(true);
					setLoading(false);
					return;
				}

				const options = items.map((b) => ({
					label: `${b.name}${!b.active ? ' (inactive)' : ''}`,
					value: b.name,
				}));

				setBridges(options);
				
				// Set initial selection to default bridge if specified
				if (bridgeDefault) {
					const idx = options.findIndex((o) => o.value === bridgeDefault);
					if (idx >= 0) setInitialIndex(idx);
				}
				setLoading(false);
			} catch (err) {
				// Bridge detection failed, use manual mode
				setManualMode(true);
				setLoading(false);
			}
		}

		loadBridges();
	}, [state.node, defaults.bridge]);

	if (loading) {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Text dimColor>Loading network bridges from {targetNode || 'preferred node'}...</Text>
			</Box>
		);
	}

	if (error) {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Text color="red">{error}</Text>
			</Box>
		);
	}

	if (manualMode) {
		const handleSubmit = () => {
			if (manualBridge.trim()) {
				onNext({ bridge: manualBridge.trim() });
			}
		};

		return (
			<Box flexDirection="column" paddingY={1}>
				<Text>Enter bridge name manually</Text>
				<Text dimColor>Bridge detection failed on {targetNode || 'target node'}</Text>
				<TextInput
					value={manualBridge}
					onChange={setManualBridge}
					onSubmit={handleSubmit}
					placeholder="vmbr0"
				/>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" paddingY={1}>
			<Text>Select network bridge from {targetNode || 'target node'}</Text>
			{defaults.bridge && <Text dimColor> (default: {defaults.bridge})</Text>}
			<SelectInput 
				items={bridges} 
				initialIndex={initialIndex} 
				onSelect={(item) => onNext({ bridge: item.value })} 
			/>
		</Box>
	);
}
