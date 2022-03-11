"use strict";

const gulp = require("gulp");
const sequence = require("run-sequence");
const shell = require("gulp-shell");
const plugins = require("gulp-load-plugins");
const del = require("del");
const path = require("path");

// Load gulp plugins
plugins();

gulp.task("clean-js", function() {
	return del("./build/**/*");
});

gulp.task("clean-joltron", function() {
	return del("bin");
});

gulp.task("js", shell.task(["tsc"]));

const joltronRepo = "github.com/gamejolt/joltron";
const gameRunnerRepo = path.join(
	process.env.GOPATH,
	"src",
	...joltronRepo.split("/")
);
function getExecutable() {
	switch (process.platform) {
		case "win32":
			return path.join(__dirname, "bin", "GameJoltRunner.exe");
		case "linux":
			return path.join(__dirname, "bin", "GameJoltRunner");
		case "darwin":
			return path.join(__dirname, "bin", "GameJoltRunner");
		default:
			throw new Error("Unsupported OS");
	}
}

if (process.platform == "win32") {
	gulp.task(
		"go-joltron",
		shell.task([
			"cd " + gameRunnerRepo + " && build\\build.bat",
			"set CGO_ENABLED= && set GOARCH=",
			"mkdir bin",
			"copy " +
				path.join(gameRunnerRepo, "joltron.exe") +
				" " +
				getExecutable()
		])
	);
} else {
	gulp.task(
		"go-joltron",
		shell.task([
			"cd " + gameRunnerRepo + " && ./build/build.sh",
			"mkdir bin",
			"cp " + path.join(gameRunnerRepo, "joltron") + " " + getExecutable()
		])
	);
}

gulp.task("build-js", gulp.series("clean-js", "js"));

gulp.task("build-joltron", gulp.series("clean-joltron", "go-joltron"));

gulp.task("build", gulp.series("build-js", "build-joltron"));

gulp.task(
	"watch",
	gulp.series("build", done => {
		gulp.watch(["./src/**/*", "tsconfig.json"], gulp.series("build-js"));
		gulp.watch([gameRunnerRepo + "/**/*.go"], gulp.series("build-joltron"));
		done();
	})
);
