import { assert } from "../../util/logic/assert";

export interface RiffChunk {
	buffer: Buffer;
	riffLabel: number;
	riffLabelString: string;
	riffChunkStart: number;
	riffChunkEnd: number;
}

export interface RiffHeader {
	watermark: number;
	dataSize: number;
	type: number;
	chunksByName: Map<string, RiffChunk>;
	chunksByIndex: Array<RiffChunk>;
	subChunksByName: Map<string, RiffChunk>;
	subChunksByIndex: Array<RiffChunk>;
}

const DUMMY_BUFFER = Buffer.alloc(0);

export function ReadRiffHeader(buffer: Buffer): RiffHeader {
	const view = new DataView(buffer.buffer);

	const riff: any = {};

	riff.watermark = view.getUint32(0, true);

	assert(
		riff.watermark === 1179011410,
		`RIFF header is invalid, watermark is incorrect, expected 1179011410 got ${riff.watermark}`
	);

	riff.dataSize = view.getUint32(4, true);
	riff.type = view.getUint32(8, true);

	riff.chunksByName = new Map<string, RiffChunk>();
	riff.chunksByIndex = new Array<RiffChunk>();
	riff.subChunksByName = new Map<string, RiffChunk>();
	riff.subChunksByIndex = new Array<RiffChunk>();

	let chunkSearchOffset = 12;

	while (true) {
		if (chunkSearchOffset >= riff.dataSize - 4) {
			break;
		}

		const rawLabel = String.fromCharCode(
			...new Uint8Array(
				buffer.subarray(chunkSearchOffset, chunkSearchOffset + 4)
			)
		);

		const label = rawLabel.replaceAll(" ", "");

		console.log(`found chunk "${rawLabel}" at offset ${chunkSearchOffset}`);

		const chunk: RiffChunk = {
			buffer: DUMMY_BUFFER,
			riffLabelString: rawLabel,
			riffLabel: view.getUint32(chunkSearchOffset, true),
			riffChunkStart: chunkSearchOffset + 8,
			riffChunkEnd:
				chunkSearchOffset +
				view.getUint32(chunkSearchOffset + 4, true) +
				8,
		};

		chunk.buffer = Buffer.alloc(chunk.riffChunkEnd - chunk.riffChunkStart);
		chunk.buffer.set(
			buffer.subarray(chunk.riffChunkStart, chunk.riffChunkEnd)
		);

		if (!riff.chunksByName.get(label)) {
			riff.chunksByName.set(label, chunk);
		} else {
			riff.chunksByName.set(label + chunkSearchOffset, chunk);
		}

		riff.chunksByIndex.push(chunk)

		if (rawLabel.toLowerCase() == "list") {
			const subChunkLabel = String.fromCharCode(
				...new Uint8Array(
					buffer.subarray(chunkSearchOffset + 8, chunkSearchOffset + 12)
				)
			);

			const subChunk: RiffChunk = {
				buffer: DUMMY_BUFFER,
				riffLabelString: subChunkLabel,
				riffLabel: view.getUint32(chunkSearchOffset + 8, true),
				riffChunkStart: chunk.riffChunkStart + 4,
				riffChunkEnd: chunk.riffChunkEnd
			}

			subChunk.buffer = Buffer.alloc(subChunk.riffChunkEnd - subChunk.riffChunkStart);
			subChunk.buffer.set(
				buffer.subarray(subChunk.riffChunkStart, subChunk.riffChunkEnd)
			);

			if (!riff.subChunksByName.get(subChunkLabel)) {
				riff.subChunksByName.set(subChunkLabel, subChunk);
			} else {
				riff.subChunksByName.set(subChunkLabel + chunkSearchOffset, subChunk);
			}

			riff.subChunksByIndex.push(subChunk)
		}

		chunkSearchOffset = chunk.riffChunkEnd;
	}

	return riff;
}

export function RiffInterfaceToBuffer(riff: RiffHeader) {
	let dataSize = 0;

	riff.chunksByName.forEach((chunk) => {
		dataSize += chunk.buffer.length + 8;
	});

	const buffer = Buffer.alloc(dataSize + 12);

	const view = new DataView(buffer.buffer);
	view.setUint32(0, 1179011410, true);
	view.setUint32(4, dataSize + 4, true);
	view.setUint32(8, riff.type, true);

	let chunkOffset = 12;

	riff.chunksByName.forEach((chunk) => {
		// console.log(chunkOffset)
		// console.log(chunk.buffer.length)
		view.setUint32(chunkOffset, chunk.riffLabel, true);
		view.setUint32(chunkOffset + 4, chunk.buffer.length, true);
		buffer.set(chunk.buffer, chunkOffset + 8);
		chunkOffset += chunk.buffer.length + 8;
	});

	return buffer;
}
