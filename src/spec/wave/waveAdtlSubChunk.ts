import { RiffChunk } from "../riff";

export interface WaveAdtlSubChunk extends RiffChunk {
	labels: Map<number, string>;
}

export function ReadWaveAdtlSubChunk(chunk: RiffChunk): WaveAdtlSubChunk {
	const lablSubChunk = {
		labels: new Map<number, string>(),
	};

	let chunkSearchOffset = 0;

	while (true) {
		const view = new DataView(chunk.buffer.buffer, chunkSearchOffset);

		if ((chunkSearchOffset + 1) >= (chunk.riffChunkEnd - chunk.riffChunkStart)) {
			// console.log(`reached end of adtl`)
			break;
		}

		const lablMagic = view.getUint32(0, true)

		// labl in ascii is 1818386796
		if (lablMagic !== 1818386796) {
			// why is this standard fuck you riff
			chunkSearchOffset += 1
			continue
		}
		
		const lablChunkSize = view.getUint32(4, true)
		const identifier = view.getUint32(8, true)
		const label = String.fromCharCode(
			...new Uint8Array(
				chunk.buffer.subarray(chunkSearchOffset + 12, chunkSearchOffset + lablChunkSize + 7)
			)
		);

		lablSubChunk.labels.set(identifier, label)

		chunkSearchOffset += lablChunkSize + 8
	}

	return Object.assign(lablSubChunk, chunk);
}
