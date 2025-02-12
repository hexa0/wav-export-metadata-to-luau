import { lastIndexOf } from "./util/string/lastIndexOf";
import { ExportMarkers } from "./renderer";
import {
	commandLineFlags,
	inputFile,
	programExecutedWithDoubleClick,
} from "./util/process/commandLineArguments";

if (!inputFile) {
	console.error("No input specified.");

	// prevent an instant exit to allow the user to read the console
	if (programExecutedWithDoubleClick) {
		process.stdin.resume();
	}
} else {
	const audioToProcess = inputFile;
	const outputPath =
		commandLineFlags.get("--output-file") ||
		audioToProcess.substring(
			0,
			lastIndexOf(audioToProcess, ".") || audioToProcess.length
		) + " (info).wav";

	const fileBuffer = Buffer.from(await Bun.file(audioToProcess).bytes());
	console.log("Processing");
	ExportMarkers(fileBuffer, outputPath).catch((err) => {
		console.error("Failed:");
		console.error(err);
		
		// prevent an instant exit to allow the user to read the console
		if (programExecutedWithDoubleClick) {
			process.stdin.resume();
		}
	});
}
