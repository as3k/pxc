import React, { useState, useEffect, useMemo } from 'react';
import { Text, Box } from 'ink';
import SelectInput from 'ink-select-input';
import { getIsoFiles, getIsoStorages, getPreferredNode } from '../lib/proxmox.js';
import { getIsoStoragePreference, setIsoStoragePreference, getResolvedDefaults, getNodeConfig } from '../lib/config.js';
import type { StepProps } from '../lib/types.js';

type Phase = 'loading' | 'select-storage' | 'select-iso';

export function Iso({ state, onNext, packageName }: StepProps) {
	const defaults = useMemo(() => getResolvedDefaults(packageName), [packageName]);
	const [phase, setPhase] = useState<Phase>('loading');
	const [storages, setStorages] = useState<Array<{ label: string; value: string }>>([]);
	const [selectedStorage, setSelectedStorage] = useState<string>('');
	const [isos, setIsos] = useState<Array<{ label: string; value: string }>>([]);
	const [targetNode, setTargetNode] = useState<string>('');

	// Initial load: check for saved preference and available storages
	useEffect(() => {
		async function init() {
			try {
				// Use selected node, fallback to preferred node
				const node = state.node || await getPreferredNode();
				setTargetNode(node);
				
				// Get node-specific defaults
				const nodeDefaults = getNodeConfig(node);
				
				// Check package defaults first, then saved preference, then node-specific
				const savedStorage = defaults.isoStorage || getIsoStoragePreference() || nodeDefaults.isoStorage;
				const availableStorages = await getIsoStorages(node);

				if (availableStorages.length === 0) {
					// No ISO storages available, skip to ISO selection with empty list
					setIsos([{ label: '(No ISO)', value: '' }]);
					setPhase('select-iso');
					return;
				}

				// Check if saved storage still exists
				const savedExists = savedStorage && availableStorages.some(s => s.name === savedStorage);

				if (savedExists) {
					// Use saved storage directly
					setSelectedStorage(savedStorage);
					loadIsos(savedStorage);
				} else if (availableStorages.length === 1) {
					// Only one storage available, use it directly
					const storage = availableStorages[0].name;
					setSelectedStorage(storage);
					setIsoStoragePreference(storage);
					loadIsos(storage);
				} else {
					// Multiple storages, let user choose
					setStorages(availableStorages.map(s => {
						// Check if storage is shared vs local
						const isShared = s.type === 'nfs' || s.type === 'cephfs' || s.type === 'rbd';
						const locationLabel = isShared ? 'Shared' : `Local (${node})`;
						
						return {
							label: `${s.name} (${s.type}) - ${locationLabel}`,
							value: s.name,
						};
					}));
					setPhase('select-storage');
				}
			} catch (err) {
				setIsos([{ label: '(No ISO)', value: '' }]);
				setPhase('select-iso');
			}
		}

		init();
	}, [state.node, defaults.isoStorage]);

	function loadIsos(storage: string) {
		getIsoFiles(storage)
			.then((items) => {
				const options = items.map((iso) => ({
					label: `${iso.filename} (${iso.storage})`,
					value: iso.volid,
				}));
				options.unshift({ label: '(No ISO)', value: '' });
				setIsos(options);
				setPhase('select-iso');
			})
			.catch(() => {
				setIsos([{ label: '(No ISO)', value: '' }]);
				setPhase('select-iso');
			});
	}

	function handleStorageSelect(item: { value: string }) {
		setSelectedStorage(item.value);
		setIsoStoragePreference(item.value);
		loadIsos(item.value);
	}

	if (phase === 'loading') {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Text dimColor>Loading ISO storages from {targetNode || 'target node'}...</Text>
			</Box>
		);
	}

	if (phase === 'select-storage') {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Text>Select storage for ISO files from {targetNode}</Text>
				<Text dimColor>(Shared storage is accessible from all nodes)</Text>
				<SelectInput items={storages} onSelect={handleStorageSelect} />
			</Box>
		);
	}

	return (
		<Box flexDirection="column" paddingY={1}>
			<Text>Select installation ISO (optional)</Text>
			{selectedStorage && <Text dimColor>from {selectedStorage} on {targetNode}</Text>}
			<SelectInput items={isos} onSelect={(item) => onNext({ isoVolid: item.value || undefined })} />
		</Box>
	);
}
