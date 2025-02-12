import { ReadWaveHeaders } from "../spec/wave";
import { ReadWaveAdtlSubChunk } from "../spec/wave/waveAdtlSubChunk";
import { ReadWaveCueChunk } from "../spec/wave/waveCueChunk";
import { ReadWaveSamplerChunk } from "../spec/wave/waveSamplerChunk";
import * as luadata from "luadata";

export async function ExportMarkers(file: Buffer, outputPath: string) {
	const waveFile = ReadWaveHeaders(file);

	console.log(`Sample rate is ${waveFile.fmt.sampleRate}`);

	const cue = waveFile.riff.chunksByName.get("cue");
	const smpl = waveFile.riff.chunksByName.get("smpl");
	const adtl = waveFile.riff.subChunksByName.get("adtl");

	const fmtOut = <any>waveFile.fmt;
	delete fmtOut.buffer

	const toSerialize: any = {
		fmt: fmtOut,
	};

	if (cue) {
		const out = <any>ReadWaveCueChunk(cue);
		delete out.buffer

		toSerialize.cue = out
	}

	if (smpl) {
		const out = <any>ReadWaveSamplerChunk(smpl);
		delete out.buffer

		toSerialize.smpl = out
	}

	if (adtl) {
		const out = <any>ReadWaveAdtlSubChunk(adtl);
		delete out.buffer

		toSerialize.adtl = out
	}

	await Bun.write(
		outputPath.substring(0, outputPath.lastIndexOf(".")) + ".luau",
		"return " +
			luadata.serializer.serialize(toSerialize, {
				indent: "\t",
				indentLevel: 0,
			}).replaceAll(",\n", ";\n")
	);

	await Bun.write(
		outputPath.substring(0, outputPath.lastIndexOf(".")) + ".json",
		JSON.stringify(toSerialize)
	);

	console.log(`Done`);
}
