import React from 'react';
import { Text, Box } from 'ink';
import { loadConfig, getConfigPath } from '../lib/config.js';
import { Info } from '../lib/ui.js';

export function ConfigShowCommand() {
	const config = loadConfig();
	const configPath = getConfigPath();

	const hasDefaults = config.defaults && Object.keys(config.defaults).length > 0;
	const hasUi = config.ui && Object.keys(config.ui).length > 0;

	return (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text bold color="magenta">▲ pxc </Text>
				<Text bold>config</Text>
			</Box>

			<Text dimColor>{configPath}</Text>
			<Text> </Text>

			{!hasDefaults && !hasUi ? (
				<Text dimColor>No configuration set</Text>
			) : (
				<>
					{hasDefaults && (
						<>
							<Text bold color="cyan">defaults:</Text>
							{config.defaults?.isoStorage && (
								<Text>  <Text dimColor>isoStorage:</Text> {config.defaults.isoStorage}</Text>
							)}
							{config.defaults?.vmStorage && (
								<Text>  <Text dimColor>vmStorage:</Text> {config.defaults.vmStorage}</Text>
							)}
							{config.defaults?.bridge && (
								<Text>  <Text dimColor>bridge:</Text> {config.defaults.bridge}</Text>
							)}
							{config.defaults?.cores && (
								<Text>  <Text dimColor>cores:</Text> {config.defaults.cores}</Text>
							)}
							{config.defaults?.memory && (
								<Text>  <Text dimColor>memory:</Text> {config.defaults.memory}</Text>
							)}
							{config.defaults?.disk && (
								<Text>  <Text dimColor>disk:</Text> {config.defaults.disk}</Text>
							)}
						</>
					)}

					{hasUi && (
						<>
							<Text bold color="cyan">ui:</Text>
							{config.ui?.savePreferences !== undefined && (
								<Text>  <Text dimColor>savePreferences:</Text> {String(config.ui.savePreferences)}</Text>
							)}
						</>
					)}
				</>
			)}

			<Box marginTop={1}>
				<Info>Edit {configPath} to change settings</Info>
			</Box>
		</Box>
	);
}
