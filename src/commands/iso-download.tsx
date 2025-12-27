import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { downloadIso, getIsoStorages } from '../lib/proxmox.js';
import { getDefault, setDefault, shouldSavePreferences } from '../lib/config.js';
import { Loading, Success, ErrorMessage, ProgressBar, formatBytes, Info } from '../lib/ui.js';

interface IsoDownloadCommandProps {
	url: string;
	storage?: string;
	filename?: string;
}

export function IsoDownloadCommand({ url, storage, filename }: IsoDownloadCommandProps) {
	const [status, setStatus] = useState<'checking' | 'downloading' | 'success' | 'error'>('checking');
	const [error, setError] = useState<string>('');
	const [volid, setVolid] = useState<string>('');
	const [targetStorage, setTargetStorage] = useState<string>(storage || '');
	const [savedPreference, setSavedPreference] = useState<boolean>(false);
	const [progress, setProgress] = useState({
		percent: 0,
		speed: '',
		eta: '',
		downloaded: 0,
		total: 0,
	});

	useEffect(() => {
		async function download() {
			try {
				let storageToUse = storage;

				if (!storageToUse) {
					storageToUse = getDefault('isoStorage');

					if (!storageToUse) {
						const storages = await getIsoStorages();
						if (storages.length === 0) {
							throw new Error('No ISO-capable storage found');
						}
						storageToUse = storages[0].name;

						if (shouldSavePreferences()) {
							setDefault('isoStorage', storageToUse);
							setSavedPreference(true);
						}
					}
				}

				setTargetStorage(storageToUse);
				setStatus('downloading');

				const result = await downloadIso(url, storageToUse, filename, (p) => {
					setProgress(p);
				});

				setVolid(result);
				setStatus('success');
			} catch (err: any) {
				setError(err.message);
				setStatus('error');
			}
		}
		download();
	}, [url, storage, filename]);

	const displayFilename = filename || url.split('/').pop() || 'download.iso';

	return (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text bold color="magenta">▲ pxc </Text>
				<Text bold>iso download</Text>
			</Box>

			{status === 'checking' && <Loading>Checking storage...</Loading>}

			{status === 'downloading' && (
				<>
					<Text>
						<Text color="cyan" bold>Downloading</Text> {displayFilename}
					</Text>
					<Text dimColor>→ {targetStorage}</Text>
					<Box marginY={1}>
						<ProgressBar percent={progress.percent} />
					</Box>
					<Text dimColor>
						{progress.speed && `${progress.speed}`}
						{progress.eta && ` • ETA: ${progress.eta}`}
						{progress.total > 0 && ` • ${formatBytes(progress.downloaded)} / ${formatBytes(progress.total)}`}
					</Text>
				</>
			)}

			{status === 'error' && <ErrorMessage>Failed to download: {error}</ErrorMessage>}

			{status === 'success' && (
				<>
					<Success>Downloaded {displayFilename}</Success>
					<Text dimColor>  Volume ID: {volid}</Text>
					{savedPreference && <Info>Saved {targetStorage} as default storage</Info>}
				</>
			)}
		</Box>
	);
}
