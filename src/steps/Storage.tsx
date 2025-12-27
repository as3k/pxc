import React, { useState, useEffect, useMemo } from 'react';
import { Text, Box } from 'ink';
import SelectInput from 'ink-select-input';
import { getStorages, getPreferredNode } from '../lib/proxmox.js';
import { getResolvedDefaults, getNodeConfig } from '../lib/config.js';
import type { StepProps } from '../lib/types.js';

export function Storage({ state, onNext, packageName }: StepProps) {
	const defaults = useMemo(() => getResolvedDefaults(packageName), [packageName]);
	const [storages, setStorages] = useState<Array<{ label: string; value: string }>>([]);
	const [initialIndex, setInitialIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');
	const [targetNode, setTargetNode] = useState<string>('');

	useEffect(() => {
		async function loadStorages() {
			try {
				// Use selected node, fallback to preferred node
				const node = state.node || await getPreferredNode();
				setTargetNode(node);
				
				// Get node-specific defaults
				const nodeDefaults = getNodeConfig(node);
				const storageDefault = defaults.vmStorage || nodeDefaults.vmStorage;

				const items = await getStorages(node);
				
				if (items.length === 0) {
					setError('No VM storage available on selected node');
					setLoading(false);
					return;
				}

				const options = items.map((s) => {
					// Check if storage is shared (available on multiple nodes) vs local
					const isShared = s.type === 'nfs' || s.type === 'rbd' || s.type === 'cephfs' || s.type === 'glusterfs';
					const locationLabel = isShared ? 'Shared' : `Local (${node})`;
					
					return {
						label: `${s.name} (${s.type}) - ${locationLabel}`,
						value: s.name,
					};
				});

				setStorages(options);
				
				// Set initial selection to default storage if specified
				if (storageDefault) {
					const idx = options.findIndex((o) => o.value === storageDefault);
					if (idx >= 0) setInitialIndex(idx);
				}
				setLoading(false);
			} catch (err) {
				setError('Failed to load storage pools from target node');
				setLoading(false);
			}
		}

		loadStorages();
	}, [state.node, defaults.vmStorage]);

	if (loading) {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Text dimColor>Loading VM storage from {targetNode || 'target node'}...</Text>
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

	if (storages.length === 0) {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Text color="red">No available storage pools found on {targetNode}</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" paddingY={1}>
			<Text>Select VM storage from {targetNode}</Text>
			{defaults.vmStorage && <Text dimColor> (default: {defaults.vmStorage})</Text>}
			<Text dimColor>Shared storage is accessible from all nodes</Text>
			<SelectInput 
				items={storages} 
				initialIndex={initialIndex} 
				onSelect={(item) => onNext({ storage: item.value })} 
			/>
		</Box>
	);
}
