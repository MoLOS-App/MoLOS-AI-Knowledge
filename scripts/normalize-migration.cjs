const fs = require('fs');
const path = require('path');

const drizzleDir = path.resolve(__dirname, '..', 'drizzle');

if (!fs.existsSync(drizzleDir)) {
	console.error('Drizzle directory not found:', drizzleDir);
	process.exit(1);
}

const sqlFiles = fs
	.readdirSync(drizzleDir)
	.filter((file) => file.endsWith('.sql'))
	.sort();

if (sqlFiles.length === 0) {
	console.log('No SQL migrations found.');
	process.exit(0);
}

const latest = sqlFiles[sqlFiles.length - 1];
const latestPath = path.join(drizzleDir, latest);
const raw = fs.readFileSync(latestPath, 'utf-8');

const statements = raw
	.split('--> statement-breakpoint')
	.map((statement) => statement.trim())
	.filter(Boolean);

const normalized = [];

for (const statement of statements) {
	const upper = statement.toUpperCase();

	if (upper.startsWith('PRAGMA FOREIGN_KEYS')) {
		continue;
	}

	if (upper.includes('INSERT INTO `__NEW_') || upper.includes('DROP TABLE `__NEW_')) {
		continue;
	}

	if (upper.includes('ALTER TABLE `__NEW_')) {
		continue;
	}

	if (upper.startsWith('DROP TABLE `MOLOS-AI-KNOWLEDGE_')) {
		continue;
	}

	let updated = statement.replace(/ON UPDATE\s+no action/gi, '');
	updated = updated.replace(/`__new_MoLOS-AI-Knowledge_/g, '`MoLOS-AI-Knowledge_');

	if (updated.trim()) {
		normalized.push(updated.trim());
	}
}

if (normalized.length === 0) {
	console.error('No valid statements remain after normalization.');
	process.exit(1);
}

const output = [`-- Normalized for MoLOS module migration validation`, ...normalized]
	.join('\n\n')
	.concat('\n');

fs.writeFileSync(latestPath, output);
console.log('Normalized migration:', latestPath);
