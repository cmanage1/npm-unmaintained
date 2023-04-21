/* eslint-disable no-console */
const { execSync } = require("child_process");
const path = require('path');

if (process.env.npm_config_client){
  console.info("Running in client dir...");
  process.chdir("client/");
}else if (process.env.npm_config_server){
  console.info("Running in server dir...");
  process.chdir('server/');
}else{
  console.info(
    "Note: You can pass --client or --server as arguments to run in respective dir."
  );
  console.info(" Running in root..");
  process.chdir(path.resolve(__dirname)); // run script in this dir
}

// Progress bar print
const printProgress = (progress) => {
  const percent = Math.floor(progress * 100);
  const barLength = 20;
  const filledLength = Math.floor(barLength * progress);
  const bar = "█".repeat(filledLength) + "-".repeat(barLength - filledLength);
  const progressString = `[${bar}] ${percent}%`;
  process.stdout.cursorTo(0);
  process.stdout.write(progressString);
}

// Calculate cutoff
const timeCutoff={
  month: process.env.npm_config_months || 0
}
if (!process.env.npm_config_months){
  console.info('Note: You can pass `--months=y` as args, using defaults');
  timeCutoff.month = 12;
}

console.info(`\nChecking for packages not maintained within ${timeCutoff.month} months`);
const today = new Date();
const someTimeAgo = new Date();
someTimeAgo.setFullYear(today.getFullYear(), today.getMonth()-timeCutoff.month)

// Get list of all packages
const {dependencies} = JSON.parse(execSync('npm list --depth=0 --json').toString());
if (Object.keys(dependencies).length === 0){
  console.error("No dependencies detected, exiting...");
  process.exit(1);
}
const dependencyKeys = Object.keys(dependencies);
console.info(`Getting info for ${dependencyKeys.length} packages, this could take a while`);

// See which packages are not maintained
const allPackageInfo = [];
for (let i = 0; i < dependencyKeys.length; i += 1) {
  printProgress(i / dependencyKeys.length);
  const item = dependencyKeys[i];
  const pkgInfo = JSON.parse(execSync(`yarn info ${item} time --json`).toString());
  try {
    if (someTimeAgo.getTime() >= new Date(pkgInfo.data.modified).getTime()) { // epoch comparison
      allPackageInfo.push({
        [item]: new Date(pkgInfo.data.modified).toDateString(),
      });
    }
  } catch (e) {
    console.error(e);
    allPackageInfo.push({
      name: item,
      lastModified: 'undefined'
    });
  }
}
printProgress(1);

// Console output
if (allPackageInfo.length === 0){
  console.info("\n\nNo unmaintained packages found within given timeframe.");
}else{
  console.info(`\n\nFound ${allPackageInfo.length} unmaintained packages found within given timeframe.`);
  console.error(allPackageInfo);
  process.exit(1);
}
process.exit(0); // success

