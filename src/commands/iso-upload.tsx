import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { uploadIso, getIsoStorages } from '../lib/proxmox.js';
import { getDefault, setDefault, shouldSavePreferences } from '../lib/config.js';
import { Loading, Success, ErrorMessage, Info } from '../lib/ui.js';

interface IsoUploadCommandProps {
	file: string;
	storage?: string;
}

export function IsoUploadCommand({ file, storage }: IsoUploadCommandProps) {
	const [status, setStatus] = useState<'checking' | 'uploading' | 'success' | 'error'>('checking');
	const [error, setError] = useState<string>('');
	const [volid, setVolid] = useState<string>('');
	const [targetStorage, setTargetStorage] = useState<string>(storage || '');
	const [savedPreference, setSavedPreference] = useState<boolean>(false);

	useEffect(() => {
		async function upload() {
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
				setStatus('uploading');

				const result = await uploadIso(file, storageToUse);
				setVolid(result);
				setStatus('success');
			} catch (err: any) {
				setError(err.message);
				setStatus('error');
			}
		}
		upload();
	}, [file, storage]);

	const displayFilename = file.split('/').pop() || file;

	return (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text bold color="magenta">▲ pxc </Text>
				<Text bold>iso upload</Text>
			</Box>

			{status === 'checking' && <Loading>Checking storage...</Loading>}

			{status === 'uploading' && (
				<Loading>Uploading {displayFilename} to {targetStorage}...</Loading>
			)}

			{status === 'error' && <ErrorMessage>Failed to upload: {error}</ErrorMessage>}

			{status === 'success' && (
				<>
					<Success>Uploaded {displayFilename}</Success>
					<Text dimColor>  Volume ID: {volid}</Text>
					{savedPreference && <Info>Saved {targetStorage} as default storage</Info>}
				</>
			)}
		</Box>
	);
}
