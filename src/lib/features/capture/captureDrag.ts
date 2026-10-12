// src/lib/features/capture/captureDrag.ts

export const captureDragType = 'application/x-sonnda-capture';

export type CaptureDrag = {
	id: string;
	name: string;
	mimeType: string;
	sizeBytes: number;
};

const captureDragFields = ['id', 'name', 'mimeType', 'sizeBytes'] as const;

export function writeCaptureDrag(dataTransfer: DataTransfer, capture: CaptureDrag) {
	dataTransfer.effectAllowed = 'copy';
	dataTransfer.setData(
		captureDragType,
		JSON.stringify({
			id: capture.id,
			name: capture.name,
			mimeType: capture.mimeType,
			sizeBytes: capture.sizeBytes
		})
	);
}

export function captureDragPresent(dataTransfer: DataTransfer | null) {
	return dataTransfer?.types.includes(captureDragType) ?? false;
}

export function readCaptureDrag(dataTransfer: DataTransfer | null): CaptureDrag | null {
	const raw = dataTransfer?.getData(captureDragType);
	if (!raw) return null;
	try {
		const value: unknown = JSON.parse(raw);
		return isCaptureDrag(value) ? value : null;
	} catch {
		return null;
	}
}

function isCaptureDrag(value: unknown): value is CaptureDrag {
	if (!value || typeof value !== 'object') return false;
	const record = value as Record<string, unknown>;
	const keys = Object.keys(record);
	if (keys.length !== captureDragFields.length) return false;
	if (!captureDragFields.every((field) => keys.includes(field))) return false;
	return (
		typeof record.id === 'string' &&
		record.id.length > 0 &&
		typeof record.name === 'string' &&
		record.name.length > 0 &&
		typeof record.mimeType === 'string' &&
		record.mimeType.length > 0 &&
		typeof record.sizeBytes === 'number' &&
		Number.isFinite(record.sizeBytes) &&
		record.sizeBytes >= 0
	);
}
